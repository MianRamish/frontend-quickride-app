import { Banknote, Check, CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";

const fallbackMethods = [
  { id: "cash", label: "Cash", enabled: true, status: "available", description: "Pay your driver in cash after the trip." },
  { id: "card", label: "Card", enabled: false, status: "coming_soon", description: "Card payments are coming soon." },
];

function PaymentMethodSelector({ methods = fallbackMethods, selected = "cash", onChange }) {
  const safeMethods = Array.isArray(methods) && methods.length ? methods : fallbackMethods;

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="mini-label">Payment</p>
          <h3 className="text-lg font-black tracking-tight text-slate-950">How will you pay?</h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700"><ShieldCheck size={12} /> Cash live</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {safeMethods.map((method) => {
          const isCash = method.id === "cash";
          const Icon = isCash ? Banknote : CreditCard;
          const isSelected = selected === method.id;
          const disabled = !method.enabled;

          return (
            <button
              key={method.id}
              type="button"
              disabled={disabled}
              onClick={() => method.enabled && onChange?.(method.id)}
              className={`relative min-h-[142px] overflow-hidden rounded-[24px] border p-3.5 text-left transition active:scale-[.98] ${isSelected ? "border-emerald-500 bg-emerald-50/70 shadow-[0_12px_30px_rgba(16,185,129,.12)]" : "border-slate-200 bg-white"} ${disabled ? "cursor-not-allowed opacity-70 active:scale-100" : ""}`}
            >
              {disabled && <div className="absolute -right-8 top-3 rotate-45 bg-slate-950 px-9 py-1 text-[9px] font-black uppercase tracking-wide text-white">Soon</div>}
              <div className="flex items-start justify-between gap-2">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}><Icon size={20} /></span>
                {isSelected ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white"><Check size={14} strokeWidth={3} /></span> : disabled ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400"><LockKeyhole size={13} /></span> : null}
              </div>
              <h4 className="mt-4 text-sm font-black text-slate-950">{method.label}</h4>
              <p className="mt-1 pr-1 text-[11px] font-semibold leading-4 text-slate-500">{disabled ? "Prepared for future gateway integration" : "Pay your driver directly after the trip"}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PaymentMethodSelector;
