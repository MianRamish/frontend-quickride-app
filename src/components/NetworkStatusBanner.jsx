import { useContext, useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { SocketDataContext } from "../contexts/SocketContext";

export default function NetworkStatusBanner({ compact = false }) {
  const { isConnected } = useContext(SocketDataContext);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  if (online && isConnected) return null;
  const offline = !online;
  return (
    <div className={`${compact ? "mx-3 mt-2" : "fixed left-3 right-3 top-[calc(env(safe-area-inset-top)+8px)] z-[90] mx-auto max-w-xl"} flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/95 px-3 py-2.5 text-amber-950 shadow-lg backdrop-blur`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">{offline ? <WifiOff size={17} /> : <RefreshCw size={17} className="animate-spin" />}</div>
      <div className="min-w-0"><p className="text-xs font-black">{offline ? "You’re offline" : "Reconnecting to QuickRide"}</p><p className="truncate text-[10px] font-semibold text-amber-800">{offline ? "Your current screen stays available. Live ride updates resume when data returns." : "Live ride requests and location updates will resume automatically."}</p></div>
    </div>
  );
}
