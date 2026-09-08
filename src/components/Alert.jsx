import { useEffect, useState } from "react";
<<<<<<< HEAD
import { CheckCircle2, CircleAlert, X } from "lucide-react";

export const Alert = ({ heading, text, isVisible, onClose, type = "success" }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let showTimer;
    let hideTimer;
    let autoCloseTimer;

    if (isVisible) {
      setShouldRender(true);
      showTimer = setTimeout(() => setIsAnimating(true), 12);
      autoCloseTimer = setTimeout(() => {
        setIsAnimating(false);
        hideTimer = setTimeout(() => {
          setShouldRender(false);
          onClose?.();
        }, 220);
      }, 4200);
    } else {
      setIsAnimating(false);
      hideTimer = setTimeout(() => setShouldRender(false), 220);
    }

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(autoCloseTimer);
    };
  }, [isVisible, onClose]);

  if (!shouldRender) return null;

  const isFailure = type === "failure";
  const Icon = isFailure ? CircleAlert : CheckCircle2;
  const accentClass = isFailure ? "toast-accent-failure" : "toast-accent-success";
  const iconWrapClass = isFailure ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600";

  return (
    <div className="toast-viewport" aria-live="assertive" role="status">
      <div
        className={`toast-card transition-all duration-200 ${
          isAnimating ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        }`}
      >
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconWrapClass}`}>
            <Icon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950">{heading}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{text}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close alert"
              >
                <X size={17} />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className={`h-1.5 flex-1 rounded-full ${accentClass}`} />
              <button
                type="button"
                onClick={onClose}
                className={`rounded-full px-3 py-1.5 text-[11px] font-black ${
                  isFailure ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                }`}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
=======
import Button from "./Button";

export const Alert = ({ heading, text, isVisible, onClose, type }) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const status = {
        success: "bg-green-500",
        failure: "bg-red-600"
    }

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            setTimeout(() => setIsAnimating(true), 10);
        } else {
            setIsAnimating(false);
            setTimeout(() => setShouldRender(false), 300);
        }
    }, [isVisible]);

    if (!shouldRender) return null;

    return (
        <div className={`absolute text-center left-0 top-0 w-full bg-black min-h-dvh flex justify-center items-center z-50 backdrop-blur-sm transition-all duration-300 ${isAnimating ? 'bg-opacity-60' : 'bg-opacity-0'}`}>
            <div className={`w-4/5 p-5 pt-7 bg-white rounded-xl transition-all duration-300 transform ${isAnimating ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
                <h1 className='font-semibold text-base'>{heading}</h1>
                <p className='text-sm font-normal text-zinc-600 mt-4 mb-6 text-pretty'>{text}</p>
                <Button
                    title={"Okay"}
                    fun={onClose}
                    classes={type && status[type]}
                />
            </div>
        </div>
    );
};
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
