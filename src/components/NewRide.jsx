import { formatMoney } from "../utils/formatMoney";
import { useEffect, useMemo, useState } from "react";
import { Banknote, Clock3, CreditCard, MapPinCheck, Navigation, PhoneCall, SendHorizontal, ShieldCheck, Star, UserRound, X } from "lucide-react";
import Button from "./Button";
import RideStatusTimeline from "./RideStatusTimeline";

function short(value) {
  return (value || "").split(",")[0] || "Location";
}

function NewRide({ rideData, otp, setOtp, showBtn, showPanel, setShowPanel, showPreviousPanel, loading, acceptRide, rejectRide, markArriving, markArrived, cancelRide, callPassenger, endRide, verifyOTP, error }) {
  const [showCashConfirmation, setShowCashConfirmation] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState({ code: "", text: "" });
  const [waitSeconds, setWaitSeconds] = useState(0);

  const ignoreRide = () => {
    if (rejectRide) return rejectRide();
    setShowPanel(false);
    showPreviousPanel(true);
  };

  const passengerName = `${rideData?.user?.fullname?.firstname || ""} ${rideData?.user?.fullname?.lastname || ""}`.trim() || "Passenger";
  const initials = `${rideData?.user?.fullname?.firstname?.[0] || "P"}${rideData?.user?.fullname?.lastname?.[0] || ""}`;
  const kilometres = (Number(rideData?.distance || 0) / 1000).toFixed(1);
  const paymentMethod = rideData?.paymentMethod || "cash";
  const PaymentIcon = paymentMethod === "card" ? CreditCard : Banknote;
  const status = rideData?.status || (showBtn === "accept" ? "pending" : showBtn === "arriving" ? "accepted" : showBtn === "arrived" ? "arriving" : showBtn === "otp" ? "arrived" : "ongoing");

  useEffect(() => {
    if (status !== "arrived" || !rideData?.arrivedAt) { setWaitSeconds(0); return undefined; }
    const tick = () => setWaitSeconds(Math.max(0, Math.floor((Date.now() - new Date(rideData.arrivedAt).getTime()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [status, rideData?.arrivedAt]);

  const waitText = useMemo(() => `${Math.floor(waitSeconds / 60)}:${String(waitSeconds % 60).padStart(2, "0")}`, [waitSeconds]);

  const requestEndRide = () => {
    if (paymentMethod === "cash") return setShowCashConfirmation(true);
    endRide?.(false);
  };

  const confirmCashAndEndRide = async () => {
    setShowCashConfirmation(false);
    await endRide?.(true);
  };

  const cancellationReasons = [
    { code: "PASSENGER_NO_SHOW", text: "Passenger did not show up" },
    { code: "PASSENGER_NOT_RESPONDING", text: "Passenger is not responding" },
    { code: "WRONG_LOCATION", text: "Pickup location is incorrect" },
    { code: "UNSAFE", text: "Unsafe situation" },
    { code: "VEHICLE_ISSUE", text: "Vehicle issue" },
    { code: "OTHER", text: "Other" },
  ];

  const stepLabel = showBtn === "accept" ? "New request" : showBtn === "arriving" ? "Ride accepted" : showBtn === "arrived" ? "Heading to pickup" : showBtn === "otp" ? "At pickup" : "Trip in progress";

  return (
    <>
      <div className={`${showPanel ? "translate-y-0" : "translate-y-full"} floating-sheet floating-sheet-nav z-40 sheet-scroll sheet-scroll-nav`}>
        <div className="sheet-handle mb-3" />
        <RideStatusTimeline status={status} />

        <div className="mt-4 mb-4 overflow-hidden rounded-[28px] bg-[#07111f] p-4 text-white shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-white text-base font-black text-slate-950">{initials}</div>
              <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-200">{stepLabel}</p><h2 className="truncate text-lg font-black">{passengerName}</h2><p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-slate-300"><Star size={11} /> Passenger rating {rideData?.user?.rating?.avg || 0}</p></div>
            </div>
            {showBtn === "accept" ? <button onClick={ignoreRide} className="icon-btn-dark h-9 w-9 rounded-xl" aria-label="Reject ride"><X size={18} /></button> : <span className="hero-badge"><Navigation size={12} /> {kilometres} km</span>}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Fare</p><p className="mt-1 text-xl font-black">{formatMoney(rideData?.fare, rideData?.currency || "NGN")}</p></div>
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Payment</p><p className="mt-1 flex items-center gap-1.5 text-sm font-black capitalize"><PaymentIcon size={15} /> {paymentMethod}</p><p className="mt-1 text-[10px] font-semibold text-slate-300">{paymentMethod === "cash" ? "Collect at trip end" : "Coming soon"}</p></div>
          </div>
        </div>

        {showBtn !== "accept" && <div className="mb-4 grid grid-cols-[1fr_auto] gap-2"><Button type="link" path={`/captain/chat/${rideData?._id}`} title="Message passenger" icon={<SendHorizontal size={17} />} variant="secondary" classes="min-h-[48px] py-3 text-xs" /><button type="button" className="icon-btn h-[48px] w-[52px]" onClick={callPassenger}><PhoneCall size={18} /></button></div>}

        <div className="route-card"><div className="route-line" /><TripRow label="Pickup" title={short(rideData.pickup)} subtitle={rideData.pickup} /><div className="mt-2" /><TripRow label="Drop-off" title={short(rideData.destination)} subtitle={rideData.destination} destination /></div>

        {showBtn === "otp" && <div className="mt-3 flex items-start gap-3 rounded-[22px] border border-amber-100 bg-amber-50 p-3.5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white"><Clock3 size={18} /></div><div><p className="text-xs font-black text-amber-950">Passenger pickup • waiting {waitText}</p><p className="mt-0.5 text-[11px] font-semibold leading-4 text-amber-800">Ask for the trip PIN only when the passenger is in the vehicle and you are ready to start.</p></div></div>}

        {paymentMethod === "cash" && showBtn === "end-ride" && <div className="mt-3 flex items-start gap-3 rounded-[22px] border border-emerald-100 bg-emerald-50 p-3.5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white"><Banknote size={18} /></div><div><p className="text-xs font-black text-emerald-950">Cash collection required</p><p className="mt-0.5 text-[11px] font-semibold leading-4 text-emerald-800">Collect {formatMoney(rideData?.fare, rideData?.currency || "NGN")} before completing this trip.</p></div></div>}

        <div className="mt-5 space-y-3">
          {showBtn === "accept" ? <div className="grid grid-cols-2 gap-3"><Button title="Reject" loading={loading} fun={ignoreRide} variant="secondary" /><Button title="Accept ride" fun={acceptRide} loading={loading} classes="bg-emerald-600" /></div>
          : showBtn === "arriving" ? <Button title="Start heading to pickup" icon={<Navigation size={17} />} loading={loading} fun={markArriving} classes="bg-emerald-600" />
          : showBtn === "arrived" ? <Button title="I've arrived at pickup" icon={<MapPinCheck size={17} />} loading={loading} fun={markArrived} classes="bg-emerald-600" />
          : showBtn === "otp" ? <><div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3"><div className="mb-2 flex items-center gap-2"><UserRound size={16} className="text-slate-500" /><p className="text-xs font-black text-slate-800">Enter passenger's 6-digit trip PIN</p></div><input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" className="input-box bg-white text-center text-xl tracking-[0.35em]" /></div>{error && <p className="rounded-2xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">{error}</p>}<Button title="Verify PIN & start trip" loading={loading} fun={verifyOTP} disabled={otp.length !== 6} classes="bg-emerald-600" /></>
          : <Button title={paymentMethod === "cash" ? "Complete trip & collect cash" : "Complete trip"} fun={requestEndRide} loading={loading} classes="bg-emerald-600" />}

          {showBtn !== "accept" && showBtn !== "end-ride" && <button type="button" className="w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-black text-red-600" onClick={() => setShowCancelModal(true)}>Cancel this ride</button>}
        </div>
      </div>

      {showCashConfirmation && <div className="modal-backdrop"><div className="modal-sheet"><div className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Banknote size={22} /></div><div><p className="mini-label">Cash collection</p><h2 className="text-xl font-black text-slate-950">Did you receive the full fare?</h2><p className="mt-1 text-sm font-semibold leading-5 text-slate-500">Only mark complete after the passenger has paid you.</p></div></div><div className="mt-5 overflow-hidden rounded-[28px] bg-[#07111f] p-4 text-white"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">Amount to collect</p><p className="mt-1 text-3xl font-black tracking-tight">{formatMoney(rideData?.fare, rideData?.currency || "NGN")}</p><p className="mt-3 flex items-center gap-2 text-[11px] font-bold text-slate-300"><ShieldCheck size={14} className="text-emerald-300" /> Cash confirmation and platform commission are recorded.</p></div><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" className="secondary-btn" onClick={() => setShowCashConfirmation(false)}>Not yet</button><button type="button" className="primary-btn bg-emerald-600" onClick={confirmCashAndEndRide} disabled={loading}>Cash received</button></div></div></div>}

      {showCancelModal && <div className="modal-backdrop"><div className="modal-sheet"><p className="mini-label">Driver cancellation</p><h2 className="text-2xl font-black text-slate-950">Why can't you continue?</h2><p className="mt-1 text-xs font-semibold text-slate-500">Choose the accurate reason. Frequent cancellations affect performance.</p><div className="mt-4 grid gap-2">{cancellationReasons.map((reason) => <button key={reason.code} type="button" onClick={() => setCancelReason(reason)} className={`rounded-2xl border p-3.5 text-left text-sm font-bold ${cancelReason.code === reason.code ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"}`}>{reason.text}</button>)}</div><div className="mt-4 grid grid-cols-2 gap-3"><button className="secondary-btn" onClick={() => setShowCancelModal(false)}>Keep ride</button><button className="danger-btn" disabled={!cancelReason.code || loading} onClick={async () => { await cancelRide?.(cancelReason.code, cancelReason.text); setShowCancelModal(false); }}>Cancel ride</button></div></div></div>}
    </>
  );
}

function TripRow({ label, title, subtitle, destination = false }) {
  return <div className="relative z-10 flex items-center gap-3"><span className={`route-dot ${destination ? "route-dot-destination" : ""}`} /><div className="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2.5 shadow-sm"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p><h3 className="truncate text-sm font-black text-slate-950">{title}</h3><p className="truncate text-[10px] font-semibold text-slate-500">{subtitle}</p></div></div>;
}

export default NewRide;
