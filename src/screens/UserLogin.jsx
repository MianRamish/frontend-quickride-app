import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import Console from "../utils/console";
import { Banknote, CarFront, MapPinned, ShieldCheck, Sparkles } from "lucide-react";

function UserLogin() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);
  const { handleSubmit, register, formState: { errors } } = useForm();
  const navigation = useNavigate();

  const loginUser = async (data) => {
    const email = data.email?.trim().toLowerCase();
    const password = data.password?.trim();
    if (!email || !password) return;

    try {
      setLoading(true);
      const configuredAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || "admin@test.com").toLowerCase();
      const isAdminLogin = email === configuredAdminEmail;
      if (isAdminLogin) {
        const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/admin/login`, { email, password });
        localStorage.setItem("adminToken", response.data.token);
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        navigation("/admin/home");
        return;
      }

      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/user/login`, { ...data, email, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userData", JSON.stringify({ type: "user", data: response.data.user }));
      navigation("/home");
    } catch (error) {
      setResponseError(error?.response?.data?.message || "Login failed. Please check your server URL and credentials.");
      Console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (responseError) setTimeout(() => setResponseError(""), 5000); }, [responseError]);

  return (
    <div className="auth-screen">
      <div className="mobile-bg" />
      <div className="auth-content mx-auto w-full max-w-xl">
        <div>
          <div className="mb-6 app-topbar">
            <div className="flex items-center gap-3"><div className="app-topbar-avatar"><CarFront size={20} /></div><div><p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[.14em] text-emerald-200"><Sparkles size={11} /> QuickRide</p><p className="text-sm font-black">Passenger app</p></div></div>
            <Link to="/admin/login" className="hero-badge">Admin</Link>
          </div>

          <div className="glass-card p-4 min-[380px]:p-5">
            <Heading title="Welcome back" eyebrow="Passenger login" description="Sign in to book rides, track your driver, and manage your trips." />
            <form onSubmit={handleSubmit(loginUser)}>
              <Input label="Email" type="email" name="email" register={register} error={errors.email} />
              <Input label="Password" type="password" name="password" register={register} error={errors.password} />
              {responseError && <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-center text-sm font-semibold text-red-600">{responseError}</p>}
              <div className="mb-4 flex items-center justify-between gap-3"><span className="text-[11px] font-semibold text-slate-400">Secure account access</span><Link to="/user/forgot-password" className="text-xs font-black text-slate-700">Forgot password?</Link></div>
              <Button title="Continue to QuickRide" loading={loading} type="submit" />
            </form>
            <p className="mt-5 text-center text-sm font-semibold text-slate-500">New to QuickRide? <Link to="/signup" className="font-black text-slate-950">Create account</Link></p>
          </div>
        </div>

        <div className="glass-card mt-5 p-4">
          <div className="grid grid-cols-3 gap-2">
            <Trust icon={Banknote} title="Cash" subtitle="Active" />
            <Trust icon={MapPinned} title="Tracking" subtitle="Live" />
            <Trust icon={ShieldCheck} title="Safety" subtitle="Built in" />
          </div>
          <Button type="link" path="/captain/login" title="Switch to driver app" variant="secondary" classes="mt-3" />
        </div>
      </div>
    </div>
  );
}

function Trust({ icon: Icon, title, subtitle }) {
  return <div className="rounded-2xl bg-slate-50 p-3 text-center"><Icon size={16} className="mx-auto text-emerald-600" /><p className="mt-1 text-[11px] font-black text-slate-800">{title}</p><p className="text-[9px] font-bold text-slate-400">{subtitle}</p></div>;
}

export default UserLogin;
