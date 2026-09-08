import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import { useUser } from "../contexts/UserContext";
import { ArrowLeft } from "lucide-react";
import Console from "../utils/console";
import { useAlert } from "../hooks/useAlert";
import { Alert } from "../components";

function UserEditProfile() {
  const token = localStorage.getItem("token");
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);
  const { alert, showAlert, hideAlert } = useAlert();
  const { handleSubmit, register, formState: { errors } } = useForm();
  const { user } = useUser();
  const navigation = useNavigate();

  const updateUserProfile = async (data) => {
    const userData = { fullname: { firstname: data.firstname, lastname: data.lastname }, phone: data.phone };
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/user/update`, userData, { headers: { token } });
      showAlert("Edit Successful", "Your profile details have been successfully updated", "success");
      setTimeout(() => navigation("/home"), 1500);
    } catch (error) {
      showAlert("Update failed", error?.response?.data?.[0]?.msg || error?.response?.data?.message || "Please try again", "failure");
      Console.log(error.response);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (responseError) setTimeout(() => setResponseError(""), 5000); }, [responseError]);

  return (
    <div className="screen-safe safe-scroll bg-slate-50 p-4">
      <Alert heading={alert.heading} text={alert.text} isVisible={alert.isVisible} onClose={hideAlert} type={alert.type} />
      <div className="mb-6 flex items-center gap-3">
        <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm" onClick={() => navigation(-1)}><ArrowLeft /></button>
        <Heading title="Edit Profile" eyebrow="Passenger" />
      </div>
      <div className="soft-card p-4">
        <Input label="Email" type="email" name="email" register={register} error={errors.email} defaultValue={user.email} disabled={true} />
        <form onSubmit={handleSubmit(updateUserProfile)}>
          <div className="responsive-grid-2">
            <Input label="First name" name="firstname" register={register} error={errors.firstname} defaultValue={user.fullname.firstname} />
            <Input label="Last name" name="lastname" register={register} error={errors.lastname} defaultValue={user.fullname.lastname} />
          </div>
          <Input label="Phone Number" type="tel" name="phone" register={register} error={errors.phone} defaultValue={user.phone} />
          {responseError && <p className="mb-4 rounded-2xl bg-red-50 p-3 text-center text-sm font-bold text-red-600">{responseError}</p>}
          <Button title="Update Profile" loading={loading} type="submit" classes="mt-4" />
        </form>
      </div>
    </div>
  );
}

export default UserEditProfile;
