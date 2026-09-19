import { formatMoney } from "../utils/formatMoney";
import { ChevronDown, Clock3, ShieldCheck, Sparkles, UsersRound } from "lucide-react";

const vehicles = [
  { id: 1, name: "QuickRide Car", description: "Comfortable everyday ride", type: "car", image: "car.png", seats: "1–4", eta: "Best match", badge: "Popular" },
  { id: 2, name: "QuickRide Bike", description: "Fast and affordable solo ride", type: "bike", image: "bike.webp", seats: "1", eta: "Budget", badge: "Value" },
];

function SelectVehicle({ selectedVehicle, showPanel, setShowPanel, showPreviousPanel, showNextPanel, fare, currency = "NGN", routeInfo = {}, pricing = null, fareBreakdown = null }) {
  return (
    <div className={`${showPanel ? "translate-y-0" : "translate-y-full"} floating-sheet floating-sheet-nav z-40 sheet-scroll sheet-scroll-nav`}>
      <div className="sheet-handle mb-3" />
      <div className="flow-steps mb-4">
        <div className="flow-step flow-step-done">1 Route</div>
        <div className="flow-step flow-step-active">2 Ride</div>
        <div className="flow-step">3 Confirm</div>
      </div>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mini-label">Choose your ride</p>
          <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">Pick the best option</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">Fare shown is the current trip estimate.</p>
          {(routeInfo?.distanceText || routeInfo?.durationText) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {routeInfo?.distanceText ? <span className="pill border-0 bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">{routeInfo.distanceText}</span> : null}
              {routeInfo?.durationText ? <span className="pill border-0 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">About {routeInfo.durationText}</span> : null}
              {routeInfo?.approximate ? <span className="pill border-0 bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">Approximate fare</span> : null}
            </div>
          )}
          {routeInfo?.approximate ? (
            <p className="mt-2 max-w-md rounded-2xl bg-amber-50 px-3 py-2 text-[10px] font-bold leading-4 text-amber-800">
              Live routing is temporarily unavailable. This estimate is for guidance only; QuickRide will re-check the live route before confirming a booking.
            </p>
          ) : null}
        </div>
        <button onClick={() => { setShowPanel(false); showPreviousPanel(true); }} className="icon-btn" aria-label="Back to trip search"><ChevronDown size={20} /></button>
      </div>

      <div className="space-y-3 pb-2">
        {vehicles.map((vehicle) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} fare={fare} currency={currency} pricing={pricing?.[vehicle.type]} breakdown={fareBreakdown?.[vehicle.type]} selectedVehicle={selectedVehicle} setShowPanel={setShowPanel} showNextPanel={showNextPanel} />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2.5 text-[11px] font-bold leading-4 text-emerald-800"><ShieldCheck size={15} className="shrink-0" /> Driver details and trip OTP appear after a driver accepts your request.</div>
    </div>
  );
}

function Vehicle({ vehicle, selectedVehicle, fare, currency, pricing, breakdown, setShowPanel, showNextPanel }) {
  return (
    <button
      onClick={() => { selectedVehicle(vehicle.type); setShowPanel(false); showNextPanel(true); }}
      className="group relative flex w-full items-center gap-3 overflow-hidden rounded-[26px] border border-slate-200 bg-white p-3 text-left shadow-[0_10px_30px_rgba(15,23,42,.055)] transition hover:border-slate-300 active:scale-[0.99]"
    >
      <div className="absolute right-0 top-0 rounded-bl-2xl bg-slate-950 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.1em] text-white">{vehicle.badge}</div>
      <div className="flex h-[70px] w-[78px] shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-slate-50 to-slate-100 min-[390px]:h-[78px] min-[390px]:w-[96px] min-[390px]:rounded-[22px]">
        <img src={`/${vehicle.image}`} className="max-h-14 max-w-[72px] object-contain mix-blend-multiply transition group-hover:scale-105 min-[390px]:max-h-16 min-[390px]:max-w-[88px]" alt={vehicle.name} />
      </div>
      <div className="min-w-0 flex-1 pr-1">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0"><h3 className="truncate text-[15px] font-black text-slate-950">{vehicle.name}</h3><p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">{vehicle.description}</p></div>
          <p className="shrink-0 text-[15px] font-black text-slate-950">{formatMoney(fare?.[vehicle.type] || 0, currency)}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-black text-slate-500">
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1"><UsersRound size={11} /> {vehicle.seats}</span>
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1"><Clock3 size={11} /> {vehicle.eta}</span>
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700"><Sparkles size={11} /> Cash</span>
        </div>
        {pricing ? (
          <p className="mt-2 text-[10px] font-bold leading-4 text-slate-400">
            {formatMoney(pricing.base || 0, currency)} base + {formatMoney(pricing.perKm || 0, currency)}/km + {formatMoney(pricing.perMinute || 0, currency)}/min
            {Number(pricing.minimum || 0) > 0 ? ` • minimum ${formatMoney(pricing.minimum, currency)}` : ""}
          </p>
        ) : null}
        {breakdown ? (
          <p className="mt-1 text-[10px] font-black text-emerald-700">
            Trip estimate: {breakdown.kilometres} km • {breakdown.minutes} min • calculated fare {formatMoney(breakdown.total || fare?.[vehicle.type] || 0, currency)}
          </p>
        ) : null}
      </div>
    </button>
  );
}

export default SelectVehicle;
