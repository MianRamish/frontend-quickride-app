import { useEffect, useState } from "react";
import axios from "axios";
import { CarFront, MapPin, Navigation, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import LiveMap from "../components/LiveMap";
import RideStatusTimeline from "../components/RideStatusTimeline";

export default function SharedTrip() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let timer;
    const load = async () => { try { const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/ride/shared/${token}`); setData(response.data); setError(""); } catch (e) { setError(e?.response?.data?.message || "This shared trip is unavailable."); } };
    load(); timer = setInterval(load, 10000); return () => clearInterval(timer);
  }, [token]);
  if (error) return <div className="flex min-h-dvh items-center justify-center bg-[#07111f] p-6 text-center text-white"><div><ShieldCheck className="mx-auto text-emerald-300" size={42} /><h1 className="mt-4 text-2xl font-black">QuickRide trip share</h1><p className="mt-2 text-sm font-semibold text-slate-300">{error}</p></div></div>;
  if (!data) return <div className="flex min-h-dvh items-center justify-center bg-[#07111f] text-sm font-black text-white">Loading live trip…</div>;
  const coords = data?.captain?.location?.coordinates;
  const markers = coords ? [{ key: "driver", lat: coords[1], lng: coords[0], title: "QuickRide driver" }] : [];
  return <div className="min-h-dvh bg-[#f4f7fb] pb-8"><header className="rounded-b-[34px] bg-[#07111f] px-4 pb-6 pt-[calc(env(safe-area-inset-top)+18px)] text-white"><p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-200">Live trip sharing</p><h1 className="mt-1 text-2xl font-black">QuickRide Nigeria</h1><p className="mt-2 text-xs font-semibold text-slate-300">This page shows limited live trip details for safety. Passenger contact information is never exposed.</p></header><main className="mx-auto max-w-xl space-y-4 px-4 pt-5"><LiveMap height="310px" markers={markers} center={coords ? [coords[1], coords[0]] : [6.5244, 3.3792]} /><RideStatusTimeline status={data.status} /><section className="premium-card p-4"><div className="space-y-3"><div className="flex gap-3"><MapPin className="mt-0.5 text-emerald-600" size={18} /><div><p className="mini-label">Pickup</p><p className="text-sm font-black text-slate-950">{data.pickup}</p></div></div><div className="flex gap-3"><Navigation className="mt-0.5 text-slate-700" size={18} /><div><p className="mini-label">Destination</p><p className="text-sm font-black text-slate-950">{data.destination}</p></div></div></div></section>{data.captain && <section className="premium-card p-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><CarFront size={20} /></div><div><p className="mini-label">Driver</p><h2 className="text-lg font-black text-slate-950">{data.captain.fullname?.firstname} {data.captain.fullname?.lastname}</h2><p className="text-xs font-semibold text-slate-500">{data.captain.vehicle?.color} {data.captain.vehicle?.type} • {data.captain.vehicle?.number} • {data.captain.rating?.avg || 0}★</p></div></div></section>}</main></div>;
}
