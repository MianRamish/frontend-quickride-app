import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Building2, CheckCircle2, GraduationCap, MapPin, Plane, Search, ShoppingBag } from "lucide-react";

const NIGERIA_SERVICE_BOUNDS = { west: 2.4, south: 4.2, east: 14.7, north: 13.9 };

const isNigeriaSuggestion = (suggestion = "") =>
  /(^|,|\s)nigeria(?:\s|,|$)/i.test(String(suggestion || "").trim());

const isWithinNigeriaServiceBounds = (lat, lng) =>
  Number.isFinite(Number(lat)) &&
  Number.isFinite(Number(lng)) &&
  Number(lng) >= NIGERIA_SERVICE_BOUNDS.west &&
  Number(lng) <= NIGERIA_SERVICE_BOUNDS.east &&
  Number(lat) >= NIGERIA_SERVICE_BOUNDS.south &&
  Number(lat) <= NIGERIA_SERVICE_BOUNDS.north;

const getSuggestionIcon = (suggestion = "") => {
  const value = suggestion.toLowerCase();
  if (value.includes("university") || value.includes("college")) return GraduationCap;
  if (value.includes("airport")) return Plane;
  if (value.includes("mall") || value.includes("market")) return ShoppingBag;
  if (value.includes("hotel") || value.includes("hospital") || value.includes("centre")) return Building2;
  return MapPin;
};

function HighlightMatch({ text = "", query = "" }) {
  const normalized = query.trim();
  if (!normalized) return text;
  const index = text.toLowerCase().indexOf(normalized.toLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-emerald-100 text-inherit">{text.slice(index, index + normalized.length)}</mark>
      {text.slice(index + normalized.length)}
    </>
  );
}

function LocationSuggestions({
  value = "",
  onValueChange,
  onSelectSuggestion,
  token,
  inputId = "location",
  label = "",
  placeholder = "Search area, street or landmark",
  userLocation = null,
  confirmed = false,
  variant = "route",
  minChars = 3,
  disabled = false,
  autoFocus = false,
  helperText = "Choose a suggestion to confirm the exact location.",
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchError, setSearchError] = useState("");
  const requestRef = useRef(0);
  const timerRef = useRef(null);
  const rootRef = useRef(null);

  const query = value.trim();
  const canSearch = query.length >= minChars && !confirmed;

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (!canSearch || !token) {
      setSuggestions([]);
      setLoading(false);
      setSearchError("");
      return undefined;
    }

    setLoading(true);
    setSearchError("");
    const requestId = ++requestRef.current;
    timerRef.current = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ input: query });
        if (Number.isFinite(Number(userLocation?.lat)) && Number.isFinite(Number(userLocation?.lng))) {
          params.set("lat", String(userLocation.lat));
          params.set("lng", String(userLocation.lng));
        }
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/map/get-suggestions?${params.toString()}`,
          { headers: { token } }
        );
        if (requestId !== requestRef.current) return;
        const nigeriaOnly = Array.isArray(response.data)
          ? response.data.filter(isNigeriaSuggestion).slice(0, 8)
          : [];
        setSuggestions(nigeriaOnly);
        setSearchError(nigeriaOnly.length ? "" : "No matching location found in Nigeria.");
        setOpen(true);
        setActiveIndex(-1);
      } catch (_) {
        if (requestId !== requestRef.current) return;
        setSuggestions([]);
        setSearchError("Unable to search locations right now.");
        setOpen(true);
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    }, 250);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [query, canSearch, token, userLocation?.lat, userLocation?.lng, minChars]);

  const chooseSuggestion = async (suggestion) => {
    try {
      setResolving(true);
      setSearchError("");
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/map/get-coordinates?address=${encodeURIComponent(suggestion)}`,
        { headers: { token } }
      );
      const lat = Number(response.data?.ltd);
      const lng = Number(response.data?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("Coordinates unavailable");
      if (!isNigeriaSuggestion(suggestion) || !isWithinNigeriaServiceBounds(lat, lng)) {
        setSearchError("QuickRide locations are currently limited to Nigeria.");
        setOpen(true);
        return;
      }
      onValueChange?.(suggestion);
      onSelectSuggestion?.({ address: suggestion, lat, lng, provider: response.data?.provider || "suggestion" }, inputId);
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
    } catch (error) {
      setSearchError(error?.response?.data?.message || "Unable to confirm this location. Try another suggestion.");
      setOpen(true);
    } finally {
      setResolving(false);
    }
  };

  const onKeyDown = (event) => {
    if (!open || !suggestions.length) {
      if (event.key === "ArrowDown" && suggestions.length) setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      chooseSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const input = (
    <input
      id={inputId}
      value={value}
      onChange={(event) => {
        onValueChange?.(event.target.value);
        setOpen(true);
      }}
      onFocus={() => {
        if (canSearch) setOpen(true);
      }}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoComplete="off"
      inputMode="search"
      autoFocus={autoFocus}
      disabled={disabled}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open && canSearch}
      aria-controls={`${inputId}-suggestions`}
      className={variant === "route" ? "location-input" : "input-box !pl-11 !pr-11"}
    />
  );

  const resultPanel = open && canSearch ? (
    <div
      id={`${inputId}-suggestions`}
      role="listbox"
      className="absolute left-0 right-0 top-[calc(100%+8px)] z-[800] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,.18)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Location suggestions</p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{helperText}</p>
        </div>
        {(loading || resolving) ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" /> : null}
      </div>

      <div className="max-h-[32dvh] overflow-y-auto overscroll-contain p-1 sm:max-h-[280px]">
        {suggestions.map((suggestion, index) => {
          const Icon = getSuggestionIcon(suggestion);
          const parts = suggestion.split(",").map((part) => part.trim()).filter(Boolean);
          const title = parts.shift() || suggestion;
          const subtitle = parts.join(", ") || "Nigeria";
          const active = index === activeIndex;
          return (
            <button
              key={`${suggestion}-${index}`}
              type="button"
              role="option"
              aria-selected={active}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => chooseSuggestion(suggestion)}
              className={`flex w-full items-center gap-3 rounded-[17px] px-3 py-3 text-left transition ${active ? "bg-emerald-50" : "hover:bg-slate-50"}`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] ${active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                <Icon size={17} strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-black text-slate-950"><HighlightMatch text={title} query={query} /></span>
                <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-500">{subtitle}</span>
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-slate-500">Select</span>
            </button>
          );
        })}

        {!loading && !suggestions.length ? (
          <div className="m-2 flex items-start gap-3 rounded-[17px] bg-slate-50 p-3">
            <Search size={17} className="mt-0.5 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs font-black text-slate-800">{searchError || "No matching location found"}</p>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">Try an area, street, landmark, university, airport or city in Nigeria.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

  if (variant === "route") {
    return (
      <div ref={rootRef} className="relative min-w-0 flex-1">
        <label className="location-input-shell">
          {label ? <span className="location-input-label">{label}</span> : null}
          <span className="flex min-w-0 items-center gap-2">
            {input}
            {confirmed ? <CheckCircle2 className="shrink-0 text-emerald-600" size={18} /> : null}
          </span>
        </label>
        {resultPanel}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <Search className="pointer-events-none absolute left-4 top-[26px] z-10 -translate-y-1/2 text-slate-400" size={18} />
      {input}
      {confirmed ? <CheckCircle2 className="pointer-events-none absolute right-4 top-[26px] -translate-y-1/2 text-emerald-600" size={18} /> : null}
      {resultPanel}
    </div>
  );
}

export default LocationSuggestions;
