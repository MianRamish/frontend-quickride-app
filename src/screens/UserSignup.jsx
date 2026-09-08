import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import Console from "../utils/console";
import { ArrowLeft, Banknote, MapPinned, ShieldCheck, Sparkles } from "lucide-react";

function UserSignup() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);
  const { handleSubmit, register, formState: { errors } } = useForm();
  const navigation = useNavigate();

  const signupUser = async (data) => {
    const userData = { fullname: { firstname: data.firstname, lastname: data.lastname }, email: data.email, password: data.password, phone: data.phone, referralCode: data.referralCode?.trim()?.toUpperCase() || undefined };
    try {
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/user/register`, userData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userData", JSON.stringify({ type: "user", data: response.data.user }));
      navigation("/home");
    } catch (error) {
      setResponseError(error?.response?.data?.[0]?.msg || error?.response?.data?.message || "Signup failed");
      Console.log(error);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (responseError) setTimeout(() => setResponseError(""), 5000); }, [responseError]);

  return (
    <div className="auth-screen">
      <div className="mobile-bg" />
      <div className="auth-content mx-auto w-full max-w-xl">
        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <button onClick={() => navigation(-1)} className="icon-btn-dark"><ArrowLeft size={20} /></button>
            <span className="hero-badge"><Sparkles size={12} className="text-emerald-300" /> Passenger signup</span>
          </div>

          <div className="glass-card p-4 min-[380px]:p-5">
            <Heading title="Create your account" eyebrow="QuickRide Nigeria" description="Set up your passenger profile and start booking cash rides in a few steps." />
            <form onSubmit={handleSubmit(signupUser)}>
              <div className="responsive-grid-2">
                <Input label="First name" name="firstname" register={register} error={errors.firstname} />
                <Input label="Last name" name="lastname" register={register} error={errors.lastname} />
              </div>
              <Input label="Phone number" type="tel" name="phone" placeholder="+234 801 234 5678" register={register} error={errors.phone} />
              <Input label="Email" type="email" name="email" register={register} error={errors.email} />
              <Input label="Referral code (optional)" name="referralCode" placeholder="QUICK123" register={register} error={errors.referralCode} />
              <Input label="Password" type="password" name="password" register={register} error={errors.password} />
              {responseError && <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-center text-sm font-semibold text-red-600">{responseError}</p>}
              <Button title="Create passenger account" loading={loading} type="submit" />
            </form>
            <p className="mt-5 text-center text-sm font-semibold text-slate-500">Already registered? <Link to="/login" className="font-black text-slate-950">Sign in</Link></p>
          </div>
        </div>

        <div className="glass-card mt-5 p-4">
          <div className="mb-3 grid grid-cols-3 gap-2">
            <Trust icon={Banknote} title="Cash" />
            <Trust icon={MapPinned} title="Tracking" />
            <Trust icon={ShieldCheck} title="Safety" />
          </div>
          <Button type="link" path="/captain/signup" title="I want to drive with QuickRide" variant="secondary" />
        </div>
      </div>
    </div>
  );
}

function Trust({ icon: Icon, title }) {
  return <div className="rounded-2xl bg-slate-50 p-3 text-center"><Icon size={16} className="mx-auto text-emerald-600" /><p className="mt-1 text-[10px] font-black text-slate-700">{title}</p></div>;
}

export default UserSignup;
