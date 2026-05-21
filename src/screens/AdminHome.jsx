import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import LiveMap from "../components/LiveMap";
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
} from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
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
  latitude: 43.6532,
  longitude: -79.3832,
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

function money(value, currency = "USD") {
  const n = Number(value || 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
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
  const token = useMemo(() => localStorage.getItem("adminToken") || "", []);
  const http = useMemo(() => api(token), [token]);

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [summary, setSummary] = useState(null);
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

  const [passengerForm, setPassengerForm] = useState(emptyPassenger);
  const [driverForm, setDriverForm] = useState(emptyDriver);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);
  const [payoutForm, setPayoutForm] = useState(emptyPayout);
  const [bonusForm, setBonusForm] = useState(emptyBonus);

  const load = async () => {
    if (!token) return navigate("/admin/login");
    try {
      setLoading(true);
      const [summaryRes, usersRes, captainsRes, vehiclesRes, ridesRes, onlineRes, reviewsRes, payoutsRes, bonusesRes, emergenciesRes, complaintsRes, withdrawalsRes, scheduledRes] = await Promise.all([
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
      ]);
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
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const approve = (id) => submit(() => http.patch(`/api/admin/captains/${id}/approve`), "Driver approved.");
  const toggleDriver = (driver) => submit(() => http.patch(`/api/admin/captains/${driver._id}`, { status: driver.status === "active" ? "inactive" : "active" }), "Driver status updated.");
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
        { ...base, id: `${c._id}-license`, type: "Driver License", expiry: c.documents?.licenseExpiry, status: c.documents?.licenseUrl ? (isExpired(c.documents?.licenseExpiry) ? "Expired" : "Valid") : "Missing", url: c.documents?.licenseUrl },
        { ...base, id: `${c._id}-id`, type: "Government ID", expiry: null, status: c.documents?.governmentIdUrl ? "Uploaded" : "Missing", url: c.documents?.governmentIdUrl },
        { ...base, id: `${c._id}-reg-driver`, type: "Vehicle Registration", expiry: c.documents?.vehicleRegistrationExpiry, status: c.documents?.vehicleRegistrationUrl ? (isExpired(c.documents?.vehicleRegistrationExpiry) ? "Expired" : "Valid") : "Missing", url: c.documents?.vehicleRegistrationUrl },
        { ...base, id: `${c._id}-ins-driver`, type: "Vehicle Insurance", expiry: c.documents?.insuranceExpiry, status: c.documents?.insuranceUrl ? (isExpired(c.documents?.insuranceExpiry) ? "Expired" : "Valid") : "Missing", url: c.documents?.insuranceUrl },
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
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">Manage passengers, drivers, vehicles, rides, payouts, reviews, bonus campaigns, documents, and live fleet activity from one responsive admin panel.</p>
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
            {activeTab === "overview" && <Overview summary={summary} rides={rides} captains={captains} users={users} payouts={payouts} bonuses={bonuses} docs={docs} />}
            {activeTab === "passengers" && <Passengers users={users} form={passengerForm} setForm={setPassengerForm} onSubmit={createPassenger} onDelete={removeUser} />}
            {activeTab === "drivers" && <Drivers captains={captains} form={driverForm} setForm={setDriverForm} onSubmit={createDriver} approve={approve} toggleDriver={toggleDriver} removeDriver={removeDriver} />}
            {activeTab === "vehicles" && <Vehicles vehicles={vehicles} captains={captains} form={vehicleForm} setForm={setVehicleForm} onSubmit={createVehicle} onDelete={removeVehicle} />}
            {activeTab === "rides" && <Rides rides={rides} updateStatus={updateRideStatus} />}
            {activeTab === "scheduled" && <ScheduledRides rides={scheduledRides} updateStatus={updateRideStatus} />}
            {activeTab === "safety" && <SafetyCenter emergencies={emergencies} complaints={complaints} updateEmergency={updateEmergency} updateComplaint={updateComplaint} />}
            {activeTab === "tracking" && <Tracking markers={markers} online={online} />}
            {activeTab === "withdrawals" && <Withdrawals withdrawals={withdrawals} updateWithdrawal={updateWithdrawal} />}
            {activeTab === "payouts" && <Payouts payouts={payouts} captains={captains} form={payoutForm} setForm={setPayoutForm} onSubmit={createPayout} togglePaid={markPayoutPaid} />}
            {activeTab === "bonuses" && <Bonuses bonuses={bonuses} form={bonusForm} setForm={setBonusForm} onSubmit={createBonus} toggleBonus={toggleBonus} />}
            {activeTab === "documents" && <Documents docs={docs} approve={approve} />}
            {activeTab === "reviews" && <Reviews reviews={reviews} hideReview={hideReview} />}
          </main>
        </div>
      </div>
    </div>
  );
}

function Overview({ summary, rides, captains, users, payouts, bonuses, docs }) {
  const pendingDrivers = captains.filter((c) => !c.isApproved).length;
  const pendingPayouts = payouts.filter((p) => p.status !== "paid").reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const expiredDocs = docs.filter((d) => d.status !== "Valid").length;
  const activeBonuses = bonuses.filter((b) => b.isActive).length;
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={UsersRound} label="Passengers" value={summary?.totalPassengers ?? users.length} />
        <Metric icon={ShieldCheck} label="Drivers" value={summary?.totalCaptains ?? captains.length} sub={`${pendingDrivers} pending approval`} />
        <Metric icon={Route} label="Completed rides" value={summary?.completed ?? 0} sub={`${summary?.cancelled ?? 0} cancelled`} />
        <Metric icon={CircleDollarSign} label="Revenue" value={money(summary?.revenue || 0)} sub={`${money(pendingPayouts)} pending payouts`} />
      </section>
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

function Passengers({ users, form, setForm, onSubmit, onDelete }) {
  return <CrudPanel title="Passenger Management" subtitle="Create, view, and remove passenger accounts." form={
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      <Input label="First name" value={form.firstname} onChange={(v) => setForm({ ...form, firstname: v })} required />
      <Input label="Last name" value={form.lastname} onChange={(v) => setForm({ ...form, lastname: v })} />
      <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
      <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <button className="admin-btn w-full" type="submit">Create passenger</button>
    </form>
  }>
    <Table headers={["Name", "Email", "Phone", "Verified", "Joined", "Actions"]} rows={users.map((u) => [fullName(u), u.email, u.phone || "—", String(!!u.emailVerified), dateShort(u.createdAt), <button className="admin-btn-danger" onClick={() => onDelete(u._id)}>Remove</button>])} />
  </CrudPanel>;
}

function Drivers({ captains, form, setForm, onSubmit, approve, toggleDriver, removeDriver }) {
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
      <div className="flex flex-wrap gap-2">{!c.isApproved && <button className="admin-btn" onClick={() => approve(c._id)}>Approve</button>}<button className="admin-btn-secondary" onClick={() => toggleDriver(c)}>{c.status === "active" ? "Deactivate" : "Activate"}</button><button className="admin-btn-danger" onClick={() => removeDriver(c._id)}>Remove</button></div>
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
      r._id?.slice(-8), fullName(r.user), fullName(r.captain), <span className="block max-w-[360px] truncate">{r.pickup} → {r.destination}</span>, money(r.fare, r.currency || "USD"), r.status, r.rating ? `${r.rating}★` : "—",
      <select className="admin-select min-w-36" value={r.status} onChange={(e) => updateStatus(r._id, e.target.value)}><option value="scheduled">scheduled</option><option value="pending">pending</option><option value="accepted">accepted</option><option value="ongoing">ongoing</option><option value="completed">completed</option><option value="cancelled">cancelled</option></select>
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
      money(r.fare, r.currency || "USD"),
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
      money(w.amount, w.currency || "USD"),
      w.method,
      <span className="block max-w-[300px] truncate">{[w.bankName, w.accountHolder, w.accountNumber].filter(Boolean).join(" • ") || w.payoutEmail || "—"}</span>,
      w.status,
      dateShort(w.createdAt),
      <select className="admin-select min-w-36" value={w.status} onChange={(e) => updateWithdrawal(w._id, e.target.value)}><option value="pending">pending</option><option value="approved">approved</option><option value="paid">paid</option><option value="rejected">rejected</option></select>
    ])} />
  </CrudPanel>;
}

function Tracking({ markers, online }) {
  return <section className="admin-card p-4 sm:p-5"><div className="mb-4"><p className="mini-label">Live fleet visibility</p><h2 className="text-2xl font-black">Online drivers</h2><p className="mt-1 text-sm font-semibold text-slate-500">Current driver location and online status from active socket/location updates.</p></div><div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><LiveMap height="min(62dvh, 620px)" markers={markers} center={markers[0] ? [markers[0].lat, markers[0].lng] : [43.6532, -79.3832]} /><div className="space-y-2 overflow-y-auto xl:max-h-[620px]">{online.map((c) => <div key={c._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><h3 className="font-black">{fullName(c)}</h3><p className="text-xs font-semibold text-slate-500">{c.email}</p><p className="mt-2 text-xs font-bold text-slate-700">Score {c.performanceScore ?? 100} • {c.rating?.avg ?? 0}★</p></div>)}</div></div></section>;
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

function Documents({ docs, approve }) {
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
      d.verificationStatus || "—",
      d.url ? <button type="button" className="text-left font-black text-blue-700 underline" onClick={() => openStoredDocument(d.url, d.type)}>View document</button> : "—",
      d.driverId && !d.isApproved ? <button className="admin-btn" onClick={() => approve(d.driverId)}>Approve driver</button> : "—",
    ])} />
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
