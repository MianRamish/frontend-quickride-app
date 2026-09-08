<<<<<<< HEAD
import { Building2, GraduationCap, MapPin, Plane, Search, ShoppingBag } from "lucide-react";

const getSuggestionIcon = (suggestion = "") => {
  const value = suggestion.toLowerCase();
  if (value.includes("university") || value.includes("college")) return GraduationCap;
  if (value.includes("airport")) return Plane;
  if (value.includes("mall") || value.includes("market")) return ShoppingBag;
  if (value.includes("hotel") || value.includes("hospital") || value.includes("centre")) return Building2;
  return MapPin;
};
=======
import { MapPin } from "lucide-react";
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7

function LocationSuggestions({
  suggestions = [],
  setSuggestions,
  setPickupLocation,
  setDestinationLocation,
  input,
<<<<<<< HEAD
  loading = false,
  query = "",
  onSelectSuggestion,
}) {
  const chooseSuggestion = (suggestion) => {
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion, input);
    } else {
      if (input === "pickup") setPickupLocation?.(suggestion);
      if (input === "destination") setDestinationLocation?.(suggestion);
    }
    setSuggestions?.([]);
  };

  return (
    <div className="location-suggestion-panel">
      <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            {input === "pickup" ? "Pickup suggestions" : "Destination suggestions"}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">Choose a result to lock the location.</p>
        </div>
        {loading ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
          </span>
        ) : null}
      </div>

      <div className="max-h-[31dvh] overflow-y-auto overscroll-contain px-1 pb-1">
        {suggestions.map((suggestion, index) => {
          const Icon = getSuggestionIcon(suggestion);
          const parts = suggestion.split(",").map((part) => part.trim()).filter(Boolean);
          const title = parts.shift() || suggestion;
          const subtitle = parts.join(", ");

          return (
            <button
              type="button"
              onClick={() => chooseSuggestion(suggestion)}
              key={`${suggestion}-${index}`}
              className="group flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left transition hover:bg-slate-50 active:scale-[0.99] active:bg-slate-100"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-slate-100 text-slate-700 transition group-hover:bg-emerald-50 group-hover:text-emerald-700">
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-black text-slate-950">{title}</span>
                <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-500">
                  {subtitle || "Nigeria"}
                </span>
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
                Select
              </span>
            </button>
          );
        })}

        {!loading && query.length >= 3 && suggestions.length === 0 ? (
          <div className="mx-2 mb-2 flex items-start gap-3 rounded-[18px] bg-slate-50 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
              <Search size={17} />
            </span>
            <div>
              <p className="text-xs font-black text-slate-800">No matching place yet</p>
              <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
                Try a specific area, landmark, university, airport or city name in Nigeria.
              </p>
            </div>
          </div>
        ) : null}
      </div>
=======
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
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
    </div>
  );
}

export default LocationSuggestions;
