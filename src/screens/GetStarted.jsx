import { useEffect } from "react";
import {
  ArrowRight,
  Banknote,
  CarFront,
  CheckCircle2,
  Gauge,
  MapPinned,
  Navigation,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "/logo-quickride.png";
import heroImage from "/get_started_illustration.jpg";

const passengerFeatures = [
  { icon: MapPinned, title: "Live driver tracking", text: "Follow your assigned driver on the map from pickup to trip completion." },
  { icon: Banknote, title: "Upfront fare", text: "See your estimated fare, distance and trip time before you confirm a ride." },
  { icon: ShieldCheck, title: "Safety built in", text: "Trip PIN, emergency support, complaints and ride sharing stay close at hand." },
];

function GetStarted() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const userData = localStorage.getItem("userData");
      if (!userData) return;
      const parsed = JSON.parse(userData);
      if (parsed.type === "user") navigate("/home");
      if (parsed.type === "captain") navigate("/captain/home");
    } catch {
      localStorage.removeItem("userData");
    }
  }, [navigate]);

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#06111f] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-32 h-[520px] w-[520px] rounded-full bg-emerald-400/20 blur-[120px]" />
        <div className="absolute -right-40 top-24 h-[520px] w-[520px] rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="absolute left-1/2 top-[520px] h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-[150px]" />
        <div className="absolute inset-x-0 top-[760px] bottom-0 bg-[#f5f7fb]" />
      </div>

      <main className="relative mx-auto w-full max-w-7xl px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[calc(env(safe-area-inset-top)+14px)] sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/[0.06] px-3 py-2.5 backdrop-blur-xl sm:px-4">
          <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white shadow-lg">
              <img src="/icon-quickride.png" alt="" className="h-7 w-7 object-contain" />
            </span>
            <span className="min-w-0">
              <img className="h-5 max-w-[132px] object-contain object-left brightness-0 invert" src={logo} alt="QuickRide" />
              <span className="mt-0.5 hidden text-[8px] font-black uppercase tracking-[0.18em] text-emerald-200 min-[380px]:block">Nigeria ride platform</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate("/login")} className="hidden min-h-10 rounded-2xl px-3 text-xs font-black text-slate-200 transition hover:bg-white/10 sm:block">Passenger login</button>
            <button type="button" onClick={() => navigate("/captain/login")} className="min-h-10 rounded-2xl border border-white/15 bg-white/10 px-3 text-[11px] font-black text-white transition hover:bg-white/15 sm:px-4 sm:text-xs">Driver portal</button>
          </div>
        </header>

        <section className="grid items-center gap-8 py-8 sm:min-h-[690px] sm:gap-10 sm:py-10 lg:grid-cols-[1.04fr_.96fr] lg:gap-16 lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200 backdrop-blur">
              <Sparkles size={13} /> Rides that feel easier from the first tap
            </div>

            <h1 className="mt-5 max-w-3xl text-[clamp(2.65rem,11vw,6.4rem)] font-black leading-[0.9] tracking-[-0.06em] text-white">
              Move around
              <span className="block bg-gradient-to-r from-emerald-300 via-cyan-200 to-blue-200 bg-clip-text text-transparent">with confidence.</span>
            </h1>

            <p className="mt-6 max-w-xl text-[15px] font-semibold leading-7 text-slate-300 sm:text-[17px]">
              Book a ride, see the fare before you confirm, follow your driver live, and keep safety tools within reach throughout the trip.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:max-w-xl sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="group flex min-h-[58px] flex-1 items-center justify-between rounded-[20px] bg-white px-4 text-left text-slate-950 shadow-[0_22px_55px_rgba(0,0,0,.25)] transition hover:-translate-y-0.5 active:scale-[0.985]"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-700"><CarFront size={19} /></span>
                  <span><span className="block text-sm font-black">Get a ride</span><span className="text-[10px] font-bold text-slate-400">Create passenger account</span></span>
                </span>
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/captain/signup")}
                className="group flex min-h-[58px] flex-1 items-center justify-between rounded-[20px] border border-white/15 bg-white/[0.08] px-4 text-left text-white backdrop-blur-xl transition hover:bg-white/[0.12] active:scale-[0.985]"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/10 text-emerald-200"><Gauge size={19} /></span>
                  <span><span className="block text-sm font-black">Drive with QuickRide</span><span className="text-[10px] font-bold text-slate-300">Join the driver network</span></span>
                </span>
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </button>
            </div>

            <div className="mt-7 grid max-w-xl grid-cols-3 gap-2">
              <TrustStat value="Live" label="Driver location" icon={Navigation} />
              <TrustStat value="Upfront" label="Estimated fare" icon={Banknote} />
              <TrustStat value="Built-in" label="Safety tools" icon={ShieldCheck} />
            </div>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold text-slate-400">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-300" /> Nigeria service area</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-300" /> Cash payments active</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-300" /> Scheduled rides available</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -inset-6 rounded-[48px] bg-gradient-to-br from-emerald-400/20 via-cyan-300/5 to-blue-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[42px] border border-white/15 bg-white/10 p-2.5 shadow-[0_38px_100px_rgba(0,0,0,.38)] backdrop-blur-xl">
              <div className="relative h-[440px] overflow-hidden rounded-[34px] bg-slate-200 sm:h-[540px]">
                <img src={heroImage} alt="QuickRide ride experience" className="h-full w-full object-cover object-[center_58%]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06111f]/65 via-transparent to-[#06111f]/10" />

                <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-3 py-2 text-[10px] font-black text-slate-800 shadow-lg backdrop-blur"><MapPinned size={13} className="text-emerald-600" /> Driver live on map</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-2 text-[9px] font-black uppercase tracking-wide text-white shadow-lg"><span className="h-1.5 w-1.5 rounded-full bg-white" /> Live</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 rounded-[28px] border border-white/70 bg-white/95 p-4 text-slate-950 shadow-[0_22px_60px_rgba(2,8,23,.25)] backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-slate-950 text-white"><CarFront size={21} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Your QuickRide</p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700"><Star size={11} fill="currentColor" /> 4.9</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-black">Victoria Island → Ikeja</p>
                      <p className="mt-1 text-[10px] font-bold text-slate-500">12.4 km • 28 min • Fare shown before booking</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <MiniTripStat label="Driver" value="Live" />
                    <MiniTripStat label="Payment" value="Cash" />
                    <MiniTripStat label="Safety" value="PIN" />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -left-5 top-[29%] hidden w-[150px] rounded-[22px] border border-white/75 bg-white/95 p-3 text-slate-950 shadow-2xl sm:block">
              <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Banknote size={15} /></span><span className="text-[10px] font-black">Upfront fare</span></div>
              <div className="mt-2"><p className="text-[9px] font-bold text-slate-400">Estimated before booking</p><p className="mt-1 text-lg font-black text-slate-900">₦3,220</p></div>
            </div>

            <div className="absolute -right-5 top-[16%] hidden rounded-[22px] border border-white/75 bg-white/95 p-3 text-slate-950 shadow-2xl sm:block">
              <ShieldCheck size={17} className="text-blue-600" />
              <p className="mt-1 text-[10px] font-black">Safety tools ready</p>
              <p className="mt-0.5 text-[9px] font-bold text-slate-400">SOS • Share • Trip PIN</p>
            </div>
          </div>
        </section>

        <section className="relative -mx-4 rounded-t-[42px] bg-[#f5f7fb] px-4 pb-10 pt-10 text-slate-950 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 lg:pb-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-3 md:grid-cols-3">
              {passengerFeatures.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,.06)]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-slate-950 text-white"><Icon size={19} /></span>
                  <h3 className="mt-4 text-lg font-black tracking-tight">{title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{text}</p>
                </div>
              ))}
            </div>

            <section className="mt-5 grid gap-5 rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,.07)] lg:grid-cols-[.85fr_1.15fr] lg:p-7">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">How QuickRide works</p>
                <h2 className="mt-2 max-w-md text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">From search to pickup without the guesswork.</h2>
                <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-slate-500">Autocomplete helps you select exact locations, your estimated fare is shown before confirmation, and your assigned driver appears live on the map.</p>
                <button type="button" onClick={() => navigate("/signup")} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white">Start riding <ArrowRight size={16} /></button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Step number="01" icon={MapPinned} title="Choose locations" text="Search Nigerian places with autocomplete or use your current GPS pickup." />
                <Step number="02" icon={Banknote} title="See your fare" text="Compare car and bike estimates before choosing your ride." />
                <Step number="03" icon={Navigation} title="Follow your driver" text="After acceptance, the assigned vehicle moves live on your trip map." />
              </div>
            </section>

            <section className="mt-5 overflow-hidden rounded-[34px] bg-[#07111f] p-5 text-white shadow-[0_24px_65px_rgba(2,8,23,.18)] lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8 lg:p-7">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-emerald-200"><Gauge size={13} /> Driver partners</div>
                <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Drive, stay visible, and receive nearby requests.</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-300">Drivers control when they go online, share live GPS during active work, manage documents, earnings, ride requests and passenger communication from one console.</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 lg:mt-0 lg:w-[320px]">
                <RoleCard icon={UsersRound} label="Passenger" detail="Book your next ride" onClick={() => navigate("/signup")} />
                <RoleCard icon={Gauge} label="Driver" detail="Join QuickRide" onClick={() => navigate("/captain/signup")} dark />
              </div>
            </section>

            <footer className="flex flex-col gap-3 py-7 text-center text-[10px] font-bold text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <span>QuickRide Nigeria • Built for local movement</span>
              <span>Cash payments active • Card payments coming soon</span>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}

function TrustStat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.07] p-3 backdrop-blur-xl">
      <div className="flex items-center gap-1.5 text-emerald-300"><Icon size={14} /><span className="text-[10px] font-black uppercase tracking-wide">{value}</span></div>
      <p className="mt-2 text-[9px] font-bold leading-4 text-slate-400">{label}</p>
    </div>
  );
}

function MiniTripStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-2 py-2 text-center">
      <p className="text-[8px] font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-[11px] font-black text-slate-900">{value}</p>
    </div>
  );
}

function Step({ number, icon: Icon, title, text }) {
  return (
    <div className="rounded-[24px] bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-white text-emerald-700 shadow-sm"><Icon size={18} /></span>
        <span className="text-[10px] font-black text-slate-300">{number}</span>
      </div>
      <h3 className="mt-4 text-sm font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function RoleCard({ icon: Icon, label, detail, onClick, dark = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[82px] items-center gap-2.5 rounded-[20px] border p-3 text-left transition active:scale-[0.985] ${dark ? "border-white/10 bg-white/10 text-white" : "border-white/10 bg-white text-slate-950"}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${dark ? "bg-emerald-400/10 text-emerald-200" : "bg-emerald-50 text-emerald-700"}`}>
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-black">{label}</span>
        <span className={`mt-0.5 block text-[9px] font-bold ${dark ? "text-slate-300" : "text-slate-400"}`}>{detail}</span>
      </span>
      <ArrowRight size={15} className="shrink-0 transition group-hover:translate-x-0.5" />
    </button>
  );
}

export default GetStarted;
