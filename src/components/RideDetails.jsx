import { formatMoney } from "../utils/formatMoney";
import { useState } from "react";
import { CreditCard, MapPinMinus, MapPinPlus, PhoneCall, SendHorizontal, ShieldCheck, Star } from "lucide-react";
import Button from "./Button";

function shortAddress(value) {
  return (value || "").split(",")[0] || value || "Not selected";
}

function RideDetails({ pickupLocation, destinationLocation, selectedVehicle, fare, currency = "USD", showPanel, setShowPanel, showPreviousPanel, createRide, cancelRide, loading, rideCreated, confirmedRideData }) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState({ code: "", text: "" });
  const reasons = [
    { code: "DRIVER_TOO_LONG", text: "Driver taking too long" },
    { code: "WRONG_PICKUP", text: "Wrong pickup or drop-off" },
    { code: "CHANGE_MIND", text: "I no longer need this ride" },
    { code: "PRICE_HIGH", text: "Fare is too high" },
    { code: "BOOKED_BY_MISTAKE", text: "Booked by mistake" },
    { code: "OTHER", text: "Other" },
  ];

  const driverName = `${confirmedRideData?.captain?.fullname?.firstname || ""} ${confirmedRideData?.captain?.fullname?.lastname || ""}`.trim();
  const plate = confirmedRideData?.captain?.activeVehicle?.plateNumber || confirmedRideData?.captain?.vehicle?.number;
  const vehicleText = confirmedRideData?.captain?.activeVehicle
    ? `${confirmedRideData.captain.activeVehicle.color || ""} ${confirmedRideData.captain.activeVehicle.make || ""} ${confirmedRideData.captain.activeVehicle.model || ""}`.trim()
    : `${confirmedRideData?.captain?.vehicle?.color || ""} ${confirmedRideData?.captain?.vehicle?.type || ""}`.trim();

  return (
    <>
      <div className={`${showPanel ? "translate-y-0" : "translate-y-full"} floating-sheet z-40 sheet-scroll`}>
        {rideCreated && !confirmedRideData && (
          <div className="mb-4 rounded-3xl bg-slate-950 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Searching</p>
                <h2 className="mt-1 text-xl font-black">Finding nearby drivers</h2>
              </div>
              <div className="h-12 w-12 animate-pulse rounded-full bg-blue-500/80" />
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full w-2/3 animate-pulse rounded-full bg-white" /></div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="mini-label">Trip summary</p>
            <h2 className="text-[clamp(1.35rem,6vw,1.6rem)] font-black tracking-tight text-slate-950">Confirm ride</h2>
          </div>
          <div className="flex h-14 w-[4.5rem] shrink-0 items-center justify-center rounded-3xl bg-slate-100 min-[380px]:h-16 min-[380px]:w-20">
            <img src={selectedVehicle === "car" ? "/car.png" : `/${selectedVehicle}.webp`} className="max-h-12 max-w-16 object-contain mix-blend-multiply min-[380px]:max-h-14 min-[380px]:max-w-20" alt="vehicle" />
          </div>
        </div>

        {confirmedRideData?._id && (
          <div className="mb-4 rounded-[28px] border border-blue-100 bg-blue-50 p-3 min-[380px]:p-4">
            <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
                  {(driverName || "D").slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-black text-slate-950">{driverName || "Driver assigned"}</h3>
                  <p className="text-xs font-bold text-slate-500">{vehicleText || "Vehicle details pending"}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-600"><Star size={13} fill="currentColor" /> {confirmedRideData?.captain?.rating?.avg || 0}/5</div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 p-3 text-left min-[380px]:block min-[380px]:bg-transparent min-[380px]:p-0 min-[380px]:text-right">
                <p className="text-xs font-bold text-slate-500">Plate</p>
                <p className="font-black text-slate-950">{plate || "-"}</p>
                <span className="mt-2 inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">OTP {confirmedRideData?.otp}</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <Button type="link" path={`/user/chat/${confirmedRideData?._id}`} title="Message" icon={<SendHorizontal size={18} />} variant="secondary" classes="min-h-[46px] py-3 text-sm" />
              <a className="flex h-[46px] w-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm" href={"tel:" + confirmedRideData?.captain?.phone}><PhoneCall size={18} /></a>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <InfoRow icon={<MapPinMinus size={18} />} label="Pickup" title={shortAddress(pickupLocation)} subtitle={pickupLocation} />
          <InfoRow icon={<MapPinPlus size={18} />} label="Drop-off" title={shortAddress(destinationLocation)} subtitle={destinationLocation} />
          <InfoRow icon={<CreditCard size={18} />} label="Fare" title={formatMoney(fare?.[selectedVehicle] || 0, currency)} subtitle="Cash payment for MVP" />
        </div>

        <div className="mt-5">
          {rideCreated || confirmedRideData ? (
            <Button title="Cancel ride" loading={loading} variant="danger" fun={() => setShowCancelModal(true)} />
          ) : (
            <Button title="Confirm ride" fun={createRide} loading={loading} />
          )}
        </div>
      </div>

      {showCancelModal && (
        <div className="modal-backdrop">
          <div className="modal-sheet">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="mini-label">Cancellation</p>
                <h2 className="text-2xl font-black text-slate-950">Why cancel?</h2>
              </div>
              <ShieldCheck className="text-slate-400" />
            </div>
            <div className="grid gap-2">
              {reasons.map((r) => (
                <button key={r.code} className={`rounded-2xl border p-4 text-left text-sm font-bold transition ${cancelReason.code === r.code ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"}`} onClick={() => setCancelReason(r)}>
                  {r.text}
                </button>
              ))}
              {cancelReason.code === "OTHER" && (
                <input className="input-box" placeholder="Write a short reason" value={cancelReason.text === "Other" ? "" : cancelReason.text} onChange={(e) => setCancelReason({ code: "OTHER", text: e.target.value })} />
              )}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="secondary-btn w-full" onClick={() => setShowCancelModal(false)}>Back</button>
              <button className="danger-btn w-full" disabled={!cancelReason.code || (cancelReason.code === "OTHER" && !cancelReason.text)} onClick={() => { cancelRide(cancelReason.code, cancelReason.text); setShowCancelModal(false); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoRow({ icon, label, title, subtitle }) {
  return (
    <div className="soft-card flex items-start gap-3 p-3 shadow-none min-[380px]:p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-950">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <h3 className="truncate text-sm font-black text-slate-950 min-[380px]:text-base">{title}</h3>
        <p className="truncate-2 text-xs font-semibold leading-4 text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default RideDetails;
