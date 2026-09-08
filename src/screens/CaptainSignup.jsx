import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import { ArrowLeft, ChevronRight, ShieldCheck, UploadCloud } from "lucide-react";
import Console from "../utils/console";

const MAX_FILE_MB = 4;
const MAX_TOTAL_FILE_MB = 18;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const MAX_TOTAL_FILE_BYTES = MAX_TOTAL_FILE_MB * 1024 * 1024;

const formatBytes = (bytes = 0) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const compressImageFile = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        const maxSide = 1400;
        const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!file) return resolve("");

    if (file.type?.startsWith("image/")) {
      compressImageFile(file).then(resolve).catch(reject);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function CaptainSignup() {
  const [responseError, setResponseError] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState({});
  const { handleSubmit, register, formState: { errors } } = useForm({ defaultValues: { type: "car", capacity: 4 } });
  const navigation = useNavigate();

  const handleFile = (key, file) => {
    setResponseError("");

    if (!file) {
      setFiles((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return true;
    }

    if (file.size > MAX_FILE_BYTES) {
      setResponseError(`${file.name} is ${formatBytes(file.size)}. Please upload files under ${MAX_FILE_MB} MB each.`);
      return false;
    }

    const otherFiles = Object.entries(files).filter(([fileKey]) => fileKey !== key).map(([, existingFile]) => existingFile).filter(Boolean);
    const totalSize = otherFiles.reduce((sum, currentFile) => sum + currentFile.size, 0) + file.size;
    if (totalSize > MAX_TOTAL_FILE_BYTES) {
      setResponseError(`Total upload size is ${formatBytes(totalSize)}. Please keep all documents under ${MAX_TOTAL_FILE_MB} MB total.`);
      return false;
    }

    setFiles((prev) => ({ ...prev, [key]: file }));
    return true;
  };

  const signupCaptain = async (data) => {
    try {
      const totalSize = Object.values(files).filter(Boolean).reduce((sum, file) => sum + file.size, 0);
      if (totalSize > MAX_TOTAL_FILE_BYTES) {
        setResponseError(`Total upload size is ${formatBytes(totalSize)}. Please keep all documents under ${MAX_TOTAL_FILE_MB} MB total.`);
        return;
      }

      setLoading(true);
      const [profilePhotoUrl, vehiclePhotoUrl, licenseUrl, vehicleRegistrationUrl, insuranceUrl, governmentIdUrl] = await Promise.all([
        fileToDataUrl(files.profilePhoto),
        fileToDataUrl(files.vehiclePhoto),
        fileToDataUrl(files.license),
        fileToDataUrl(files.registration),
        fileToDataUrl(files.insurance),
        fileToDataUrl(files.governmentId),
      ]);

      const captainData = {
        fullname: { firstname: data.firstname, lastname: data.lastname },
        email: data.email,
        password: data.password,
        phone: data.phone,
        profilePhotoUrl,
        vehiclePhotoUrl,
        backgroundCheckConsent: Boolean(data.backgroundCheckConsent),
        documents: {
          licenseUrl,
          licenseNumber: data.licenseNumber,
          licenseExpiry: data.licenseExpiry || null,
          vehicleRegistrationUrl,
          vehicleRegistrationExpiry: data.vehicleRegistrationExpiry || null,
          insuranceUrl,
          insuranceExpiry: data.insuranceExpiry || null,
          governmentIdUrl,
          backgroundCheckConsent: Boolean(data.backgroundCheckConsent),
        },
        vehicle: {
          color: data.color,
          number: data.number,
          capacity: data.capacity,
          type: data.type,
        },
      };

      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/captain/register`, captainData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userData", JSON.stringify({ type: "captain", data: response.data.captain }));
      navigation("/captain/home");
    } catch (error) {
      setResponseError(error?.response?.data?.[0]?.msg || error?.response?.data?.message || "Signup failed");
      Console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (responseError) setTimeout(() => setResponseError(""), 5000); }, [responseError]);

  return (
    <div className="auth-screen">
      <div className="mobile-bg" />
      <div className="auth-content max-w-5xl">
        <div>
          <button onClick={() => step > 1 ? setStep(step - 1) : navigation(-1)} className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur"><ArrowLeft /></button>
          <div className="glass-card p-4 min-[380px]:p-5">
<<<<<<< HEAD
            <div className="flow-steps mb-5">
              <div className={`flow-step ${step === 1 ? "flow-step-active" : "flow-step-done"}`}>1 Profile</div>
              <div className={`flow-step ${step === 2 ? "flow-step-active" : step > 2 ? "flow-step-done" : ""}`}>2 Vehicle</div>
              <div className={`flow-step ${step === 3 ? "flow-step-active" : ""}`}>3 Verify</div>
            </div>
            <Heading title={step === 1 ? "Create driver account" : step === 2 ? "Vehicle details" : "Verification documents"} eyebrow="Drive with QuickRide" />
=======
            <Heading title={step === 1 ? "Create driver account" : step === 2 ? "Vehicle details" : "Verification documents"} eyebrow={`Captain signup • Step ${step} of 3`} />
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
            <form onSubmit={handleSubmit(signupCaptain)}>
              {step === 1 && (
                <>
                  <div className="responsive-grid-2">
                    <Input label="First name" name="firstname" register={register} error={errors.firstname} />
                    <Input label="Last name" name="lastname" register={register} error={errors.lastname} />
                  </div>
<<<<<<< HEAD
                  <Input label="Phone number" type="tel" name="phone" placeholder="+234 801 234 5678" register={register} error={errors.phone} />
=======
                  <Input label="Phone number" type="tel" name="phone" register={register} error={errors.phone} />
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
                  <Input label="Email" type="email" name="email" register={register} error={errors.email} />
                  <Input label="Password" type="password" name="password" register={register} error={errors.password} />
                  {responseError && <p className="mb-4 rounded-2xl bg-red-50 p-3 text-center text-sm font-semibold text-red-600">{responseError}</p>}
                  <button type="button" className="primary-btn flex w-full items-center justify-center gap-2" onClick={() => setStep(2)}>Next <ChevronRight size={20} /></button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="responsive-grid-2">
                    <Input label="Vehicle colour" name="color" register={register} error={errors.color} />
                    <Input label="Seats" type="number" name="capacity" register={register} error={errors.capacity} />
                  </div>
                  <Input label="Plate number" name="number" register={register} error={errors.number} />
                  <Input label="Vehicle type" type="select" options={["Car", "Bike"]} name="type" register={register} error={errors.type} />
<<<<<<< HEAD
                  <p className="mb-3 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-bold text-slate-600">Vehicle availability can be configured by Nigerian city and operating area.</p>
=======
                  <p className="mb-3 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-bold text-slate-600">Auto/rickshaw is disabled because this build is configured for Canada and the United States.</p>
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
                  <div className="responsive-grid-2">
                    <FileInput label="Profile photo" onChange={(file) => handleFile("profilePhoto", file)} />
                    <FileInput label="Vehicle photo" onChange={(file) => handleFile("vehiclePhoto", file)} />
                  </div>
                  <button type="button" className="primary-btn flex w-full items-center justify-center gap-2" onClick={() => setStep(3)}>Next <ChevronRight size={20} /></button>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="responsive-grid-2">
                    <Input label="License number" name="licenseNumber" register={register} error={errors.licenseNumber} />
                    <Input label="License expiry" type="date" name="licenseExpiry" register={register} error={errors.licenseExpiry} />
                  </div>
                  <div className="responsive-grid-2">
                    <Input label="Registration expiry" type="date" name="vehicleRegistrationExpiry" register={register} error={errors.vehicleRegistrationExpiry} />
                    <Input label="Insurance expiry" type="date" name="insuranceExpiry" register={register} error={errors.insuranceExpiry} />
                  </div>
                  <p className="mb-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                    Upload clear images or PDFs. Each file must be under {MAX_FILE_MB} MB; images are compressed automatically before submission.
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <FileInput label="Driver license" onChange={(file) => handleFile("license", file)} required />
                    <FileInput label="Vehicle registration" onChange={(file) => handleFile("registration", file)} required />
                    <FileInput label="Insurance" onChange={(file) => handleFile("insurance", file)} required />
                    <FileInput label="Government ID" onChange={(file) => handleFile("governmentId", file)} required />
                  </div>
                  <label className="my-4 flex items-start gap-3 rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-slate-600">
                    <input type="checkbox" {...register("backgroundCheckConsent")} className="mt-1" />
                    I consent to driver background check and understand my account must be approved before receiving trips.
                  </label>
                  {responseError && <p className="mb-4 rounded-2xl bg-red-50 p-3 text-center text-sm font-semibold text-red-600">{responseError}</p>}
                  <Button title="Submit for verification" loading={loading} type="submit" />
                </>
              )}
            </form>
            <p className="mt-5 text-center text-sm font-semibold text-slate-500">Already have an account? <Link to="/captain/login" className="font-black text-slate-950">Login</Link></p>
          </div>
        </div>
        <div className="glass-card mt-5 p-4">
          <div className="mb-3 flex items-center gap-3 text-sm font-semibold text-slate-600"><ShieldCheck size={18} /> Drivers remain pending until admin approves their documents.</div>
          <Button type="link" path="/signup" title="Sign up as Passenger" variant="secondary" />
        </div>
      </div>
    </div>
  );
}

function FileInput({ label, onChange, required }) {
  const [name, setName] = useState("");
  const [size, setSize] = useState("");

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setName("");
      setSize("");
      onChange(null);
      return;
    }

    const accepted = onChange(file);
    if (accepted === false) {
      e.target.value = "";
      setName("");
      setSize("");
      return;
    }

    setName(file.name);
    setSize(formatBytes(file.size));
  };

  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}{required ? " *" : ""}</span>
      <div className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-white">
        <UploadCloud size={18} />
        <span className="min-w-0 flex-1 truncate">{name || "Upload file"}</span>
        {size && <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] text-slate-400">{size}</span>}
      </div>
      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleChange} />
    </label>
  );
}

export default CaptainSignup;
