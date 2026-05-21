import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useCaptain } from "../contexts/CaptainContext";
import { BarChart3, BellRing, CarFront, FileCheck2, FileText, Gauge, Phone, Power, RefreshCcw, ShieldAlert, UploadCloud } from "lucide-react";
import { SocketDataContext } from "../contexts/SocketContext";
import { NewRide, Sidebar } from "../components";
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
  const { socket } = useContext(SocketDataContext);
  const [loading, setLoading] = useState(false);
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
  const [mapCenter, setMapCenter] = useState([43.6532, -79.3832]);
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
        setShowBtn("otp");
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

  const toggleAvailability = async () => {
    try {
      setLoading(true);
      const next = !isOnline;
      const response = await axios.patch(`${import.meta.env.VITE_SERVER_URL}/captain/availability`, { online: next }, { headers: { token } });
      setIsOnline(Boolean(response.data?.captain?.isOnline));
      showAlert("Status updated", response.data?.message || (next ? "You are online" : "You are offline"), "success");
      await fetchIncomingRides();
    } catch (error) {
      setIsOnline(false);
      showAlert("Cannot go online", error?.response?.data?.message || "Admin approval is required.", "failure");
    } finally {
      setLoading(false);
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

  const endRide = async () => {
    try {
      if (newRide._id != "") {
        setLoading(true);
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/ride/end-ride`,
          {
            rideId: newRide._id,
          },
          {
            headers: {
              token: token,
            },
          }
        );
        if (riderLocation.ltd && riderLocation.lng) setMapCenter([riderLocation.ltd, riderLocation.lng]);
        setShowBtn("accept");
        setLoading(false);
        setShowCaptainDetailsPanel(true);
        setShowNewRidePanel(false);
        setNewRide(defaultRideData);
        localStorage.removeItem("rideDetails");
        localStorage.removeItem("showPanel");
      }
    } catch (err) {
      setLoading(false);
      Console.log(err);
    }
  };

  const updateLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRiderLocation({
          ltd: position.coords.latitude,
          lng: position.coords.longitude,
        });

        setMapCenter([position.coords.latitude, position.coords.longitude]);

        if (socket && captain?._id) {
          socket.emit("update-location-captain", {
            userId: captain._id,
            location: {
              ltd: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
        }
      },
      () => {
        // Browser location may fail if permission is denied, GPS is unavailable,
        // or the app is not served from HTTPS/localhost. Keep the app usable.
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  };

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
    if (captain._id) {
      socket.emit("join", {
        userId: captain._id,
        userType: "captain",
      });

      // const locationInterval = setInterval(updateLocation, 10000);
      updateLocation(); // IMP: Call this function to update location
      refreshCaptainProfile();
      fetchCaptainExtras();
      fetchWithdrawals();
      fetchIncomingRides();
      setIsOnline(Boolean(captain?.isOnline));
    }

    socket.on("new-ride", (data) => {
      Console.log("New Ride available:", data);
      setShowBtn("accept");
      setNewRide(data);
      setIncomingRides((prev) => [data, ...prev.filter((ride) => ride._id !== data._id)]);
      setShowNewRidePanel(true);
      setActiveTab("requests");
    });

    socket.on("ride-cancelled", (data) => {
      Console.log("Ride cancelled", data);
      updateLocation();
      clearRideData();
    });
  }, [captain?._id]);

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
      distanceTravelled: Math.round(distanceTravelled / 1609.344),
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
      ? { key: "driver", lat: riderLocation.ltd, lng: riderLocation.lng, title: "Your location" }
      : null,
  ].filter(Boolean);

  function Metric({ label, value }) {
    return (
      <div className="soft-card p-4 text-center shadow-none">
        <h3 className="text-2xl font-black text-slate-950">{value ?? 0}</h3>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      </div>
    );
  }

  return (
    <div className="screen-safe">
      <div className="mobile-bg" />
      <Alert heading={alert.heading} text={alert.text} isVisible={alert.isVisible} onClose={hideAlert} type={alert.type} />
      <Sidebar />

      <div className="relative z-0 h-[43dvh] min-h-[280px] max-h-[410px] px-4 pb-0 pt-4">
        <div className="mb-3 flex items-start justify-between gap-3 pr-14 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Captain mode</p>
            <h1 className="mt-1 text-[clamp(1.35rem,6vw,1.55rem)] font-black tracking-tight">Ready for trips</h1>
          </div>
          <div className="hidden rounded-2xl bg-emerald-400/20 px-3 py-2 text-right backdrop-blur min-[360px]:block">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Status</p>
            <p className="text-sm font-black">{isOnline ? "Online" : "Offline"}</p>
          </div>
        </div>
        <LiveMap height="calc(100% - 58px)" center={mapCenter} markers={captainMarkers} />
      </div>

      {showCaptainDetailsPanel && (
        <div className="floating-sheet z-30 sheet-scroll">
          <div className="sheet-handle mb-4" />

          {(!captain?.isApproved || captain?.verificationStatus !== "approved") && (
            <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 shrink-0" size={20} />
                <div>
                  <h3 className="font-black">Pending admin verification</h3>
                  <p className="mt-1 text-sm font-semibold leading-5">Upload valid driver and vehicle documents, then wait for admin approval before accepting rides. Use the document update section below whenever documents expire or need replacement.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button className={`rounded-2xl px-4 py-3 text-sm font-black text-white ${isOnline ? "bg-emerald-600" : "bg-slate-950"}`} onClick={toggleAvailability} disabled={loading}>
              <span className="inline-flex items-center gap-2"><Power size={16} /> {isOnline ? "Go offline" : "Go online"}</span>
            </button>
            <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950" onClick={() => { setActiveTab("requests"); fetchIncomingRides(); }} disabled={loading}>
              <span className="inline-flex items-center gap-2"><RefreshCcw size={16} /> Refresh rides</span>
            </button>
            <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950" onClick={refreshCaptainProfile} disabled={loading}>
              <span className="inline-flex items-center gap-2"><RefreshCcw size={16} /> Refresh profile</span>
            </button>
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">
              {incomingRides.length} incoming request{incomingRides.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-slate-950 text-lg font-black text-white">
                {captain?.fullname?.firstname?.[0]}{captain?.fullname?.lastname?.[0]}
              </div>
              <div className="min-w-0">
                <p className="mini-label">Driver</p>
                <h2 className="truncate text-xl font-black leading-6 text-slate-950">{captain?.fullname?.firstname} {captain?.fullname?.lastname}</h2>
                <p className="mt-1 flex items-center gap-1 truncate text-xs font-semibold text-slate-500"><Phone size={12} /> {captain?.phone}</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="mini-label">Today</p>
              <h3 className="text-lg font-black text-slate-950">{formatMoney(earnings.today, earningsSummary?.currency || "USD")}</h3>
            </div>
          </div>

          <div className="sticky top-0 z-10 -mx-1 mb-4 overflow-x-auto rounded-3xl border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
            <div className="flex min-w-max gap-1">
              {DRIVER_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${isActive ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"}`}
                  >
                    <Icon size={16} /> {tab.label}
                    {tab.key === "requests" && incomingRides.length > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">{incomingRides.length}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Metric label="Accepted" value={rides?.accepted} />
                <Metric label="Miles" value={rides?.distanceTravelled} />
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
                          <p><span className="font-black text-slate-950">Fare:</span> {formatMoney(ride.fare, ride.currency || "USD")}</p>
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
                <DocStatus label="License" url={captain?.documents?.licenseUrl} expiry={captain?.documents?.licenseExpiry} onOpen={openDocument} />
                <DocStatus label="Registration" url={captain?.documents?.vehicleRegistrationUrl} expiry={captain?.documents?.vehicleRegistrationExpiry} onOpen={openDocument} />
                <DocStatus label="Insurance" url={captain?.documents?.insuranceUrl} expiry={captain?.documents?.insuranceExpiry} onOpen={openDocument} />
                <DocStatus label="Government ID" url={captain?.documents?.governmentIdUrl} onOpen={openDocument} />
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
                  <p className="mini-label">Available balance</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-950">{formatMoney(earningsSummary?.balance ?? captain?.earnings?.balance ?? 0, earningsSummary?.currency || "USD")}</h3>
                  <p className="text-xs font-semibold text-slate-500">Can be requested for withdrawal</p>
                </div>
                <div className="soft-card p-4 shadow-none">
                  <p className="mini-label">Total net</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-950">{formatMoney(earningsSummary?.totalNet ?? earnings.total, earningsSummary?.currency || "USD")}</h3>
                  <p className="text-xs font-semibold text-slate-500">Completed trips after commission</p>
                </div>
                <div className="soft-card p-4 shadow-none">
                  <p className="mini-label">Bonuses</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-950">{formatMoney(earningsSummary?.totalBonus ?? 0, earningsSummary?.currency || "USD")}</h3>
                  <p className="text-xs font-semibold text-slate-500">Campaign rewards</p>
                </div>
              </div>

              <form onSubmit={requestWithdrawal} className="soft-card p-4 shadow-none">
                <div className="mb-3">
                  <p className="mini-label">Withdraw funds</p>
                  <h3 className="text-lg font-black text-slate-950">Request a payout</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Admin can approve, pay, or reject withdrawal requests.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <input className="input-box" type="number" min="1" step="0.01" placeholder="Amount" value={withdrawalForm.amount} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })} />
                  <select className="input-box" value={withdrawalForm.method} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, method: e.target.value })}>
                    <option value="bank">Bank transfer</option>
                    <option value="wallet">Wallet</option>
                    <option value="cash">Cash</option>
                  </select>
                  <input className="input-box" placeholder="Bank name" value={withdrawalForm.bankName} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, bankName: e.target.value })} />
                  <input className="input-box" placeholder="Account holder" value={withdrawalForm.accountHolder} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountHolder: e.target.value })} />
                  <input className="input-box" placeholder="Account number" value={withdrawalForm.accountNumber} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountNumber: e.target.value })} />
                  <input className="input-box" placeholder="Routing / transit number" value={withdrawalForm.routingNumber} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, routingNumber: e.target.value })} />
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
                      <div className="flex items-center justify-between gap-3"><span className="font-black text-slate-950">{formatMoney(item.amount, item.currency || earningsSummary?.currency || "USD")}</span><span className="capitalize">{item.status}</span></div>
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
                          <p className="mt-1 text-sm font-black text-emerald-700">Bonus: {formatMoney(campaign.rewardAmount || campaign.bonusAmount || 0, earningsSummary?.currency || "USD")}</p>
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

      <NewRide rideData={newRide} otp={otp} setOtp={setOtp} showBtn={showBtn} showPanel={showNewRidePanel} setShowPanel={setShowNewRidePanel} showPreviousPanel={setShowCaptainDetailsPanel} loading={loading} acceptRide={acceptRide} rejectRide={rejectRide} verifyOTP={verifyOTP} endRide={endRide} error={error} />
    </div>
  );
}

function DocStatus({ label, url, expiry, onOpen }) {
  const expired = expiry ? new Date(expiry).getTime() < Date.now() : false;
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-sm">
      <p className="font-black text-slate-950">{label}</p>
      <p className={`mt-1 text-xs font-bold ${url ? expired ? "text-amber-700" : "text-emerald-700" : "text-red-600"}`}>
        {url ? expired ? "Uploaded / expired" : "Uploaded" : "Missing"}
      </p>
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
