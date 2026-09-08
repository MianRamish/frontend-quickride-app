import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Copy, Home, MapPin, Plus, ShieldCheck, Trash2, UserRound, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MobileBottomNav, NetworkStatusBanner } from "../components";

export default function UserTools() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [profile, setProfile] = useState(null);
  const [places, setPlaces] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [place, setPlace] = useState({ label: "Home", address: "" });
  const [contact, setContact] = useState({ name: "", phone: "", relationship: "" });
  const [notice, setNotice] = useState("");
  const http = (method, path, data) => axios({ method, url: `${import.meta.env.VITE_SERVER_URL}${path}`, data, headers: { token } });

  const load = async () => {
    try {
      const [p, s, c] = await Promise.all([http("get", "/user/profile"), http("get", "/user/saved-places"), http("get", "/user/emergency-contacts")]);
      setProfile(p.data?.user || null); setPlaces(s.data || []); setContacts(c.data || []);
    } catch (error) { setNotice(error?.response?.data?.message || "Unable to load your preferences."); }
  };
  useEffect(() => { load(); }, []);

  const addPlace = async (e) => { e.preventDefault(); if (!place.address.trim()) return; try { const response = await http("post", "/user/saved-places", place); setPlaces(response.data || []); setPlace({ label: "Home", address: "" }); } catch (error) { setNotice(error?.response?.data?.message || "Could not save place."); } };
  const removePlace = async (id) => { const response = await http("delete", `/user/saved-places/${id}`); setPlaces(response.data || []); };
  const addContact = async (e) => { e.preventDefault(); if (!contact.name || !contact.phone) return; try { const response = await http("post", "/user/emergency-contacts", contact); setContacts(response.data || []); setContact({ name: "", phone: "", relationship: "" }); } catch (error) { setNotice(error?.response?.data?.message || "Could not save emergency contact."); } };
  const removeContact = async (id) => { const response = await http("delete", `/user/emergency-contacts/${id}`); setContacts(response.data || []); };
  const copyReferral = async () => { try { await navigator.clipboard.writeText(profile?.referralCode || ""); setNotice("Referral code copied."); } catch (_) {} };

  return <div className="min-h-dvh bg-[#f4f7fb] pb-[var(--qr-bottom-nav-offset)]">
    <NetworkStatusBanner />
    <header className="relative overflow-hidden rounded-b-[36px] bg-[#07111f] px-4 pb-7 pt-[calc(env(safe-area-inset-top)+16px)] text-white">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative flex items-center gap-3"><button className="icon-btn-dark" onClick={() => navigate(-1)}><ArrowLeft size={19} /></button><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-200">Passenger essentials</p><h1 className="text-2xl font-black">Places & safety</h1></div></div>
      <p className="relative mt-4 max-w-md text-xs font-semibold leading-5 text-slate-300">Save frequent destinations, trusted contacts and your referral code in one place.</p>
    </header>
    <main className="mx-auto max-w-xl space-y-4 px-4 py-5">
      {notice && <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-600">{notice}</div>}

      <section className="premium-card p-4">
        <div className="flex items-start justify-between gap-3"><div><p className="mini-label">Saved places</p><h2 className="mt-1 text-xl font-black text-slate-950">One-tap destinations</h2></div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><MapPin size={19} /></div></div>
        <div className="mt-3 space-y-2">{places.length ? places.map((item) => <div key={item._id} className="flex items-center gap-3 rounded-[20px] bg-slate-50 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700">{item.label?.toLowerCase() === "home" ? <Home size={17} /> : <MapPin size={17} />}</div><div className="min-w-0 flex-1"><p className="text-xs font-black text-slate-950">{item.label || "Saved place"}</p><p className="truncate text-[10px] font-semibold text-slate-500">{item.address}</p></div><button className="icon-btn h-10 w-10" onClick={() => removePlace(item._id)}><Trash2 size={16} /></button></div>) : <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-500">No saved places yet.</p>}</div>
        <form onSubmit={addPlace} className="mt-3 grid grid-cols-1 gap-2 min-[400px]:grid-cols-[110px_1fr]"><select className="input-box" value={place.label} onChange={(e) => setPlace({ ...place, label: e.target.value })}><option>Home</option><option>Work</option><option>School</option><option>Favourite</option></select><input className="input-box" placeholder="Address or landmark" value={place.address} onChange={(e) => setPlace({ ...place, address: e.target.value })} /><button className="primary-btn min-h-12 min-[400px]:col-span-2"><Plus size={16} /> Save place</button></form>
      </section>

      <section className="premium-card p-4">
        <div className="flex items-start justify-between gap-3"><div><p className="mini-label">Trusted contacts</p><h2 className="mt-1 text-xl font-black text-slate-950">Emergency contacts</h2></div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700"><ShieldCheck size={19} /></div></div>
        <div className="mt-3 space-y-2">{contacts.length ? contacts.map((item) => <div key={item._id} className="flex items-center gap-3 rounded-[20px] bg-slate-50 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700"><UserRound size={17} /></div><div className="min-w-0 flex-1"><p className="text-xs font-black text-slate-950">{item.name}</p><p className="truncate text-[10px] font-semibold text-slate-500">{item.relationship || "Trusted contact"} • {item.phone}</p></div><button className="icon-btn h-10 w-10" onClick={() => removeContact(item._id)}><Trash2 size={16} /></button></div>) : <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-500">Add someone you trust for trip sharing and emergencies.</p>}</div>
        <form onSubmit={addContact} className="mt-3 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2"><input className="input-box" placeholder="Name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} /><input className="input-box" placeholder="+234…" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /><input className="input-box min-[400px]:col-span-2" placeholder="Relationship (optional)" value={contact.relationship} onChange={(e) => setContact({ ...contact, relationship: e.target.value })} /><button className="primary-btn min-h-12 min-[400px]:col-span-2"><UsersRound size={16} /> Add trusted contact</button></form>
      </section>

      <section className="overflow-hidden rounded-[28px] bg-[#07111f] p-4 text-white shadow-xl">
        <p className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-200">Invite & grow</p><h2 className="mt-1 text-xl font-black">Your referral code</h2><p className="mt-1 text-xs font-semibold text-slate-300">Share this code with friends. New passengers can enter it during signup, and QuickRide records the referral attribution.</p><button type="button" onClick={copyReferral} className="mt-4 flex w-full items-center justify-between rounded-2xl bg-white/10 p-3"><span className="text-lg font-black tracking-[.18em]">{profile?.referralCode || "—"}</span><Copy size={17} /></button>
      </section>
    </main>
    <MobileBottomNav userType="user" />
  </div>;
}
