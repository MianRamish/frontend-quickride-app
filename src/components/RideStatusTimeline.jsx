import { Check, CircleDot } from "lucide-react";

const stages = [
  { key: "pending", label: "Searching" },
  { key: "accepted", label: "Accepted" },
  { key: "arriving", label: "On the way" },
  { key: "arrived", label: "Arrived" },
  { key: "ongoing", label: "In trip" },
  { key: "completed", label: "Complete" },
];

export default function RideStatusTimeline({ status = "pending", compact = false }) {
  if (status === "cancelled") return <div className="rounded-2xl bg-red-50 px-3 py-2.5 text-xs font-black text-red-700">Ride cancelled</div>;
  const current = Math.max(0, stages.findIndex((item) => item.key === status));
  return (
    <div className={`grid grid-cols-6 gap-1 ${compact ? "" : "rounded-[22px] bg-slate-50 p-3"}`}>
      {stages.map((stage, index) => {
        const done = index < current || status === "completed";
        const active = index === current && status !== "completed";
        return (
          <div key={stage.key} className="min-w-0 text-center">
            <div className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full ${done ? "bg-emerald-600 text-white" : active ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-400"}`}>{done ? <Check size={12} strokeWidth={3} /> : <CircleDot size={10} />}</div>
            <p className={`mt-1 truncate text-[8px] font-black uppercase tracking-tight ${done || active ? "text-slate-800" : "text-slate-400"}`}>{stage.label}</p>
          </div>
        );
      })}
    </div>
  );
}
