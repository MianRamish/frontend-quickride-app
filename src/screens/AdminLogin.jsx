import { useState } from "react";
import axios from "axios";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(import.meta.env.VITE_ADMIN_EMAIL || "admin@test.com");
  const [password, setPassword] = useState(import.meta.env.VITE_ADMIN_PASSWORD || "password123");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    try {
      setLoading(true);
      setMsg("");
      const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/admin/login`, { email, password });
      localStorage.setItem("adminToken", res.data.token);
      navigate("/admin/home");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="mobile-bg" />
      <div className="auth-content justify-center">
        <div className="glass-card p-5">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ShieldCheck />
            </div>
            <div>
              <p className="mini-label">Admin access</p>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">Admin Login</h1>
            </div>
          </div>

          <div className="space-y-3">
            <input className="input-box" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input className="input-box" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
            {msg ? <p className="rounded-2xl bg-red-50 p-3 text-center text-sm font-bold text-red-600">{msg}</p> : null}
            <Button title={loading ? "Please wait..." : "Login"} fun={login} loading={loading} />
          </div>

          <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-500">
            Use ADMIN_EMAIL / ADMIN_PASSWORD from Backend .env.
          </p>
        </div>
      </div>
    </div>
  );
}
