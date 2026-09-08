import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import { useCaptain } from "../contexts/CaptainContext";
import { ArrowLeft } from "lucide-react";
import Console from "../utils/console";

function CaptainEditProfile() {
  const token = localStorage.getItem("token");
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);
  const { handleSubmit, register, formState: { errors } } = useForm();
  const { captain } = useCaptain();
  const navigation = useNavigate();

  const updateUserProfile = async (data) => {
    const captainData = {
      fullname: { firstname: data.firstname, lastname: data.lastname },
      phone: data.phone,
      vehicle: { color: data.color, number: data.number, capacity: data.capacity, type: data.type.toLowerCase() },
    };
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/captain/update`, { captainData }, { headers: { token } });
      navigation("/captain/home");
    } catch (error) {
      setResponseError(error?.response?.data?.[0]?.msg || error?.response?.data?.message || "Update failed");
      Console.log(error.response || error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (responseError) setTimeout(() => setResponseError(""), 5000); }, [responseError]);

  return (
    <div className="screen-safe safe-scroll bg-slate-50 p-4">
      <div className="mb-6 flex items-center gap-3">
        <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm" onClick={() => navigation(-1)}><ArrowLeft /></button>
<<<<<<< HEAD
        <Heading title="Edit Profile" eyebrow="Driver" />
=======
        <Heading title="Edit Profile" eyebrow="Captain" />
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
      </div>
      <div className="soft-card p-4">
        <Input label="Email" type="email" name="email" register={register} error={errors.email} defaultValue={captain.email} disabled={true} />
        <form onSubmit={handleSubmit(updateUserProfile)}>
<<<<<<< HEAD
          <Input label="Phone Number" type="tel" name="phone" register={register} error={errors.phone} defaultValue={captain.phone} />
=======
          <Input label="Phone Number" type="number" name="phone" register={register} error={errors.phone} defaultValue={captain.phone} />
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
          <div className="responsive-grid-2">
            <Input label="First name" name="firstname" register={register} error={errors.firstname} defaultValue={captain.fullname.firstname} />
            <Input label="Last name" name="lastname" register={register} error={errors.lastname} defaultValue={captain.fullname.lastname} />
          </div>
          <div className="responsive-grid-2">
            <Input label="Vehicle colour" name="color" register={register} error={errors.color} defaultValue={captain.vehicle.color} />
            <Input label="Vehicle capacity" type="number" name="capacity" register={register} error={errors.capacity} defaultValue={captain.vehicle.capacity} />
          </div>
          <Input label="Vehicle number" name="number" register={register} error={errors.number} defaultValue={captain.vehicle.number} />
          <Input label="Vehicle type" type="select" options={["Car", "Bike"]} name="type" register={register} error={errors.type} defaultValue={captain.vehicle.type} />
          {responseError && <p className="mb-4 rounded-2xl bg-red-50 p-3 text-center text-sm font-bold text-red-600">{responseError}</p>}
          <Button title="Update Profile" loading={loading} type="submit" classes="mt-4" />
        </form>
      </div>
    </div>
  );
}

export default CaptainEditProfile;
