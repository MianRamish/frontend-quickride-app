import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Banknote, CarFront, ChevronDown, Clock3, MapPin, PhoneCall, SendHorizontal, Share2, ShieldCheck, Sparkles, Star, Tag } from "lucide-react";
import { formatMoney } from "../utils/formatMoney";
import Button from "./Button";
import PaymentMethodSelector from "./PaymentMethodSelector";
import RideStatusTimeline from "./RideStatusTimeline";

function shortAddress(value) {
  return (value || "").split(",")[0] || value || "Not selected";
}

function RideDetails({ pickupLocation, destinationLocation, selectedVehicle, fare, fareBreakdown = null, farePricing = null, currency = "NGN", routeInfo = {}, showPanel, setShowPanel, showPreviousPanel, createRide, cancelRide, loading, rideCreated, confirmedRideData, paymentMethod = "cash", setPaymentMethod, paymentMethods = [], promoCode = "", setPromoCode }) {
  const token = localStorage.getItem("token");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState({ code: "", text: "" });
  const [promoInput, setPromoInput] = useState(promoCode || "");
  const [promoResult, setPromoResult] = useState(null);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [searchSeconds, setSearchSeconds] = useState(0);

  const reasons = [
    { code: "DRIVER_LATE", text: "Driver is taking too long" },
    { code: "DRIVER_ASKED", text: "Driver asked me to cancel" },
    { code: "WRONG_PICKUP", text: "Pickup location is wrong" },
    { code: "CHANGE_OF_PLANS", text: "My plans changed" },
    { code: "FOUND_OTHER_RIDE", text: "I found another ride" },
    { code: "OTHER", text: "Other" },
  ];

  const driverName = `${confirmedRideData?.captain?.fullname?.firstname || ""} ${confirmedRideData?.captain?.fullname?.lastname || ""}`.trim();
  const plate = confirmedRideData?.captain?.activeVehicle?.plateNumber || confirmedRideData?.captain?.vehicle?.number;
  const vehicleText = confirmedRideData?.captain?.activeVehicle
    ? `${confirmedRideData.captain.activeVehicle.color || ""} ${confirmedRideData.captain.activeVehicle.make || ""} ${confirmedRideData.captain.activeVehicle.model || ""}`.trim()
    : `${confirmedRideData?.captain?.vehicle?.color || ""} ${confirmedRideData?.captain?.vehicle?.type || ""}`.trim();
  const baseFare = Number(fare?.[selectedVehicle] || 0);
  const displayFare = confirmedRideData?.fare ?? promoResult?.finalFare ?? baseFare;
  const rideFare = formatMoney(displayFare, currency);
  const selectedBreakdown = fareBreakdown?.[selectedVehicle] || null;
  const selectedPricing = farePricing?.[selectedVehicle] || null;
  const breakdownSubtotal = selectedBreakdown
    ? Number(selectedBreakdown.base || 0) + Number(selectedBreakdown.distanceCharge || 0) + Number(selectedBreakdown.timeCharge || 0)
    : 0;
  const minimumAdjustment = selectedBreakdown
    ? Math.max(0, Number(selectedBreakdown.total || 0) - breakdownSubtotal)
    : 0;
  const status = confirmedRideData?.status || (rideCreated ? "pending" : "pending");

  useEffect(() => {
    if (!rideCreated || confirmedRideData) {
      setSearchSeconds(0);
      return undefined;
    }
    const startedAt = Date.now();
    const tick = () => setSearchSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rideCreated, confirmedRideData]);

  useEffect(() => {
    if (status !== "arrived" || !confirmedRideData?.arrivedAt) {
      setWaitingSeconds(0);
      return undefined;
    }
    const tick = () => setWaitingSeconds(Math.max(0, Math.floor((Date.now() - new Date(confirmedRideData.arrivedAt).getTime()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, confirmedRideData?.arrivedAt]);

  const waitingText = useMemo(() => {
    const mins = Math.floor(waitingSeconds / 60);
    const secs = waitingSeconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }, [waitingSeconds]);

  const searchTimeText = useMemo(() => {
    const mins = Math.floor(searchSeconds / 60);
    const secs = searchSeconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }, [searchSeconds]);

  const searchStatusText = searchSeconds < 20
    ? "Contacting nearby available drivers"
    : searchSeconds < 45
      ? "Your request is still being offered to nearby drivers"
      : "Checking additional available drivers for your trip";

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoResult(null);
      setPromoMessage("");
      setPromoCode?.("");
      return;
    }
    try {
      setPromoLoading(true);
      setPromoMessage("");
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/ride/promo/validate`, { promoCode: code, fare: baseFare }, { headers: { token } });
      setPromoResult(response.data);
      setPromoCode?.(response.data.code || code);
      setPromoMessage(`Promo applied • you save ${formatMoney(response.data.discount || 0, currency)}`);
    } catch (error) {
      setPromoResult(null);
      setPromoCode?.("");
      setPromoMessage(error?.response?.data?.message || "Promo code could not be applied.");
    } finally {
      setPromoLoading(false);
    }
  };

  const callDriver = async () => {
    if (!confirmedRideData?._id) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/ride/${confirmedRideData._id}/contact`, { headers: { token } });
      const phone = response.data?.phone;
      if (phone) window.location.href = `tel:${phone}`;
    } catch (error) {
      alert(error?.response?.data?.message || "Calling is only available during an active trip.");
    }
  };

  const shareTrip = async () => {
    if (!confirmedRideData?._id) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/ride/${confirmedRideData._id}/share`, { headers: { token } });
      const shareUrl = response.data?.url;
      if (!shareUrl) return;
      if (navigator.share) await navigator.share({ title: "QuickRide live trip", text: "Follow my QuickRide trip", url: shareUrl });
      else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Trip link copied.");
      }
    } catch (error) {
      alert(error?.response?.data?.message || "Unable to share this trip.");
    }
  };

  return (
    <>
      <div className={`${showPanel ? "translate-y-0" : "translate-y-full"} floating-sheet floating-sheet-nav z-40 sheet-scroll sheet-scroll-nav`}>
        <div className="sheet-handle mb-3" />

        {rideCreated && !confirmedRideData ? (
          <div className="absolute inset-0 z-50 overflow-y-auto overscroll-contain bg-[#f7f9fc] px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-5">
            <div className="mx-auto flex min-h-full max-w-xl flex-col">
              <div className="mx-auto h-1 w-12 rounded-full bg-slate-200" />

              <div className="flex flex-1 flex-col items-center justify-center py-7 text-center">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-emerald-200 bg-emerald-50" />
                  <div className="absolute inset-3 animate-ping rounded-full border border-emerald-300/70" />
                  <div className="absolute inset-6 animate-pulse rounded-full bg-emerald-600/10" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-950 text-white shadow-xl">
                    <CarFront size={28} />
                  </div>
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Driver search active</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-slate-950">Finding your driver</h2>
                <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-500">{searchStatusText}.</p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm">
                  <Clock3 size={14} className="text-emerald-600" /> Searching {searchTimeText}
                </div>

                <div className="mt-6 w-full rounded-[28px] border border-slate-200 bg-white p-4 text-left shadow-[0_16px_40px_rgba(15,23,42,.06)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="mini-label">Your request</p>
                      <h3 className="mt-1 text-base font-black text-slate-950">{selectedVehicle === "bike" ? "Bike ride" : "Car ride"} • {rideFare}</h3>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700">Searching</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><MapPin size={15} /></span>
                      <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Pickup</p><p className="mt-0.5 text-xs font-bold leading-5 text-slate-800">{pickupLocation}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><MapPin size={15} /></span>
                      <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Drop-off</p><p className="mt-0.5 text-xs font-bold leading-5 text-slate-800">{destinationLocation}</p></div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-[10px] font-semibold leading-4 text-slate-500">
                    <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                    Keep QuickRide open while we match your request. You’ll automatically see the driver and live vehicle location when one accepts.
                  </div>
                </div>
              </div>

              <button type="button" className="w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-black text-red-600" onClick={() => cancelRide?.("CHANGE_OF_PLANS", "Passenger cancelled while searching for a driver")} disabled={loading}>
                Cancel driver search
              </button>
            </div>
          </div>
        ) : null}

        {!rideCreated && !confirmedRideData && (
          <div className="flow-steps mb-4">
            <div className="flow-step flow-step-done">1 Route</div>
            <div className="flow-step flow-step-done">2 Ride</div>
            <div className="flow-step flow-step-active">3 Confirm</div>
          </div>
        )}

        {(rideCreated || confirmedRideData) && <div className="mb-4"><RideStatusTimeline status={status} /></div>}

        {rideCreated && !confirmedRideData && (
          <div className="relative mb-4 overflow-hidden rounded-[28px] bg-[#07111f] p-4 text-white shadow-xl">
            <div className="absolute -right-12 -top-16 h-36 w-36 rounded-full bg-emerald-400/20 blur-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">Smart matching</p><h2 className="mt-1 text-xl font-black tracking-tight">Finding the nearest driver</h2><p className="mt-1 text-xs font-semibold text-slate-300">Requests are offered to nearby online drivers one at a time.</p></div>
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10"><div className="absolute inset-1 rounded-full border-2 border-emerald-300/50 pulse-soft" /><div className="h-3 w-3 rounded-full bg-emerald-300" /></div>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-start justify-between gap-3">
          <div><p className="mini-label">Trip summary</p><h2 className="text-2xl font-black tracking-[-0.035em] text-slate-950">{status === "arrived" ? "Your driver has arrived" : status === "ongoing" ? "Trip in progress" : confirmedRideData ? "Driver connected" : rideCreated ? "Ride requested" : "Confirm your ride"}</h2><p className="mt-1 text-xs font-semibold text-slate-500">Everything important stays on one screen.</p></div>
          {!rideCreated && !confirmedRideData ? <button onClick={() => { setShowPanel(false); showPreviousPanel(true); }} className="icon-btn" aria-label="Back to vehicles"><ChevronDown size={20} /></button> : <div className="flex h-14 w-[76px] shrink-0 items-center justify-center rounded-[22px] bg-slate-100"><img src={selectedVehicle === "car" ? "/car.png" : `/${selectedVehicle}.webp`} className="max-h-12 max-w-16 object-contain mix-blend-multiply" alt="vehicle" /></div>}
        </div>

        {confirmedRideData?._id && (
          <div className="mb-4 overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-[0_12px_30px_rgba(16,185,129,.10)]">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-slate-950 text-lg font-black text-white">{(driverName || "D").slice(0, 1)}</div>
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="truncate font-black text-slate-950">{driverName || "Driver assigned"}</h3><span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-700 shadow-sm"><Star size={11} fill="currentColor" /> {confirmedRideData?.captain?.rating?.avg || 0}</span></div><p className="mt-0.5 truncate text-xs font-bold text-slate-500">{vehicleText || "Vehicle details pending"}</p><p className="mt-1 text-[11px] font-black uppercase tracking-wide text-emerald-700">Plate {plate || "-"}</p></div>
            </div>

            {(status === "arrived" || status === "accepted" || status === "arriving") && <div className="mt-4 grid grid-cols-1 gap-2 min-[390px]:grid-cols-[1fr_auto]">
              <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white"><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Trip PIN • share only when ready to leave</p><p className="mt-0.5 text-2xl font-black tracking-[.18em]">{confirmedRideData?.otp || "••••••"}</p>{status === "arrived" && <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-200"><Clock3 size={11} /> Driver waiting {waitingText}</p>}</div>
              <div className="grid grid-cols-3 gap-2"><Button type="link" path={`/user/chat/${confirmedRideData?._id}`} title="Chat" icon={<SendHorizontal size={17} />} variant="secondary" classes="min-h-[52px] px-2 py-3 text-xs" /><button type="button" className="icon-btn h-[52px] w-full" onClick={callDriver} aria-label="Call driver"><PhoneCall size={18} /></button><button type="button" className="icon-btn h-[52px] w-full" onClick={shareTrip} aria-label="Share trip"><Share2 size={18} /></button></div>
            </div>}
          </div>
        )}

        <div className="route-card"><div className="route-line" /><InfoRow label="Pickup" title={shortAddress(pickupLocation)} subtitle={pickupLocation} /><div className="mt-2" /><InfoRow label="Drop-off" title={shortAddress(destinationLocation)} subtitle={destinationLocation} destination /></div>

        <div className="mt-3 flex items-center justify-between rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,.05)]">
          <div><p className="mini-label">{routeInfo?.approximate ? "Approximate fare" : promoResult?.discount ? "Discounted fare" : "Estimated fare"}</p><h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{rideFare}</h3>{promoResult?.discount ? <p className="mt-1 text-[11px] font-black text-emerald-700">Saved {formatMoney(promoResult.discount, currency)} with {promoResult.code}</p> : <p className="mt-1 text-[11px] font-semibold text-slate-500">{routeInfo?.approximate ? "Live route pricing will be checked again before booking." : "Cash is paid directly to your driver."}</p>}{(routeInfo?.distanceText || routeInfo?.durationText) ? <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400">{[routeInfo.distanceText, routeInfo.durationText].filter(Boolean).join(" • ")}</p> : null}</div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] ${routeInfo?.approximate ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{routeInfo?.approximate ? <AlertTriangle size={20} /> : <Banknote size={20} />}</div>
        </div>
        {!rideCreated && !confirmedRideData && selectedBreakdown ? (
          <div className="mt-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mini-label">Fare breakdown</p>
                <h3 className="mt-1 text-base font-black text-slate-950">How your estimate is calculated</h3>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-slate-500 shadow-sm">{selectedVehicle}</span>
            </div>
            <div className="mt-3 space-y-2 text-xs font-bold">
              <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Base fare</span><span className="text-slate-950">{formatMoney(selectedBreakdown.base || 0, currency)}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Distance • {selectedBreakdown.kilometres || 0} km</span><span className="text-slate-950">{formatMoney(selectedBreakdown.distanceCharge || 0, currency)}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Time • {selectedBreakdown.minutes || 0} min</span><span className="text-slate-950">{formatMoney(selectedBreakdown.timeCharge || 0, currency)}</span></div>
              {minimumAdjustment > 0 ? <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Minimum fare adjustment</span><span className="text-slate-950">{formatMoney(minimumAdjustment, currency)}</span></div> : null}
              <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2"><span className="font-black text-slate-950">Estimated total</span><span className="text-base font-black text-slate-950">{formatMoney(selectedBreakdown.total || baseFare, currency)}</span></div>
            </div>
            {selectedPricing ? (
              <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-[10px] font-bold leading-4 text-slate-500">
                Rate: {formatMoney(selectedPricing.base || 0, currency)} base + {formatMoney(selectedPricing.perKm || 0, currency)}/km + {formatMoney(selectedPricing.perMinute || 0, currency)}/min
                {Number(selectedPricing.minimum || 0) > 0 ? " • minimum " + formatMoney(selectedPricing.minimum, currency) : ""}
              </p>
            ) : null}
          </div>
        ) : null}

        {routeInfo?.approximate && !rideCreated && !confirmedRideData ? (
          <div className="mt-3 rounded-[22px] border border-amber-200 bg-amber-50 p-3.5 text-[11px] font-bold leading-4 text-amber-900">
            QuickRide will request a fresh live route when you confirm. The ride will only be created if live route pricing is available.
          </div>
        ) : null}

        {!rideCreated && !confirmedRideData && <>
          <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-3.5"><div className="flex items-center gap-2"><Tag size={15} className="text-slate-500" /><p className="text-xs font-black text-slate-800">Promo code</p></div><div className="mt-2 flex gap-2"><input className="input-box min-w-0 flex-1 bg-white uppercase" placeholder="e.g. WELCOME10" value={promoInput} onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); if (!e.target.value) { setPromoResult(null); setPromoCode?.(""); } }} /><button type="button" onClick={applyPromo} disabled={promoLoading || !promoInput.trim()} className="rounded-2xl bg-slate-950 px-4 text-xs font-black text-white disabled:opacity-40">{promoLoading ? "Checking" : "Apply"}</button></div>{promoMessage && <p className={`mt-2 text-[11px] font-bold ${promoResult ? "text-emerald-700" : "text-red-600"}`}>{promoMessage}</p>}</div>
          <div className="mt-4"><PaymentMethodSelector methods={paymentMethods} selected={paymentMethod} onChange={setPaymentMethod} /></div>
        </>}

        {(rideCreated || confirmedRideData) && <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-emerald-100 bg-emerald-50 p-3.5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white"><Banknote size={18} /></div><div><p className="text-xs font-black text-emerald-950">Cash payment</p><p className="mt-0.5 text-[11px] font-semibold leading-4 text-emerald-800">Pay {rideFare} directly to your driver at trip end. Card remains visible but disabled until a gateway is integrated.</p></div></div>}

        <div className="mt-5">{rideCreated || confirmedRideData ? <Button title="Cancel ride" loading={loading} variant="danger" fun={() => setShowCancelModal(true)} /> : <Button title={routeInfo?.approximate ? `Recheck & confirm • ${rideFare}` : `Confirm • ${rideFare}`} fun={createRide} loading={loading} />}</div>
      </div>

      {showCancelModal && <div className="modal-backdrop"><div className="modal-sheet"><div className="mb-4 flex items-start justify-between gap-3"><div><p className="mini-label">Cancellation</p><h2 className="text-2xl font-black text-slate-950">Why are you cancelling?</h2><p className="mt-1 text-xs font-semibold text-slate-500">Late cancellations may carry a fee configured by operations.</p></div><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><ShieldCheck size={19} /></div></div><div className="grid gap-2">{reasons.map((r) => <button key={r.code} className={`rounded-2xl border p-3.5 text-left text-sm font-bold transition ${cancelReason.code === r.code ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"}`} onClick={() => setCancelReason(r)}>{r.text}</button>)}</div><div className="mt-4 grid grid-cols-2 gap-3"><button className="secondary-btn" onClick={() => setShowCancelModal(false)}>Keep ride</button><button className="danger-btn" disabled={!cancelReason.code || loading} onClick={async () => { await cancelRide(cancelReason.code, cancelReason.text); setShowCancelModal(false); }}>Cancel ride</button></div></div></div>}
    </>
  );
}

function InfoRow({ label, title, subtitle, destination = false }) {
  return <div className="relative z-10 flex items-center gap-3"><span className={`route-dot ${destination ? "route-dot-destination" : ""}`} /><div className="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2.5 shadow-sm"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p><h3 className="truncate text-sm font-black text-slate-950">{title}</h3><p className="truncate text-[10px] font-semibold text-slate-500">{subtitle}</p></div></div>;
}

export default RideDetails;
