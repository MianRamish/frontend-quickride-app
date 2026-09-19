import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Bell, BellRing, CheckCheck, X } from "lucide-react";
import { SocketDataContext } from "../contexts/SocketContext";
import { enablePushNotifications } from "../utils/pushNotifications";
import { Alert } from "./Alert";

export default function NotificationBell({ userType = "user", dark = true }) {
  const token = localStorage.getItem("token");
  const { socket } = useContext(SocketDataContext);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [alertNotice, setAlertNotice] = useState("");
  const [alertLoading, setAlertLoading] = useState(false);
  const [foregroundNotice, setForegroundNotice] = useState(null);
  const endpoint = useMemo(() => `/${userType === "captain" ? "captain" : "user"}/notifications`, [userType]);
  const unread = items.filter((item) => !item.readAt).length;

  const load = async () => {
    if (!token) return;
    try { const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}${endpoint}`, { headers: { token } }); setItems(response.data || []); } catch (_) {}
  };

  useEffect(() => { load(); }, [endpoint]);
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) return undefined;
    const onServiceWorkerMessage = (event) => {
      if (event.data?.type !== "quickride-push") return;
      const notice = event.data?.notification || {};
      setForegroundNotice({
        title: notice.title || "QuickRide update",
        body: notice.body || "",
        data: notice.data || {},
      });
    };
    navigator.serviceWorker.addEventListener("message", onServiceWorkerMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onServiceWorkerMessage);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onNotification = (item) => {
      setItems((prev) => [item, ...prev.filter((x) => x._id !== item._id)]);
      const appVisible = typeof document !== "undefined" && document.visibilityState === "visible";
      if (appVisible) {
        setForegroundNotice(item);
        return;
      }
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try { new Notification(item.title || "QuickRide", { body: item.body || "", icon: "/icon-192.png" }); } catch (_) {}
      }
    };
    socket.on("notification", onNotification);
    return () => socket.off("notification", onNotification);
  }, [socket]);

  const markRead = async (id) => {
    try { await axios.patch(`${import.meta.env.VITE_SERVER_URL}${endpoint}/${id}/read`, {}, { headers: { token } }); setItems((prev) => prev.map((item) => item._id === id ? { ...item, readAt: new Date().toISOString() } : item)); } catch (_) {}
  };

  const enableBrowserAlerts = async () => {
    if (typeof Notification === "undefined") return;
    try {
      setAlertLoading(true);
      const result = await enablePushNotifications({ userType: userType === "captain" ? "captain" : "user", token });
      setAlertNotice(result.message || (result.ok ? "Ride alerts enabled." : "Unable to enable alerts."));
    } catch (error) {
      setAlertNotice(error?.response?.data?.message || error?.message || "Unable to enable ride alerts.");
    } finally {
      setAlertLoading(false);
    }
  };

  const foregroundNoticeType = /cancel|failed|error|declined/i.test(
    `${foregroundNotice?.title || ""} ${foregroundNotice?.body || ""}`
  ) ? "failure" : "success";

  return (
    <>
      <Alert
        heading={foregroundNotice?.title || "QuickRide update"}
        text={foregroundNotice?.body || ""}
        isVisible={Boolean(foregroundNotice)}
        onClose={() => setForegroundNotice(null)}
        type={foregroundNoticeType}
      />
      <button type="button" onClick={() => { setOpen(true); load(); }} className={`relative flex h-11 w-11 items-center justify-center rounded-2xl ${dark ? "bg-white/10 text-white" : "border border-slate-200 bg-white text-slate-700"}`} aria-label="Notifications">
        {unread ? <BellRing size={18} /> : <Bell size={18} />}
        {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && <div className="fixed inset-0 z-[95] bg-slate-950/55 backdrop-blur-sm" onClick={() => setOpen(false)}>
        <section className="absolute bottom-0 left-0 right-0 mx-auto max-w-xl overflow-hidden rounded-t-[32px] bg-[#f6f8fb] p-4 pb-[calc(env(safe-area-inset-bottom)+18px)]" style={{ maxHeight: "min(78dvh, calc(100dvh - env(safe-area-inset-top) - 12px))" }} onClick={(e) => e.stopPropagation()}>
          <div className="sheet-handle mb-3" />
          <div className="flex items-center justify-between gap-3"><div><p className="mini-label">QuickRide updates</p><h2 className="text-2xl font-black text-slate-950">Notifications</h2></div><button className="icon-btn" onClick={() => setOpen(false)}><X size={18} /></button></div>
          {typeof Notification !== "undefined" && Notification.permission !== "denied" && <button type="button" onClick={enableBrowserAlerts} disabled={alertLoading} className="mt-3 flex w-full items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-left disabled:opacity-60"><span><span className="block text-xs font-black text-emerald-950">{alertLoading ? "Enabling ride alerts…" : Notification.permission === "granted" ? "Sync device alerts" : "Enable ride alerts"}</span><span className="mt-0.5 block text-[10px] font-semibold text-emerald-800">Uses browser notifications now and Web Push when VAPID keys are configured on the server.</span></span><BellRing size={18} className="text-emerald-700" /></button>}
          {alertNotice && <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold leading-4 text-slate-600">{alertNotice}</div>}
          <div className="mt-3 max-h-[55dvh] space-y-2 overflow-y-auto">
            {items.length ? items.map((item) => <button key={item._id} type="button" onClick={() => markRead(item._id)} className={`w-full rounded-[20px] border p-3 text-left ${item.readAt ? "border-slate-200 bg-white" : "border-emerald-100 bg-emerald-50"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-xs font-black text-slate-950">{item.title}</p><p className="mt-1 break-words text-[11px] font-semibold leading-4 text-slate-600">{item.body}</p><p className="mt-2 break-words text-[9px] font-bold uppercase tracking-wide text-slate-400">{new Date(item.createdAt).toLocaleString("en-NG")}</p></div>{item.readAt ? <CheckCheck size={15} className="text-slate-300" /> : <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />}</div></button>) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-400">No notifications yet.</div>}
          </div>
        </section>
      </div>}
    </>
  );
}
