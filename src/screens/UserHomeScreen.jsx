import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "../contexts/UserContext";
import LiveMap from "../components/LiveMap";
import {
  Button,
  LocationSuggestions,
  SelectVehicle,
  RideDetails,
  Sidebar,
  NetworkStatusBanner,
  NotificationBell,
  MobileBottomNav,
} from "../components";
import axios from "axios";
import debounce from "lodash.debounce";
import { SocketDataContext } from "../contexts/SocketContext";
import Console from "../utils/console";
import { ArrowDownUp, Banknote, CalendarClock, CheckCircle2, Clock3, GraduationCap, MapPin, Navigation, Plane, Search, ShieldCheck, Sparkles } from "lucide-react";

const DEFAULT_MAP_CENTER = [6.5244, 3.3792];

function getLocationErrorMessage(error) {
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return "Live location requires HTTPS. Open the deployed QuickRide site over a secure connection and try again.";
  }
  if (error?.code === 1) return "Location permission is blocked. Allow location access for QuickRide in your browser settings and try again.";
  if (error?.code === 2) return "Your device could not determine its GPS location. Turn on Location Services and try again.";
  if (error?.code === 3) return "GPS is taking too long to respond. Move to an open area or try again.";
  return "Unable to access your current location. You can still enter the pickup manually.";
}

function UserHomeScreen() {
  const token = localStorage.getItem("token");
  const { socket } = useContext(SocketDataContext);
  const { user } = useUser();
  const [messages, setMessages] = useState(JSON.parse(localStorage.getItem("messages")) || []);
  const [loading, setLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [ratingTags, setRatingTags] = useState([]);
  const [completedRide, setCompletedRide] = useState(null);
  const [position, setPosition] = useState(null);

  const [selectedInput, setSelectedInput] = useState("pickup");
  const [locationSuggestion, setLocationSuggestion] = useState([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [destinationConfirmed, setDestinationConfirmed] = useState(false);
  const [recentPlaces, setRecentPlaces] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("recentPlaces") || "[]");
      const nigeriaOnly = Array.isArray(stored)
        ? stored.filter((place) => /(^|,|\s)nigeria(?:\s|,|$)/i.test(String(place || ""))).slice(0, 4)
        : [];
      localStorage.setItem("recentPlaces", JSON.stringify(nigeriaOnly));
      return nigeriaOnly;
    } catch {
      return [];
    }
  });
  const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState({ distanceText: "", durationText: "" });
  const [mapNotice, setMapNotice] = useState("");
  const [rideCreated, setRideCreated] = useState(false);
  const [rideMode, setRideMode] = useState("now");
  const [scheduledFor, setScheduledFor] = useState("");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [emergencyType, setEmergencyType] = useState("unsafe_driving");
  const [emergencyMessage, setEmergencyMessage] = useState("");
  const [complaintCategory, setComplaintCategory] = useState("driver_behavior");
  const [complaintDescription, setComplaintDescription] = useState("");

  const [pickupLocation, setPickupLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("car");
  const [fare, setFare] = useState({ car: 0, bike: 0 });
  const [currency, setCurrency] = useState("NGN");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentMethods, setPaymentMethods] = useState([
    { id: "cash", label: "Cash", enabled: true, status: "available", description: "Pay the driver directly in cash after the trip." },
    { id: "card", label: "Card", enabled: false, status: "coming_soon", description: "Card payments are coming soon." },
  ]);
  const [confirmedRideData, setConfirmedRideData] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [locationActionLoading, setLocationActionLoading] = useState(false);
  const [isUsingLivePickup, setIsUsingLivePickup] = useState(false);
  const [serviceAreaStatus, setServiceAreaStatus] = useState("unknown");
  const [driverLiveAt, setDriverLiveAt] = useState(null);
  const [pickupAddressDetails, setPickupAddressDetails] = useState(null);
  const [destinationAddressDetails, setDestinationAddressDetails] = useState(null);
  const suggestionRequestId = useRef(0);

  const [showFindTripPanel, setShowFindTripPanel] = useState(true);
  const [showSelectVehiclePanel, setShowSelectVehiclePanel] = useState(false);
  const [showRideDetailsPanel, setShowRideDetailsPanel] = useState(false);

  const handleLocationChange = useCallback(
    debounce(async (inputValue, authToken, requestId, userLat, userLng) => {
      if (inputValue.trim().length < 3) return;
      try {
        const params = new URLSearchParams({ input: inputValue });
        if (Number.isFinite(userLat) && Number.isFinite(userLng)) {
          params.set("lat", String(userLat));
          params.set("lng", String(userLng));
        }
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/map/get-suggestions?${params.toString()}`,
          { headers: { token: authToken } }
        );
        if (requestId !== suggestionRequestId.current) return;
        setLocationSuggestion(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (requestId === suggestionRequestId.current) setLocationSuggestion([]);
        Console.error(error);
      } finally {
        if (requestId === suggestionRequestId.current) setSuggestionLoading(false);
      }
    }, 260),
    []
  );

  useEffect(() => () => handleLocationChange.cancel(), [handleLocationChange]);

  const onChangeHandler = (e) => {
    const { id, value } = e.target;
    setSelectedInput(id);
    setMapNotice("");

    if (id === "pickup") {
      setPickupLocation(value);
      setPickupConfirmed(false);
      setPickupCoords(null);
      setIsUsingLivePickup(false);
      setServiceAreaStatus("unknown");
    }
    if (id === "destination") {
      setDestinationLocation(value);
      setDestinationConfirmed(false);
      setDestinationCoords(null);
    }

    suggestionRequestId.current += 1;
    handleLocationChange.cancel();

    if (value.trim().length >= 3) {
      setSuggestionLoading(true);
      handleLocationChange(
        value,
        token,
        suggestionRequestId.current,
        position?.coords?.latitude,
        position?.coords?.longitude
      );
    } else {
      setSuggestionLoading(false);
      setLocationSuggestion([]);
    }
  };

  const rememberPlace = (place) => {
    if (!/(^|,|\s)nigeria(?:\s|,|$)/i.test(String(place || ""))) return;
    const updated = [place, ...recentPlaces.filter((item) => item !== place)].slice(0, 4);
    setRecentPlaces(updated);
    localStorage.setItem("recentPlaces", JSON.stringify(updated));
  };

  const resolveLocationDetails = async (lat, lng) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/map/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
        { headers: { token } }
      );
      return response.data || null;
    } catch (_) {
      return null;
    }
  };

  const selectLocationSuggestion = (suggestion, inputType = selectedInput) => {
    if (inputType === "pickup") {
      setPickupLocation(suggestion);
      setPickupConfirmed(true);
      setPickupCoords(null);
      setIsUsingLivePickup(false);
      setServiceAreaStatus("inside");
    } else {
      setDestinationLocation(suggestion);
      setDestinationConfirmed(true);
      setDestinationCoords(null);
    }
    setLocationSuggestion([]);
    setSuggestionLoading(false);
    setMapNotice("");
    rememberPlace(suggestion);
  };

  const chooseQuickDestination = (place) => {
    setSelectedInput("destination");
    selectLocationSuggestion(place, "destination");
  };

  const swapLocations = () => {
    setPickupLocation(destinationLocation);
    setDestinationLocation(pickupLocation);
    setPickupConfirmed(destinationConfirmed);
    setDestinationConfirmed(pickupConfirmed);
    setPickupCoords(destinationCoords);
    setDestinationCoords(pickupCoords);
    setIsUsingLivePickup(false);
    setServiceAreaStatus("unknown");
    setLocationSuggestion([]);
    setSuggestionLoading(false);
  };

  const getDistanceAndFare = async (pickup, destination) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ pickup, destination });
      if (pickupCoords && Number.isFinite(pickupCoords.lat) && Number.isFinite(pickupCoords.lng)) {
        params.set("pickupLat", String(pickupCoords.lat));
        params.set("pickupLng", String(pickupCoords.lng));
      }
      if (destinationCoords && Number.isFinite(destinationCoords.lat) && Number.isFinite(destinationCoords.lng)) {
        params.set("destinationLat", String(destinationCoords.lat));
        params.set("destinationLng", String(destinationCoords.lng));
      }
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/ride/get-fare?${params.toString()}`,
        { headers: { token } }
      );
      setFare(response.data.fare || { car: 0, bike: 0 });
      setServiceAreaStatus("inside");
      setCurrency(response.data.market?.currency || "NGN");
      const distanceTime = response.data.distanceTime || {};
      setRouteInfo({
        distanceText: distanceTime?.distance?.text || "",
        durationText: distanceTime?.duration?.text || "",
        approximate: Boolean(distanceTime?.approximate),
        routeUnavailable: Boolean(distanceTime?.routeUnavailable),
        provider: distanceTime?.provider || "",
      });
      if (distanceTime?.approximate) {
        setMapNotice("Live road navigation is temporarily unavailable. QuickRide is showing only the pickup and destination markers and will re-check the road route before booking.");
      } else {
        setMapNotice("");
      }
      const origin = distanceTime.originCoordinates;
      const destinationPoint = distanceTime.destinationCoordinates;
      if (origin) setPickupCoords({ lat: origin.ltd, lng: origin.lng });
      if (destinationPoint) setDestinationCoords({ lat: destinationPoint.ltd, lng: destinationPoint.lng });
      setRouteCoords(
        !distanceTime?.approximate && Array.isArray(distanceTime?.route) && distanceTime.route.length > 2
          ? distanceTime.route
          : []
      );
      if (origin) setMapCenter([origin.ltd, origin.lng]);
      setShowFindTripPanel(false);
      setShowSelectVehiclePanel(true);
      setLocationSuggestion([]);
    } catch (error) {
      const code = error?.response?.data?.code;
      if (code === "OUTSIDE_SERVICE_AREA") setServiceAreaStatus("outside");
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to calculate fare. Please use more specific pickup and destination addresses.";
      setMapNotice(message);
      Console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const createRide = async () => {
    try {
      setLoading(true);
      const payload = {
        pickup: pickupLocation,
        destination: destinationLocation,
        vehicleType: selectedVehicle,
        rideMode,
        paymentMethod,
        promoCode,
        ...(pickupCoords ? { pickupCoordinates: { lat: pickupCoords.lat, lng: pickupCoords.lng } } : {}),
        ...(destinationCoords ? { destinationCoordinates: { lat: destinationCoords.lat, lng: destinationCoords.lng } } : {}),
      };

      if (rideMode === "scheduled") {
        payload.scheduledFor = scheduledFor;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/ride/create`,
        payload,
        { headers: { token } }
      );

      const rideData = {
        pickup: pickupLocation,
        destination: destinationLocation,
        pickupConfirmed,
        destinationConfirmed,
        vehicleType: selectedVehicle,
        fare,
        routeInfo,
        currency,
        paymentMethod,
        confirmedRideData: null,
        rideMode,
        scheduledFor: rideMode === "scheduled" ? scheduledFor : null,
        _id: response.data._id,
        promoCode: response.data?.promoCode || promoCode,
        promoDiscount: response.data?.promoDiscount || 0,
      };
      localStorage.setItem("rideDetails", JSON.stringify(rideData));
      setRideCreated(true);
      if (rideMode === "scheduled") {
        setMapNotice("Ride scheduled successfully. Admin can view it under Scheduled Rides.");
        setShowRideDetailsPanel(false);
        setShowSelectVehiclePanel(false);
        setShowFindTripPanel(true);
        return;
      }

      setMapNotice("Request sent. QuickRide will keep searching nearby online drivers and update you automatically.");
    } catch (error) {
      const validationMessage = error?.response?.data?.errors?.[0]?.msg;
      const message = validationMessage || error?.response?.data?.message || error?.message || "Unable to create ride. Please try again.";
      setMapNotice(message);
      Console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentRideId = () => {
    const stored = JSON.parse(localStorage.getItem("rideDetails") || "{}");
    return confirmedRideData?._id || stored?.confirmedRideData?._id || stored?._id;
  };

  const resetRideUi = () => {
    if (position?.coords) setMapCenter([position.coords.latitude, position.coords.longitude]);
    setRouteCoords([]);
    setRouteInfo({ distanceText: "", durationText: "" });
    setPickupCoords(null);
    setDestinationCoords(null);
    setPickupAddressDetails(null);
    setDestinationAddressDetails(null);
    setShowRideDetailsPanel(false);
    setShowSelectVehiclePanel(false);
    setShowFindTripPanel(true);
    setDefaults();
    localStorage.removeItem("rideDetails");
    localStorage.removeItem("panelDetails");
    localStorage.removeItem("messages");
    localStorage.removeItem("showPanel");
    localStorage.removeItem("showBtn");
  };

  const cancelRide = async (reasonCode = "", reasonText = "") => {
    const rideId = getCurrentRideId();
    if (!rideId) {
      resetRideUi();
      return true;
    }
    if (!reasonCode || !String(reasonText || "").trim()) {
      setMapNotice("Please select a cancellation reason before cancelling the ride.");
      return false;
    }

    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/ride/cancel-user`,
        { rideId, reasonCode, reasonText: String(reasonText).trim() },
        { headers: { token } }
      );
      resetRideUi();
      return true;
    } catch (error) {
      const message =
        error?.response?.data?.errors?.[0]?.msg ||
        error?.response?.data?.message ||
        "Unable to cancel the ride. Please try again.";
      setMapNotice(message);
      Console.log(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    const rideId = completedRide?._id;
    if (!rideId) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/ride/rate`,
        { rideId, rating, review, tags: ratingTags },
        { headers: { token } }
      );
      setShowRatingModal(false);
      setCompletedRide(null);
      setReview("");
      setRating(5);
      setRatingTags([]);
    } catch (e) {
      alert(e?.response?.data?.message || "Rating failed");
    }
  };

  const submitEmergency = async () => {
    try {
      setLoading(true);
      const rideId = getCurrentRideId();
      const currentLocation = position?.coords ? { ltd: position.coords.latitude, lng: position.coords.longitude, address: pickupLocation } : { address: pickupLocation };
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/ride/emergency`,
        { rideId, type: emergencyType, message: emergencyMessage, location: currentLocation },
        { headers: { token } }
      );
      setShowEmergencyModal(false);
      setEmergencyMessage("");
      alert("Emergency report sent to admin.");
    } catch (error) {
      alert(error?.response?.data?.message || "Unable to send emergency report.");
    } finally {
      setLoading(false);
    }
  };

  const submitComplaint = async () => {
    try {
      setLoading(true);
      const rideId = getCurrentRideId();
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/ride/complaint`,
        { rideId, category: complaintCategory, description: complaintDescription },
        { headers: { token } }
      );
      setShowComplaintModal(false);
      setComplaintDescription("");
      alert("Complaint submitted to admin.");
    } catch (error) {
      alert(error?.response?.data?.message || "Unable to submit complaint.");
    } finally {
      setLoading(false);
    }
  };

  const setDefaults = () => {
    setPickupLocation("");
    setDestinationLocation("");
    setPickupConfirmed(false);
    setDestinationConfirmed(false);
    setLocationSuggestion([]);
    setSuggestionLoading(false);
    setSelectedVehicle("car");
    setFare({ car: 0, bike: 0 });
    setPickupCoords(null);
    setDestinationCoords(null);
    setIsUsingLivePickup(false);
    setServiceAreaStatus("unknown");
    setDriverLiveAt(null);
    setConfirmedRideData(null);
    setRideCreated(false);
    setRideMode("now");
    setScheduledFor("");
    setPaymentMethod("cash");
    setPromoCode("");
  };

  useEffect(() => {
    if (!isUsingLivePickup) return undefined;
    if (!navigator.geolocation) {
      setMapCenter(DEFAULT_MAP_CENTER);
      setMapNotice("Location is unavailable on this device. You can still enter pickup and destination manually.");
      return undefined;
    }
    if (window.isSecureContext === false) {
      setMapCenter(DEFAULT_MAP_CENTER);
      setMapNotice("Live location requires HTTPS. Open QuickRide over a secure connection to use GPS pickup.");
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (currentPosition) => {
        const lat = currentPosition.coords.latitude;
        const lng = currentPosition.coords.longitude;
        setPosition(currentPosition);
        setMapCenter([lat, lng]);
        if (isUsingLivePickup) setPickupCoords({ lat, lng });
      },
      (error) => {
        setPosition(null);
        if (!isUsingLivePickup) setMapCenter(DEFAULT_MAP_CENTER);
        setMapNotice(getLocationErrorMessage(error));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isUsingLivePickup]);

  const useCurrentLocationAsPickup = () => {
    if (!navigator.geolocation) {
      setMapNotice("Location is unavailable on this device.");
      return;
    }
    if (window.isSecureContext === false) {
      setMapNotice("Live location requires HTTPS. Open the deployed QuickRide site securely and try again.");
      return;
    }

    setLocationActionLoading(true);
    setMapNotice("");
    navigator.geolocation.getCurrentPosition(async (currentPosition) => {
      const lat = currentPosition.coords.latitude;
      const lng = currentPosition.coords.longitude;
      setPosition(currentPosition);
      setMapCenter([lat, lng]);
      setPickupCoords({ lat, lng });
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/map/reverse-geocode?lat=${lat}&lng=${lng}`, { headers: { token } });
        const details = response.data || null;
        const address = details?.address || details?.display_name || `Current location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        setPickupAddressDetails(details);
        setPickupLocation(address);
        if (details?.serviceAvailable === false) {
          setPickupConfirmed(false);
          setIsUsingLivePickup(false);
          setServiceAreaStatus("outside");
          setMapNotice(`We found your location, but QuickRide booking is currently limited to ${details?.serviceArea || "Nigeria"}.`);
        } else {
          setPickupConfirmed(true);
          setIsUsingLivePickup(true);
          setServiceAreaStatus("inside");
          rememberPlace(address);
          setMapNotice("Live GPS pickup is active. Your pickup coordinates will stay updated until you choose another location.");
        }
      } catch (error) {
        const address = `Current location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        const serviceAreaMessage = error?.response?.data?.code === "OUTSIDE_SERVICE_AREA"
          ? error?.response?.data?.message
          : "";
        setPickupLocation(address);
        if (serviceAreaMessage) {
          setPickupConfirmed(false);
          setIsUsingLivePickup(false);
          setServiceAreaStatus("outside");
          setMapNotice(serviceAreaMessage);
        } else {
          setPickupConfirmed(true);
          setIsUsingLivePickup(true);
          setServiceAreaStatus("unknown");
          setMapNotice("Live GPS pickup is active. Fare calculation will use your coordinates directly.");
        }
      } finally {
        setLocationActionLoading(false);
      }
    }, (error) => {
      setLocationActionLoading(false);
      setIsUsingLivePickup(false);
      setMapNotice(getLocationErrorMessage(error));
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 });
  };

  const stopLivePickup = () => {
    setIsUsingLivePickup(false);
    setMapNotice("Live GPS updates stopped. QuickRide will keep the last confirmed pickup location.");
  };

  useEffect(() => {
    if (!token) return;
    Promise.allSettled([
      axios.get(`${import.meta.env.VITE_SERVER_URL}/user/saved-places`, { headers: { token } }),
      axios.get(`${import.meta.env.VITE_SERVER_URL}/ride/active`, { headers: { token } }),
    ]).then(([placesResult, activeResult]) => {
      if (placesResult.status === "fulfilled") {
        const places = Array.isArray(placesResult.value.data) ? placesResult.value.data : [];
        setSavedPlaces(
          places.filter((place) => /(^|,|\s)nigeria(?:\s|,|$)/i.test(String(place?.address || "")))
        );
      }
      if (activeResult.status === "fulfilled" && activeResult.value.data?._id) {
        const ride = activeResult.value.data;
        setConfirmedRideData(ride.captain ? ride : null);
        setRideCreated(!ride.captain && ride.status === "pending");
        setPickupLocation(ride.pickup || "");
        setDestinationLocation(ride.destination || "");
        setPickupConfirmed(true);
        setDestinationConfirmed(true);
        setSelectedVehicle(ride.vehicle || "car");
        setPaymentMethod(ride.paymentMethod || "cash");
        setPromoCode(ride.promoCode || "");
        setShowFindTripPanel(false);
        setShowSelectVehiclePanel(false);
        setShowRideDetailsPanel(true);
      }
    });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/ride/payment-methods`, { headers: { token } })
      .then((response) => {
        if (Array.isArray(response.data?.methods) && response.data.methods.length) {
          setPaymentMethods(response.data.methods);
          setPaymentMethod(response.data.defaultMethod || "cash");
        }
      })
      .catch(() => {
        // Keep the safe cash/card-coming-soon fallback if the server is older.
      });
  }, [token]);

  useEffect(() => {
    if (!socket || !user?._id) return;

    // Socket.IO reconnects create a new server-side socket. Re-authenticate the
    // passenger after every reconnect so ride events and live driver GPS resume.
    const joinPassenger = () => socket.emit("join", { userId: user._id, userType: "user", token });
    if (socket.connected) joinPassenger();
    socket.on("connect", joinPassenger);

    const onRideConfirmed = (data) => {
      setConfirmedRideData(data);
      localStorage.setItem(
        "rideDetails",
        JSON.stringify({
          pickup: data.pickup,
          destination: data.destination,
          vehicleType: data.vehicle,
          fare,
          confirmedRideData: data,
          _id: data._id,
        })
      );
      if (data?.captain?.location?.coordinates) {
        setMapCenter([data.captain.location.coordinates[1], data.captain.location.coordinates[0]]);
        setDriverLiveAt(data.captain.lastLocationAt || new Date().toISOString());
      }
    };

    const updateRideStatus = (status, data = {}) => setConfirmedRideData((prev) => prev ? { ...prev, ...data, status } : prev);
    const onDriverArriving = (data) => updateRideStatus("arriving", data);
    const onDriverArrived = (data) => updateRideStatus("arrived", data);
    const onRideStarted = (data) => {
      updateRideStatus("ongoing", data);
      if (destinationCoords) setMapCenter([destinationCoords.lat, destinationCoords.lng]);
    };

    const onRideEnded = (data) => {
      setCompletedRide(data);
      setShowRatingModal(true);
      resetRideUi();
    };

    const onRideCancelled = () => resetRideUi();
    const onCaptainLocation = (payload) => {
      if (!Number.isFinite(Number(payload?.location?.ltd)) || !Number.isFinite(Number(payload?.location?.lng))) return;
      setDriverLiveAt(payload.updatedAt || new Date().toISOString());
      setConfirmedRideData((prev) => prev ? {
        ...prev,
        captain: {
          ...(prev.captain || payload.captain || {}),
          location: { coordinates: [Number(payload.location.lng), Number(payload.location.ltd)] },
          liveHeading: Number.isFinite(Number(payload.location.heading)) ? Number(payload.location.heading) : prev?.captain?.liveHeading,
        },
      } : prev);
    };

    socket.on("ride-confirmed", onRideConfirmed);
    socket.on("driver-arriving", onDriverArriving);
    socket.on("driver-arrived", onDriverArrived);
    socket.on("ride-started", onRideStarted);
    socket.on("ride-ended", onRideEnded);
    socket.on("ride-cancelled", onRideCancelled);
    socket.on("captain-location-updated", onCaptainLocation);

    return () => {
      socket.off("connect", joinPassenger);
      socket.off("ride-confirmed", onRideConfirmed);
      socket.off("driver-arriving", onDriverArriving);
      socket.off("driver-arrived", onDriverArrived);
      socket.off("ride-started", onRideStarted);
      socket.off("ride-ended", onRideEnded);
      socket.off("ride-cancelled", onRideCancelled);
      socket.off("captain-location-updated", onCaptainLocation);
    };
  }, [socket, user?._id, pickupLocation, fare]);

  useEffect(() => {
    const storedRideDetails = localStorage.getItem("rideDetails");
    const storedPanelDetails = localStorage.getItem("panelDetails");

    if (storedRideDetails) {
      const ride = JSON.parse(storedRideDetails);
      setPickupLocation(ride.pickup || "");
      setDestinationLocation(ride.destination || "");
      setPickupConfirmed(Boolean(ride.pickupConfirmed || ride.confirmedRideData));
      setDestinationConfirmed(Boolean(ride.destinationConfirmed || ride.confirmedRideData));
      setSelectedVehicle(ride.vehicleType || "car");
      setFare(ride.fare || { car: 0, bike: 0 });
      setRouteInfo(ride.routeInfo || { distanceText: "", durationText: "" });
      setCurrency(ride.currency || "NGN");
      setPaymentMethod(ride.paymentMethod || "cash");
      setConfirmedRideData(ride.confirmedRideData || null);
      setRideCreated(Boolean(ride._id && !ride.confirmedRideData));
    }

    if (storedPanelDetails) {
      const panels = JSON.parse(storedPanelDetails);
      setShowFindTripPanel(Boolean(panels.showFindTripPanel));
      setShowSelectVehiclePanel(Boolean(panels.showSelectVehiclePanel));
      setShowRideDetailsPanel(Boolean(panels.showRideDetailsPanel));
    }
  }, []);

  useEffect(() => {
    const current = JSON.parse(localStorage.getItem("rideDetails") || "{}");
    const rideData = {
      ...current,
      pickup: pickupLocation,
      destination: destinationLocation,
      pickupConfirmed,
      destinationConfirmed,
      vehicleType: selectedVehicle,
      fare,
      routeInfo,
      paymentMethod,
      confirmedRideData,
    };
    if (pickupLocation || destinationLocation || confirmedRideData || current?._id) {
      localStorage.setItem("rideDetails", JSON.stringify(rideData));
    }
  }, [pickupLocation, destinationLocation, pickupConfirmed, destinationConfirmed, selectedVehicle, fare, routeInfo, paymentMethod, confirmedRideData]);

  useEffect(() => {
    localStorage.setItem(
      "panelDetails",
      JSON.stringify({ showFindTripPanel, showSelectVehiclePanel, showRideDetailsPanel })
    );
  }, [showFindTripPanel, showSelectVehiclePanel, showRideDetailsPanel]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!socket || !confirmedRideData?._id) return;
    socket.emit("join-room", confirmedRideData._id);
    const onMessage = (msg) => setMessages((prev) => [...prev, { msg, by: "other" }]);
    socket.on("receiveMessage", onMessage);
    return () => socket.off("receiveMessage", onMessage);
  }, [socket, confirmedRideData?._id]);

  const markers = [
    position?.coords
      ? { key: "me", lat: position.coords.latitude, lng: position.coords.longitude, title: "You", color: "#2563eb" }
      : null,
    pickupCoords ? { key: "pickup", lat: pickupCoords.lat, lng: pickupCoords.lng, title: "Pickup", subtitle: pickupLocation, color: "#10b981" } : null,
    destinationCoords ? { key: "destination", lat: destinationCoords.lat, lng: destinationCoords.lng, title: "Destination", subtitle: destinationLocation, color: "#0f172a" } : null,
    confirmedRideData?.captain?.location?.coordinates
      ? {
          key: "captain",
          lat: confirmedRideData.captain.location.coordinates[1],
          lng: confirmedRideData.captain.location.coordinates[0],
          title: "Driver",
          subtitle: `${confirmedRideData?.captain?.fullname?.firstname || ""} ${confirmedRideData?.captain?.fullname?.lastname || ""}`.trim(),
          color: "#f59e0b",
          kind: "vehicle",
          animated: true,
        }
      : null,
  ].filter(Boolean);

  const activeSearchValue = selectedInput === "pickup" ? pickupLocation : destinationLocation;
  const activeLocationConfirmed = selectedInput === "pickup" ? pickupConfirmed : destinationConfirmed;
  const isLocationSearching = false;
  const popularDestinations = [
    { label: "UNILAG", value: "University of Lagos, Akoka, Yaba, Lagos, Nigeria", icon: GraduationCap },
    { label: "Lagos Airport", value: "Murtala Muhammed International Airport, Ikeja, Lagos, Nigeria", icon: Plane },
    { label: "Victoria Island", value: "Victoria Island, Lagos, Nigeria", icon: MapPin },
  ];

  return (
    <div className="screen-safe screen-with-nav">
      <div className="mobile-bg" />
      <NetworkStatusBanner />
      <Sidebar />

      <div className="relative z-0 h-[41dvh] min-h-[285px] max-h-[410px] px-3 pb-0 pt-3">
        <div className="app-topbar mb-3 pr-[60px]">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="app-topbar-avatar">{user?.fullname?.firstname?.[0] || "R"}</div>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200"><Sparkles size={11} /> QuickRide Nigeria</p>
              <h1 className="truncate text-[14px] font-black tracking-tight min-[390px]:text-[15px]">Ready to ride, {user?.fullname?.firstname || "rider"}?</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2"><span className="hidden rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-black text-emerald-200 min-[460px]:inline-flex">Cash active</span><NotificationBell userType="user" /></div>
        </div>

        <div className="relative h-[calc(100%_-_62px)]">
          <LiveMap height="100%" center={mapCenter} markers={markers} routeCoords={routeCoords} followMarkerKey={confirmedRideData ? "captain" : null} />
          <div className="pointer-events-none absolute left-3 top-3 z-[500] flex gap-2">
            <span className="rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-[10px] font-black text-slate-700 shadow-lg backdrop-blur"><Navigation size={11} className="mr-1 inline" /> Live map</span>
            {confirmedRideData && <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-[10px] font-black text-white shadow-lg">{driverLiveAt ? "Driver live" : "Driver connected"}</span>}
          </div>
        </div>
        {mapNotice && (
          <div className="absolute left-3 right-3 top-[52px] z-[501] max-h-[72px] overflow-y-auto rounded-2xl border border-white/70 bg-white/95 px-3 py-2.5 text-[11px] font-semibold leading-4 text-slate-600 shadow-xl backdrop-blur">
            {mapNotice}
          </div>
        )}
      </div>

      {showFindTripPanel && (
        <div className="floating-sheet floating-sheet-nav sheet-frame z-30 min-h-[57dvh] sheet-enter">
          <div className="sheet-handle mt-4 mb-1" />
          <div className="sheet-body flex flex-col gap-3">

          <div className="flow-steps">
            <div className="flow-step flow-step-active"><span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[9px] text-white">1</span> Route</div>
            <div className="flow-step">2 Ride</div>
            <div className="flow-step">3 Confirm</div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="mini-label">Book a ride</p>
              <h2 className="mt-0.5 text-[clamp(1.55rem,7vw,1.95rem)] font-black tracking-[-0.04em] text-slate-950">Plan your trip</h2>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">Search Nigerian places and select the exact result.</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[17px] bg-emerald-50 text-emerald-700">
              <Search size={19} strokeWidth={2.3} />
            </div>
          </div>

          <div className="route-card route-card-advanced">
            <div className="route-line" />

            <div className="relative z-10 flex items-center gap-3">
              <span className="route-dot" />
              <LocationSuggestions
                inputId="pickup"
                label="Pickup"
                value={pickupLocation}
                token={token}
                confirmed={pickupConfirmed}
                placeholder="Area, landmark or address"
                userLocation={position?.coords ? { lat: position.coords.latitude, lng: position.coords.longitude } : null}
                onValueChange={(value) => {
                  setSelectedInput("pickup");
                  setPickupLocation(value);
                  setPickupConfirmed(false);
                  setPickupCoords(null);
                  setPickupAddressDetails(null);
                  setIsUsingLivePickup(false);
                  setServiceAreaStatus("unknown");
                  setMapNotice("");
                }}
                onSelectSuggestion={async (place) => {
                  setPickupLocation(place.address);
                  setPickupCoords({ lat: place.lat, lng: place.lng });
                  setPickupConfirmed(true);
                  setIsUsingLivePickup(false);
                  setServiceAreaStatus("inside");
                  setMapNotice("");
                  rememberPlace(place.address);
                  const details = await resolveLocationDetails(place.lat, place.lng);
                  if (details) {
                    setPickupAddressDetails(details);
                    if (details.address) setPickupLocation(details.address);
                  }
                }}
              />
            </div>

            <button
              type="button"
              className="route-swap-btn"
              onClick={swapLocations}
              aria-label="Swap pickup and destination"
              disabled={!pickupLocation && !destinationLocation}
            >
              <ArrowDownUp size={15} />
            </button>

            <div className="relative z-10 mt-2 flex items-center gap-3">
              <span className="route-dot route-dot-destination" />
              <LocationSuggestions
                inputId="destination"
                label="Drop-off"
                value={destinationLocation}
                token={token}
                confirmed={destinationConfirmed}
                placeholder="Where are you going?"
                userLocation={position?.coords ? { lat: position.coords.latitude, lng: position.coords.longitude } : null}
                onValueChange={(value) => {
                  setSelectedInput("destination");
                  setDestinationLocation(value);
                  setDestinationConfirmed(false);
                  setDestinationCoords(null);
                  setDestinationAddressDetails(null);
                  setMapNotice("");
                }}
                onSelectSuggestion={async (place) => {
                  setDestinationLocation(place.address);
                  setDestinationCoords({ lat: place.lat, lng: place.lng });
                  setDestinationConfirmed(true);
                  setMapNotice("");
                  rememberPlace(place.address);
                  const details = await resolveLocationDetails(place.lat, place.lng);
                  if (details) {
                    setDestinationAddressDetails(details);
                    if (details.address) setDestinationLocation(details.address);
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className={serviceAreaStatus === "outside" ? "rounded-[20px] border border-red-200 bg-red-50 px-3 py-3" : isUsingLivePickup ? "rounded-[20px] border border-emerald-200 bg-emerald-50 px-3 py-3" : "rounded-[20px] border border-slate-200 bg-slate-50 px-3 py-3"}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={serviceAreaStatus === "outside" ? "text-[10px] font-black uppercase tracking-[0.12em] text-red-600" : isUsingLivePickup ? "text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700" : "text-[10px] font-black uppercase tracking-[0.12em] text-slate-500"}>
                    {serviceAreaStatus === "outside" ? "Outside service area" : isUsingLivePickup ? "Live GPS active" : "Service area"}
                  </p>
                  <p className={serviceAreaStatus === "outside" ? "mt-1 text-xs font-bold leading-4 text-red-900" : "mt-1 text-xs font-bold leading-4 text-slate-700"}>
                    {serviceAreaStatus === "outside"
                      ? "QuickRide currently operates in Nigeria. Choose a pickup inside the service area to continue."
                      : isUsingLivePickup
                        ? "Your pickup coordinates update while this screen is open."
                        : "QuickRide currently operates in Nigeria. GPS is requested only when you tap the button below."}
                  </p>
                </div>
                {isUsingLivePickup ? <span className="rounded-full bg-emerald-600 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white">Live</span> : null}
              </div>
            </div>
            <div className={isUsingLivePickup ? "grid grid-cols-[1fr_auto] gap-2" : ""}>
              <button type="button" onClick={useCurrentLocationAsPickup} disabled={locationActionLoading || isUsingLivePickup} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-emerald-100 bg-emerald-50 px-3 text-xs font-black text-emerald-800 disabled:opacity-60"><Navigation size={15} /> {locationActionLoading ? "Finding your location…" : isUsingLivePickup ? "Live location active" : "Use my current location for pickup"}</button>
              {isUsingLivePickup ? <button type="button" onClick={stopLivePickup} className="min-h-11 rounded-[18px] border border-slate-200 bg-white px-3 text-xs font-black text-slate-600">Stop</button> : null}
            </div>

            {(pickupAddressDetails || destinationAddressDetails) ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {pickupAddressDetails ? <LocationDetailCard label="Pickup details" details={pickupAddressDetails} /> : null}
                {destinationAddressDetails ? <LocationDetailCard label="Drop-off details" details={destinationAddressDetails} /> : null}
              </div>
            ) : null}
          </div>

          {isLocationSearching ? (
            <div className="min-h-0 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.10)]">
              <LocationSuggestions
                suggestions={locationSuggestion}
                setSuggestions={setLocationSuggestion}
                setPickupLocation={setPickupLocation}
                setDestinationLocation={setDestinationLocation}
                input={selectedInput}
                loading={suggestionLoading}
                query={activeSearchValue}
                onSelectSuggestion={selectLocationSuggestion}
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="mini-label">Popular destinations</p>
                  <span className="text-[10px] font-bold text-slate-400">Lagos</span>
                </div>
                <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
                  {popularDestinations.map(({ label, value, icon: Icon }) => (
                    <button key={value} type="button" className="destination-chip" onClick={() => chooseQuickDestination(value)}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Icon size={15} /></span>
                      <span className="whitespace-nowrap">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {savedPlaces.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><p className="mini-label">Saved places</p><button type="button" onClick={() => window.location.assign("/user/tools")} className="text-[10px] font-black text-emerald-700">Manage</button></div>
                  <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
                    {savedPlaces.slice(0, 4).map((place) => <button key={place._id || place.address} type="button" className="destination-chip" onClick={() => chooseQuickDestination(place.address)}><MapPin size={14} className="text-emerald-600" /><span className="whitespace-nowrap">{place.label || place.address?.split(",")[0]}</span></button>)}
                  </div>
                </div>
              ) : null}

              {recentPlaces.length > 0 ? (
                <div className="space-y-2">
                  <p className="mini-label">Recent places</p>
                  <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
                    {recentPlaces.slice(0, 3).map((place) => (
                      <button key={place} type="button" className="recent-place-chip" onClick={() => chooseQuickDestination(place)}>
                        <Clock3 size={14} className="shrink-0 text-slate-400" />
                        <span className="max-w-[170px] truncate">{place.split(",")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="mini-label">When</p>
                  {pickupConfirmed && destinationConfirmed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700"><CheckCircle2 size={11} /> Locations ready</span>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-[20px] bg-slate-100 p-1.5">
                  <button type="button" className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black transition ${rideMode === "now" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`} onClick={() => setRideMode("now")}><Navigation size={14} /> Ride now</button>
                  <button type="button" className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black transition ${rideMode === "scheduled" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`} onClick={() => setRideMode("scheduled")}><CalendarClock size={14} /> Schedule</button>
                </div>
              </div>

              {rideMode === "scheduled" && (
                <div className="premium-card p-3">
                  <label className="mini-label">Pickup date & time</label>
                  <input type="datetime-local" className="input-box mt-2 bg-white" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
                  <p className="mt-2 text-[11px] font-semibold leading-4 text-slate-500">Your request will be prepared for the selected pickup time.</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="ride-benefit ride-benefit-green"><Banknote size={14} /><span>Cash</span></div>
                <div className="ride-benefit ride-benefit-blue"><Navigation size={14} /><span>Live trip</span></div>
                <div className="ride-benefit ride-benefit-rose"><ShieldCheck size={14} /><span>Safety</span></div>
              </div>
            </>
          )}

          {!isLocationSearching && (!pickupConfirmed || !destinationConfirmed) ? (
            <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-[11px] font-bold text-amber-800">
              <MapPin size={14} className="shrink-0" /> Select pickup and drop-off from the suggestions to continue.
            </div>
          ) : null}

          </div>
          <div className="sheet-fixed-footer">
            <Button
              title={pickupConfirmed && destinationConfirmed ? "See ride options" : "Select both locations"}
              loading={loading}
              loadingMessage="Calculating route"
              disabled={!pickupConfirmed || !destinationConfirmed || (rideMode === "scheduled" && !scheduledFor)}
              fun={() => getDistanceAndFare(pickupLocation, destinationLocation)}
            />
          </div>
        </div>
      )}

      <SelectVehicle selectedVehicle={setSelectedVehicle} showPanel={showSelectVehiclePanel} setShowPanel={setShowSelectVehiclePanel} showPreviousPanel={setShowFindTripPanel} showNextPanel={setShowRideDetailsPanel} fare={fare} currency={currency} routeInfo={routeInfo} />

      <RideDetails pickupLocation={pickupLocation} destinationLocation={destinationLocation} selectedVehicle={selectedVehicle} fare={fare} currency={currency} routeInfo={routeInfo} showPanel={showRideDetailsPanel} setShowPanel={setShowRideDetailsPanel} showPreviousPanel={setShowSelectVehiclePanel} createRide={createRide} cancelRide={cancelRide} loading={loading} rideCreated={rideCreated} confirmedRideData={confirmedRideData} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} paymentMethods={paymentMethods} promoCode={promoCode} setPromoCode={setPromoCode} />

      {(confirmedRideData || rideCreated) && (
        <div className="fixed fab-stack-nav left-4 right-4 z-[35] mx-auto grid max-w-xl grid-cols-2 gap-3 pointer-events-auto">
          <button type="button" className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-xl" onClick={() => setShowEmergencyModal(true)}>Emergency / SOS</button>
          <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-xl" onClick={() => setShowComplaintModal(true)}>File complaint</button>
        </div>
      )}

      {showRatingModal && (
        <div className="modal-backdrop">
          <div className="modal-sheet">
            <p className="mini-label">Trip completed</p>
            <h2 className="text-2xl font-black text-slate-950">Rate your driver</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Your feedback helps management monitor service quality.</p>
            <div className="mt-4 grid grid-cols-5 gap-1.5 min-[360px]:gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} className={`rounded-2xl border py-3 text-base font-black min-[360px]:text-lg ${rating === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"}`} onClick={() => { setRating(value); setRatingTags([]); }}>
                  {value}★
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(rating >= 4
                ? ["Safe driving", "Professional", "Clean vehicle", "Friendly", "Smooth pickup"]
                : ["Late pickup", "Unsafe driving", "Rude behaviour", "Vehicle issue", "Wrong route"]
              ).map((tag) => {
                const selected = ratingTags.includes(tag);
                return <button key={tag} type="button" onClick={() => setRatingTags((items) => selected ? items.filter((item) => item !== tag) : [...items, tag].slice(0, 6))} className={`rounded-full border px-3 py-2 text-xs font-black transition ${selected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{tag}</button>;
              })}
            </div>
            <textarea className="input-box mt-4 min-h-28 resize-none" placeholder="Leave a comment (optional)" value={review} onChange={(e) => setReview(e.target.value)} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="secondary-btn w-full" onClick={() => setShowRatingModal(false)}>Later</button>
              <button className="primary-btn w-full" onClick={submitRating}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {showEmergencyModal && (
        <div className="modal-backdrop">
          <div className="modal-sheet">
            <p className="mini-label">Passenger safety</p>
            <h2 className="text-2xl font-black text-slate-950">Emergency / SOS</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">This creates an urgent admin alert with ride and location context.</p>
            <select className="input-box mt-4" value={emergencyType} onChange={(e) => setEmergencyType(e.target.value)}>
              <option value="unsafe_driving">Unsafe driving</option>
              <option value="driver_behavior">Driver behavior issue</option>
              <option value="wrong_route">Wrong route</option>
              <option value="medical">Medical emergency</option>
              <option value="vehicle_issue">Vehicle issue</option>
              <option value="other">Other</option>
            </select>
            <textarea className="input-box mt-3 min-h-28 resize-none" placeholder="Add details for admin" value={emergencyMessage} onChange={(e) => setEmergencyMessage(e.target.value)} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="secondary-btn" onClick={() => setShowEmergencyModal(false)}>Cancel</button>
              <button className="danger-btn" onClick={submitEmergency} disabled={loading}>Send SOS</button>
            </div>
          </div>
        </div>
      )}

      {showComplaintModal && (
        <div className="modal-backdrop">
          <div className="modal-sheet">
            <p className="mini-label">Support case</p>
            <h2 className="text-2xl font-black text-slate-950">Complaint against driver</h2>
            <select className="input-box mt-4" value={complaintCategory} onChange={(e) => setComplaintCategory(e.target.value)}>
              <option value="driver_behavior">Driver behavior</option>
              <option value="unsafe_driving">Unsafe driving</option>
              <option value="vehicle_condition">Vehicle condition</option>
              <option value="fare_issue">Fare issue</option>
              <option value="late_arrival">Late arrival</option>
              <option value="other">Other</option>
            </select>
            <textarea className="input-box mt-3 min-h-32 resize-none" placeholder="Describe what happened" value={complaintDescription} onChange={(e) => setComplaintDescription(e.target.value)} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="secondary-btn" onClick={() => setShowComplaintModal(false)}>Cancel</button>
              <button className="primary-btn" onClick={submitComplaint} disabled={loading || complaintDescription.length < 5}>Submit</button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav userType="user" />
    </div>
  );
}

function LocationDetailCard({ label, details }) {
  const locality = [details.area, details.city, details.state].filter(Boolean).join(", ");
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-black leading-4 text-slate-900">{details.street || details.address || "Resolved location"}</p>
      {details.landmark ? <p className="mt-1 text-[10px] font-bold text-emerald-700">Near {details.landmark}{Number.isFinite(Number(details.landmarkDistanceKm)) ? ` • ${details.landmarkDistanceKm} km` : ""}</p> : null}
      {locality ? <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{locality}</p> : null}
      {details.postalCode ? <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-slate-400">Postal code {details.postalCode}</p> : null}
    </div>
  );
}

export default UserHomeScreen;
