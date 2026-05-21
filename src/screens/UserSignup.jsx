import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import Console from "../utils/console";
import { ArrowLeft, ShieldCheck } from "lucide-react";

function UserSignup() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);
  const { handleSubmit, register, formState: { errors } } = useForm();
  const navigation = useNavigate();

  const signupUser = async (data) => {
    const userData = { fullname: { firstname: data.firstname, lastname: data.lastname }, email: data.email, password: data.password, phone: data.phone };
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
      <div className="auth-content">
        <div>
          <button onClick={() => navigation(-1)} className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur"><ArrowLeft /></button>
          <div className="glass-card p-4 min-[380px]:p-5">
            <Heading title="Create passenger account" eyebrow="Passenger signup" />
            <form onSubmit={handleSubmit(signupUser)}>
              <div className="responsive-grid-2">
                <Input label="First name" name="firstname" register={register} error={errors.firstname} />
                <Input label="Last name" name="lastname" register={register} error={errors.lastname} />
              </div>
              <Input label="Phone number" type="tel" name="phone" register={register} error={errors.phone} />
              <Input label="Email" type="email" name="email" register={register} error={errors.email} />
              <Input label="Password" type="password" name="password" register={register} error={errors.password} />
              {responseError && <p className="mb-4 rounded-2xl bg-red-50 p-3 text-center text-sm font-semibold text-red-600">{responseError}</p>}
              <Button title="Create account" loading={loading} type="submit" />
            </form>
            <p className="mt-5 text-center text-sm font-semibold text-slate-500">Already have an account? <Link to="/login" className="font-black text-slate-950">Login</Link></p>
          </div>
        </div>
        <div className="glass-card mt-5 p-4">
          <div className="mb-3 flex items-center gap-3 text-sm font-semibold text-slate-600"><ShieldCheck size={18} /> Want to drive instead?</div>
          <Button type="link" path="/captain/signup" title="Sign up as Captain" variant="secondary" />
        </div>
      </div>
    </div>
  );
}

export default UserSignup;
