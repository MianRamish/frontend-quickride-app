<<<<<<< HEAD
import axios from "axios";
import { useEffect, useState } from "react";
import { ArrowLeft, Banknote, Calendar, ChevronDown, Clock, HelpCircle, Route, Sparkles, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatMoney } from "../utils/formatMoney";
import { MobileBottomNav, NetworkStatusBanner, RideStatusTimeline } from "../components";

function RideHistory() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const stored = JSON.parse(localStorage.getItem("userData") || "{}");
  const role = stored.type === "captain" ? "captain" : "user";
  const [profile, setProfile] = useState(stored.data || { rides: [] });
  const [loading, setLoading] = useState(true);
  const [supportRide, setSupportRide] = useState(null);
  const [supportCategory, setSupportCategory] = useState("fare_issue");
  const [supportText, setSupportText] = useState("");

  const load = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/${role}/profile`, { headers: { token } });
      setProfile(response.data?.[role === "captain" ? "captain" : "user"] || stored.data || { rides: [] });
    } catch (_) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const rides = profile?.rides || [];
  const upcomingScheduled = rides.filter((ride) => ride.rideMode === "scheduled" && ride.status === "scheduled").sort((a, b) => new Date(a.scheduledFor || 0) - new Date(b.scheduledFor || 0));
  const groups = classifyAndSortRides(rides.filter((ride) => !(ride.rideMode === "scheduled" && ride.status === "scheduled")));
  const completed = rides.filter((ride) => ride.status === "completed").length;

  const cancelScheduled = async (ride) => {
    if (!ride?._id) return;
    const ok = window.confirm("Cancel this scheduled ride?");
    if (!ok) return;
    try {
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/ride/cancel-user`, { rideId: ride._id, reasonCode: "CHANGE_OF_PLANS", reasonText: "Scheduled ride cancelled by passenger" }, { headers: { token } });
      await load();
    } catch (error) {
      alert(error?.response?.data?.message || "Unable to cancel scheduled ride.");
    }
  };

  const sendSupport = async () => {
    if (!supportRide?._id || supportText.trim().length < 5) return;
    try {
      if (role === "captain") await axios.post(`${import.meta.env.VITE_SERVER_URL}/captain/complaint`, { rideId: supportRide._id, category: supportCategory, description: supportText }, { headers: { token } });
      else await axios.post(`${import.meta.env.VITE_SERVER_URL}/ride/complaint`, { rideId: supportRide._id, category: supportCategory, description: supportText }, { headers: { token } });
      setSupportRide(null); setSupportText("");
      alert("Support case submitted.");
    } catch (error) { alert(error?.response?.data?.message || "Unable to submit support case."); }
  };

  return (
    <div className="min-h-dvh bg-[#f4f7fb] pb-[var(--qr-bottom-nav-offset)]">
      <NetworkStatusBanner />
      <header className="relative overflow-hidden rounded-b-[36px] bg-[#07111f] px-4 pb-7 pt-[calc(env(safe-area-inset-top)+16px)] text-white">
        <div className="absolute -right-14 -top-16 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative flex items-center gap-3"><button className="icon-btn-dark" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button><div><p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[.14em] text-emerald-200"><Sparkles size={11} /> QuickRide Nigeria</p><h1 className="text-2xl font-black tracking-tight">Trip history</h1></div></div>
        <div className="relative mt-5 grid grid-cols-3 gap-2"><Stat label="All rides" value={rides.length} /><Stat label="Completed" value={completed} /><Stat label="Cancelled" value={rides.filter((r) => r.status === "cancelled").length} /></div>
      </header>

      <main className="safe-scroll mx-auto -mt-2 max-w-2xl px-4 pt-6">
        {loading ? <div className="rounded-[26px] bg-white p-6 text-center text-sm font-bold text-slate-400">Loading trips…</div> : <><HistoryGroup title="Upcoming scheduled" rides={upcomingScheduled} onHelp={setSupportRide} onCancel={cancelScheduled} /><HistoryGroup title="Today" rides={groups.today} onHelp={setSupportRide} /><HistoryGroup title="Yesterday" rides={groups.yesterday} onHelp={setSupportRide} /><HistoryGroup title="Earlier" rides={groups.earlier} onHelp={setSupportRide} /></>}
      </main>

      {supportRide && <div className="modal-backdrop"><div className="modal-sheet"><p className="mini-label">Trip support</p><h2 className="text-2xl font-black text-slate-950">Help with this trip</h2><p className="mt-1 text-xs font-semibold text-slate-500">Ride #{supportRide._id?.slice(-8)} • {supportRide.pickup?.split(",")[0]} → {supportRide.destination?.split(",")[0]}</p><select className="input-box mt-4" value={supportCategory} onChange={(e) => setSupportCategory(e.target.value)}><option value="fare_issue">Fare issue</option><option value="lost_item">Lost item</option><option value={role === "captain" ? "passenger_behavior" : "driver_behavior"}>{role === "captain" ? "Passenger issue" : "Driver issue"}</option><option value="safety">Safety concern</option><option value="wrong_route">Wrong route</option><option value="other">Other</option></select><textarea className="input-box mt-3 min-h-28 resize-none" value={supportText} onChange={(e) => setSupportText(e.target.value)} placeholder="Describe what happened" /><div className="mt-4 grid grid-cols-2 gap-3"><button className="secondary-btn" onClick={() => setSupportRide(null)}>Cancel</button><button className="primary-btn" onClick={sendSupport} disabled={supportText.trim().length < 5}>Submit case</button></div></div></div>}
      <MobileBottomNav userType={role} />
=======
import { formatMoney } from "../utils/formatMoney";
import { useState } from "react";
import { ArrowLeft, Calendar, ChevronUp, Clock, CreditCard, MapPinMinus, MapPinPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

function RideHistory() {
  const navigation = useNavigate();
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const [user] = useState(userData.data || { rides: [] });
  const groups = classifyAndSortRides(user.rides || []);

  return (
    <div className="screen-safe safe-scroll bg-slate-50 p-5">
      <div className="mb-6 flex items-center gap-3">
        <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm" onClick={() => navigation(-1)}><ArrowLeft /></button>
        <div>
          <p className="mini-label">Trips</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Ride history</h1>
        </div>
      </div>
      <HistoryGroup title="Today" rides={groups.today} />
      <HistoryGroup title="Yesterday" rides={groups.yesterday} />
      <HistoryGroup title="Earlier" rides={groups.earlier} />
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
    </div>
  );
}

<<<<<<< HEAD
function Stat({ label, value }) { return <div className="rounded-[22px] bg-white/10 p-3 backdrop-blur"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>; }

function HistoryGroup({ title, rides, onHelp, onCancel }) {
  return <details open className="group mb-4"><summary className="mb-3 flex cursor-pointer list-none select-none items-center justify-between px-1 py-1 text-sm font-black text-slate-900"><span>{title} <span className="ml-1 text-xs text-slate-400">{rides.length}</span></span><ChevronDown className="h-5 w-5 text-slate-400 transition-transform duration-300 group-open:rotate-180" /></summary><div className="space-y-3">{rides.length ? rides.map((ride) => <Ride ride={ride} onHelp={onHelp} onCancel={onCancel} key={ride._id} />) : <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 p-6 text-center"><Route className="mx-auto text-slate-300" /><p className="mt-2 text-sm font-black text-slate-600">No rides here yet</p></div>}</div></details>;
}

function classifyAndSortRides(rides) {
  const today = new Date(); const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const sameDay = (a,b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  const out={today:[],yesterday:[],earlier:[]};
  rides.forEach((ride)=>{const date=new Date(ride.createdAt); if(sameDay(date,today))out.today.push(ride); else if(sameDay(date,yesterday))out.yesterday.push(ride); else out.earlier.push(ride);});
  Object.values(out).forEach((arr)=>arr.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))); return out;
}

export const Ride = ({ ride, onHelp, onCancel }) => {
  const date = new Date(ride.createdAt);
  const statusColor = ride.status === "completed" ? "bg-emerald-50 text-emerald-700" : ride.status === "cancelled" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700";
  return <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_12px_34px_rgba(15,23,42,.06)]"><div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3"><div><p className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><Calendar size={12} /> {date.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})} <span>•</span> <Clock size={12} /> {date.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})}</p><p className="mt-1 text-lg font-black text-slate-950">{formatMoney(ride.fare, ride.currency || "NGN")}</p></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${statusColor}`}>{ride.status || "trip"}</span></div><div className="p-4">{ride.rideMode === "scheduled" && ride.scheduledFor ? <div className="mb-3 flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2.5 text-[11px] font-black text-blue-700"><Calendar size={14} /> Scheduled pickup: {new Date(ride.scheduledFor).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div> : null}<RideStatusTimeline status={ride.status || "pending"} compact /><div className="route-card mt-3"><div className="route-line" /><Address label="Pickup" text={ride.pickup} /><div className="mt-2" /><Address label="Drop-off" text={ride.destination} destination /></div><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-2xl bg-slate-50 px-3 py-2.5"><span className="flex items-center gap-2 text-xs font-black text-slate-700"><Banknote size={15} className="text-emerald-600" /> {ride.paymentMethod === "card" ? "Card" : "Cash"}</span>{ride.cashCollected && <p className="mt-1 text-[9px] font-bold text-emerald-700">Cash confirmed</p>}</div><div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-right">{ride.promoCode ? <><p className="flex items-center justify-end gap-1 text-[10px] font-black text-emerald-700"><Tag size={11} /> {ride.promoCode}</p><p className="text-[9px] font-bold text-slate-400">Saved {formatMoney(ride.promoDiscount || 0, ride.currency || "NGN")}</p></> : <p className="text-[10px] font-bold text-slate-400">QuickRide Nigeria</p>}</div></div>{(ride.cancelReason?.text || ride.cancelReason?.code) && <div className="mt-3 rounded-2xl bg-red-50 p-3 text-[11px] font-semibold text-red-700"><strong>Cancellation:</strong> {ride.cancelReason?.text || String(ride.cancelReason?.code || "").replaceAll("_", " ")}{ride.cancellationFee ? ` • Fee ${formatMoney(ride.cancellationFee, ride.currency || "NGN")}` : ""}</div>}<div className={`mt-3 grid ${ride.status === "scheduled" && onCancel ? "grid-cols-2" : "grid-cols-1"} gap-2`}>{ride.status === "scheduled" && onCancel ? <button type="button" onClick={() => onCancel(ride)} className="flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-black text-red-600">Cancel booking</button> : null}<button type="button" onClick={() => onHelp?.(ride)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700"><HelpCircle size={15} /> Help with this trip</button></div></div></div>;
};

function Address({ label, text, destination=false }) { return <div className="relative z-10 flex items-center gap-3"><span className={`route-dot ${destination ? "route-dot-destination" : ""}`} /><div className="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2.5 shadow-sm"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p><p className="truncate text-xs font-black text-slate-800">{text}</p></div></div>; }
=======
function HistoryGroup({ title, rides }) {
  return (
    <details open className="group mb-4">
      <summary className="mb-3 flex cursor-pointer select-none items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm">
        <span>{title}</span>
        <ChevronUp className="h-5 w-5 text-slate-500 transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="space-y-3">
        {rides.length > 0 ? rides.map((ride) => <Ride ride={ride} key={ride._id} />) : <p className="rounded-2xl bg-white p-4 text-center text-sm font-semibold text-slate-500">No rides found</p>}
      </div>
    </details>
  );
}

function classifyAndSortRides(rides) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const out = { today: [], yesterday: [], earlier: [] };
  rides.forEach((ride) => {
    const date = new Date(ride.createdAt);
    if (sameDay(date, today)) out.today.push(ride);
    else if (sameDay(date, yesterday)) out.yesterday.push(ride);
    else out.earlier.push(ride);
  });
  Object.values(out).forEach((arr) => arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  return out;
}

export const Ride = ({ ride }) => {
  const date = new Date(ride.createdAt);
  const dateText = date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const timeText = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <div className="soft-card p-4 shadow-none">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
        <span className="flex items-center gap-1"><Calendar size={14} /> {dateText}</span>
        <span className="flex items-center gap-1"><Clock size={14} /> {timeText}</span>
        <span className="flex items-center gap-1 text-slate-950"><CreditCard size={14} /> {formatMoney(ride.fare, ride.currency || "USD")}</span>
      </div>
      <div className="space-y-3">
        <Address icon={<MapPinMinus size={16} />} label="Pickup" text={ride.pickup} />
        <Address icon={<MapPinPlus size={16} />} label="Drop-off" text={ride.destination} />
      </div>
    </div>
  );
};

function Address({ icon, label, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-950">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="truncate text-sm font-bold text-slate-700">{text}</p>
      </div>
    </div>
  );
}
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7

export default RideHistory;
