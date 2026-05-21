import { useEffect } from "react";
import { ArrowRight, CarFront, MapPinned, ShieldCheck } from "lucide-react";
import { Button } from "../components/index";
import { useNavigate } from "react-router-dom";
import logo from "/logo-quickride.png";

function GetStarted() {
  const navigate = useNavigate();

  useEffect(() => {
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
    </div>
  );
}

export default GetStarted;
