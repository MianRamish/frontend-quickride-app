import { formatMoney } from "../utils/formatMoney";
import { ChevronDown, Clock3, UsersRound } from "lucide-react";

const vehicles = [
  { id: 1, name: "Standard", description: "Everyday ride", type: "car", image: "car.png", seats: "1-4", eta: "Fast" },
  { id: 2, name: "Economy", description: "Lower fare option", type: "bike", image: "bike.webp", seats: "1", eta: "Budget" },
];

function SelectVehicle({ selectedVehicle, showPanel, setShowPanel, showPreviousPanel, showNextPanel, fare, currency = "USD" }) {
  return (
    <div className={`${showPanel ? "translate-y-0" : "translate-y-full"} floating-sheet z-40 sheet-scroll`}>
      <button
        onClick={() => { setShowPanel(false); showPreviousPanel(true); }}
        className="mx-auto mb-3 flex h-9 w-16 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm"
        aria-label="Back to trip search"
      >
        <ChevronDown strokeWidth={2.5} />
      </button>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="mini-label">Choose ride</p>
          <h2 className="text-[clamp(1.35rem,6vw,1.6rem)] font-black tracking-tight text-slate-950">Select vehicle</h2>
        </div>
        <span className="pill">Free map API</span>
      </div>
      <div className="space-y-3 pb-2">
        {vehicles.map((vehicle) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} fare={fare} currency={currency} selectedVehicle={selectedVehicle} setShowPanel={setShowPanel} showNextPanel={showNextPanel} />
        ))}
      </div>
    </div>
  );
}

const Vehicle = ({ vehicle, selectedVehicle, fare, currency, setShowPanel, showNextPanel }) => {
  return (
    <button
      onClick={() => { selectedVehicle(vehicle.type); setShowPanel(false); showNextPanel(true); }}
      className="soft-card flex w-full items-center gap-3 p-3 text-left transition active:scale-[0.99]"
    >
      <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-3xl bg-slate-100 min-[380px]:h-20 min-[380px]:w-24">
        <img src={`/${vehicle.image}`} className="max-h-14 max-w-20 object-contain mix-blend-multiply min-[380px]:max-h-16 min-[380px]:max-w-24" alt={vehicle.name} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3 className="truncate text-base font-black text-slate-950 min-[380px]:text-lg">{vehicle.name}</h3>
          <p className="shrink-0 font-black text-slate-950">{formatMoney(fare?.[vehicle.type] || 0, currency)}</p>
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500 min-[380px]:text-sm">{vehicle.description}</p>
        <div className="mt-3 flex gap-2 text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1"><UsersRound size={12} /> {vehicle.seats}</span>
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1"><Clock3 size={12} /> {vehicle.eta}</span>
        </div>
      </div>
    </button>
  );
};
export default SelectVehicle;
