import axios from "axios";
import { ArrowLeft, LockKeyhole, Send, WifiOff } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SocketDataContext } from "../contexts/SocketContext";
import { NetworkStatusBanner } from "../components";
import Loading from "./Loading";

function ChatScreen() {
  const { rideId, userType } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const token = localStorage.getItem("token");
  const { socket, isConnected } = useContext(SocketDataContext);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [closed, setClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/ride/chat-details/${rideId}`, { headers: { token } });
      setMessages(response.data?.messages || []);
      setClosed(Boolean(response.data?.chatClosed));
      setOtherUser(userType === "captain" ? response.data?.user : response.data?.captain);
    } catch (err) {
      setError(err?.response?.data?.message || "This chat is unavailable.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [rideId]);
  useEffect(() => {
    if (!socket) return undefined;
    const authenticateAndJoin = () => {
      let session = null;
      try { session = JSON.parse(localStorage.getItem("userData") || "null"); } catch (_) {}
      const userId = session?.data?._id;
      if (!userId || !token || !["user", "captain"].includes(userType)) return;
      socket.emit("join", { userId, userType, token });
    };
    const onSessionReady = () => socket.emit("join-room", rideId);
    const onConnect = () => authenticateAndJoin();
    const onMessage = (payload) => {
      const item = typeof payload === "string" ? { msg: payload, by: "other", time: new Date().toISOString() } : payload;
      setMessages((prev) => [...prev, item]);
    };
    const onClosed = () => setClosed(true);
    if (socket.connected) authenticateAndJoin();
    socket.on("connect", onConnect);
    socket.on("session-ready", onSessionReady);
    socket.on("receiveMessage", onMessage);
    socket.on("chat-closed", onClosed);
    return () => { socket.off("connect", onConnect); socket.off("session-ready", onSessionReady); socket.off("receiveMessage", onMessage); socket.off("chat-closed", onClosed); };
  }, [socket, rideId, token, userType]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const sendMessage = (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || closed || !isConnected) return;
    const payload = { rideId, msg: text, userType, time: new Date().toISOString() };
    socket.emit("message", payload);
    setMessages((prev) => [...prev, { ...payload, by: userType }]);
    setMessage("");
  };

  if (loading) return <Loading />;
  if (error) return <div className="screen-safe flex min-h-dvh items-center justify-center bg-slate-50 p-4"><div className="max-w-sm rounded-[28px] bg-white p-6 text-center shadow-xl"><LockKeyhole className="mx-auto text-slate-400" /><h1 className="mt-3 text-xl font-black">Chat unavailable</h1><p className="mt-2 text-sm font-semibold text-slate-500">{error}</p><button className="primary-btn mt-5 w-full" onClick={() => navigate(-1)}>Go back</button></div></div>;

  const name = `${otherUser?.fullname?.firstname || ""} ${otherUser?.fullname?.lastname || ""}`.trim() || (userType === "captain" ? "Passenger" : "Driver");
  const initials = `${otherUser?.fullname?.firstname?.[0] || "Q"}${otherUser?.fullname?.lastname?.[0] || ""}`;

  return (
    <div className="flex h-dvh flex-col bg-[#f4f7fb]">
      <NetworkStatusBanner />
      <header className="relative overflow-hidden bg-[#07111f] px-3 pb-4 pt-[calc(env(safe-area-inset-top)+12px)] text-white">
        <div className="flex items-center gap-3"><button className="icon-btn-dark" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white font-black text-slate-950">{initials}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{name}</p><p className="mt-0.5 text-[10px] font-bold text-slate-300">{closed ? "Trip chat closed" : isConnected ? "Secure active-trip chat" : "Reconnecting…"}</p></div>{!isConnected && <WifiOff size={18} className="text-amber-300" />}</div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto flex max-w-xl flex-col gap-2">
          <div className="mx-auto mb-2 rounded-full bg-slate-200/70 px-3 py-1.5 text-[9px] font-black uppercase tracking-wide text-slate-500">Messages are linked to this ride</div>
          {messages.map((item, index) => {
            const mine = item.by === userType;
            const date = item.createdAt || item.time;
            const time = date ? new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
            return <div key={item._id || `${index}-${item.msg}`} className={`max-w-[82%] rounded-[20px] px-3.5 py-2.5 text-sm font-semibold shadow-sm ${mine ? "ml-auto rounded-br-md bg-slate-950 text-white" : "mr-auto rounded-bl-md bg-white text-slate-800"}`}><p className="whitespace-pre-wrap break-words">{item.msg}</p><p className={`mt-1 text-right text-[9px] font-bold ${mine ? "text-slate-400" : "text-slate-400"}`}>{time}</p></div>;
          })}
          {!messages.length && <div className="rounded-[26px] border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm font-bold text-slate-400">No messages yet. Use chat for pickup and trip coordination.</div>}
        </div>
      </main>

      {closed ? <div className="border-t border-slate-200 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3"><div className="mx-auto max-w-xl rounded-2xl bg-slate-100 px-4 py-3 text-center text-xs font-black text-slate-500"><LockKeyhole size={14} className="mr-1 inline" /> Chat closed because the ride ended.</div></div> : <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-3"><div className="mx-auto flex max-w-xl items-center gap-2"><input className="input-box min-w-0 flex-1 bg-slate-50" placeholder={isConnected ? "Message…" : "Waiting for connection…"} value={message} onChange={(e) => setMessage(e.target.value)} disabled={!isConnected} /><button type="submit" disabled={!message.trim() || !isConnected} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white disabled:bg-slate-300"><Send size={19} /></button></div></form>}
    </div>
  );
}

export default ChatScreen;
