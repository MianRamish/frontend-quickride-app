import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "../contexts/UserContext";
import LiveMap from "../components/LiveMap";
import {
  Button,
  LocationSuggestions,
  SelectVehicle,
  RideDetails,
  Sidebar,
} from "../components";
import axios from "axios";
import debounce from "lodash.debounce";
import { SocketDataContext } from "../contexts/SocketContext";
import Console from "../utils/console";

function UserHomeScreen() {
  const token = localStorage.getItem("token");
  const { socket } = useContext(SocketDataContext);
  const { user } = useUser();
  const [messages, setMessages] = useState(JSON.parse(localStorage.getItem("messages")) || []);
  const [loading, setLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [completedRide, setCompletedRide] = useState(null);
  const [position, setPosition] = useState(null);

  const [selectedInput, setSelectedInput] = useState("pickup");
  const [locationSuggestion, setLocationSuggestion] = useState([]);
  const [mapCenter, setMapCenter] = useState([43.6532, -79.3832]);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
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
  const [currency, setCurrency] = useState("USD");
  const [confirmedRideData, setConfirmedRideData] = useState(null);
  const rideTimeout = useRef(null);

  const [showFindTripPanel, setShowFindTripPanel] = useState(true);
  const [showSelectVehiclePanel, setShowSelectVehiclePanel] = useState(false);
  const [showRideDetailsPanel, setShowRideDetailsPanel] = useState(false);

  const handleLocationChange = useCallback(
    debounce(async (inputValue, authToken) => {
      if (inputValue.length < 3) return;
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/map/get-suggestions?input=${encodeURIComponent(inputValue)}`,
          { headers: { token: authToken } }
        );
        setLocationSuggestion(response.data || []);
      } catch (error) {
        Console.error(error);
      }
    }, 700),
    []
  );

  const onChangeHandler = (e) => {
    const { id, value } = e.target;
    setSelectedInput(id);
    if (id === "pickup") setPickupLocation(value);
    if (id === "destination") setDestinationLocation(value);

    if (value.length >= 3) {
      handleLocationChange(value, token);
    } else {
      setLocationSuggestion([]);
    }
  };

  const getDistanceAndFare = async (pickup, destination) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/ride/get-fare?pickup=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}`,
        { headers: { token } }
      );
      setFare(response.data.fare || { car: 0, bike: 0 });
      setCurrency(response.data.market?.currency || "USD");
      const distanceTime = response.data.distanceTime || {};
      const origin = distanceTime.originCoordinates;
      const destinationPoint = distanceTime.destinationCoordinates;
      if (origin) setPickupCoords({ lat: origin.ltd, lng: origin.lng });
      if (destinationPoint) setDestinationCoords({ lat: destinationPoint.ltd, lng: destinationPoint.lng });
      setRouteCoords(distanceTime.route || []);
      if (origin) setMapCenter([origin.ltd, origin.lng]);
      setShowFindTripPanel(false);
      setShowSelectVehiclePanel(true);
      setLocationSuggestion([]);
    } catch (error) {
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
        vehicleType: selectedVehicle,
        fare,
        currency,
        confirmedRideData: null,
        rideMode,
        scheduledFor: rideMode === "scheduled" ? scheduledFor : null,
        _id: response.data._id,
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

      const timeoutMs = Number(import.meta.env.VITE_RIDE_TIMEOUT || 90000);
      rideTimeout.current = setTimeout(() => {
        cancelRide("NO_DRIVER_FOUND", "No driver accepted the ride in time");
      }, timeoutMs);
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
    updateLocation();
    setRouteCoords([]);
    setPickupCoords(null);
    setDestinationCoords(null);
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
    if (!rideId) return resetRideUi();

    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/ride/cancel-user`,
        { rideId, reasonCode, reasonText },
        { headers: { token } }
      );
      resetRideUi();
    } catch (error) {
      Console.log(error);
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
        { rideId, rating, review },
        { headers: { token } }
      );
      setShowRatingModal(false);
      setCompletedRide(null);
      setReview("");
      setRating(5);
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
    setSelectedVehicle("car");
    setFare({ car: 0, bike: 0 });
    setConfirmedRideData(null);
    setRideCreated(false);
    setRideMode("now");
    setScheduledFor("");
  };

  const DEFAULT_MAP_CENTER = [43.6532, -79.3832];

  const updateLocation = () => {
    if (!navigator.geolocation) {
      setMapCenter(DEFAULT_MAP_CENTER);
      setMapNotice("Location is unavailable. You can still enter pickup and destination manually.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (currentPosition) => {
        setPosition(currentPosition);
        setMapCenter([currentPosition.coords.latitude, currentPosition.coords.longitude]);
        setMapNotice("");
      },
      (error) => {
        Console.warn?.("Location unavailable, using fallback map center", error);
        setPosition(null);
        setMapCenter(DEFAULT_MAP_CENTER);
        setMapNotice("Location permission is unavailable. Type pickup and destination to continue.");
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  };

  useEffect(() => {
    updateLocation();
  }, []);

  useEffect(() => {
    if (!socket || !user?._id) return;

    socket.emit("join", { userId: user._id, userType: "user" });

    const onRideConfirmed = (data) => {
      clearTimeout(rideTimeout.current);
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
      }
    };

    const onRideStarted = () => {
      if (destinationCoords) setMapCenter([destinationCoords.lat, destinationCoords.lng]);
    };

    const onRideEnded = (data) => {
      setCompletedRide(data);
      setShowRatingModal(true);
      resetRideUi();
    };

    const onRideCancelled = () => resetRideUi();
    const onCaptainLocation = (payload) => {
      if (!payload?.location?.ltd || !payload?.location?.lng) return;
      setMapCenter([payload.location.ltd, payload.location.lng]);
      setConfirmedRideData((prev) => prev ? {
        ...prev,
        captain: {
          ...(prev.captain || payload.captain || {}),
          location: { coordinates: [payload.location.lng, payload.location.ltd] },
        },
      } : prev);
    };

    socket.on("ride-confirmed", onRideConfirmed);
    socket.on("ride-started", onRideStarted);
    socket.on("ride-ended", onRideEnded);
    socket.on("ride-cancelled", onRideCancelled);
    socket.on("captain-location-updated", onCaptainLocation);

    return () => {
      socket.off("ride-confirmed", onRideConfirmed);
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
      setSelectedVehicle(ride.vehicleType || "car");
      setFare(ride.fare || { car: 0, bike: 0 });
      setCurrency(ride.currency || "USD");
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
      vehicleType: selectedVehicle,
      fare,
      confirmedRideData,
    };
    if (pickupLocation || destinationLocation || confirmedRideData || current?._id) {
      localStorage.setItem("rideDetails", JSON.stringify(rideData));
    }
  }, [pickupLocation, destinationLocation, selectedVehicle, fare, confirmedRideData]);

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
      ? { key: "me", lat: position.coords.latitude, lng: position.coords.longitude, title: "You" }
      : null,
    pickupCoords ? { key: "pickup", lat: pickupCoords.lat, lng: pickupCoords.lng, title: "Pickup", subtitle: pickupLocation } : null,
    destinationCoords ? { key: "destination", lat: destinationCoords.lat, lng: destinationCoords.lng, title: "Destination", subtitle: destinationLocation } : null,
    confirmedRideData?.captain?.location?.coordinates
      ? {
          key: "captain",
          lat: confirmedRideData.captain.location.coordinates[1],
          lng: confirmedRideData.captain.location.coordinates[0],
          title: "Driver",
          subtitle: `${confirmedRideData?.captain?.fullname?.firstname || ""} ${confirmedRideData?.captain?.fullname?.lastname || ""}`.trim(),
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="screen-safe">
      <div className="mobile-bg" />
      <Sidebar />

      <div className="relative z-0 h-[43dvh] min-h-[280px] max-h-[410px] px-4 pb-0 pt-4">
        <div className="mb-3 flex items-start justify-between gap-3 pr-14 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">QuickRide</p>
            <h1 className="mt-1 text-[clamp(1.35rem,6vw,1.55rem)] font-black tracking-tight">Where to today?</h1>
          </div>
          <div className="hidden rounded-2xl bg-white/15 px-3 py-2 text-right backdrop-blur min-[360px]:block">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Market</p>
            <p className="text-sm font-black">CA / US</p>
          </div>
        </div>
        <LiveMap height="calc(100% - 58px)" center={mapCenter} markers={markers} routeCoords={routeCoords} />
        {mapNotice && (
          <div className="absolute bottom-3 left-6 right-6 rounded-2xl border border-white/70 bg-white/95 px-3 py-2 text-[11px] font-semibold leading-4 text-slate-600 shadow-xl">
            {mapNotice}
          </div>
        )}
      </div>

      {showFindTripPanel && (
        <div className="floating-sheet z-30 flex min-h-[48dvh] flex-col gap-4 sheet-scroll">
          <div className="sheet-handle" />
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="mini-label">Book a ride</p>
              <h2 className="text-[clamp(1.8rem,8vw,2rem)] font-black tracking-tight text-slate-950">Find a trip</h2>
            </div>
            <span className="pill">OpenStreetMap</span>
          </div>

          <div className="soft-card p-3 shadow-none">
            <div className="relative flex items-center">
              <div className="absolute bottom-5 left-5 top-5 flex w-1 flex-col items-center justify-between rounded-full bg-slate-950">
                <div className="-mt-1 h-3 w-3 rounded-full border-[3px] border-slate-950 bg-white" />
                <div className="-mb-1 h-3 w-3 rounded-sm border-[3px] border-slate-950 bg-white" />
              </div>
              <div className="min-w-0 w-full space-y-2 pl-9">
                <input id="pickup" placeholder="Pickup in Canada or United States" className="input-box" value={pickupLocation} onChange={onChangeHandler} autoComplete="off" />
                <input id="destination" placeholder="Drop-off location" className="input-box" value={destinationLocation} onChange={onChangeHandler} autoComplete="off" />
              </div>
            </div>
          </div>


          <div className="grid grid-cols-2 gap-3">
            <button type="button" className={`rounded-2xl border px-4 py-3 text-sm font-black ${rideMode === "now" ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"}`} onClick={() => setRideMode("now")}>Ride now</button>
            <button type="button" className={`rounded-2xl border px-4 py-3 text-sm font-black ${rideMode === "scheduled" ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"}`} onClick={() => setRideMode("scheduled")}>Schedule later</button>
          </div>

          {rideMode === "scheduled" && (
            <div className="soft-card p-3 shadow-none">
              <label className="mini-label">Pickup date & time</label>
              <input type="datetime-local" className="input-box mt-2" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
              <p className="mt-2 text-xs font-semibold text-slate-500">Scheduled rides are saved for admin monitoring and can be dispatched closer to pickup time.</p>
            </div>
          )}
          <Button
            title="Search rides"
            loading={loading}
            loadingMessage="Finding route"
            disabled={pickupLocation.length <= 2 || destinationLocation.length <= 2 || (rideMode === "scheduled" && !scheduledFor)}
            fun={() => getDistanceAndFare(pickupLocation, destinationLocation)}
          />

          {locationSuggestion.length > 0 && (
            <div className="min-h-0 overflow-hidden">
              <LocationSuggestions suggestions={locationSuggestion} setSuggestions={setLocationSuggestion} setPickupLocation={setPickupLocation} setDestinationLocation={setDestinationLocation} input={selectedInput} />
            </div>
          )}
        </div>
      )}

      <SelectVehicle selectedVehicle={setSelectedVehicle} showPanel={showSelectVehiclePanel} setShowPanel={setShowSelectVehiclePanel} showPreviousPanel={setShowFindTripPanel} showNextPanel={setShowRideDetailsPanel} fare={fare} currency={currency} />

      <RideDetails pickupLocation={pickupLocation} destinationLocation={destinationLocation} selectedVehicle={selectedVehicle} fare={fare} currency={currency} showPanel={showRideDetailsPanel} setShowPanel={setShowRideDetailsPanel} showPreviousPanel={setShowSelectVehiclePanel} createRide={createRide} cancelRide={cancelRide} loading={loading} rideCreated={rideCreated} confirmedRideData={confirmedRideData} />

      {(confirmedRideData || rideCreated) && (
        <div className="fixed bottom-5 left-4 right-4 z-40 mx-auto grid max-w-xl grid-cols-2 gap-3 pointer-events-auto">
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
                <button key={value} className={`rounded-2xl border py-3 text-base font-black min-[360px]:text-lg ${rating === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"}`} onClick={() => setRating(value)}>
                  {value}★
                </button>
              ))}
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

    </div>
  );
}

export default UserHomeScreen;
