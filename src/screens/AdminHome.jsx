import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import LiveMap from "../components/LiveMap";
import { SocketDataContext } from "../contexts/SocketContext";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CarFront,
  CircleDollarSign,
  FileCheck2,
  Gift,
  LayoutDashboard,
  LogOut,
  MapPinned,
  MessageSquareText,
  RefreshCcw,
  Route,
  ShieldCheck,
  Star,
  UsersRound,
  ShieldAlert,
  CalendarClock,
  WalletCards,
  TrendingUp,
  AlertTriangle,
  Clock3,
  MapPin,
} from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "forecast", label: "Demand Forecast", icon: TrendingUp },
  { id: "passengers", label: "Passengers", icon: UsersRound },
  { id: "drivers", label: "Drivers", icon: ShieldCheck },
  { id: "vehicles", label: "Vehicles", icon: CarFront },
  { id: "rides", label: "Rides", icon: Route },
  { id: "scheduled", label: "Scheduled", icon: CalendarClock },
  { id: "safety", label: "Safety & Complaints", icon: ShieldAlert },
  { id: "tracking", label: "Live Tracking", icon: MapPinned },
  { id: "withdrawals", label: "Withdrawals", icon: WalletCards },
  { id: "payouts", label: "Payouts", icon: CircleDollarSign },
  { id: "bonuses", label: "Bonuses", icon: Gift },
  { id: "documents", label: "Documents", icon: FileCheck2 },
  { id: "reviews", label: "Reviews", icon: MessageSquareText },
  { id: "pricing", label: "Pricing & Matching", icon: CircleDollarSign },
  { id: "settlements", label: "Cash Settlements", icon: WalletCards },
  { id: "promos", label: "Promo Codes", icon: Gift },
];

const emptyPassenger = { firstname: "", lastname: "", email: "", phone: "", password: "Password123!" };
const emptyDriver = {
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  password: "Password123!",
  isApproved: true,
  status: "active",
  vehicleType: "car",
  vehicleColor: "Black",
  vehicleNumber: "TBD",
  vehicleCapacity: 4,
  latitude: 6.5244,
  longitude: 3.3792,
};
const emptyVehicle = {
  captainId: "",
  make: "",
  model: "",
  year: "",
  color: "",
  plateNumber: "",
  type: "car",
};
const emptyPayout = {
  captainId: "",
  amount: "",
  periodStart: "",
  periodEnd: "",
  status: "pending",
  method: "bank",
  reference: "",
};
const emptyBonus = {
  name: "",
  description: "",
  period: "daily",
  targetRides: 20,
  rewardAmount: 100,
  startsAt: "",
  endsAt: "",
};

function api(token) {
  return axios.create({ baseURL: import.meta.env.VITE_SERVER_URL, headers: { token } });
}

function money(value, currency = "NGN") {
  const n = Number(value || 0);
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(n);
}

function fullName(person) {
  return `${person?.fullname?.firstname || ""} ${person?.fullname?.lastname || ""}`.trim() || "—";
}

function dateShort(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function isExpired(value) {
  if (!value) return true;
  return new Date(value).getTime() < Date.now();
}

function openStoredDocument(url, label = "Document") {
  if (!url) return;
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
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (error) {
    alert("Unable to open this document. Please ask the driver to upload it again.");
  }
}

export default function AdminHome() {
  const navigate = useNavigate();
  const { socket } = useContext(SocketDataContext);
  const token = useMemo(() => localStorage.getItem("adminToken") || "", []);
  const http = useMemo(() => api(token), [token]);

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [summary, setSummary] = useState(null);
  const [demandForecast, setDemandForecast] = useState(null);
  const [users, setUsers] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [rides, setRides] = useState([]);
  const [online, setOnline] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [scheduledRides, setScheduledRides] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [promos, setPromos] = useState([]);
  const [liveOps, setLiveOps] = useState({ drivers: [], rides: [], staleSeconds: 120 });
  const [promoForm, setPromoForm] = useState({ code: "", description: "", type: "percent", value: 10, maxDiscount: "", minFare: 0, usageLimit: "", perUserLimit: 1, startsAt: "", endsAt: "" });

  const [passengerForm, setPassengerForm] = useState(emptyPassenger);
  const [driverForm, setDriverForm] = useState(emptyDriver);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);
  const [payoutForm, setPayoutForm] = useState(emptyPayout);
  const [bonusForm, setBonusForm] = useState(emptyBonus);

  const load = async () => {
    if (!token) return navigate("/admin/login");
    try {
      setLoading(true);
      const forecastRequest = http.get("/api/admin/analytics/demand-forecast?horizon=12")
        .then((response) => {
          setDemandForecast(response.data || null);
          return response;
        })
        .catch(() => null);

      const [summaryRes, usersRes, captainsRes, vehiclesRes, ridesRes, onlineRes, reviewsRes, payoutsRes, bonusesRes, emergenciesRes, complaintsRes, withdrawalsRes, scheduledRes, pricingRes, settlementsRes, promosRes, liveOpsRes] = await Promise.all([
        http.get("/api/admin/analytics/summary"),
        http.get("/api/admin/users"),
        http.get("/api/admin/captains"),
        http.get("/api/admin/vehicles"),
        http.get("/api/admin/rides"),
        http.get("/api/admin/online-captains"),
        http.get("/api/admin/reviews"),
        http.get("/api/admin/payouts"),
        http.get("/api/admin/incentives"),
        http.get("/api/admin/emergencies"),
        http.get("/api/admin/complaints"),
        http.get("/api/admin/withdrawals"),
        http.get("/api/admin/scheduled-rides"),
        http.get("/api/admin/pricing"),
        http.get("/api/admin/settlements"),
        http.get("/api/admin/promo-codes"),
        http.get("/api/admin/live-operations"),
      ]);
      void forecastRequest;
      setSummary(summaryRes.data || {});
      setUsers(usersRes.data || []);
      setCaptains(captainsRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setRides(ridesRes.data || []);
      setOnline(onlineRes.data || []);
      setReviews(reviewsRes.data || []);
      setPayouts(payoutsRes.data || []);
      setBonuses(bonusesRes.data || []);
      setEmergencies(emergenciesRes.data || []);
      setComplaints(complaintsRes.data || []);
      setWithdrawals(withdrawalsRes.data || []);
      setScheduledRides(scheduledRes.data || []);
      setPricing(pricingRes.data || null);
      setSettlements(settlementsRes.data || []);
      setPromos(promosRes.data || []);
      setLiveOps(liveOpsRes.data || { drivers: [], rides: [], staleSeconds: 120 });
    } catch (e) {
      if (e?.response?.status === 401) navigate("/admin/login");
      setNotice(e?.response?.data?.message || "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket || !token) return undefined;
    const joinAdmin = () => socket.emit("join-admin", { token });
    const onCaptainLocation = (payload) => {
      if (!payload?.captainId || !payload?.location) return;
      const driver = {
        ...(payload.captain || {}),
        _id: payload.captainId,
        location: { type: "Point", coordinates: [payload.location.lng, payload.location.ltd] },
        lastLocationAt: payload.updatedAt || new Date().toISOString(),
        locationFresh: true,
      };
      setLiveOps((prev) => ({
        ...prev,
        drivers: [driver, ...(prev.drivers || []).filter((item) => String(item._id) !== String(payload.captainId))],
      }));
      setOnline((prev) => [driver, ...prev.filter((item) => String(item._id) !== String(payload.captainId))]);
    };
    if (socket.connected) joinAdmin();
    const onAdminNotification = (item) => {
      setNotice(item?.title ? `${item.title}${item.body ? ` • ${item.body}` : ""}` : "New operations update received.");
      // Safety/verification changes should appear without requiring a manual refresh.
      if (["emergency", "complaint", "driver_verification"].includes(item?.type)) load().catch?.(() => {});
    };
    socket.on("connect", joinAdmin);
    socket.on("admin-captain-location", onCaptainLocation);
    socket.on("notification", onAdminNotification);
    const poll = window.setInterval(async () => {
      try {
        const [live, summaryData] = await Promise.all([http.get("/api/admin/live-operations"), http.get("/api/admin/analytics/summary")]);
        setLiveOps(live.data || { drivers: [], rides: [], staleSeconds: 120 });
        setOnline((live.data?.drivers || []).filter((item) => item.locationFresh !== false));
        setSummary(summaryData.data || {});
      } catch (_) {}
    }, 15000);
    const forecastPoll = window.setInterval(async () => {
      try {
        const response = await http.get("/api/admin/analytics/demand-forecast?horizon=12");
        setDemandForecast(response.data || null);
      } catch (_) {}
    }, 60000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(forecastPoll);
      socket.off("connect", joinAdmin);
      socket.off("admin-captain-location", onCaptainLocation);
      socket.off("notification", onAdminNotification);
    };
  }, [socket, token, http]);

  const submit = async (handler, success) => {
    try {
      setLoading(true);
      setNotice("");
      await handler();
      setNotice(success || "Updated successfully.");
      await load();
    } catch (e) {
      setNotice(e?.response?.data?.message || e?.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    socket?.emit("leave-session");
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const approve = (id) => submit(() => http.patch(`/api/admin/captains/${id}/approve`), "Driver approved.");
  const toggleDriver = (driver) => submit(() => http.patch(`/api/admin/captains/${driver._id}`, { status: driver.status === "active" ? "inactive" : "active" }), "Driver status updated.");
  const suspendDriver = (driver) => submit(() => http.patch(`/api/admin/captains/${driver._id}`, { status: driver.status === "suspended" ? "active" : "suspended" }), driver.status === "suspended" ? "Driver restored." : "Driver suspended.");
  const removeDriver = (id) => window.confirm("Remove this driver and their vehicles?") && submit(() => http.delete(`/api/admin/captains/${id}`), "Driver removed.");
  const removeUser = (id) => window.confirm("Remove this passenger?") && submit(() => http.delete(`/api/admin/users/${id}`), "Passenger removed.");
  const removeVehicle = (id) => window.confirm("Remove this vehicle?") && submit(() => http.delete(`/api/admin/vehicles/${id}`), "Vehicle removed.");
  const updateRideStatus = (id, status) => submit(() => http.patch(`/api/admin/rides/${id}`, { status }), "Ride updated.");
  const markPayoutPaid = (payout) => submit(() => http.patch(`/api/admin/payouts/${payout._id}`, { status: payout.status === "paid" ? "pending" : "paid" }), "Payout updated.");
  const toggleBonus = (bonus) => submit(() => http.patch(`/api/admin/incentives/${bonus._id}`, { isActive: !bonus.isActive }), "Bonus campaign updated.");
  const hideReview = (rideId) => submit(() => http.patch(`/api/admin/reviews/hide`, { rideId }), "Review hidden.");
  const updateEmergency = (id, status) => submit(() => http.patch(`/api/admin/emergencies/${id}`, { status }), "Emergency updated.");
  const updateComplaint = (id, status) => submit(() => http.patch(`/api/admin/complaints/${id}`, { status }), "Complaint updated.");
  const updateWithdrawal = (id, status) => submit(() => http.patch(`/api/admin/withdrawals/${id}`, { status }), "Withdrawal updated.");
  const togglePassenger = (user) => submit(() => http.patch(`/api/admin/users/${user._id}`, { status: user.status === "suspended" ? "active" : "suspended" }), user.status === "suspended" ? "Passenger activated." : "Passenger suspended.");
  const reviewDocument = (driverId, docKey, status) => {
    const note = status === "rejected" ? (window.prompt("Why is this document rejected?", "Please upload a clear, valid document.") || "Document rejected") : status === "approved" ? "Reviewed and approved by admin" : "Document needs review";
    return submit(() => http.patch(`/api/admin/captains/${driverId}/documents/${docKey}/review`, { status, note }), `Document ${status}.`);
  };
  const savePricing = (next) => submit(() => http.patch("/api/admin/pricing", next), "Operations pricing and matching settings updated.");
  const settleCash = (item) => {
    const outstanding = Math.max(0, Number(item.amount || 0) - Number(item.settledAmount || 0));
    const amount = Number(window.prompt("Amount received from driver", String(outstanding)) || 0);
    if (!amount) return;
    const reference = window.prompt("Settlement reference (optional)", "cash-office") || "";
    return submit(() => http.patch(`/api/admin/settlements/${item._id}/settle`, { amount, reference }), "Cash commission settlement recorded.");
  };
  const createPromo = (e) => { e.preventDefault(); return submit(async () => { const payload = { ...promoForm, code: promoForm.code.trim().toUpperCase(), value: Number(promoForm.value), minFare: Number(promoForm.minFare || 0), perUserLimit: Number(promoForm.perUserLimit || 1), maxDiscount: promoForm.maxDiscount === "" ? null : Number(promoForm.maxDiscount), usageLimit: promoForm.usageLimit === "" ? null : Number(promoForm.usageLimit), startsAt: promoForm.startsAt || undefined, endsAt: promoForm.endsAt || null }; await http.post("/api/admin/promo-codes", payload); setPromoForm({ code: "", description: "", type: "percent", value: 10, maxDiscount: "", minFare: 0, usageLimit: "", perUserLimit: 1, startsAt: "", endsAt: "" }); }, "Promo code created."); };
  const togglePromo = (promo) => submit(() => http.patch(`/api/admin/promo-codes/${promo._id}`, { isActive: !promo.isActive }), "Promo status updated.");

  const createPassenger = (e) => {
    e.preventDefault();
    submit(async () => {
      await http.post("/api/admin/users", passengerForm);
      setPassengerForm(emptyPassenger);
    }, "Passenger created.");
  };

  const createDriver = (e) => {
    e.preventDefault();
    submit(async () => {
      await http.post("/api/admin/captains", driverForm);
      setDriverForm(emptyDriver);
    }, "Driver created.");
  };

  const createVehicle = (e) => {
    e.preventDefault();
    submit(async () => {
      await http.post("/api/admin/vehicles", vehicleForm);
      setVehicleForm(emptyVehicle);
    }, "Vehicle created.");
  };

  const createPayout = (e) => {
    e.preventDefault();
    submit(async () => {
      await http.post("/api/admin/payouts", payoutForm);
      setPayoutForm(emptyPayout);
    }, "Payout created.");
  };

  const createBonus = (e) => {
    e.preventDefault();
    submit(async () => {
      await http.post("/api/admin/incentives", bonusForm);
      setBonusForm(emptyBonus);
    }, "Bonus campaign created.");
  };

  const markers = (online || []).map((c) => ({
    key: c._id,
    lat: c.location?.coordinates?.[1],
    lng: c.location?.coordinates?.[0],
    title: fullName(c),
    subtitle: `Score ${c.performanceScore ?? 100} • ⭐ ${c.rating?.avg ?? 0}`,
  })).filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));

  const docs = useMemo(() => {
    const driverDocs = captains.flatMap((c) => {
      const owner = fullName(c);
      const ownerEmail = c.email || "—";
      const base = {
        driverId: c._id,
        owner,
        ownerEmail,
        verificationStatus: c.verificationStatus || "pending",
        isApproved: !!c.isApproved,
      };
      return [
        { ...base, id: `${c._id}-license`, docKey: "license", type: "Driver License", expiry: c.documents?.licenseExpiry, status: c.documents?.licenseUrl ? (isExpired(c.documents?.licenseExpiry) ? "Expired" : "Valid") : "Missing", reviewStatus: c.documents?.reviews?.license?.status || "pending", reviewNote: c.documents?.reviews?.license?.note || "", url: c.documents?.licenseUrl },
        { ...base, id: `${c._id}-id`, docKey: "governmentId", type: "Government ID", expiry: null, status: c.documents?.governmentIdUrl ? "Uploaded" : "Missing", reviewStatus: c.documents?.reviews?.governmentId?.status || "pending", reviewNote: c.documents?.reviews?.governmentId?.note || "", url: c.documents?.governmentIdUrl },
        { ...base, id: `${c._id}-reg-driver`, docKey: "registration", type: "Vehicle Registration", expiry: c.documents?.vehicleRegistrationExpiry, status: c.documents?.vehicleRegistrationUrl ? (isExpired(c.documents?.vehicleRegistrationExpiry) ? "Expired" : "Valid") : "Missing", reviewStatus: c.documents?.reviews?.registration?.status || "pending", reviewNote: c.documents?.reviews?.registration?.note || "", url: c.documents?.vehicleRegistrationUrl },
        { ...base, id: `${c._id}-ins-driver`, docKey: "insurance", type: "Vehicle Insurance", expiry: c.documents?.insuranceExpiry, status: c.documents?.insuranceUrl ? (isExpired(c.documents?.insuranceExpiry) ? "Expired" : "Valid") : "Missing", reviewStatus: c.documents?.reviews?.insurance?.status || "pending", reviewNote: c.documents?.reviews?.insurance?.note || "", url: c.documents?.insuranceUrl },
      ];
    });
    const vehicleDocs = vehicles.flatMap((v) => {
      const driver = v.captain;
      const owner = driver ? `${fullName(driver)} • ${driver.email || ""}` : "Unassigned driver";
      const vehicleLabel = `${v.make || "Vehicle"} ${v.model || ""} • ${v.plateNumber || "—"}`;
      const base = {
        driverId: driver?._id,
        owner,
        ownerEmail: driver?.email || "—",
        vehicle: vehicleLabel,
        verificationStatus: driver?.verificationStatus || "—",
        isApproved: !!driver?.isApproved,
      };
      return [
        { ...base, id: `${v._id}-reg`, type: "Vehicle Registration", expiry: v.docs?.registrationExpiry, status: v.docs?.registrationUrl ? (isExpired(v.docs?.registrationExpiry) ? "Expired" : "Valid") : "Missing", url: v.docs?.registrationUrl },
        { ...base, id: `${v._id}-ins`, type: "Vehicle Insurance", expiry: v.docs?.insuranceExpiry, status: v.docs?.insuranceUrl ? (isExpired(v.docs?.insuranceExpiry) ? "Expired" : "Valid") : "Missing", url: v.docs?.insuranceUrl },
      ];
    });
    return [...driverDocs, ...vehicleDocs];
  }, [captains, vehicles]);

  return (
    <div className="dashboard-shell">
      <div className="dashboard-container">
        <header className="mb-4 flex flex-col gap-4 rounded-[28px] bg-slate-950 p-5 text-white shadow-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">QuickRide Admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight lg:text-4xl">Operations dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">Manage live rides, drivers, safety cases, pricing, cash settlements, promos, payouts, reviews and driver verification from one responsive operations console.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="admin-btn-secondary border-white/15 bg-white/10 text-white hover:bg-white/20" onClick={load} disabled={loading}><RefreshCcw size={16} /> <span className="ml-2">Refresh</span></button>
            <button className="admin-btn-danger" onClick={logout}><LogOut size={16} /> <span className="ml-2">Logout</span></button>
          </div>
        </header>

        {notice ? <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">{notice}</div> : null}

        <div className="dashboard-grid">
          <aside className="dashboard-sidebar admin-card p-3">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-black transition ${activeTab === id ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>
                  <Icon size={18} />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="min-w-0 space-y-4">
            {activeTab === "overview" && <Overview summary={summary} forecast={demandForecast} rides={rides} captains={captains} users={users} payouts={payouts} bonuses={bonuses} docs={docs} />}
            {activeTab === "forecast" && <DemandForecast forecast={demandForecast} />}
            {activeTab === "passengers" && <Passengers users={users} form={passengerForm} setForm={setPassengerForm} onSubmit={createPassenger} onDelete={removeUser} toggleStatus={togglePassenger} />}
            {activeTab === "drivers" && <Drivers captains={captains} form={driverForm} setForm={setDriverForm} onSubmit={createDriver} approve={approve} toggleDriver={toggleDriver} suspendDriver={suspendDriver} removeDriver={removeDriver} />}
            {activeTab === "vehicles" && <Vehicles vehicles={vehicles} captains={captains} form={vehicleForm} setForm={setVehicleForm} onSubmit={createVehicle} onDelete={removeVehicle} />}
            {activeTab === "rides" && <Rides rides={rides} updateStatus={updateRideStatus} />}
            {activeTab === "scheduled" && <ScheduledRides rides={scheduledRides} updateStatus={updateRideStatus} />}
            {activeTab === "safety" && <SafetyCenter emergencies={emergencies} complaints={complaints} updateEmergency={updateEmergency} updateComplaint={updateComplaint} />}
            {activeTab === "tracking" && <Tracking markers={markers} online={online} liveOps={liveOps} />}
            {activeTab === "withdrawals" && <Withdrawals withdrawals={withdrawals} updateWithdrawal={updateWithdrawal} />}
            {activeTab === "payouts" && <Payouts payouts={payouts} captains={captains} form={payoutForm} setForm={setPayoutForm} onSubmit={createPayout} togglePaid={markPayoutPaid} />}
            {activeTab === "bonuses" && <Bonuses bonuses={bonuses} form={bonusForm} setForm={setBonusForm} onSubmit={createBonus} toggleBonus={toggleBonus} />}
            {activeTab === "documents" && <Documents docs={docs} approve={approve} reviewDocument={reviewDocument} />}
            {activeTab === "reviews" && <Reviews reviews={reviews} hideReview={hideReview} />}
            {activeTab === "pricing" && <Pricing pricing={pricing} onSave={savePricing} />}
            {activeTab === "settlements" && <Settlements items={settlements} onSettle={settleCash} />}
            {activeTab === "promos" && <Promos promos={promos} form={promoForm} setForm={setPromoForm} onSubmit={createPromo} togglePromo={togglePromo} />}
          </main>
        </div>
      </div>
    </div>
  );
}

function Overview({ summary, forecast, rides, captains, users, payouts, bonuses, docs }) {
  const pendingDrivers = captains.filter((c) => !c.isApproved).length;
  const pendingPayouts = payouts.filter((p) => p.status !== "paid").reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const expiredDocs = docs.filter((d) => d.status !== "Valid").length;
  const activeBonuses = bonuses.filter((b) => b.isActive).length;
  const nextPressure = forecast?.buckets?.find((bucket) => ["high", "critical"].includes(bucket.risk));
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={UsersRound} label="Passengers" value={summary?.totalPassengers ?? users.length} />
        <Metric icon={ShieldCheck} label="Drivers" value={summary?.totalCaptains ?? captains.length} sub={`${pendingDrivers} pending approval`} />
        <Metric icon={Route} label="Completed rides" value={summary?.completed ?? 0} sub={`${summary?.cancelled ?? 0} cancelled`} />
        <Metric icon={CircleDollarSign} label="Revenue" value={money(summary?.revenue || 0)} sub={`${money(pendingPayouts)} pending payouts`} />
      </section>
      {nextPressure ? (
        <section className="admin-card border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><AlertTriangle size={20} /></div>
              <div><p className="mini-label text-amber-700">Upcoming supply pressure</p><h2 className="text-lg font-black text-amber-950">{nextPressure.localLabel}: about {nextPressure.predictedRequests} ride requests vs {nextPressure.projectedSupply} projected drivers</h2><p className="mt-1 text-xs font-bold text-amber-800">Estimated driver gap: {nextPressure.driverGap}. Open Demand Forecast for zone-level repositioning guidance.</p></div>
            </div>
          </div>
        </section>
      ) : null}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="admin-card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center gap-3"><BarChart3 /><div><p className="mini-label">Analytics</p><h2 className="text-2xl font-black">System snapshot</h2></div></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MiniStat label="Total rides" value={summary?.totalRides ?? rides.length} />
            <MiniStat label="Active bonuses" value={activeBonuses} />
            <MiniStat label="Expired documents" value={expiredDocs} />
          </div>
        </div>
        <div className="admin-card p-5">
          <p className="mini-label">Attention needed</p>
          <div className="mt-4 space-y-3 text-sm font-bold text-slate-700">
            <Row label="Pending driver approvals" value={pendingDrivers} />
            <Row label="Expired / missing docs" value={expiredDocs} />
            <Row label="Pending payout value" value={money(pendingPayouts)} />
          </div>
        </div>
      </section>
    </div>
  );
}

function DemandForecast({ forecast }) {
  if (!forecast) {
    return <section className="admin-card p-5"><p className="mini-label">Predictive analytics</p><h2 className="mt-1 text-2xl font-black">Demand forecast unavailable</h2><p className="mt-2 text-sm font-semibold text-slate-500">Refresh the dashboard after the backend forecast endpoint is available.</p></section>;
  }

  const buckets = forecast.buckets || [];
  const maxDemand = Math.max(1, ...buckets.map((bucket) => Number(bucket.predictedRequests || 0)));
  const pressureBuckets = buckets.filter((bucket) => ["high", "critical"].includes(bucket.risk));
  const nextPressure = pressureBuckets[0];
  const confidenceLabel = `${forecast.confidence || "low"} confidence • ${forecast.sampleSize || 0} historical rides`;
  const geoZones = (forecast.zoneRecommendations || []).filter((item) => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng)));
  const zoneMarkers = geoZones.map((item) => ({
    key: "forecast-" + item.zone,
    lat: Number(item.lat),
    lng: Number(item.lng),
    title: item.zone,
    subtitle: "~" + item.predictedRequests + " expected requests • " + item.currentDrivers + " drivers now • " + item.driverGap + " short",
    color: item.driverGap >= 3 ? "#dc2626" : item.driverGap > 0 ? "#d97706" : "#059669",
    kind: "zone",
    label: String(item.driverGap || 0),
  }));
  const zoneMapCenter = zoneMarkers[0] ? [zoneMarkers[0].lat, zoneMarkers[0].lng] : [6.5244, 3.3792];

  const riskClass = (risk) => risk === "critical"
    ? "bg-red-100 text-red-700"
    : risk === "high"
      ? "bg-amber-100 text-amber-800"
      : risk === "watch"
        ? "bg-blue-100 text-blue-700"
        : "bg-emerald-100 text-emerald-700";

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={ShieldCheck} label="Available drivers now" value={forecast.availableDriversNow || 0} sub={`${forecast.busyDriversNow || 0} currently busy`} />
        <Metric icon={Clock3} label="Average trip" value={`${forecast.averageTripMinutes || 0} min`} sub={`${forecast.ridesPerDriverPerHour || 0} rides/driver/hour`} />
        <Metric icon={TrendingUp} label="Forecast window" value={`${forecast.horizonHours || 0} hr`} sub={confidenceLabel} />
        <Metric icon={AlertTriangle} label="Pressure periods" value={pressureBuckets.length} sub={nextPressure ? `Next: ${nextPressure.localLabel}` : "No projected shortage"} />
      </section>

      <section className="admin-card p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mini-label">Predictive demand</p><h2 className="text-2xl font-black">Upcoming demand vs driver supply</h2><p className="mt-1 text-sm font-semibold text-slate-500">Historical same-day/hour demand is combined with known scheduled pickups. Driver supply uses fresh online GPS status.</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600">{forecast.timezone || "Africa/Lagos"}</span>
        </div>
        <DemandSupplyChart buckets={buckets} />
        <div className="mt-4 space-y-3">
          {buckets.map((bucket) => {
            const width = `${Math.max(4, Math.min(100, (Number(bucket.predictedRequests || 0) / maxDemand) * 100))}%`;
            return (
              <div key={bucket.startsAt} className="rounded-[22px] border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><p className="text-sm font-black text-slate-950">{bucket.localLabel}</p><p className="mt-0.5 text-[10px] font-bold text-slate-500">{bucket.scheduledCount || 0} scheduled • historical baseline {bucket.historicalExpected || 0}</p></div>
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${riskClass(bucket.risk)}`}>{bucket.risk}</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-slate-950" style={{ width }} /></div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-white px-2 py-2"><p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Demand</p><p className="mt-1 text-lg font-black">{bucket.predictedRequests}</p></div>
                  <div className="rounded-2xl bg-white px-2 py-2"><p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Drivers</p><p className="mt-1 text-lg font-black">{bucket.projectedSupply}</p></div>
                  <div className="rounded-2xl bg-white px-2 py-2"><p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Gap</p><p className={`mt-1 text-lg font-black ${bucket.driverGap > 0 ? "text-red-600" : "text-emerald-700"}`}>{bucket.driverGap}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="admin-card p-4 sm:p-5">
        <div className="mb-4"><p className="mini-label">Driver distribution</p><h2 className="text-2xl font-black">Zones to watch in the next 4 hours</h2><p className="mt-1 text-sm font-semibold text-slate-500">Map pins show the projected driver shortage: red is critical, amber needs attention, and green is currently covered.</p></div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
          <div>
            {zoneMarkers.length ? (
              <LiveMap height="min(52dvh, 520px)" markers={zoneMarkers} center={zoneMapCenter} />
            ) : (
              <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">Zone coordinates will appear here as QuickRide collects enough localized trip history.</div>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black">
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700">Critical shortage</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">Driver gap</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">Covered</span>
            </div>
          </div>
          <div className="space-y-3">
            {(forecast.zoneRecommendations || []).map((item) => (
              <div key={item.zone} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-1 text-xs font-black text-slate-950"><MapPin size={14} /> {item.zone}</p><p className="mt-1 text-[10px] font-bold text-slate-500">~{item.predictedRequests} expected requests</p></div><span className={item.driverGap > 0 ? "rounded-full bg-red-100 px-2 py-1 text-[9px] font-black text-red-700" : "rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black text-emerald-700"}>{item.driverGap > 0 ? item.driverGap + " short" : "covered"}</span></div>
                <div className="mt-3 grid grid-cols-2 gap-2"><MiniStat label="Drivers now" value={item.currentDrivers} /><MiniStat label="Needed" value={item.requiredDrivers} /></div>
              </div>
            ))}
            {!(forecast.zoneRecommendations || []).length ? <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">More ride and driver-location history is needed for zone recommendations.</div> : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs font-semibold leading-5 text-blue-900">
        <strong>How this forecast works:</strong> {forecast.methodology} This is an operational estimate, not a guaranteed demand level; accuracy improves as QuickRide collects more ride history.
      </section>
    </div>
  );
}

function DemandSupplyChart({ buckets = [] }) {
  if (!buckets.length) return null;

  const width = 760;
  const height = 250;
  const left = 38;
  const right = 18;
  const top = 18;
  const bottom = 42;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxValue = Math.max(1, ...buckets.flatMap((bucket) => [
    Number(bucket.predictedRequests || 0),
    Number(bucket.projectedSupply || 0),
    Number(bucket.requiredDrivers || 0),
  ]));
  const xFor = (index) => left + (buckets.length <= 1 ? plotWidth / 2 : (index / (buckets.length - 1)) * plotWidth);
  const yFor = (value) => top + plotHeight - (Number(value || 0) / maxValue) * plotHeight;
  const pointsFor = (field) => buckets.map((bucket, index) => xFor(index) + "," + yFor(bucket[field])).join(" ");

  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-wide">
        <span className="flex items-center gap-1.5 text-slate-700"><span className="h-2.5 w-2.5 rounded-full bg-slate-950" /> Expected demand</span>
        <span className="flex items-center gap-1.5 text-emerald-700"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Projected drivers</span>
        <span className="flex items-center gap-1.5 text-amber-700"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Drivers required</span>
      </div>
      <svg viewBox={"0 0 " + width + " " + height} className="min-w-[680px] w-full" role="img" aria-label="QuickRide demand and driver supply forecast">
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = top + plotHeight - fraction * plotHeight;
          const value = Math.round(maxValue * fraction);
          return <g key={fraction}><line x1={left} y1={y} x2={width - right} y2={y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 5" /><text x={left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">{value}</text></g>;
        })}
        <polyline points={pointsFor("predictedRequests")} fill="none" stroke="#0f172a" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={pointsFor("projectedSupply")} fill="none" stroke="#059669" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={pointsFor("requiredDrivers")} fill="none" stroke="#d97706" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="7 6" />
        {buckets.map((bucket, index) => (
          <g key={bucket.startsAt || index}>
            <circle cx={xFor(index)} cy={yFor(bucket.predictedRequests)} r="4" fill="#0f172a" />
            <circle cx={xFor(index)} cy={yFor(bucket.projectedSupply)} r="4" fill="#059669" />
            <text x={xFor(index)} y={height - 14} textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748b">{bucket.localLabel}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Passengers({ users, form, setForm, onSubmit, onDelete, toggleStatus }) {
  return <CrudPanel title="Passenger Management" subtitle="Create, view, and remove passenger accounts." form={
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      <Input label="First name" value={form.firstname} onChange={(v) => setForm({ ...form, firstname: v })} required />
      <Input label="Last name" value={form.lastname} onChange={(v) => setForm({ ...form, lastname: v })} />
      <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
      <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <button className="admin-btn w-full" type="submit">Create passenger</button>
    </form>
  }>
    <Table headers={["Name", "Email", "Phone", "Status", "Rating", "Joined", "Actions"]} rows={users.map((u) => [fullName(u), u.email, u.phone || "—", u.status || "active", `${u.rating?.avg || 0}★`, dateShort(u.createdAt), <div className="flex flex-wrap gap-2"><button className="admin-btn-secondary" onClick={() => toggleStatus(u)}>{u.status === "suspended" ? "Activate" : "Suspend"}</button><button className="admin-btn-danger" onClick={() => onDelete(u._id)}>Remove</button></div>])} />
  </CrudPanel>;
}

function Drivers({ captains, form, setForm, onSubmit, approve, toggleDriver, suspendDriver, removeDriver }) {
  return <CrudPanel title="Driver & Fleet Onboarding" subtitle="Create drivers, approve onboarding, and manage driver availability." form={
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Input label="First name" value={form.firstname} onChange={(v) => setForm({ ...form, firstname: v })} required />
      <Input label="Last name" value={form.lastname} onChange={(v) => setForm({ ...form, lastname: v })} />
      <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
      <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <Select label="Vehicle type" value={form.vehicleType} onChange={(v) => setForm({ ...form, vehicleType: v })} options={["car", "bike"]} />
      <Input label="Vehicle color" value={form.vehicleColor} onChange={(v) => setForm({ ...form, vehicleColor: v })} />
      <Input label="Plate number" value={form.vehicleNumber} onChange={(v) => setForm({ ...form, vehicleNumber: v })} />
      <button className="admin-btn w-full" type="submit">Create driver</button>
    </form>
  }>
    <Table headers={["Driver", "Email", "Status", "Approved", "Rating", "Score", "Vehicle", "Actions"]} rows={captains.map((c) => [
      fullName(c), c.email, c.status, String(!!c.isApproved), `${c.rating?.avg ?? 0}★`, c.performanceScore ?? 100,
      c.activeVehicle ? `${c.activeVehicle.make || ""} ${c.activeVehicle.model || ""} ${c.activeVehicle.plateNumber || ""}` : `${c.vehicle?.color || ""} ${c.vehicle?.number || ""}`,
      <div className="flex flex-wrap gap-2">{!c.isApproved && <button className="admin-btn" onClick={() => approve(c._id)}>Approve</button>}<button className="admin-btn-secondary" onClick={() => toggleDriver(c)} disabled={c.status === "suspended"}>{c.status === "active" ? "Deactivate" : "Activate"}</button><button className={c.status === "suspended" ? "admin-btn" : "admin-btn-danger"} onClick={() => suspendDriver(c)}>{c.status === "suspended" ? "Restore" : "Suspend"}</button><button className="admin-btn-danger" onClick={() => removeDriver(c._id)}>Remove</button></div>
    ])} />
  </CrudPanel>;
}

function Vehicles({ vehicles, captains, form, setForm, onSubmit, onDelete }) {
  return <CrudPanel title="Vehicle Management" subtitle="Create vehicles, assign them to drivers, and track fleet records." form={
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Select label="Assign driver" value={form.captainId} onChange={(v) => setForm({ ...form, captainId: v })} options={["", ...captains.map((c) => c._id)]} labels={{ "": "Select driver", ...Object.fromEntries(captains.map((c) => [c._id, fullName(c)])) }} required />
      <Input label="Make" value={form.make} onChange={(v) => setForm({ ...form, make: v })} />
      <Input label="Model" value={form.model} onChange={(v) => setForm({ ...form, model: v })} />
      <Input label="Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} />
      <Input label="Color" value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
      <Input label="Plate number" value={form.plateNumber} onChange={(v) => setForm({ ...form, plateNumber: v })} />
      <Select label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={["car", "bike"]} />
      <button className="admin-btn w-full" type="submit">Create vehicle</button>
    </form>
  }>
    <Table headers={["Driver", "Vehicle", "Plate", "Type", "Active", "Registration", "Insurance", "Actions"]} rows={vehicles.map((v) => [
      v.captain ? `${fullName(v.captain)} • ${v.captain.email || ""}` : "Unassigned",
      `${v.make || "—"} ${v.model || ""} ${v.year || ""}`,
      v.plateNumber || "—", v.type, String(!!v.isActive), dateShort(v.docs?.registrationExpiry), dateShort(v.docs?.insuranceExpiry),
      <button className="admin-btn-danger" onClick={() => onDelete(v._id)}>Remove</button>
    ])} />
  </CrudPanel>;
}

function Rides({ rides, updateStatus }) {
  return <CrudPanel title="Ride Management" subtitle="Monitor ride status, fare, passengers, drivers, and cancellation reasons.">
    <Table headers={["Ride", "Passenger", "Driver", "Route", "Fare", "Status", "Rating", "Actions"]} rows={rides.map((r) => [
      r._id?.slice(-8), fullName(r.user), fullName(r.captain), <span className="block max-w-[360px] truncate">{r.pickup} → {r.destination}</span>, money(r.fare, r.currency || "NGN"), r.status, r.rating ? `${r.rating}★` : "—",
      <select className="admin-select min-w-36" value={r.status} onChange={(e) => updateStatus(r._id, e.target.value)}><option value="scheduled">scheduled</option><option value="pending">pending</option><option value="accepted">accepted</option><option value="arriving">arriving</option><option value="arrived">arrived</option><option value="ongoing">ongoing</option><option value="completed">completed</option><option value="cancelled">cancelled</option></select>
    ])} />
  </CrudPanel>;
}


function ScheduledRides({ rides, updateStatus }) {
  return <CrudPanel title="Scheduled Rides" subtitle="View passenger rides booked for later and dispatch/cancel when needed.">
    <Table headers={["Pickup time", "Passenger", "Route", "Vehicle", "Fare", "Status", "Actions"]} rows={rides.map((r) => [
      r.scheduledFor ? new Date(r.scheduledFor).toLocaleString() : "—",
      fullName(r.user),
      <span className="block max-w-[420px] truncate">{r.pickup} → {r.destination}</span>,
      r.vehicle,
      money(r.fare, r.currency || "NGN"),
      r.status,
      <select className="admin-select min-w-36" value={r.status} onChange={(e) => updateStatus(r._id, e.target.value)}><option value="scheduled">scheduled</option><option value="pending">pending</option><option value="cancelled">cancelled</option></select>
    ])} />
  </CrudPanel>;
}

function SafetyCenter({ emergencies, complaints, updateEmergency, updateComplaint }) {
  return <div className="space-y-4">
    <CrudPanel title="Emergency / SOS Alerts" subtitle="Urgent passenger safety reports from active rides.">
      <Table headers={["Status", "Passenger", "Driver", "Type", "Message", "Location", "Date", "Actions"]} rows={emergencies.map((e) => [
        e.status,
        fullName(e.user),
        fullName(e.captain),
        e.type,
        <span className="block max-w-[320px] truncate">{e.message || "—"}</span>,
        e.location?.address || [e.location?.ltd, e.location?.lng].filter(Boolean).join(", ") || "—",
        dateShort(e.createdAt),
        <select className="admin-select min-w-36" value={e.status} onChange={(ev) => updateEmergency(e._id, ev.target.value)}><option value="open">open</option><option value="in_review">in review</option><option value="resolved">resolved</option><option value="dismissed">dismissed</option></select>
      ])} />
    </CrudPanel>
    <CrudPanel title="Passenger Complaints" subtitle="Passenger complaints against drivers with ride context.">
      <Table headers={["Status", "Passenger", "Driver", "Category", "Description", "Date", "Actions"]} rows={complaints.map((c) => [
        c.status,
        fullName(c.user),
        fullName(c.captain),
        c.category,
        <span className="block max-w-[460px] truncate">{c.description}</span>,
        dateShort(c.createdAt),
        <select className="admin-select min-w-36" value={c.status} onChange={(ev) => updateComplaint(c._id, ev.target.value)}><option value="open">open</option><option value="in_review">in review</option><option value="resolved">resolved</option><option value="dismissed">dismissed</option></select>
      ])} />
    </CrudPanel>
  </div>;
}

function Withdrawals({ withdrawals, updateWithdrawal }) {
  return <CrudPanel title="Driver Withdrawal Requests" subtitle="Approve, pay, or reject driver withdrawal requests from available balances.">
    <Table headers={["Driver", "Amount", "Method", "Bank / account", "Status", "Requested", "Actions"]} rows={withdrawals.map((w) => [
      fullName(w.captain),
      money(w.amount, w.currency || "NGN"),
      w.method,
      <span className="block max-w-[300px] truncate">{[w.bankName, w.accountHolder, w.accountNumber].filter(Boolean).join(" • ") || w.payoutEmail || "—"}</span>,
      w.status,
      dateShort(w.createdAt),
      <select className="admin-select min-w-36" value={w.status} onChange={(e) => updateWithdrawal(w._id, e.target.value)}><option value="pending">pending</option><option value="approved">approved</option><option value="paid">paid</option><option value="rejected">rejected</option></select>
    ])} />
  </CrudPanel>;
}

function Tracking({ markers, online, liveOps }) {
  return <section className="admin-card p-4 sm:p-5"><div className="mb-4"><p className="mini-label">Live fleet visibility</p><h2 className="text-2xl font-black">Online drivers</h2><p className="mt-1 text-sm font-semibold text-slate-500">Live GPS freshness, online drivers and active rides from Socket.IO. Stale drivers are excluded from matching.</p><div className="mt-3 grid grid-cols-3 gap-2"><MiniStat label="Online" value={liveOps?.drivers?.length ?? online.length} /><MiniStat label="Active rides" value={liveOps?.rides?.length ?? 0} /><MiniStat label="Stale after" value={`${liveOps?.staleSeconds || 120}s`} /></div></div><div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><LiveMap height="min(62dvh, 620px)" markers={markers} center={markers[0] ? [markers[0].lat, markers[0].lng] : [6.5244, 3.3792]} /><div className="space-y-2 overflow-y-auto xl:max-h-[620px]">{online.map((c) => <div key={c._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><h3 className="font-black">{fullName(c)}</h3><p className="text-xs font-semibold text-slate-500">{c.email}</p><p className="mt-2 text-xs font-bold text-slate-700">Score {c.performanceScore ?? 100} • {c.rating?.avg ?? 0}★</p></div>)}</div></div></section>;
}

function Payouts({ payouts, captains, form, setForm, onSubmit, togglePaid }) {
  return <CrudPanel title="Payout Management" subtitle="Create payout records and track pending/paid driver payments." form={
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Select label="Driver" value={form.captainId} onChange={(v) => setForm({ ...form, captainId: v })} options={["", ...captains.map((c) => c._id)]} labels={{ "": "Select driver", ...Object.fromEntries(captains.map((c) => [c._id, fullName(c)])) }} required />
      <Input label="Amount" type="number" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} required />
      <Input label="Period start" type="date" value={form.periodStart} onChange={(v) => setForm({ ...form, periodStart: v })} required />
      <Input label="Period end" type="date" value={form.periodEnd} onChange={(v) => setForm({ ...form, periodEnd: v })} required />
      <Select label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["pending", "processing", "paid", "failed"]} />
      <Input label="Method" value={form.method} onChange={(v) => setForm({ ...form, method: v })} />
      <Input label="Reference" value={form.reference} onChange={(v) => setForm({ ...form, reference: v })} />
      <button className="admin-btn w-full" type="submit">Create payout</button>
    </form>
  }>
    <Table headers={["Driver", "Amount", "Period", "Method", "Reference", "Status", "Actions"]} rows={payouts.map((p) => [fullName(p.captain), money(p.amount), `${dateShort(p.periodStart)} - ${dateShort(p.periodEnd)}`, p.method || "—", p.reference || "—", p.status, <button className="admin-btn-secondary" onClick={() => togglePaid(p)}>{p.status === "paid" ? "Mark pending" : "Mark paid"}</button>])} />
  </CrudPanel>;
}

function Bonuses({ bonuses, form, setForm, onSubmit, toggleBonus }) {
  return <CrudPanel title="Bonus Campaigns" subtitle="Create daily, weekly, or monthly driver incentive campaigns." form={
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Input label="Campaign name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
      <Select label="Period" value={form.period} onChange={(v) => setForm({ ...form, period: v })} options={["daily", "weekly", "monthly"]} />
      <Input label="Target rides" type="number" value={form.targetRides} onChange={(v) => setForm({ ...form, targetRides: v })} required />
      <Input label="Reward amount" type="number" value={form.rewardAmount} onChange={(v) => setForm({ ...form, rewardAmount: v })} required />
      <Input label="Start date" type="date" value={form.startsAt} onChange={(v) => setForm({ ...form, startsAt: v })} />
      <Input label="End date" type="date" value={form.endsAt} onChange={(v) => setForm({ ...form, endsAt: v })} />
      <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
      <button className="admin-btn w-full" type="submit">Create campaign</button>
    </form>
  }>
    <Table headers={["Campaign", "Period", "Target", "Reward", "Dates", "Active", "Actions"]} rows={bonuses.map((b) => [b.name, b.period, b.targetRides, money(b.rewardAmount), `${dateShort(b.startsAt)} - ${dateShort(b.endsAt)}`, String(!!b.isActive), <button className="admin-btn-secondary" onClick={() => toggleBonus(b)}>{b.isActive ? "Deactivate" : "Activate"}</button>])} />
  </CrudPanel>;
}

function Documents({ docs, approve, reviewDocument }) {
  const badgeClass = (status) => status === "Valid" || status === "Uploaded"
    ? "bg-emerald-50 text-emerald-700"
    : status === "Expired"
      ? "bg-amber-50 text-amber-700"
      : "bg-red-50 text-red-700";

  return <CrudPanel title="Driver & Vehicle Documents" subtitle="Every document row is linked to the driver who uploaded it, so management can verify documents even when many drivers are onboarded.">
    <Table headers={["Driver", "Email", "Document", "Vehicle", "Expiry", "Doc status", "Verification", "File", "Action"]} rows={docs.map((d) => [
      d.owner || "—",
      d.ownerEmail || "—",
      d.type,
      d.vehicle || "Driver profile",
      dateShort(d.expiry),
      <span className={`rounded-full px-2 py-1 text-xs font-black ${badgeClass(d.status)}`}>{d.status}</span>,
      <div><span className="font-black capitalize">{d.reviewStatus || "pending"}</span>{d.reviewNote ? <p className="mt-1 max-w-[220px] text-[10px] font-semibold text-slate-400">{d.reviewNote}</p> : null}</div>,
      d.url ? <button type="button" className="text-left font-black text-blue-700 underline" onClick={() => openStoredDocument(d.url, d.type)}>View document</button> : "—",
      d.driverId && d.docKey ? <div className="flex flex-wrap gap-1"><button className="admin-btn" disabled={!d.url || d.status === "Expired"} onClick={() => reviewDocument(d.driverId, d.docKey, "approved")}>Approve doc</button><button className="admin-btn-danger" disabled={!d.url} onClick={() => reviewDocument(d.driverId, d.docKey, "rejected")}>Reject</button>{!d.isApproved && <button className="admin-btn-secondary" onClick={() => approve(d.driverId)}>Approve driver</button>}</div> : "—",
    ])} />
  </CrudPanel>;
}

function Pricing({ pricing, onSave }) {
  const [form, setForm] = useState(null);
  useEffect(() => { if (pricing) setForm(JSON.parse(JSON.stringify(pricing))); }, [pricing]);
  if (!form) return <CrudPanel title="Pricing & Matching" subtitle="Loading operations settings…"><div className="p-8 text-center font-bold text-slate-400">Loading…</div></CrudPanel>;
  const updateFare = (type, key, value) => setForm({ ...form, fares: { ...form.fares, [type]: { ...form.fares?.[type], [key]: Number(value || 0) } } });
  return <CrudPanel title="Pricing & Matching" subtitle="Control Nigeria fare rules, cancellation policy and driver matching without editing environment files.">
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{["car","bike"].map((type) => <div key={type} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"><p className="mini-label">{type} fares • NGN</p><div className="mt-3 grid grid-cols-2 gap-3"><Input label="Base fare" type="number" value={form.fares?.[type]?.base ?? 0} onChange={(v)=>updateFare(type,"base",v)} /><Input label="Per kilometre" type="number" value={form.fares?.[type]?.perKm ?? 0} onChange={(v)=>updateFare(type,"perKm",v)} /><Input label="Per minute" type="number" value={form.fares?.[type]?.perMinute ?? 0} onChange={(v)=>updateFare(type,"perMinute",v)} /><Input label="Minimum fare" type="number" value={form.fares?.[type]?.minimum ?? 0} onChange={(v)=>updateFare(type,"minimum",v)} /></div></div>)}</div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"><Input label="Commission %" type="number" value={Math.round(Number(form.commissionRate || 0)*100)} onChange={(v)=>setForm({...form,commissionRate:Number(v||0)/100})} /><Input label="Cancellation fee" type="number" value={form.cancellationFee ?? 0} onChange={(v)=>setForm({...form,cancellationFee:Number(v||0)})} /><Input label="Free cancel minutes" type="number" value={form.cancellationFreeMinutes ?? 0} onChange={(v)=>setForm({...form,cancellationFreeMinutes:Number(v||0)})} /><Input label="Free waiting minutes" type="number" value={form.waitingFreeMinutes ?? 0} onChange={(v)=>setForm({...form,waitingFreeMinutes:Number(v||0)})} /><Input label="Matching radius km" type="number" value={form.matchingRadiusKm ?? 8} onChange={(v)=>setForm({...form,matchingRadiusKm:Number(v||0)})} /><Input label="Ride offer seconds" type="number" value={form.rideOfferSeconds ?? 20} onChange={(v)=>setForm({...form,rideOfferSeconds:Number(v||0)})} /><Input label="GPS stale seconds" type="number" value={form.driverLocationStaleSeconds ?? 120} onChange={(v)=>setForm({...form,driverLocationStaleSeconds:Number(v||0)})} /><Input label="Scheduled dispatch min" type="number" value={form.scheduledDispatchMinutes ?? 20} onChange={(v)=>setForm({...form,scheduledDispatchMinutes:Number(v||0)})} /><Input label="Support phone" value={form.supportPhone || ""} onChange={(v)=>setForm({...form,supportPhone:v})} /></div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">Card payments remain disabled by the backend. Updating this page cannot activate card processing.</div>
      <button className="admin-btn" onClick={()=>onSave({ fares:form.fares, commissionRate:form.commissionRate, cancellationFee:form.cancellationFee, cancellationFreeMinutes:form.cancellationFreeMinutes, waitingFreeMinutes:form.waitingFreeMinutes, matchingRadiusKm:form.matchingRadiusKm, rideOfferSeconds:form.rideOfferSeconds, driverLocationStaleSeconds:form.driverLocationStaleSeconds, scheduledDispatchMinutes:form.scheduledDispatchMinutes, supportPhone:form.supportPhone })}>Save operations settings</button>
    </div>
  </CrudPanel>;
}

function Settlements({ items, onSettle }) {
  const outstanding = items.reduce((sum,item)=>sum+Math.max(0,Number(item.amount||0)-Number(item.settledAmount||0)),0);
  return <CrudPanel title="Cash Commission Settlements" subtitle="Track what drivers owe QuickRide after collecting passenger fares in cash.">
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3"><MiniStat label="Outstanding" value={money(outstanding)} /><MiniStat label="Open records" value={items.filter((x)=>["owed","partially_settled"].includes(x.status)).length} /><MiniStat label="Settled" value={items.filter((x)=>x.status==="settled").length} /></div>
    <Table headers={["Driver","Ride","Cash fare","Commission","Settled","Outstanding","Status","Action"]} rows={items.map((item)=>{const due=Math.max(0,Number(item.amount||0)-Number(item.settledAmount||0)); return [fullName(item.captain), item.ride?._id?.slice(-8)||"—", money(item.grossCash||item.ride?.fare||0,item.currency||"NGN"), money(item.amount||0,item.currency||"NGN"), money(item.settledAmount||0,item.currency||"NGN"), money(due,item.currency||"NGN"), item.status, due>0?<button className="admin-btn" onClick={()=>onSettle(item)}>Record payment</button>:"Complete"];})} />
  </CrudPanel>;
}

function Promos({ promos, form, setForm, onSubmit, togglePromo }) {
  return <CrudPanel title="Promo Codes" subtitle="Create controlled passenger discounts while preserving the normal cash payment flow." form={<form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"><Input label="Code" value={form.code} onChange={(v)=>setForm({...form,code:v.toUpperCase()})} required /><Select label="Type" value={form.type} onChange={(v)=>setForm({...form,type:v})} options={["percent","fixed"]} /><Input label={form.type==="percent"?"Discount %":"Discount NGN"} type="number" value={form.value} onChange={(v)=>setForm({...form,value:v})} required /><Input label="Max discount" type="number" value={form.maxDiscount} onChange={(v)=>setForm({...form,maxDiscount:v})} /><Input label="Minimum fare" type="number" value={form.minFare} onChange={(v)=>setForm({...form,minFare:v})} /><Input label="Total usage limit" type="number" value={form.usageLimit} onChange={(v)=>setForm({...form,usageLimit:v})} /><Input label="Per user limit" type="number" value={form.perUserLimit} onChange={(v)=>setForm({...form,perUserLimit:v})} /><Input label="Description" value={form.description} onChange={(v)=>setForm({...form,description:v})} /><Input label="Start date" type="date" value={form.startsAt} onChange={(v)=>setForm({...form,startsAt:v})} /><Input label="End date" type="date" value={form.endsAt} onChange={(v)=>setForm({...form,endsAt:v})} /><button className="admin-btn w-full" type="submit">Create promo</button></form>}>
    <Table headers={["Code","Offer","Min fare","Usage","Dates","Active","Action"]} rows={promos.map((promo)=>[<strong>{promo.code}</strong>, promo.type==="percent"?`${promo.value}%`:money(promo.value), money(promo.minFare||0), `${promo.usageCount||0}${promo.usageLimit?` / ${promo.usageLimit}`:""}`, `${dateShort(promo.startsAt)} - ${dateShort(promo.endsAt)}`, String(!!promo.isActive), <button className="admin-btn-secondary" onClick={()=>togglePromo(promo)}>{promo.isActive?"Disable":"Enable"}</button>])} />
  </CrudPanel>;
}

function Reviews({ reviews, hideReview }) {
  return <CrudPanel title="Review Moderation" subtitle="View customer ratings/comments and hide inappropriate reviews."><Table headers={["Rating", "Passenger", "Driver", "Comment", "Date", "Actions"]} rows={reviews.map((r) => [`${r.rating}★`, fullName(r.user), fullName(r.captain), <span className="block max-w-[420px] truncate">{r.review || "(hidden)"}</span>, dateShort(r.createdAt), r.review ? <button className="admin-btn-secondary" onClick={() => hideReview(r._id)}>Hide</button> : "—"])} /></CrudPanel>;
}

function CrudPanel({ title, subtitle, form, children }) {
  return <section className="admin-card p-4 sm:p-5"><div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="mini-label">Admin tools</p><h2 className="text-2xl font-black tracking-tight">{title}</h2><p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p></div></div>{form ? <div className="mb-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">{form}</div> : null}<div className="min-w-0">{children}</div></section>;
}

function Table({ headers, rows }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{headers.map((h) => <th key={h} className="admin-th">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.length ? rows.map((row, idx) => <tr key={idx} className="hover:bg-slate-50">{row.map((cell, i) => <td key={i} className="admin-td">{cell}</td>)}</tr>) : <tr><td className="px-4 py-10 text-center text-sm font-bold text-slate-400" colSpan={headers.length}>No records found.</td></tr>}</tbody></table></div>;
}

function Input({ label, value, onChange, type = "text", required }) {
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">{label}</span><input className="admin-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} /></label>;
}

function Select({ label, value, onChange, options, labels = {}, required }) {
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">{label}</span><select className="admin-select" value={value} onChange={(e) => onChange(e.target.value)} required={required}>{options.map((o) => <option key={o} value={o}>{labels[o] || o}</option>)}</select></label>;
}

function Metric({ icon: Icon, label, value, sub }) {
  return <div className="admin-card p-5"><div className="flex items-start justify-between gap-3"><div><p className="mini-label">{label}</p><h3 className="mt-2 truncate text-2xl font-black lg:text-3xl">{value ?? 0}</h3>{sub ? <p className="mt-1 truncate text-xs font-bold text-slate-500">{sub}</p> : null}</div><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><Icon size={22} /></div></div></div>;
}
function MiniStat({ label, value }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="mini-label">{label}</p><h3 className="mt-2 text-2xl font-black">{value ?? 0}</h3></div>; }
function Row({ label, value }) { return <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3"><span>{label}</span><strong>{value}</strong></div>; }
