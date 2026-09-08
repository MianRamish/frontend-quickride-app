import { Home, History, MapPinned, ShieldCheck, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function MobileBottomNav({ userType = "user" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isCaptain = userType === "captain";
  const items = isCaptain
    ? [
        { label: "Home", icon: Home, path: "/captain/home" },
        { label: "Trips", icon: History, path: "/captain/rides" },
        { label: "Profile", icon: UserRound, path: "/captain/edit-profile" },
      ]
    : [
        { label: "Ride", icon: MapPinned, path: "/home" },
        { label: "Trips", icon: History, path: "/user/rides" },
        { label: "Safety", icon: ShieldCheck, path: "/user/tools" },
        { label: "Profile", icon: UserRound, path: "/user/edit-profile" },
      ];

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[70] mx-auto max-w-xl px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2">
      <div className="rounded-[26px] border border-slate-200/80 bg-white/96 p-2 shadow-[0_-14px_40px_rgba(15,23,42,.10)] backdrop-blur-xl">
        <div className={`grid ${isCaptain ? "grid-cols-3" : "grid-cols-4"} gap-1.5`}>
          {items.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[18px] px-2 text-[10px] font-black uppercase tracking-[0.06em] transition active:scale-[0.98] ${
                  active
                    ? "bg-slate-950 text-white shadow-[0_10px_22px_rgba(2,8,23,.16)]"
                    : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
