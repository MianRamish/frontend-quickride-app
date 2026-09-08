import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useCaptain } from "../contexts/CaptainContext";
import { BarChart3, BellRing, CarFront, Check, Crosshair, FileCheck2, FileText, Gauge, LoaderCircle, LocateFixed, MapPin, Navigation, Phone, Power, RefreshCcw, Search, ShieldAlert, Sparkles, UploadCloud, X } from "lucide-react";
import { SocketDataContext } from "../contexts/SocketContext";
import { NewRide, Sidebar, NetworkStatusBanner, NotificationBell, MobileBottomNav } from "../components";
import LiveMap from "../components/LiveMap";
import Console from "../utils/console";
import { useAlert } from "../hooks/useAlert";
import { Alert } from "../components";
import { formatMoney } from "../utils/formatMoney";

const MAX_DOC_FILE_MB = 4;
const DOC_FIELDS = [
  { key: "license", label: "Driver license", urlKey: "licenseUrl" },
  { key: "registration", label: "Vehicle registration", urlKey: "vehicleRegistrationUrl" },
  { key: "insurance", label: "Vehicle insurance", urlKey: "insuranceUrl" },
  { key: "governmentId", label: "Government ID", urlKey: "governmentIdUrl" },
];

const DRIVER_TABS = [
  { key: "overview", label: "Overview", icon: Gauge },
  { key: "requests", label: "Rides", icon: BellRing },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "earnings", label: "Earnings", icon: BarChart3 },
  { key: "vehicle", label: "Vehicle", icon: CarFront },
];

const formatDocSize = (bytes = 0) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const docFileToDataUrl = (file) => new Promise((resolve, reject) => {
  if (!file) return resolve("");
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const defaultRideData = {
  user: {
    fullname: {
      firstname: "No",
      lastname: "User",
    },
    _id: "",
    email: "example@gmail.com",
    rides: [],
  },
  pickup: "Place, City, State, Country",
  destination: "Place, City, State, Country",
  fare: 0,
  vehicle: "car",
  status: "pending",
  duration: 0,
  distance: 0,
  _id: "123456789012345678901234",
};

function CaptainHomeScreen() {
  const token = localStorage.getItem("token");
const fetchCaptainExtras = async () => {
  try {
    const [eRes, iRes, pRes] = await Promise.all([
      axios.get(`${import.meta.env.VITE_SERVER_URL}/captain/earnings`, { headers: { token } }),
      axios.get(`${import.meta.env.VITE_SERVER_URL}/captain/incentives`, { headers: { token } }),
      axios.get(`${import.meta.env.VITE_SERVER_URL}/captain/performance`, { headers: { token } }),
    ]);
    setEarningsSummary(eRes.data);
    setIncentives(iRes.data || []);
    setPerformance(pRes.data);
  } catch (e) {
    // ignore
  }
};


const fetchWithdrawals = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/captain/withdrawals`, { headers: { token } });
    setWithdrawals(response.data || []);
  } catch (e) {
    // ignore
  }
};

const requestWithdrawal = async (event) => {
  event.preventDefault();
  try {
    setLoading(true);
    await axios.post(`${import.meta.env.VITE_SERVER_URL}/captain/withdrawals`, withdrawalForm, { headers: { token } });
    setWithdrawalForm({ amount: "", method: "bank", bankName: "", accountHolder: "", accountNumber: "", routingNumber: "", payoutEmail: "" });
    await Promise.all([fetchCaptainExtras(), fetchWithdrawals()]);
    showAlert("Withdrawal requested", "Admin will review your withdrawal request.", "success");
  } catch (error) {
    showAlert("Withdrawal failed", error?.response?.data?.message || "Please try again.", "failure");
  } finally {
    setLoading(false);
  }
};

  const { captain, setCaptain } = useCaptain();
  const { socket, isConnected: socketConnected } = useContext(SocketDataContext);
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [earningsSummary, setEarningsSummary] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalForm, setWithdrawalForm] = useState({ amount: "", method: "bank", bankName: "", accountHolder: "", accountNumber: "", routingNumber: "", payoutEmail: "" });
  const [incentives, setIncentives] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [incomingRides, setIncomingRides] = useState([]);
  const [isOnline, setIsOnline] = useState(Boolean(captain?.isOnline));
  const [showDocumentPanel, setShowDocumentPanel] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [docFiles, setDocFiles] = useState({});
  const [docForm, setDocForm] = useState({
    licenseNumber: captain?.documents?.licenseNumber || "",
    licenseExpiry: captain?.documents?.licenseExpiry ? String(captain.documents.licenseExpiry).slice(0, 10) : "",
    vehicleRegistrationExpiry: captain?.documents?.vehicleRegistrationExpiry ? String(captain.documents.vehicleRegistrationExpiry).slice(0, 10) : "",
    insuranceExpiry: captain?.documents?.insuranceExpiry ? String(captain.documents.insuranceExpiry).slice(0, 10) : "",
    backgroundCheckConsent: Boolean(captain?.documents?.backgroundCheckConsent),
  });

  const { alert, showAlert, hideAlert } = useAlert();

  const [riderLocation, setRiderLocation] = useState({
    ltd: null,
    lng: null,
  });
  const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]);
  const [earnings, setEarnings] = useState({
    total: 0,
    today: 0,
  });

  const [rides, setRides] = useState({
    accepted: 0,
    cancelled: 0,
    distanceTravelled: 0,
  });
  const [newRide, setNewRide] = useState(
    JSON.parse(localStorage.getItem("rideDetails")) || defaultRideData
  );

  const [otp, setOtp] = useState("");
  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem("messages")) || []
  );
  const [error, setError] = useState("");
  const [lastLocationAt, setLastLocationAt] = useState(captain?.lastLocationAt || null);
  const [trackingState, setTrackingState] = useState("idle");
  const [geoPermission, setGeoPermission] = useState("unknown");
  const [trackingMessage, setTrackingMessage] = useState("");
  // GPS tracking must only start after an explicit driver action (Go online / Refresh GPS).
  // Do not auto-trigger browser location prompts merely because the backend remembers isOnline.
  const [gpsSessionActive, setGpsSessionActive] = useState(false);
  const lastGpsRef = useRef(null);
  const geoRequestRef = useRef(null);
  const geoWatchRef = useRef(null);
  const geoPermissionRef = useRef("unknown");
  const [locationSource, setLocationSource] = useState(captain?.lastLocationSource === "manual" ? "manual" : "gps");
  const [manualLocationLabel, setManualLocationLabel] = useState(captain?.manualLocationLabel || "");
  const [showLocationSetup, setShowLocationSetup] = useState(false);
  const [manualLocationDraft, setManualLocationDraft] = useState(() => {
    const coords = captain?.location?.coordinates || [];
    return Number.isFinite(Number(coords[1])) && Number.isFinite(Number(coords[0]))
      ? { lat: Number(coords[1]), lng: Number(coords[0]), label: captain?.manualLocationLabel || "" }
      : { lat: 6.5244, lng: 3.3792, label: "" };
  });
  const [manualSearch, setManualSearch] = useState("");
  const [manualSuggestions, setManualSuggestions] = useState([]);
  const [manualSearchLoading, setManualSearchLoading] = useState(false);
  const [manualLocationSaving, setManualLocationSaving] = useState(false);
  const [manualLocationChosen, setManualLocationChosen] = useState(false);
  const manualSearchTimerRef = useRef(null);
  const [showPassengerRating, setShowPassengerRating] = useState(false);
  const [passengerRating, setPassengerRating] = useState(5);
  const [passengerReview, setPassengerReview] = useState("");
  const [passengerRatingTags, setPassengerRatingTags] = useState([]);
  const [completedRideForRating, setCompletedRideForRating] = useState(null);

  // Panels
  const [showCaptainDetailsPanel, setShowCaptainDetailsPanel] = useState(true);
  const [showNewRidePanel, setShowNewRidePanel] = useState(
    JSON.parse(localStorage.getItem("showPanel")) || false
  );
  const [showBtn, setShowBtn] = useState(
    JSON.parse(localStorage.getItem("showBtn")) || "accept"
  );

  const refreshCaptainProfile = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/captain/profile`, { headers: { token } });
      const freshCaptain = response.data?.captain;
      if (freshCaptain) {
        setCaptain(freshCaptain);
        localStorage.setItem("userData", JSON.stringify({ type: "captain", data: freshCaptain }));
        setIsOnline(Boolean(freshCaptain.isOnline));
        setLocationSource(freshCaptain.lastLocationSource === "manual" ? "manual" : "gps");
        setManualLocationLabel(freshCaptain.manualLocationLabel || "");
        const freshCoords = freshCaptain?.location?.coordinates || [];
        if (Number.isFinite(Number(freshCoords[1])) && Number.isFinite(Number(freshCoords[0]))) {
          setRiderLocation({ ltd: Number(freshCoords[1]), lng: Number(freshCoords[0]) });
          setMapCenter([Number(freshCoords[1]), Number(freshCoords[0])]);
          if (freshCaptain.lastLocationSource === "manual") {
            lastGpsRef.current = {
              ltd: Number(freshCoords[1]),
              lng: Number(freshCoords[0]),
              accuracy: null,
              heading: null,
              capturedAt: freshCaptain.lastLocationAt ? new Date(freshCaptain.lastLocationAt).getTime() : Date.now(),
              source: "manual",
            };
          }
        }
        setLastLocationAt(freshCaptain.lastLocationAt || null);
        setDocForm({
          licenseNumber: freshCaptain?.documents?.licenseNumber || "",
          licenseExpiry: freshCaptain?.documents?.licenseExpiry ? String(freshCaptain.documents.licenseExpiry).slice(0, 10) : "",
          vehicleRegistrationExpiry: freshCaptain?.documents?.vehicleRegistrationExpiry ? String(freshCaptain.documents.vehicleRegistrationExpiry).slice(0, 10) : "",
          insuranceExpiry: freshCaptain?.documents?.insuranceExpiry ? String(freshCaptain.documents.insuranceExpiry).slice(0, 10) : "",
          backgroundCheckConsent: Boolean(freshCaptain?.documents?.backgroundCheckConsent),
        });
      }
    } catch (error) {
      // If auth expires, the protected wrapper will handle redirect on next navigation.
    }
  };

  const handleDocFile = (key, file) => {
    if (!file) {
      setDocFiles((prev) => { const next = { ...prev }; delete next[key]; return next; });
      return;
    }
    if (file.size > MAX_DOC_FILE_MB * 1024 * 1024) {
      showAlert("File too large", `${file.name} is ${formatDocSize(file.size)}. Please upload files under ${MAX_DOC_FILE_MB} MB.`, "failure");
      return;
    }
    setDocFiles((prev) => ({ ...prev, [key]: file }));
  };

  const openDocument = (url, label = "Document") => {
    if (!url) {
      showAlert("Document missing", "No document file has been uploaded yet.", "failure");
      return;
    }

    try {
      if (String(url).startsWith("data:")) {
        const [meta, content] = url.split(",");
        const mime = meta.match(/data:(.*?);base64/)?.[1] || "application/octet-stream";
        const binary = atob(content || "");
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
        const opened = window.open(blobUrl, "_blank", "noopener,noreferrer");
        if (!opened) {
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `${label.replace(/\s+/g, "-").toLowerCase()}.${mime.includes("pdf") ? "pdf" : "jpg"}`;
          link.click();
        }
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        return;
      }

      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) showAlert("Popup blocked", "Please allow popups for this site to view documents.", "failure");
    } catch (error) {
      showAlert("Unable to open document", "The uploaded document could not be opened. Please upload it again.", "failure");
    }
  };

  const submitUpdatedDocuments = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const uploaded = {};
      for (const field of DOC_FIELDS) {
        uploaded[field.urlKey] = docFiles[field.key] ? await docFileToDataUrl(docFiles[field.key]) : undefined;
      }

      const documents = {
        ...Object.fromEntries(Object.entries(uploaded).filter(([, value]) => value !== undefined)),
        licenseNumber: docForm.licenseNumber,
        licenseExpiry: docForm.licenseExpiry || null,
        vehicleRegistrationExpiry: docForm.vehicleRegistrationExpiry || null,
        insuranceExpiry: docForm.insuranceExpiry || null,
        backgroundCheckConsent: Boolean(docForm.backgroundCheckConsent),
      };

      const response = await axios.patch(
        `${import.meta.env.VITE_SERVER_URL}/captain/documents`,
        { documents, backgroundCheckConsent: Boolean(docForm.backgroundCheckConsent) },
        { headers: { token } }
      );
      const freshCaptain = response.data?.captain;
      if (freshCaptain) {
        setCaptain(freshCaptain);
        localStorage.setItem("userData", JSON.stringify({ type: "captain", data: freshCaptain }));
      }
      setDocFiles({});
      setShowDocumentPanel(false);
      showAlert("Documents submitted", "Your account is now pending admin verification again.", "success");
      await refreshCaptainProfile();
    } catch (error) {
      showAlert("Upload failed", error?.response?.data?.message || "Please try again.", "failure");
    } finally {
      setLoading(false);
    }
  };

  const acceptRide = async () => {
    try {
      if (newRide._id != "") {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/ride/confirm`,
          { rideId: newRide._id },
          {
            headers: {
              token: token,
            },
          }
        );
        setLoading(false);
        setNewRide(response.data || newRide);
        setShowBtn("arriving");
        if (riderLocation.ltd && riderLocation.lng) setMapCenter([riderLocation.ltd, riderLocation.lng]);
        Console.log(response);
      }
    } catch (error) {
      setLoading(false);
      showAlert('Some error occured', error.response.data.message, 'failure');
      Console.log(error.response);
      setTimeout(() => {
        clearRideData();
      }, 1000);
    }
  };

  const markArriving = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/ride/arriving`, { rideId: newRide._id }, { headers: { token } });
      setNewRide(response.data || { ...newRide, status: "arriving" });
      setShowBtn("arrived");
      if (riderLocation.ltd && riderLocation.lng) setMapCenter([riderLocation.ltd, riderLocation.lng]);
    } catch (error) {
      showAlert("Unable to update trip", error?.response?.data?.message || "Please try again.", "failure");
    } finally { setLoading(false); }
  };

  const markArrived = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/ride/arrived`, { rideId: newRide._id }, { headers: { token } });
      setNewRide(response.data || { ...newRide, status: "arrived", arrivedAt: new Date().toISOString() });
      setShowBtn("otp");
    } catch (error) {
      showAlert("Unable to mark arrived", error?.response?.data?.message || "Please try again.", "failure");
    } finally { setLoading(false); }
  };

  const callPassenger = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/ride/${newRide._id}/contact`, { headers: { token } });
      if (response.data?.phone) window.location.href = `tel:${response.data.phone}`;
    } catch (error) {
      showAlert("Call unavailable", error?.response?.data?.message || "Calling is only available on an active trip.", "failure");
    }
  };

  const cancelActiveRide = async (reasonCode, reasonText) => {
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/ride/cancel-captain`, { rideId: newRide._id, reasonCode, reasonText }, { headers: { token } });
      clearRideData();
      await fetchIncomingRides();
    } catch (error) {
      showAlert("Unable to cancel", error?.response?.data?.message || "Please try again.", "failure");
    } finally { setLoading(false); }
  };

  const rejectRide = async (rideOverride = null) => {
    const rideToReject = rideOverride || newRide;
    if (!rideToReject?._id) return;
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/ride/reject`, { rideId: rideToReject._id, reasonCode: "NOT_AVAILABLE", reasonText: "Driver rejected the request" }, { headers: { token } });
      setIncomingRides((prev) => prev.filter((ride) => ride._id !== rideToReject._id));
      if (newRide?._id === rideToReject._id) clearRideData();
      await fetchIncomingRides();
    } catch (error) {
      showAlert("Unable to reject ride", error?.response?.data?.message || "Please try again", "failure");
    } finally {
      setLoading(false);
    }
  };

  const openLocationSetupPanel = () => {
    const current = lastGpsRef.current;
    if (current && Number.isFinite(Number(current.ltd)) && Number.isFinite(Number(current.lng))) {
      setManualLocationDraft({ lat: Number(current.ltd), lng: Number(current.lng), label: manualLocationLabel || "" });
    } else if (riderLocation.ltd && riderLocation.lng) {
      setManualLocationDraft({ lat: Number(riderLocation.ltd), lng: Number(riderLocation.lng), label: manualLocationLabel || "" });
    }
    setManualSearch("");
    setManualSuggestions([]);
    setManualLocationChosen(locationSource === "manual" && Boolean(lastLocationAt));
    setShowLocationSetup(true);
  };

  const searchManualPlaces = (value) => {
    setManualSearch(value);
    setManualSuggestions([]);
    if (manualSearchTimerRef.current) window.clearTimeout(manualSearchTimerRef.current);
    if (value.trim().length < 3) {
      setManualSearchLoading(false);
      return;
    }
    setManualSearchLoading(true);
    manualSearchTimerRef.current = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ input: value.trim() });
        if (Number.isFinite(Number(manualLocationDraft.lat)) && Number.isFinite(Number(manualLocationDraft.lng))) {
          params.set("lat", String(manualLocationDraft.lat));
          params.set("lng", String(manualLocationDraft.lng));
        }
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/map/get-suggestions?${params.toString()}`, { headers: { token } });
        setManualSuggestions(Array.isArray(response.data) ? response.data.slice(0, 8) : []);
      } catch (_) {
        setManualSuggestions([]);
      } finally {
        setManualSearchLoading(false);
      }
    }, 260);
  };

  const chooseManualSuggestion = async (suggestion) => {
    try {
      setManualSearchLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/map/get-coordinates?address=${encodeURIComponent(suggestion)}`, { headers: { token } });
      const ltd = Number(response.data?.ltd);
      const lng = Number(response.data?.lng);
      if (!Number.isFinite(ltd) || !Number.isFinite(lng)) throw new Error("No coordinates returned");
      setManualLocationDraft({ lat: ltd, lng, label: suggestion });
      setManualLocationChosen(true);
      setManualSearch(suggestion);
      setManualSuggestions([]);
    } catch (_) {
      showAlert("Location not found", "Try a more specific area, landmark or street name.", "failure");
    } finally {
      setManualSearchLoading(false);
    }
  };

  const chooseManualMapPoint = async ({ lat, lng }) => {
    const next = { lat: Number(lat), lng: Number(lng), label: "Pinned driver location" };
    setManualLocationDraft(next);
    setManualLocationChosen(true);
    setManualSuggestions([]);
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/map/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`, { headers: { token } });
      const label = response.data?.address || next.label;
      setManualLocationDraft({ lat: Number(lat), lng: Number(lng), label });
      setManualSearch(label);
    } catch (_) {
      setManualSearch(`${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`);
    }
  };

  const saveManualLocation = async () => {
    const lat = Number(manualLocationDraft.lat);
    const lng = Number(manualLocationDraft.lng);
    if (!manualLocationChosen || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      showAlert("Choose your location", "Search for your area or tap your position on the map first.", "failure");
      return;
    }
    try {
      setManualLocationSaving(true);
      const label = String(manualLocationDraft.label || manualSearch || "Pinned driver location").trim();
      const response = await axios.patch(
        `${import.meta.env.VITE_SERVER_URL}/captain/location`,
        { ltd: lat, lng, source: "manual", label },
        { headers: { token } }
      );
      const confirmedAt = response.data?.lastLocationAt || new Date().toISOString();
      const capturedAt = new Date(confirmedAt).getTime();
      lastGpsRef.current = { ltd: lat, lng, accuracy: null, heading: null, capturedAt, source: "manual" };
      setLocationSource("manual");
      setManualLocationLabel(label);
      setGpsSessionActive(false);
      setRiderLocation({ ltd: lat, lng });
      setMapCenter([lat, lng]);
      setLastLocationAt(confirmedAt);
      setTrackingState("manual");
      setTrackingMessage("");
      setShowLocationSetup(false);
      if (isOnline) await fetchIncomingRides();
      showAlert("Location confirmed", "QuickRide will use this pinned location for nearby rides. Reconfirm it if you move.", "success");
    } catch (error) {
      showAlert("Unable to save location", error?.response?.data?.message || "Please try again.", "failure");
    } finally {
      setManualLocationSaving(false);
    }
  };

  const tryGpsFromSetup = async () => {
    try {
      setManualLocationSaving(true);
      const location = await requestFreshLocation({ highAccuracy: true });
      if (location) {
        await axios.patch(`${import.meta.env.VITE_SERVER_URL}/captain/location`, {
          ltd: location.ltd,
          lng: location.lng,
          accuracy: location.accuracy,
          heading: location.heading,
          source: "gps",
        }, { headers: { token } });
      }
      setShowLocationSetup(false);
      showAlert("GPS connected", "Your live location is ready for ride matching.", "success");
    } catch (_) {
      setShowLocationSetup(true);
    } finally {
      setManualLocationSaving(false);
    }
  };

  const toggleAvailability = async () => {
    if (availabilityLoading) return;

    const next = !isOnline;
    if (next && (!captain?.isApproved || captain?.verificationStatus !== "approved" || captain?.status !== "active")) {
      showAlert("Cannot go online", "Your driver account must be approved and active before you can receive rides.", "failure");
      return;
    }

    try {
      setAvailabilityLoading(true);

      // Request one fresh location from the driver's explicit tap before enabling
      // availability. This avoids multiple simultaneous browser GPS prompts.
      if (next && !hasRecentLocationFix()) {
        if (["permission", "system", "policy", "insecure", "unsupported"].includes(trackingState) || geoPermission === "denied") {
          setShowLocationSetup(true);
          showAlert("Set your driver location", "GPS is unavailable in this browser. Use GPS or pin your current area on the map so QuickRide can match nearby rides.", "failure");
          return;
        }
        try {
          await requestFreshLocation({ highAccuracy: true });
        } catch (_) {
          setShowLocationSetup(true);
          showAlert("Set your driver location", "GPS could not provide a position. You can pin your current area manually and continue.", "failure");
          return;
        }
      }

      // Make sure the live channel is trying to connect before enabling availability.
      if (next && !socket.connected) socket.connect();

      const response = await axios.patch(
        `${import.meta.env.VITE_SERVER_URL}/captain/availability`,
        { online: next },
        { headers: { token } }
      );

      const freshCaptain = response.data?.captain;
      const updatedOnline = Boolean(freshCaptain?.isOnline);
      setIsOnline(updatedOnline);

      if (freshCaptain) {
        setCaptain(freshCaptain);
        localStorage.setItem("userData", JSON.stringify({ type: "captain", data: freshCaptain }));
      }

      if (updatedOnline) {
        socket.emit("join", { userId: freshCaptain?._id || captain?._id, userType: "captain", token });
        const location = lastGpsRef.current;
        if (location && socket.connected && locationSource === "gps") {
          socket.emit("update-location-captain", { userId: freshCaptain?._id || captain?._id, location: { ltd: location.ltd, lng: location.lng }, accuracy: location.accuracy, heading: location.heading, capturedAt: location.capturedAt });
        }
        setActiveTab("requests");
        await fetchIncomingRides();
      } else {
        setGpsSessionActive(false);
        if (geoWatchRef.current !== null && navigator.geolocation) {
          navigator.geolocation.clearWatch(geoWatchRef.current);
          geoWatchRef.current = null;
        }
        setIncomingRides([]);
      }

      showAlert(
        updatedOnline ? "You're online" : "You're offline",
        response.data?.message || (updatedOnline ? "You can now receive nearby ride requests." : "New ride requests are paused."),
        "success"
      );
    } catch (error) {
      await refreshCaptainProfile();
      showAlert(
        next ? "Cannot go online" : "Cannot go offline",
        error?.response?.data?.message || "Unable to update your availability. Please try again.",
        "failure"
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const fetchIncomingRides = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/captain/incoming-rides`, { headers: { token } });
      setIncomingRides(response.data || []);
    } catch (error) {
      // approved/online checks happen server-side; keep UI stable
    }
  };

  const verifyOTP = async () => {
    try {
      if (newRide._id != "" && otp.length == 6) {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/ride/start-ride?rideId=${newRide._id}&otp=${otp}`,
          {
            headers: {
              token: token,
            },
          }
        );
        if (riderLocation.ltd && riderLocation.lng) setMapCenter([riderLocation.ltd, riderLocation.lng]);
        setShowBtn("end-ride");
        setLoading(false);
        Console.log(response);
      }
    } catch (err) {
      setLoading(false);
      setError("Invalid OTP");
      Console.log(err);
    }
  };

  const endRide = async (cashCollected = false) => {
    try {
      if (newRide._id != "") {
        setLoading(true);
        const completedResponse = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/ride/end-ride`,
          { rideId: newRide._id, cashCollected },
          { headers: { token } }
        );
        if (riderLocation.ltd && riderLocation.lng) setMapCenter([riderLocation.ltd, riderLocation.lng]);
        setShowBtn("accept");
        setLoading(false);
        setShowCaptainDetailsPanel(true);
        setShowNewRidePanel(false);
        setCompletedRideForRating(completedResponse.data || newRide);
        setShowPassengerRating(true);
        setNewRide(defaultRideData);
        fetchCaptainExtras();
        localStorage.removeItem("rideDetails");
        localStorage.removeItem("showPanel");
      }
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.message || "Unable to complete the trip.");
      Console.log(err);
    }
  };

  const submitPassengerRating = async () => {
    if (!completedRideForRating?._id) return;
    try {
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/ride/rate-passenger`, { rideId: completedRideForRating._id, rating: passengerRating, review: passengerReview, tags: passengerRatingTags }, { headers: { token } });
      setShowPassengerRating(false); setPassengerReview(""); setPassengerRating(5); setPassengerRatingTags([]); setCompletedRideForRating(null);
      showAlert("Thanks", "Passenger feedback saved.", "success");
    } catch (error) { showAlert("Rating failed", error?.response?.data?.message || "Please try again.", "failure"); }
  };

  const isSecureLocationContext = () => {
    if (typeof window === "undefined") return true;
    const hostname = window.location.hostname;
    return window.isSecureContext || hostname === "localhost" || hostname === "127.0.0.1";
  };

  const locationFreshWindowMs = () => locationSource === "manual" ? 15 * 60 * 1000 : 120000;

  const hasRecentLocationFix = () => {
    const capturedAt = Number(lastGpsRef.current?.capturedAt || 0);
    const allowedAge = locationFreshWindowMs();
    if (capturedAt && Date.now() - capturedAt < allowedAge) return true;
    if (!lastLocationAt) return false;
    const timestamp = new Date(lastLocationAt).getTime();
    return Number.isFinite(timestamp) && Date.now() - timestamp < allowedAge;
  };

  const hasRecentGpsFix = () => locationSource === "gps" && hasRecentLocationFix();

  const geolocationPolicyAllows = () => {
    try {
      const policy = document.permissionsPolicy || document.featurePolicy;
      if (policy?.allowsFeature) return policy.allowsFeature("geolocation");
    } catch (_) {}
    return true;
  };

  const isEmbeddedPreview = () => {
    try { return window.self !== window.top; } catch (_) { return true; }
  };

  const readGeolocationPermission = async () => {
    if (!navigator.permissions?.query) return geoPermissionRef.current || "unknown";
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      geoPermissionRef.current = status.state || "unknown";
      setGeoPermission(geoPermissionRef.current);
      return geoPermissionRef.current;
    } catch (_) {
      return geoPermissionRef.current || "unknown";
    }
  };

  const applyGpsPosition = (position) => {
    const liveLocation = {
      ltd: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      capturedAt: Date.now(),
      source: "gps",
    };
    const now = new Date().toISOString();
    lastGpsRef.current = liveLocation;
    setGpsSessionActive(true);
    setLocationSource("gps");
    setManualLocationLabel("");
    geoPermissionRef.current = "granted";
    setGeoPermission("granted");
    setRiderLocation({ ltd: liveLocation.ltd, lng: liveLocation.lng });
    setTrackingState("live");
    setTrackingMessage("");
    setLastLocationAt(now);
    setMapCenter([liveLocation.ltd, liveLocation.lng]);

    if (socket?.connected && captain?._id) {
      socket.emit("update-location-captain", {
        userId: captain._id,
        location: { ltd: liveLocation.ltd, lng: liveLocation.lng },
        accuracy: liveLocation.accuracy,
        heading: liveLocation.heading,
        capturedAt: liveLocation.capturedAt,
      });
    }
    return liveLocation;
  };

  const handleGeolocationError = async (geoError) => {
    if (!isSecureLocationContext()) {
      setGpsSessionActive(false);
      setTrackingState("insecure");
      setTrackingMessage("Location access needs HTTPS on a real phone. Open QuickRide from a secure HTTPS address instead of a local-network http:// IP.");
      return;
    }

    if (!geolocationPolicyAllows()) {
      setGpsSessionActive(false);
      setTrackingState("policy");
      setTrackingMessage(isEmbeddedPreview()
        ? "This preview/frame is not allowed to use location. Open QuickRide directly in its own browser tab, then tap Refresh GPS."
        : "The browser is blocking geolocation through its Permissions Policy. Open QuickRide directly and check the browser's site controls.");
      return;
    }

    const permission = await readGeolocationPermission();
    const code = Number(geoError?.code);

    if (code === 1) {
      if (permission === "denied") {
        setGpsSessionActive(false);
        setTrackingState("permission");
        setTrackingMessage("QuickRide does not currently have site permission for Location. Change this site's Location permission to Allow, reload the page, then tap Refresh GPS.");
      } else {
        // Some browsers/OS integrations return PERMISSION_DENIED even while the
        // site permission itself is granted. Do not falsely mark the site blocked.
        setTrackingState("system");
        setTrackingMessage(permission === "granted"
          ? "QuickRide is allowed to use Location, but the browser or operating system refused the GPS request. Check device location services and browser-level location access, then tap Refresh GPS."
          : "The browser refused this location request. Open QuickRide directly (not inside an embedded preview), confirm Location is allowed, then tap Refresh GPS.");
      }
      return;
    }

    if (code === 2) {
      setTrackingState(hasRecentGpsFix() ? "live" : "unavailable");
      setTrackingMessage("Location access is available, but the device has not returned a usable position yet. Keep Location on, move near an open area if possible, and tap Refresh GPS.");
      return;
    }

    if (code === 3) {
      setTrackingState(hasRecentGpsFix() ? "live" : "waiting");
      setTrackingMessage("QuickRide is still waiting for a fresh GPS fix. Your site permission has not been changed by the app.");
      return;
    }

    setTrackingState(hasRecentGpsFix() ? "live" : "waiting");
    setTrackingMessage("QuickRide is waiting for your current location.");
  };

  const requestFreshLocation = ({ highAccuracy = true } = {}) => {
    if (geoRequestRef.current) return geoRequestRef.current;

    geoRequestRef.current = new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setGpsSessionActive(false);
        setTrackingState("unsupported");
        setTrackingMessage("This browser does not provide geolocation support.");
        reject(new Error("Geolocation unsupported"));
        return;
      }

      if (!isSecureLocationContext()) {
        setGpsSessionActive(false);
        setTrackingState("insecure");
        setTrackingMessage("Location access needs HTTPS on a real phone. Open QuickRide from a secure HTTPS address.");
        reject(new Error("Insecure geolocation context"));
        return;
      }

      if (!geolocationPolicyAllows()) {
        setGpsSessionActive(false);
        setTrackingState("policy");
        setTrackingMessage("This page is not allowed to use geolocation. Open QuickRide directly in its own browser tab and try again.");
        reject(new Error("Geolocation blocked by Permissions Policy"));
        return;
      }

      if (!hasRecentGpsFix()) setTrackingState("waiting");
      setTrackingMessage("Requesting your current location…");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = applyGpsPosition(position);
          resolve(location);
        },
        async (error) => {
          await handleGeolocationError(error);
          reject(error);
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 20000,
          maximumAge: 5000,
        }
      );
    }).finally(() => {
      geoRequestRef.current = null;
    });

    return geoRequestRef.current;
  };

  const updateLocation = (trigger = null) => {
    // Button clicks are explicit permission/user actions. Background events may
    // refresh an already-started GPS session, but must never start one.
    const explicitUserAction = trigger?.type === "click" || trigger?.force === true;
    if (!explicitUserAction && !gpsSessionActive) return;
    requestFreshLocation({ highAccuracy: true }).catch(() => {});
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setTrackingState("unsupported");
      return undefined;
    }

    if (!isSecureLocationContext()) {
      setTrackingState("insecure");
      setTrackingMessage("Location access needs HTTPS on a real phone. Open QuickRide from a secure HTTPS address.");
      return undefined;
    }

    if (!geolocationPolicyAllows()) {
      setTrackingState("policy");
      setTrackingMessage("This page is not allowed to use geolocation. Open QuickRide directly in its own browser tab.");
      return undefined;
    }

    if (!navigator.permissions?.query) return undefined;

    let permissionStatus;
    const syncPermission = () => {
      const state = permissionStatus?.state || "unknown";
      geoPermissionRef.current = state;
      setGeoPermission(state);
      if (state === "denied") {
        setGpsSessionActive(false);
        setTrackingState("permission");
        setTrackingMessage("Location is blocked for this site. Change this site's Location permission to Allow, reload QuickRide, then tap Refresh GPS.");
      } else if (state === "granted") {
        setTrackingState((current) => ["permission", "system", "idle"].includes(current) ? (hasRecentGpsFix() ? "live" : "waiting") : current);
        setTrackingMessage((current) => /blocked for this site|does not currently have site permission/i.test(current) ? "Location is allowed. Tap Refresh GPS once to start the driver GPS session." : current);
      } else if (state === "prompt" && !gpsSessionActive) {
        setTrackingState((current) => current === "idle" ? "waiting" : current);
        setTrackingMessage((current) => current || "Tap Refresh GPS to ask for Location. QuickRide will not request it automatically.");
      }
    };

    navigator.permissions.query({ name: "geolocation" }).then((status) => {
      permissionStatus = status;
      syncPermission();
      status.addEventListener?.("change", syncPermission);
    }).catch(() => {});

    return () => permissionStatus?.removeEventListener?.("change", syncPermission);
  }, []);

  useEffect(() => () => {
    if (manualSearchTimerRef.current) window.clearTimeout(manualSearchTimerRef.current);
  }, []);

  const clearRideData = () => {
    setShowBtn("accept");
    setLoading(false);
    setShowCaptainDetailsPanel(true);
    setShowNewRidePanel(false);
    setNewRide(defaultRideData);
    localStorage.removeItem("rideDetails");
    localStorage.removeItem("showPanel");
  }

  useEffect(() => {
    const activeTrip = ["accepted", "arriving", "arrived", "ongoing"].includes(newRide?.status);
    if (locationSource !== "gps" || (!isOnline && !activeTrip) || !captain?._id || !gpsSessionActive || !navigator.geolocation || !isSecureLocationContext() || !geolocationPolicyAllows()) return undefined;

    if (geoWatchRef.current !== null) navigator.geolocation.clearWatch(geoWatchRef.current);
    geoWatchRef.current = navigator.geolocation.watchPosition(
      (position) => { applyGpsPosition(position); },
      (error) => { handleGeolocationError(error); },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
    );

    return () => {
      if (geoWatchRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
        geoWatchRef.current = null;
      }
    };
  }, [isOnline, newRide?.status, captain?._id, gpsSessionActive, locationSource]);

  // Browser-friendly location heartbeat. Socket.IO remains the fastest path, while
  // this REST heartbeat keeps the driver's last-known GPS fresh through short
  // socket reconnects and browser timer throttling. Browsers still cannot promise
  // continuous GPS after the app is fully closed; that requires a native app.
  useEffect(() => {
    const activeTrip = ["accepted", "arriving", "arrived", "ongoing"].includes(newRide?.status);
    if (locationSource !== "gps" || (!isOnline && !activeTrip) || !captain?._id) return undefined;

    let wakeLock = null;
    let cancelled = false;
    const flushLocation = async () => {
      const location = lastGpsRef.current;
      if (!location || !navigator.onLine) return;
      const capturedAt = Number(location.capturedAt || 0);
      if (!capturedAt || Date.now() - capturedAt > 45000) {
        if (!cancelled) {
          setTrackingState((current) => ["permission", "system", "policy", "insecure", "unsupported"].includes(current) ? current : "waiting");
          setTrackingMessage((current) => current || "Waiting for a fresh GPS fix before syncing your location.");
        }
        return;
      }
      try {
        await axios.patch(`${import.meta.env.VITE_SERVER_URL}/captain/location`, location, { headers: { token } });
        if (!cancelled) { setLastLocationAt(new Date(capturedAt).toISOString()); setTrackingState("live"); setTrackingMessage(""); }
      } catch (_) {
        if (!cancelled) setTrackingState("reconnecting");
      }
    };
    const requestWakeLock = async () => {
      if (document.visibilityState !== "visible" || !navigator.wakeLock?.request) return;
      try { wakeLock = await navigator.wakeLock.request("screen"); } catch (_) {}
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") requestWakeLock();
      // Do not call getCurrentPosition here. Browser location is initiated only
      // from an explicit driver tap; the active watch resumes by itself.
      flushLocation();
    };
    const onOnline = () => {
      // Reconnect network transport only; never trigger a browser permission
      // request from an automatic online event.
      flushLocation();
    };

    requestWakeLock();
    const heartbeat = window.setInterval(flushLocation, 20000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      try { wakeLock?.release?.(); } catch (_) {}
    };
  }, [isOnline, newRide?.status, captain?._id, token, locationSource]);

  useEffect(() => {
    if (!captain?._id) return undefined;

    const joinCaptain = () => {
      socket.emit("join", { userId: captain._id, userType: "captain", token });
      const location = lastGpsRef.current;
      if (isOnline && location && locationSource === "gps" && hasRecentGpsFix()) {
        socket.emit("update-location-captain", {
          userId: captain._id,
          location: { ltd: location.ltd, lng: location.lng },
          accuracy: location.accuracy,
          heading: location.heading,
          capturedAt: location.capturedAt,
        });
      }
    };

    const handleNewRide = (data) => {
      Console.log("New Ride available:", data);
      setShowBtn("accept");
      setNewRide(data);
      setIncomingRides((prev) => [data, ...prev.filter((ride) => ride._id !== data._id)]);
      setShowNewRidePanel(true);
      setActiveTab("requests");
    };

    const handleRideCancelled = (data) => { Console.log("Ride cancelled", data); updateLocation(); clearRideData(); };
    const handleOfferExpired = (data) => {
      if (!data?.rideId || data.rideId === newRide?._id) { setIncomingRides((prev) => prev.filter((ride) => ride._id !== data?.rideId)); if (newRide?._id === data?.rideId) clearRideData(); }
    };

    // Custom join events are not automatically replayed after Socket.IO reconnects,
    // so re-register the driver every time the transport connects.
    if (socket.connected) joinCaptain();
    socket.on("connect", joinCaptain);
    socket.on("new-ride", handleNewRide);
    socket.on("ride-cancelled", handleRideCancelled);
    socket.on("ride-offer-expired", handleOfferExpired);

    refreshCaptainProfile();
    fetchCaptainExtras();
    fetchWithdrawals();
    fetchIncomingRides();
    axios.get(`${import.meta.env.VITE_SERVER_URL}/captain/current-ride`, { headers: { token } }).then((response) => {
      const ride = response.data;
      if (!ride?._id) return;
      setNewRide(ride); setShowNewRidePanel(true); setShowCaptainDetailsPanel(false);
      setShowBtn(ride.status === "accepted" ? "arriving" : ride.status === "arriving" ? "arrived" : ride.status === "arrived" ? "otp" : "end-ride");
    }).catch(() => {});

    return () => {
      socket.off("connect", joinCaptain);
      socket.off("new-ride", handleNewRide);
      socket.off("ride-cancelled", handleRideCancelled);
      socket.off("ride-offer-expired", handleOfferExpired);
    };
  }, [captain?._id, isOnline, token, locationSource]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    socket.emit("join-room", newRide._id);

    socket.on("receiveMessage", async (msg) => {
      // Console.log("Received message: ", msg);
      setMessages((prev) => [...prev, { msg, by: "other" }]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [newRide]);

  useEffect(() => {
    localStorage.setItem("rideDetails", JSON.stringify(newRide));
  }, [newRide]);

  useEffect(() => {
    localStorage.setItem("showPanel", JSON.stringify(showNewRidePanel));
    localStorage.setItem("showBtn", JSON.stringify(showBtn));
  }, [showNewRidePanel, showBtn]);

  const calculateEarnings = () => {
    let Totalearnings = 0;
    let Todaysearning = 0;

    let acceptedRides = 0;
    let cancelledRides = 0;

    let distanceTravelled = 0;

    const today = new Date();
    const todayWithoutTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    (captain.rides || []).forEach((ride) => {
      if (ride.status == "completed") {
        acceptedRides++;
        distanceTravelled += ride.distance;
      }
      if (ride.status == "cancelled") cancelledRides++;

      Totalearnings += ride.fare;
      const rideDate = new Date(ride.updatedAt);

      const rideDateWithoutTime = new Date(
        rideDate.getFullYear(),
        rideDate.getMonth(),
        rideDate.getDate()
      );

      if (
        rideDateWithoutTime.getTime() === todayWithoutTime.getTime() &&
        ride.status === "completed"
      ) {
        Todaysearning += ride.fare;
      }
    });

    setEarnings({ total: Totalearnings, today: Todaysearning });
    setRides({
      accepted: acceptedRides,
      cancelled: cancelledRides,
      distanceTravelled: Math.round(distanceTravelled / 1000),
    });
  };

  useEffect(() => {
    calculateEarnings();
  }, [captain?._id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline) fetchIncomingRides();
    }, 15000);
    return () => clearInterval(interval);
  }, [isOnline]);

  useEffect(() => {
    if (!captain?._id) return undefined;
    const interval = setInterval(() => {
      refreshCaptainProfile();
    }, 30000);
    return () => clearInterval(interval);
  }, [captain?._id]);

  useEffect(() => {
    if (socket.id) Console.log("socket id:", socket.id);
  }, [socket.id]);

  const captainMarkers = [
    riderLocation.ltd && riderLocation.lng
      ? { key: "driver", lat: riderLocation.ltd, lng: riderLocation.lng, title: locationSource === "manual" ? "Pinned driver location" : "Live driver location", color: locationSource === "manual" ? "#2563eb" : "#10b981" }
      : null,
  ].filter(Boolean);
  const manualSetupMarkers = Number.isFinite(Number(manualLocationDraft.lat)) && Number.isFinite(Number(manualLocationDraft.lng))
    ? [{ key: "manual-driver", lat: Number(manualLocationDraft.lat), lng: Number(manualLocationDraft.lng), title: "Driver location", subtitle: manualLocationDraft.label || "Tap the map to adjust", color: "#2563eb" }]
    : [];

  const locationFresh = hasRecentLocationFix();
  const gpsDisplayState = locationSource === "manual"
    ? (locationFresh ? "manual" : "manual_stale")
    : locationFresh && !["permission", "system", "policy", "insecure", "unsupported"].includes(trackingState)
      ? "live"
      : trackingState === "idle" && geoPermission === "granted" ? "waiting" : trackingState;
  const gpsStatus = {
    live: { label: "GPS live", className: "bg-emerald-100 text-emerald-700" },
    manual: { label: "Pinned location", className: "bg-blue-100 text-blue-700" },
    manual_stale: { label: "Reconfirm location", className: "bg-amber-100 text-amber-700" },
    waiting: { label: geoPermission === "granted" ? "Finding GPS" : "Checking GPS", className: "bg-amber-100 text-amber-700" },
    unavailable: { label: "Signal unavailable", className: "bg-amber-100 text-amber-700" },
    reconnecting: { label: "Syncing location", className: "bg-amber-100 text-amber-700" },
    permission: { label: "GPS unavailable", className: "bg-red-100 text-red-700" },
    system: { label: "GPS unavailable", className: "bg-red-100 text-red-700" },
    policy: { label: "GPS unavailable", className: "bg-red-100 text-red-700" },
    insecure: { label: "HTTPS required", className: "bg-red-100 text-red-700" },
    unsupported: { label: "GPS unsupported", className: "bg-red-100 text-red-700" },
    idle: { label: "Location not set", className: "bg-slate-100 text-slate-600" },
  }[gpsDisplayState] || { label: "Location not set", className: "bg-slate-100 text-slate-600" };
  const readyForRequests = isOnline && socketConnected && locationFresh;
  const locationSummaryTitle = !isOnline
    ? "Ready when you are"
    : !socketConnected
      ? "Reconnecting"
      : readyForRequests
        ? (locationSource === "manual" ? "Online with pinned location" : "Online and ready")
        : locationSource === "manual"
          ? "Reconfirm your location"
          : "Set your driver location";
  const locationSummaryText = !isOnline
    ? "Set your location, then go online to receive nearby trips."
    : !socketConnected
      ? "Your availability is saved. Requests resume when the connection returns."
      : readyForRequests
        ? (locationSource === "manual" ? `${manualLocationLabel || "Pinned location"} • confirm again if you move.` : "Live GPS is active and nearby requests can reach you.")
        : "GPS is not available here. Pin your current area or retry device GPS.";

  function Metric({ label, value }) {
    return (
      <div className="soft-card p-4 text-center shadow-none">
        <h3 className="text-2xl font-black text-slate-950">{value ?? 0}</h3>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      </div>
    );
  }

  return (
    <div className="screen-safe screen-with-nav">
      <NetworkStatusBanner />
      <div className="mobile-bg" />
      <Alert heading={alert.heading} text={alert.text} isVisible={alert.isVisible} onClose={hideAlert} type={alert.type} />
      <Sidebar />

      <div className="relative z-0 h-[44dvh] min-h-[300px] max-h-[430px] px-4 pb-0 pt-4">
        <div className="app-topbar mb-3 pr-[60px]">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="app-topbar-avatar">{captain?.fullname?.firstname?.[0] || "D"}</div>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200"><Sparkles size={11} /> Driver console</p>
              <h1 className="truncate text-[14px] font-black tracking-tight min-[390px]:text-[15px]">{captain?.fullname?.firstname || "Driver"} • {isOnline ? (readyForRequests ? "Ready for trips" : "Set location") : "Offline"}</h1>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2"><NotificationBell userType="captain" />
          <button
            type="button"
            onClick={toggleAvailability}
            disabled={availabilityLoading}
            aria-pressed={isOnline}
            className={`driver-status-chip min-h-11 min-w-11 justify-center px-2.5 transition active:scale-[.98] disabled:cursor-wait min-[390px]:px-3 ${isOnline ? (readyForRequests ? "driver-status-online" : "driver-status-reconnecting") : "driver-status-offline"}`}
            title={availabilityLoading ? "Updating availability" : isOnline ? (readyForRequests ? "Online and ready" : "Online • location needed") : "Offline"}
          >
            {availabilityLoading ? <LoaderCircle size={13} className="animate-spin" /> : <span className="live-dot" />}
            <span className="hidden min-[430px]:inline">{availabilityLoading ? "Updating" : isOnline ? (readyForRequests ? "Online" : "Location") : "Offline"}</span>
          </button></div>
        </div>
        <div className="relative h-[calc(100%_-_62px)]">
          <LiveMap height="100%" center={mapCenter} markers={captainMarkers} />
          <div className="absolute bottom-3 left-3 right-3 z-[500] flex items-center gap-2 rounded-[22px] border border-white/80 bg-white/95 p-2.5 shadow-xl backdrop-blur-xl">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${readyForRequests ? "bg-emerald-100 text-emerald-700" : locationFresh ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
              {readyForRequests ? <Navigation size={18} /> : locationFresh ? <MapPin size={18} /> : <LocateFixed size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-black text-slate-950">{locationSummaryTitle}</p>
                <span className={`hidden rounded-full px-2 py-0.5 text-[8px] font-black uppercase min-[390px]:inline ${gpsStatus.className}`}>{gpsStatus.label}</span>
              </div>
              <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{locationSource === "manual" && locationFresh ? manualLocationLabel || "Pinned location" : readyForRequests ? "Live location active" : "Choose how QuickRide should locate you"}</p>
            </div>
            {!locationFresh ? (
              <button type="button" className="shrink-0 rounded-2xl bg-slate-950 px-3.5 py-2.5 text-[11px] font-black text-white transition active:scale-[.98]" onClick={openLocationSetupPanel}>
                Set location
              </button>
            ) : (
              <button type="button" className={`shrink-0 rounded-2xl px-3.5 py-2.5 text-[11px] font-black text-white transition active:scale-[.98] disabled:opacity-60 ${isOnline ? "bg-slate-950" : "bg-emerald-600"}`} onClick={toggleAvailability} disabled={availabilityLoading}>
                {availabilityLoading ? "Wait…" : isOnline ? "Offline" : "Go online"}
              </button>
            )}
          </div>
        </div>
      </div>

      {showCaptainDetailsPanel && (
        <div className="floating-sheet floating-sheet-nav z-30 sheet-scroll sheet-scroll-nav sheet-enter">
          <div className="sheet-handle mb-4" />

          <div className="mb-4 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,.07)]">
            <div className="flex items-start gap-3">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${readyForRequests ? "bg-emerald-600 text-white" : locationFresh ? "bg-blue-600 text-white" : "bg-amber-100 text-amber-700"}`}>
                {availabilityLoading ? <LoaderCircle size={22} className="animate-spin" /> : readyForRequests ? <Navigation size={22} /> : locationFresh ? <MapPin size={22} /> : <LocateFixed size={22} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="mini-label">Availability</p>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${gpsStatus.className}`}>{gpsStatus.label}</span>
                </div>
                <h3 className="mt-1 text-[20px] font-black leading-tight text-slate-950">{availabilityLoading ? "Updating status…" : locationSummaryTitle}</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{locationSummaryText}</p>

                {locationSource === "manual" && locationFresh ? (
                  <div className="mt-3 flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2.5 text-blue-800">
                    <MapPin size={15} className="shrink-0" />
                    <p className="min-w-0 flex-1 truncate text-[11px] font-black">{manualLocationLabel || "Pinned driver location"}</p>
                    <button type="button" onClick={openLocationSetupPanel} className="shrink-0 text-[10px] font-black underline">Change</button>
                  </div>
                ) : null}

                {!locationFresh ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={openLocationSetupPanel} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 text-xs font-black text-white">
                      <MapPin size={15} /> Set location
                    </button>
                    <button type="button" onClick={(event) => updateLocation({ type: event.type, force: true })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700">
                      <Crosshair size={15} /> Try GPS
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleAvailability}
                      disabled={availabilityLoading || (!isOnline && (!captain?.isApproved || captain?.verificationStatus !== "approved"))}
                      className={`min-h-11 flex-1 rounded-2xl px-4 text-xs font-black text-white transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${isOnline ? "bg-slate-950" : "bg-emerald-600"}`}
                    >
                      {availabilityLoading ? "Please wait" : isOnline ? "Go offline" : "Go online"}
                    </button>
                    <button type="button" onClick={openLocationSetupPanel} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700" title="Change driver location">
                      <MapPin size={17} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(!captain?.isApproved || captain?.verificationStatus !== "approved") && (
            <div className="mb-4 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100"><ShieldAlert size={19} /></div>
                <div><h3 className="font-black">Verification required</h3><p className="mt-1 text-xs font-semibold leading-5">Keep your driver and vehicle documents valid. Admin approval is required before you can receive trips.</p></div>
              </div>
            </div>
          )}

          <div className="mb-4 overflow-hidden rounded-[28px] bg-[#07111f] p-4 text-white shadow-[0_18px_42px_rgba(2,8,23,.16)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white text-sm font-black text-slate-950">{captain?.fullname?.firstname?.[0]}{captain?.fullname?.lastname?.[0]}</div>
                <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.14em] text-emerald-200">Driver partner</p><h2 className="truncate text-base font-black">{captain?.fullname?.firstname} {captain?.fullname?.lastname}</h2><p className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-semibold text-slate-300"><Phone size={11} /> {captain?.phone}</p></div>
              </div>
              <div className="shrink-0 text-right"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Today</p><h3 className="text-lg font-black">{formatMoney(earnings.today, earningsSummary?.currency || "NGN")}</h3></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/10 px-2 py-2.5 text-center"><p className="text-lg font-black">{incomingRides.length}</p><p className="text-[9px] font-bold uppercase tracking-wide text-slate-300">Requests</p></div>
              <div className="rounded-2xl bg-white/10 px-2 py-2.5 text-center"><p className="text-lg font-black">{rides?.accepted ?? 0}</p><p className="text-[9px] font-bold uppercase tracking-wide text-slate-300">Accepted</p></div>
              <div className="rounded-2xl bg-white/10 px-2 py-2.5 text-center"><p className="text-lg font-black">{captain?.rating?.avg ?? 0}★</p><p className="text-[9px] font-bold uppercase tracking-wide text-slate-300">Rating</p></div>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <button className="secondary-btn min-h-0 px-3 py-3 text-xs" onClick={() => { setActiveTab("requests"); fetchIncomingRides(); }} disabled={loading}><span className="inline-flex items-center gap-2"><RefreshCcw size={15} /> Refresh rides</span></button>
            <button className="secondary-btn min-h-0 px-3 py-3 text-xs" onClick={refreshCaptainProfile} disabled={loading}><span className="inline-flex items-center gap-2"><RefreshCcw size={15} /> Sync profile</span></button>
          </div>

          <div className="sticky top-0 z-10 -mx-1 mb-4 overflow-x-auto rounded-[22px] border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur-xl">
            <div className="flex min-w-max gap-1">
              {DRIVER_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`relative flex min-h-11 items-center gap-1.5 rounded-[17px] px-3.5 py-2.5 text-xs font-black transition ${isActive ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"}`}>
                    <Icon size={15} /> {tab.label}
                    {tab.key === "requests" && incomingRides.length > 0 && <span className="ml-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] text-white">{incomingRides.length}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Metric label="Accepted" value={rides?.accepted} />
                <Metric label="Kilometres" value={rides?.distanceTravelled} />
                <Metric label="Cancelled" value={rides?.cancelled} />
              </div>

              <div className="responsive-grid-2">
                <div className="soft-card p-4 shadow-none">
                  <p className="mini-label">Score</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-950">{performance?.score ?? captain?.performanceScore ?? 100}</h3>
                  <p className="text-xs font-semibold text-slate-500">Performance rating</p>
                </div>
                <div className="soft-card p-4 shadow-none">
                  <p className="mini-label">Rating</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-950">{captain?.rating?.avg ?? 0}★</h3>
                  <p className="text-xs font-semibold text-slate-500">Passenger reviews</p>
                </div>
              </div>

              <div className="soft-card p-4 shadow-none">
                <p className="mini-label">Account status</p>
                <h3 className="mt-1 text-xl font-black capitalize text-slate-950">{captain?.verificationStatus || "pending"}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{captain?.isApproved ? "You can go online and receive trips." : "Admin approval is required before you can receive trips."}</p>
              </div>
            </div>
          )}

          {activeTab === "requests" && (
            <div className="space-y-3">
              <div className="soft-card p-4 shadow-none">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="mini-label">Incoming rides</p>
                    <h3 className="text-lg font-black text-slate-950">Ride requests</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Go online to receive new ride requests from passengers.</p>
                  </div>
                  <button className="secondary-btn min-h-0 px-4 py-3 text-sm" onClick={fetchIncomingRides} disabled={loading}>
                    <span className="inline-flex items-center gap-2"><RefreshCcw size={16} /> Refresh</span>
                  </button>
                </div>

                {incomingRides.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">No incoming ride requests right now.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    {incomingRides.map((ride) => (
                      <div key={ride._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mini-label">Passenger</p>
                        <h4 className="mt-1 text-base font-black text-slate-950">{ride?.user?.fullname?.firstname || "Passenger"} {ride?.user?.fullname?.lastname || ""}</h4>
                        <div className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
                          <p className="truncate"><span className="font-black text-slate-950">Pickup:</span> {ride.pickup}</p>
                          <p className="truncate"><span className="font-black text-slate-950">Drop-off:</span> {ride.destination}</p>
                          <p><span className="font-black text-slate-950">Fare:</span> {formatMoney(ride.fare, ride.currency || "NGN")}</p>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button className="secondary-btn min-h-0 flex-1 px-4 py-3 text-sm" onClick={() => rejectRide(ride)}>Reject</button>
                          <button className="primary-btn min-h-0 flex-1 px-4 py-3 text-sm" onClick={() => { setNewRide(ride); setShowNewRidePanel(true); setShowCaptainDetailsPanel(false); }}>View / accept</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="soft-card p-4 shadow-none">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="mini-label">Verification documents</p>
                  <h3 className="text-lg font-black capitalize text-slate-950">{captain?.verificationStatus || "pending"}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">View your uploaded documents or submit updated copies for admin verification.</p>
                </div>
                <button className="secondary-btn min-h-0 px-4 py-3 text-sm" onClick={() => setShowDocumentPanel((value) => !value)}>
                  <span className="inline-flex items-center gap-2"><FileText size={16} /> {showDocumentPanel ? "Close upload" : "Upload updates"}</span>
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <DocStatus label="License" url={captain?.documents?.licenseUrl} expiry={captain?.documents?.licenseExpiry} review={captain?.documents?.reviews?.license} onOpen={openDocument} />
                <DocStatus label="Registration" url={captain?.documents?.vehicleRegistrationUrl} expiry={captain?.documents?.vehicleRegistrationExpiry} review={captain?.documents?.reviews?.registration} onOpen={openDocument} />
                <DocStatus label="Insurance" url={captain?.documents?.insuranceUrl} expiry={captain?.documents?.insuranceExpiry} review={captain?.documents?.reviews?.insurance} onOpen={openDocument} />
                <DocStatus label="Government ID" url={captain?.documents?.governmentIdUrl} review={captain?.documents?.reviews?.governmentId} onOpen={openDocument} />
              </div>

              {showDocumentPanel && (
                <form onSubmit={submitUpdatedDocuments} className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="block"><span className="mini-label">License number</span><input className="input-box mt-2" value={docForm.licenseNumber} onChange={(e) => setDocForm({ ...docForm, licenseNumber: e.target.value })} /></label>
                    <label className="block"><span className="mini-label">License expiry</span><input type="date" className="input-box mt-2" value={docForm.licenseExpiry} onChange={(e) => setDocForm({ ...docForm, licenseExpiry: e.target.value })} /></label>
                    <label className="block"><span className="mini-label">Vehicle registration expiry</span><input type="date" className="input-box mt-2" value={docForm.vehicleRegistrationExpiry} onChange={(e) => setDocForm({ ...docForm, vehicleRegistrationExpiry: e.target.value })} /></label>
                    <label className="block"><span className="mini-label">Insurance expiry</span><input type="date" className="input-box mt-2" value={docForm.insuranceExpiry} onChange={(e) => setDocForm({ ...docForm, insuranceExpiry: e.target.value })} /></label>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {DOC_FIELDS.map((field) => <DocUpload key={field.key} label={field.label} file={docFiles[field.key]} onChange={(file) => handleDocFile(field.key, file)} />)}
                  </div>
                  <label className="mt-4 flex items-start gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600">
                    <input type="checkbox" checked={docForm.backgroundCheckConsent} onChange={(e) => setDocForm({ ...docForm, backgroundCheckConsent: e.target.checked })} className="mt-1" />
                    I consent to driver background check and understand updated documents require admin approval before receiving trips.
                  </label>
                  <button className="primary-btn mt-4 w-full" type="submit" disabled={loading}>Submit updated documents</button>
                </form>
              )}
            </div>
          )}

          {activeTab === "earnings" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="soft-card p-4 shadow-none">
                  <p className="mini-label">Bonus balance</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-950">{formatMoney(earningsSummary?.balance ?? captain?.earnings?.balance ?? 0, earningsSummary?.currency || "NGN")}</h3>
                  <p className="text-xs font-semibold text-slate-500">Platform-funded balance available for payout</p>
                </div>
                <div className="soft-card p-4 shadow-none">
                  <p className="mini-label">Cash collected</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-950">{formatMoney(earningsSummary?.totalGrossCash ?? earnings.total, earningsSummary?.currency || "NGN")}</h3>
                  <p className="text-xs font-semibold text-slate-500">Cash received directly from passengers</p>
                </div>
                <div className="soft-card p-4 shadow-none">
                  <p className="mini-label">Commission</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-950">{formatMoney(earningsSummary?.totalCommission ?? 0, earningsSummary?.currency || "NGN")}</h3>
                  <p className="text-xs font-semibold text-slate-500">Platform commission recorded on completed trips</p>
                </div>
              </div>

              <form onSubmit={requestWithdrawal} className="soft-card p-4 shadow-none">
                <div className="mb-3">
                  <p className="mini-label">Withdraw funds</p>
                  <h3 className="text-lg font-black text-slate-950">Request a payout</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Only platform-funded bonuses are withdrawable for now. Passenger fares are collected directly in cash.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <input className="input-box" type="number" min="1" step="0.01" placeholder="Amount" value={withdrawalForm.amount} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })} />
                  <select className="input-box" value={withdrawalForm.method} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, method: e.target.value })}>
                    <option value="bank">Bank transfer</option>
                  </select>
                  <input className="input-box" placeholder="Bank name" value={withdrawalForm.bankName} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, bankName: e.target.value })} />
                  <input className="input-box" placeholder="Account holder" value={withdrawalForm.accountHolder} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountHolder: e.target.value })} />
                  <input className="input-box" placeholder="Account number" value={withdrawalForm.accountNumber} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountNumber: e.target.value })} />
                  <input className="input-box" placeholder="Bank code (if required)" value={withdrawalForm.routingNumber} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, routingNumber: e.target.value })} />
                </div>
                <button className="primary-btn mt-3 w-full" type="submit" disabled={loading || !withdrawalForm.amount}>Request withdrawal</button>
              </form>

              <div className="soft-card p-4 shadow-none">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="mini-label">Withdrawal history</p><h3 className="text-lg font-black text-slate-950">Requests</h3></div>
                  <button className="secondary-btn min-h-0 px-4 py-3 text-sm" onClick={fetchWithdrawals}>Refresh</button>
                </div>
                <div className="mt-3 space-y-2">
                  {withdrawals.length ? withdrawals.map((item) => (
                    <div key={item._id} className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">
                      <div className="flex items-center justify-between gap-3"><span className="font-black text-slate-950">{formatMoney(item.amount, item.currency || earningsSummary?.currency || "NGN")}</span><span className="capitalize">{item.status}</span></div>
                      <p className="mt-1 text-xs">{item.method} • {new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  )) : <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">No withdrawal requests yet.</p>}
                </div>
              </div>

              <div className="soft-card p-4 shadow-none">
                <p className="mini-label">Bonus campaigns</p>
                {incentives?.length ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
                    {incentives.map((item, index) => {
                      const campaign = item.campaign || item;
                      return (
                        <div key={campaign._id || index} className="rounded-2xl bg-slate-50 p-4">
                          <h4 className="font-black text-slate-950">{campaign.name || campaign.title || "Bonus campaign"}</h4>
                          <p className="mt-1 text-sm font-semibold text-slate-500">Progress: {item.completedCount ?? 0} / {item.target || campaign.targetRides || campaign.targetRideCount || 0} rides</p>
                          <p className="mt-1 text-sm font-black text-emerald-700">Bonus: {formatMoney(campaign.rewardAmount || campaign.bonusAmount || 0, earningsSummary?.currency || "NGN")}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">No active bonus campaigns right now.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "vehicle" && (
            <div className="soft-card flex items-center justify-between gap-3 overflow-hidden p-4 shadow-none">
              <div>
                <p className="mini-label">Vehicle</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{captain?.vehicle?.number || "No plate"}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">{captain?.vehicle?.color || "Vehicle"} • {captain?.vehicle?.type || "car"} • {captain?.vehicle?.capacity || "-"} seats</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">Use the Documents tab to update vehicle registration and insurance.</p>
              </div>
              <img className="h-16 shrink-0 scale-x-[-1] object-contain min-[380px]:h-20" src="/car.png" alt="Vehicle" />
            </div>
          )}
        </div>
      )}

      {showLocationSetup && (
        <div className="modal-backdrop z-[120]">
          <div className="modal-sheet max-w-[620px] !bg-[#f7f9fc]">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-200" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mini-label">Driver location</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Choose where you are</h2>
                <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">If browser GPS is blocked, pin your current area manually. QuickRide will use it for nearby ride matching.</p>
              </div>
              <button type="button" onClick={() => setShowLocationSetup(false)} className="icon-btn !h-10 !w-10" aria-label="Close location setup"><X size={18} /></button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={tryGpsFromSetup} disabled={manualLocationSaving} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 text-sm font-black text-white shadow-sm disabled:opacity-60">
                {manualLocationSaving ? <LoaderCircle size={17} className="animate-spin" /> : <Crosshair size={17} />} Try device GPS
              </button>
              <button type="button" onClick={() => setManualSearch("")} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 shadow-sm">
                <MapPin size={17} /> Pin on map
              </button>
            </div>

            {geoPermission === "denied" ? (
              <div className="mt-3 flex items-start gap-3 rounded-[20px] border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-100"><ShieldAlert size={17} /></div>
                <div>
                  <p className="text-xs font-black">Browser GPS is blocked</p>
                  <p className="mt-0.5 text-[11px] font-semibold leading-4">You can still work using a pinned location. For safety, the pinned location expires after 15 minutes and should be reconfirmed whenever you move.</p>
                </div>
              </div>
            ) : null}

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={manualSearch}
                onChange={(event) => searchManualPlaces(event.target.value)}
                className="input-box !pl-11 !pr-11"
                placeholder="Search area, street or landmark"
                autoComplete="off"
              />
              {manualSearchLoading ? <LoaderCircle className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400" size={18} /> : null}
            </div>

            {manualSuggestions.length > 0 ? (
              <div className="mt-2 max-h-44 overflow-y-auto rounded-[22px] border border-slate-200 bg-white p-1 shadow-lg">
                {manualSuggestions.map((suggestion, index) => (
                  <button key={`${suggestion}-${index}`} type="button" onClick={() => chooseManualSuggestion(suggestion)} className="flex w-full items-center gap-3 rounded-[17px] px-3 py-3 text-left transition hover:bg-slate-50 active:bg-slate-100">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><MapPin size={16} /></span>
                    <span className="min-w-0 flex-1 truncate text-xs font-black text-slate-800">{suggestion}</span>
                    <span className="text-[9px] font-black uppercase tracking-wide text-slate-400">Select</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="relative mt-4">
              <LiveMap
                height={260}
                center={[Number(manualLocationDraft.lat) || 6.5244, Number(manualLocationDraft.lng) || 3.3792]}
                markers={manualSetupMarkers}
                onMapClick={chooseManualMapPoint}
                className="!rounded-[24px]"
              />
              <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-full bg-slate-950/85 px-3 py-1.5 text-[10px] font-black text-white shadow-lg backdrop-blur">
                Tap the map to move your pin
              </div>
            </div>

            <div className={`mt-3 rounded-[22px] border p-3 ${manualLocationChosen ? "border-blue-100 bg-blue-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${manualLocationChosen ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{manualLocationChosen ? <Navigation size={17} /> : <MapPin size={17} />}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-[.12em] ${manualLocationChosen ? "text-blue-500" : "text-slate-400"}`}>{manualLocationChosen ? "Selected driver location" : "Choose a location"}</p>
                  <p className="mt-0.5 truncate text-sm font-black text-slate-950">{manualLocationChosen ? (manualLocationDraft.label || manualSearch || "Pinned map location") : "Search above or tap your position on the map"}</p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">{manualLocationChosen ? `${Number(manualLocationDraft.lat).toFixed(5)}, ${Number(manualLocationDraft.lng).toFixed(5)} • valid for 15 minutes` : "QuickRide will not use the default map centre until you choose it."}</p>
                </div>
                {manualLocationChosen ? <Check size={18} className="mt-1 shrink-0 text-blue-600" /> : null}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_1.4fr] gap-2">
              <button type="button" onClick={() => setShowLocationSetup(false)} className="secondary-btn !min-h-[52px] !py-3 text-sm">Cancel</button>
              <button type="button" onClick={saveManualLocation} disabled={manualLocationSaving || !manualLocationChosen} className="primary-btn !min-h-[52px] !py-3 text-sm">
                <span className="inline-flex items-center justify-center gap-2">{manualLocationSaving ? <LoaderCircle size={17} className="animate-spin" /> : <MapPin size={17} />} Confirm this location</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <NewRide rideData={newRide} otp={otp} setOtp={setOtp} showBtn={showBtn} showPanel={showNewRidePanel} setShowPanel={setShowNewRidePanel} showPreviousPanel={setShowCaptainDetailsPanel} loading={loading} acceptRide={acceptRide} rejectRide={rejectRide} markArriving={markArriving} markArrived={markArrived} cancelRide={cancelActiveRide} callPassenger={callPassenger} verifyOTP={verifyOTP} endRide={endRide} error={error} />

      {showPassengerRating && <div className="modal-backdrop"><div className="modal-sheet"><p className="mini-label">Trip completed</p><h2 className="text-2xl font-black text-slate-950">Rate your passenger</h2><p className="mt-1 text-sm font-semibold text-slate-500">Feedback helps QuickRide identify reliable riders and safety concerns.</p><div className="mt-4 grid grid-cols-5 gap-2">{[1,2,3,4,5].map((value) => <button key={value} type="button" onClick={() => { setPassengerRating(value); setPassengerRatingTags([]); }} className={`rounded-2xl border py-3 font-black ${passengerRating === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"}`}>{value}★</button>)}</div><div className="mt-4 flex flex-wrap gap-2">{(passengerRating >= 4 ? ["Ready at pickup", "Respectful", "Friendly", "Clear pickup", "Easy trip"] : ["Passenger late", "Unreachable", "Rude behaviour", "Unsafe behaviour", "Pickup issue"]).map((tag) => { const selected = passengerRatingTags.includes(tag); return <button key={tag} type="button" onClick={() => setPassengerRatingTags((items) => selected ? items.filter((item) => item !== tag) : [...items, tag].slice(0, 6))} className={`rounded-full border px-3 py-2 text-xs font-black ${selected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{tag}</button>; })}</div><textarea className="input-box mt-4 min-h-24 resize-none" value={passengerReview} onChange={(e) => setPassengerReview(e.target.value)} placeholder="Optional feedback" /><div className="mt-4 grid grid-cols-2 gap-3"><button className="secondary-btn" onClick={() => setShowPassengerRating(false)}>Later</button><button className="primary-btn" onClick={submitPassengerRating}>Submit</button></div></div></div>}
      <MobileBottomNav userType="captain" />
    </div>
  );
}

function DocStatus({ label, url, expiry, review, onOpen }) {
  const expired = expiry ? new Date(expiry).getTime() < Date.now() : false;
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-sm">
      <p className="font-black text-slate-950">{label}</p>
      <p className={`mt-1 text-xs font-bold ${url ? expired ? "text-amber-700" : "text-emerald-700" : "text-red-600"}`}>
        {url ? expired ? "Uploaded / expired" : "Uploaded" : "Missing"}
      </p>
      <p className={`mt-1 text-[10px] font-black uppercase tracking-wide ${review?.status === "approved" ? "text-emerald-700" : review?.status === "rejected" || review?.status === "expired" ? "text-red-600" : "text-amber-700"}`}>Admin: {review?.status || "pending"}</p>
      {review?.note && <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{review.note}</p>}
      {expiry && <p className="mt-1 text-[11px] font-semibold text-slate-500">Expires {new Date(expiry).toLocaleDateString()}</p>}
      {url && <button type="button" className="mt-2 inline-block text-left text-xs font-black text-blue-700 underline" onClick={() => onOpen?.(url, label)}>View document</button>}
    </div>
  );
}

function DocUpload({ label, file, onChange }) {
  return (
    <label className="block">
      <span className="mini-label">{label}</span>
      <div className="mt-2 flex min-h-[58px] cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-500">
        <UploadCloud size={18} />
        <span className="min-w-0 flex-1 truncate">{file ? file.name : "Upload file"}</span>
        {file && <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px]">{formatDocSize(file.size)}</span>}
      </div>
      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
    </label>
  );
}

export default CaptainHomeScreen;
