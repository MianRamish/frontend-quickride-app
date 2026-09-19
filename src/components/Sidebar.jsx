import { useContext, useEffect, useState } from "react";
import {
  ChevronRight,
  CircleUserRound,
  History,
  KeyRound,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Console from "../utils/console";
import { SocketDataContext } from "../contexts/SocketContext";

function Sidebar() {
  const token = localStorage.getItem("token");
  const [showSidebar, setShowSidebar] = useState(false);
  const [newUser, setNewUser] = useState({});
  const navigate = useNavigate();
  const { socket } = useContext(SocketDataContext);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    setNewUser(userData || {});
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = showSidebar ? "hidden" : originalOverflow || "";
    return () => { document.body.style.overflow = originalOverflow || ""; };
  }, [showSidebar]);

  const closeSidebar = () => setShowSidebar(false);

  const logout = async () => {
    // Stop the authenticated live session first so a signed-out driver/passenger
    // cannot remain reachable through an already-open Socket.IO connection.
    try { socket?.emit("leave-session"); } catch (_) {}
    try {
      await axios.get(`${import.meta.env.VITE_SERVER_URL}/${newUser.type}/logout`, { headers: { token } });
    } catch (error) {
      // Local sign-out must still succeed if the network/backend is temporarily unavailable.
      Console.log("Server logout unavailable; clearing local session", error);
    } finally {
      ["token", "userData", "messages", "rideDetails", "panelDetails", "showPanel", "showBtn"].forEach((key) => localStorage.removeItem(key));
      closeSidebar();
      navigate("/");
    }
  };

  const initials = `${newUser?.data?.fullname?.firstname?.[0] || ""}${newUser?.data?.fullname?.lastname?.[0] || ""}` || "U";
  const fullName = `${newUser?.data?.fullname?.firstname || ""} ${newUser?.data?.fullname?.lastname || ""}`.trim() || "QuickRide user";
  const role = newUser?.type === "captain" ? "Driver partner" : "Passenger";

  return (
    <>
      <button
        type="button"
        className="absolute right-4 top-[calc(env(safe-area-inset-top)+16px)] z-[65] icon-btn-dark"
        onClick={() => setShowSidebar(true)}
        aria-label="Open profile menu"
      >
        <Menu size={21} />
      </button>

      {showSidebar && (
        <>
          <button type="button" className="fixed inset-0 z-[89] bg-slate-950/55 backdrop-blur-sm" onClick={closeSidebar} aria-label="Close profile panel" />

          <aside className="fixed bottom-0 right-0 top-0 z-[90] flex w-[min(90vw,390px)] flex-col overflow-hidden rounded-l-[34px] bg-[#f6f8fb] text-slate-950 shadow-[-30px_0_80px_rgba(2,8,23,.24)]">
            <div className="relative overflow-hidden bg-[#07111f] px-5 pb-7 pt-[calc(env(safe-area-inset-top)+18px)] text-white">
              <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-2xl" />
              <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-blue-500/15 blur-2xl" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-black tracking-tight">
                  <Sparkles size={17} className="text-emerald-300" /> QuickRide
                </div>
                <button type="button" onClick={closeSidebar} className="icon-btn-dark" aria-label="Close profile panel"><X size={20} /></button>
              </div>

              <div className="relative mt-8 flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] border border-white/15 bg-white text-2xl font-black text-slate-950 shadow-xl">{initials}</div>
                <div className="min-w-0">
                  <span className="hero-badge"><ShieldCheck size={13} /> {role}</span>
                  <h2 className="mt-3 truncate text-2xl font-black tracking-tight">{fullName}</h2>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-300">{newUser?.data?.email}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              <p className="mini-label px-2">Account</p>
              <div className="mt-2 space-y-2">
                <MenuLink to={`/${newUser?.type}/edit-profile`} onClick={closeSidebar} icon={CircleUserRound} title="Profile & account" subtitle="Personal details and contact info" />
                <MenuLink to={`/${newUser?.type}/rides`} onClick={closeSidebar} icon={History} title="Ride history" subtitle="Completed and previous trips" />
                {newUser?.type === "user" && <MenuLink to="/user/tools" onClick={closeSidebar} icon={ShieldCheck} title="Places & safety" subtitle="Home, work, emergency contacts and referral" />}
                <MenuLink to={`/${newUser?.type}/reset-password?token=${token}`} onClick={closeSidebar} icon={KeyRound} title="Security" subtitle="Change your account password" />
              </div>

              <div className="mt-6 rounded-[26px] border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white"><ShieldCheck size={18} /></div>
                  <div>
                    <p className="text-sm font-black text-emerald-950">Safety first</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-emerald-800">Trip records and safety reports stay connected to your QuickRide account.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
              <button type="button" onClick={logout} className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition active:scale-[.98]">
                <LogOut size={18} /> Sign out
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function MenuLink({ to, onClick, icon: Icon, title, subtitle }) {
  return (
    <Link to={to} onClick={onClick} className="group flex items-center gap-3 rounded-[22px] border border-transparent bg-white px-3 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,.04)] transition hover:border-slate-200">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-slate-950 group-hover:text-white"><Icon size={19} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">{subtitle}</p>
      </div>
      <ChevronRight size={18} className="text-slate-300" />
    </Link>
  );
}

export default Sidebar;
