import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import Console from "../utils/console";
import { CarFront, ShieldCheck } from "lucide-react";

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
      <div className="auth-content">
        <div>
          <div className="mb-8 flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"><CarFront /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">QuickRide</p>
                <p className="text-sm font-black">Canada / United States</p>
              </div>
            </div>
            <Link to="/admin/login" className="shrink-0 rounded-full bg-white/15 px-3 py-2 text-xs font-bold backdrop-blur">Admin</Link>
          </div>

          <div className="glass-card p-4 min-[380px]:p-5">
            <Heading title="Welcome back" eyebrow="Passenger login" />
            <form onSubmit={handleSubmit(loginUser)}>
              <Input label="Email" type="email" name="email" register={register} error={errors.email} />
              <Input label="Password" type="password" name="password" register={register} error={errors.password} />
              {responseError && <p className="mb-4 rounded-2xl bg-red-50 p-3 text-center text-sm font-semibold text-red-600">{responseError}</p>}
              <Link to="/user/forgot-password" className="mb-4 inline-block text-sm font-bold text-slate-500">Forgot password?</Link>
              <Button title="Login" loading={loading} type="submit" />
            </form>
            <p className="mt-5 text-center text-sm font-semibold text-slate-500">Don&apos;t have an account? <Link to="/signup" className="font-black text-slate-950">Sign up</Link></p>
          </div>
        </div>

        <div className="glass-card mt-5 p-4">
          <div className="mb-3 flex items-center gap-3 text-sm font-semibold text-slate-600"><ShieldCheck size={18} /> Secure passenger access</div>
          <Button type="link" path="/captain/login" title="Login as Captain" variant="secondary" />
        </div>
      </div>
    </div>
  );
}

export default UserLogin;
