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
    </div>
  );
}

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

export default RideHistory;
