import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import Console from "../utils/console";
import { BarChart3, CarFront, ShieldCheck, Sparkles, Zap } from "lucide-react";

function CaptainLogin() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);
  const { handleSubmit, register, formState: { errors } } = useForm();
  const navigation = useNavigate();

  const loginCaptain = async (data) => {
    if (data.email.trim() !== "" && data.password.trim() !== "") {
      try {
        setLoading(true);
        const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/captain/login`, data);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userData", JSON.stringify({ type: "captain", data: response.data.captain }));
        navigation("/captain/home");
      } catch (error) {
        setResponseError(error?.response?.data?.message || "Login failed. Please check your server URL and credentials.");
        Console.log(error);
      } finally { setLoading(false); }
    }
  };

  useEffect(() => { if (responseError) setTimeout(() => setResponseError(""), 5000); }, [responseError]);

  return (
    <div className="auth-screen">
      <div className="mobile-bg" />
      <div className="auth-content mx-auto w-full max-w-xl">
        <div>
          <div className="mb-6 app-topbar">
            <div className="flex items-center gap-3"><div className="app-topbar-avatar"><CarFront size={20} /></div><div><p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[.14em] text-emerald-200"><Sparkles size={11} /> QuickRide</p><p className="text-sm font-black">Driver app</p></div></div>
            <Link to="/admin/login" className="hero-badge">Admin</Link>
          </div>

          <div className="glass-card p-4 min-[380px]:p-5">
            <Heading title="Ready to drive?" eyebrow="Driver login" description="Manage availability, ride requests, trip OTPs, cash collection, and earnings from one place." />
            <form onSubmit={handleSubmit(loginCaptain)}>
              <Input label="Email" type="email" name="email" register={register} error={errors.email} />
              <Input label="Password" type="password" name="password" register={register} error={errors.password} />
              {responseError && <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-center text-sm font-semibold text-red-600">{responseError}</p>}
              <div className="mb-4 flex items-center justify-between gap-3"><span className="text-[11px] font-semibold text-slate-400">Driver partner access</span><Link to="/captain/forgot-password" className="text-xs font-black text-slate-700">Forgot password?</Link></div>
              <Button title="Open driver console" loading={loading} type="submit" classes="bg-emerald-600" />
            </form>
            <p className="mt-5 text-center text-sm font-semibold text-slate-500">Not a driver yet? <Link to="/captain/signup" className="font-black text-slate-950">Apply to drive</Link></p>
          </div>
        </div>

        <div className="glass-card mt-5 p-4">
          <div className="grid grid-cols-3 gap-2">
            <Trust icon={Zap} title="Requests" subtitle="Live" />
            <Trust icon={BarChart3} title="Earnings" subtitle="Tracked" />
            <Trust icon={ShieldCheck} title="Verified" subtitle="Drivers" />
          </div>
          <Button type="link" path="/login" title="Switch to passenger app" variant="secondary" classes="mt-3" />
        </div>
      </div>
    </div>
  );
}

function Trust({ icon: Icon, title, subtitle }) {
  return <div className="rounded-2xl bg-slate-50 p-3 text-center"><Icon size={16} className="mx-auto text-emerald-600" /><p className="mt-1 text-[11px] font-black text-slate-800">{title}</p><p className="text-[9px] font-bold text-slate-400">{subtitle}</p></div>;
}

export default CaptainLogin;
