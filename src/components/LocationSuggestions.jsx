import { MapPin } from "lucide-react";

function LocationSuggestions({
  suggestions = [],
  setSuggestions,
  setPickupLocation,
  setDestinationLocation,
  input,
}) {
  return (
    <div className="max-h-[34dvh] overflow-y-auto overscroll-contain rounded-[22px] border border-slate-200 bg-white p-1">
      {suggestions.map((suggestion, index) => (
        <button
          type="button"
          onClick={() => {
            if (input === "pickup") setPickupLocation(suggestion);
            if (input === "destination") setDestinationLocation(suggestion);
            setSuggestions([]);
          }}
          key={`${suggestion}-${index}`}
          className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition active:bg-slate-100"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <MapPin size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate-2 text-sm font-bold leading-5 text-slate-900">{suggestion}</span>
            <span className="mt-1 block text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {input === "pickup" ? "Set pickup" : "Set drop-off"}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

export default LocationSuggestions;
