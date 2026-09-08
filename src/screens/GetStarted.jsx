import { useEffect } from "react";
<<<<<<< HEAD
import {
  ArrowRight,
  Banknote,
  CarFront,
  CheckCircle2,
  Clock3,
  MapPinned,
  Navigation,
  ShieldCheck,
  Sparkles,
  Gauge,
  UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "/logo-quickride.png";
import heroImage from "/get_started_illustration.jpg";
=======
import { ArrowRight, CarFront, MapPinned, ShieldCheck } from "lucide-react";
import { Button } from "../components/index";
import { useNavigate } from "react-router-dom";
import logo from "/logo-quickride.png";
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7

function GetStarted() {
  const navigate = useNavigate();

  useEffect(() => {
<<<<<<< HEAD
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
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-[90px]" />
        <div className="absolute -right-28 top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-[100px]" />
        <div className="absolute inset-x-0 top-[58%] h-[55%] rounded-t-[52px] bg-[#f5f7fb]" />
      </div>

      <main className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+16px)] sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[17px] bg-white shadow-xl">
              <img src="/icon-quickride.png" alt="" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <img className="h-5 max-w-[130px] object-contain object-left brightness-0 invert" src={logo} alt="QuickRide" />
              <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200">Move Nigeria better</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white backdrop-blur-xl">
            <Sparkles size={12} className="text-emerald-300" /> Nigeria
          </span>
        </header>

        <section className="grid flex-1 items-center gap-8 py-7 lg:grid-cols-[1.02fr_.98fr] lg:gap-14 lg:py-12">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200 backdrop-blur">
              <Navigation size={13} /> Built for everyday movement
            </div>

            <h1 className="mt-5 max-w-2xl text-[clamp(2.65rem,11vw,5.3rem)] font-black leading-[0.92] tracking-[-0.06em] text-white">
              Your next ride,
              <span className="block bg-gradient-to-r from-emerald-300 via-emerald-200 to-cyan-200 bg-clip-text text-transparent">made simple.</span>
            </h1>

            <p className="mt-5 max-w-xl text-[15px] font-semibold leading-6 text-slate-300 sm:text-base sm:leading-7">
              Request a ride, follow your driver live, use built-in safety tools, and pay in cash when your trip ends.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2.5 sm:max-w-xl sm:gap-3">
              <MiniStat icon={Clock3} title="Fast" text="Simple booking" />
              <MiniStat icon={MapPinned} title="Live" text="Trip tracking" />
              <MiniStat icon={ShieldCheck} title="Safer" text="Trip tools" />
            </div>

            <div className="mt-7 grid gap-3 sm:max-w-xl sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="group flex min-h-[62px] items-center justify-between rounded-[22px] bg-white px-4 text-left text-slate-950 shadow-[0_20px_45px_rgba(0,0,0,.22)] transition active:scale-[0.985]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-emerald-50 text-emerald-700">
                    <CarFront size={21} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black">Book a ride</span>
                    <span className="mt-0.5 block text-[10px] font-bold text-slate-400">Passenger login</span>
                  </span>
                </span>
                <ArrowRight size={18} className="shrink-0 transition group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/captain/login")}
                className="group flex min-h-[62px] items-center justify-between rounded-[22px] border border-white/15 bg-white/10 px-4 text-left text-white backdrop-blur-xl transition active:scale-[0.985]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white/10 text-emerald-200">
                    <Gauge size={21} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black">Drive & earn</span>
                    <span className="mt-0.5 block text-[10px] font-bold text-slate-300">Driver login</span>
                  </span>
                </span>
                <ArrowRight size={18} className="shrink-0 transition group-hover:translate-x-0.5" />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold text-slate-400">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-300" /> Cash active</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-300" /> Card coming soon</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-300" /> Nigeria-first locations</span>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative mx-auto max-w-[470px]">
              <div className="absolute -inset-5 rounded-[44px] bg-gradient-to-br from-emerald-400/20 via-transparent to-blue-500/20 blur-2xl" />

              <div className="relative overflow-hidden rounded-[38px] border border-white/15 bg-white/10 p-2.5 shadow-[0_35px_90px_rgba(0,0,0,.34)] backdrop-blur-xl">
                <div className="relative h-[330px] overflow-hidden rounded-[31px] bg-emerald-100 sm:h-[440px] lg:h-[500px]">
                  <img
                    src={heroImage}
                    alt="QuickRide passenger booking a ride"
                    className="h-full w-full object-cover object-[center_58%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06111f]/50 via-transparent to-transparent" />

                  <div className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/95 px-3 py-2 text-[10px] font-black text-slate-800 shadow-lg backdrop-blur">
                    <span className="inline-flex items-center gap-1.5"><MapPinned size={13} className="text-emerald-600" /> Live trip view</span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 rounded-[24px] border border-white/70 bg-white/95 p-3 text-slate-950 shadow-[0_18px_50px_rgba(2,8,23,.22)] backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-slate-950 text-white"><CarFront size={20} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">QuickRide trip</p>
                        <p className="truncate text-sm font-black">Lagos Island → Ikeja</p>
                        <p className="mt-0.5 text-[10px] font-bold text-slate-500">Cash • Live tracking • Safety tools</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-700">Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-2 top-[36%] hidden rounded-[20px] border border-white/70 bg-white/95 p-3 text-slate-950 shadow-xl min-[390px]:block sm:-left-7">
                <Banknote size={17} className="text-emerald-600" />
                <p className="mt-1 text-[10px] font-black">Cash payment</p>
                <p className="text-[9px] font-bold text-slate-400">Active now</p>
              </div>

              <div className="absolute -right-2 top-[18%] hidden rounded-[20px] border border-white/70 bg-white/95 p-3 text-slate-950 shadow-xl min-[390px]:block sm:-right-7">
                <ShieldCheck size={17} className="text-blue-600" />
                <p className="mt-1 text-[10px] font-black">Trip safety</p>
                <p className="text-[9px] font-bold text-slate-400">Built in</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative rounded-[32px] border border-slate-200/80 bg-white p-4 text-slate-950 shadow-[0_24px_70px_rgba(2,8,23,.13)] sm:p-5 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">Choose your side of the journey</p>
            <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Ride when you need it. Drive when you want.</h2>
            <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-500">Passenger and driver experiences are separated so each side stays focused and easy to use.</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:mt-0 lg:w-[310px]">
            <RoleCard icon={UsersRound} label="Passenger" detail="Book rides" onClick={() => navigate("/signup")} />
            <RoleCard icon={Gauge} label="Driver" detail="Join QuickRide" onClick={() => navigate("/captain/signup")} dark />
          </div>
        </section>

        <footer className="relative py-4 text-center text-[10px] font-bold text-slate-400 lg:text-left">
          QuickRide Nigeria • Cash payments active • Card payments coming later
        </footer>
      </main>
=======
    const userData = localStorage.getItem("userData");
    if (!userData) return;
    const parsed = JSON.parse(userData);
    if (parsed.type === "user") navigate("/home");
    if (parsed.type === "captain") navigate("/captain/home");
  }, [navigate]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,.45),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(20,184,166,.28),transparent_30%)]" />
      <div className="relative flex flex-1 flex-col px-6 pb-6 pt-8">
        <div className="flex items-center justify-between">
          <img className="h-9 object-contain brightness-0 invert" src={logo} alt="QuickRide" />
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-blue-100 backdrop-blur">CA / US</span>
        </div>

        <div className="mt-12 flex flex-1 flex-col justify-center">
          <div className="relative mx-auto mb-10 h-64 w-64 rounded-full bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="absolute -right-3 top-8 rounded-3xl bg-white px-4 py-3 text-slate-950 shadow-xl">
              <MapPinned size={22} />
            </div>
            <div className="absolute -left-3 bottom-9 rounded-3xl bg-blue-500 px-4 py-3 text-white shadow-xl">
              <ShieldCheck size={22} />
            </div>
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-white to-blue-100 text-slate-950">
              <CarFront size={108} strokeWidth={1.6} />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-200">Ride booking MVP</p>
          <h1 className="mt-3 text-5xl font-black leading-[0.95] tracking-tight">Move smarter with QuickRide.</h1>
          <p className="mt-5 max-w-sm text-base font-semibold leading-7 text-slate-300">A redesigned mobile-first ride app for Canada and the United States using free map services.</p>
        </div>

        <div className="glass-card bg-white p-4 text-slate-950">
          <Button title="Continue" path="/login" type="link" icon={<ArrowRight />} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-slate-500">
            <span className="rounded-2xl bg-slate-100 px-2 py-2">Passengers</span>
            <span className="rounded-2xl bg-slate-100 px-2 py-2">Captains</span>
            <span className="rounded-2xl bg-slate-100 px-2 py-2">Admin</span>
          </div>
        </div>
      </div>
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
    </div>
  );
}

<<<<<<< HEAD
function MiniStat({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.07] p-3 backdrop-blur">
      <Icon size={17} className="text-emerald-300" />
      <p className="mt-2 text-xs font-black text-white">{title}</p>
      <p className="mt-0.5 text-[9px] font-bold text-slate-400">{text}</p>
    </div>
  );
}

function RoleCard({ icon: Icon, label, detail, onClick, dark = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[76px] items-center gap-2.5 rounded-[20px] border p-3 text-left transition active:scale-[0.985] ${
        dark
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-200 bg-slate-50 text-slate-950"
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${dark ? "bg-white/10 text-emerald-200" : "bg-white text-emerald-700 shadow-sm"}`}>
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

=======
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
export default GetStarted;
