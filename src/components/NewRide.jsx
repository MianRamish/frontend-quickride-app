import { formatMoney } from "../utils/formatMoney";
import { CreditCard, MapPinMinus, MapPinPlus, PhoneCall, SendHorizontal, X } from "lucide-react";
import Button from "./Button";

function short(value) {
  return (value || "").split(",")[0] || "Location";
}

function NewRide({
  rideData,
  otp,
  setOtp,
  showBtn,
  showPanel,
  setShowPanel,
  showPreviousPanel,
  loading,
  acceptRide,
  rejectRide,
  endRide,
  verifyOTP,
  error,
}) {
  const ignoreRide = () => {
    if (rejectRide) return rejectRide();
    setShowPanel(false);
    showPreviousPanel(true);
  };

  const passengerName = `${rideData?.user?.fullname?.firstname || ""} ${rideData?.user?.fullname?.lastname || ""}`.trim() || "Passenger";
  const initials = `${rideData?.user?.fullname?.firstname?.[0] || "P"}${rideData?.user?.fullname?.lastname?.[0] || ""}`;
  const miles = (Number(rideData?.distance || 0) / 1609.344).toFixed(1);

  return (
    <div className={`${showPanel ? "translate-y-0" : "translate-y-full"} floating-sheet z-40 sheet-scroll`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500 text-lg font-black text-white shadow-lg shadow-emerald-500/20">
            {initials}
          </div>
          <div>
            <p className="mini-label">New request</p>
            <h2 className="truncate text-lg font-black leading-6 text-slate-950 min-[380px]:text-xl">{passengerName}</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">{rideData?.user?.phone || rideData?.user?.email}</p>
          </div>
        </div>
        {showBtn === "accept" ? (
          <button onClick={ignoreRide} className="rounded-full bg-slate-100 p-2 text-slate-500" aria-label="Ignore ride"><X size={20} /></button>
        ) : (
          <div className="text-right">
            <p className="mini-label">Trip</p>
            <p className="text-lg font-black text-slate-950">{miles} mi</p>
          </div>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 min-[380px]:gap-3">
        <div className="metric-card">
          <p className="mini-label">Fare</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">{formatMoney(rideData?.fare, rideData?.currency || "USD")}</h3>
        </div>
        <div className="metric-card">
          <p className="mini-label">Distance</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">{miles}</h3>
          <p className="text-xs font-bold text-slate-400">miles</p>
        </div>
      </div>

      {showBtn !== "accept" && (
        <div className="mb-4 grid grid-cols-[1fr_auto] gap-2">
          <Button type="link" path={`/captain/chat/${rideData?._id}`} title="Message" icon={<SendHorizontal strokeWidth={1.8} size={18} />} variant="secondary" classes="min-h-[46px] py-3 text-sm" />
          <a className="flex h-[46px] w-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm" href={"tel:" + rideData?.user?.phone}><PhoneCall size={18} /></a>
        </div>
      )}

      <div className="space-y-3">
        <TripRow icon={<MapPinMinus size={18} />} label="Pickup" title={short(rideData.pickup)} subtitle={rideData.pickup} />
        <TripRow icon={<MapPinPlus size={18} />} label="Drop-off" title={short(rideData.destination)} subtitle={rideData.destination} />
        <TripRow icon={<CreditCard size={18} />} label="Payment" title={formatMoney(rideData.fare, rideData?.currency || "USD")} subtitle="Cash payment for MVP" />
      </div>

      <div className="mt-5">
        {showBtn === "accept" ? (
          <div className="grid grid-cols-2 gap-3">
            <Button title="Reject" loading={loading} fun={ignoreRide} variant="secondary" />
            <Button title="Accept" fun={acceptRide} loading={loading} />
          </div>
        ) : showBtn === "otp" ? (
          <>
            <input type="number" minLength={6} maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter passenger OTP" className="input-box mb-3 text-center tracking-[0.3em]" />
            {error && <p className="mb-3 rounded-2xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">{error}</p>}
            <Button title="Verify OTP" loading={loading} fun={verifyOTP} />
          </>
        ) : (
          <Button title="End ride" fun={endRide} loading={loading} classes="bg-emerald-600" />
        )}
      </div>
    </div>
  );
}

function TripRow({ icon, label, title, subtitle }) {
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

export default NewRide;
