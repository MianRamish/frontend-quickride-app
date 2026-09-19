import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";

const defaultCenter = [6.5244, 3.3792];

const createIcon = ({ color = "#111827", kind = "point", label = "", animated = false } = {}) => {
  if (kind === "vehicle") {
    return L.divIcon({
      className: animated ? "quickride-moving-marker" : "",
      html: `
        <div style="width:44px;height:44px;border-radius:16px;background:${color};border:4px solid white;box-shadow:0 10px 28px rgba(15,23,42,.30);display:flex;align-items:center;justify-content:center;">
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 17h14"/><path d="M6 17v2"/><path d="M18 17v2"/><path d="M4 13l1.5-5h13L20 13"/><path d="M4 13v4h16v-4"/><circle cx="7.5" cy="14.5" r="1"/><circle cx="16.5" cy="14.5" r="1"/>
          </svg>
        </div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -23],
    });
  }

  if (kind === "zone") {
    return L.divIcon({
      className: "",
      html: `<div style="min-width:42px;height:42px;padding:0 8px;border-radius:21px;background:${color};border:4px solid white;box-shadow:0 10px 25px rgba(15,23,42,.24);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:900;">${String(label || "0")}</div>`,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -22],
    });
  }

  return L.divIcon({
    className: "",
    html: `<div style="width:34px;height:34px;border-radius:18px;background:${color};border:4px solid white;box-shadow:0 10px 25px rgba(15,23,42,.28);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:999px;background:white"></div></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
};

function MapTapHandler({ onMapClick }) {
  useMapEvents({
    click(event) {
      onMapClick?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function FitMapBounds({ center, markers, routeCoords }) {
  const map = useMap();
  const stableMarkers = (markers || []).filter((marker) => !marker.animated);
  const fitMarkers = stableMarkers.length || (routeCoords || []).length ? stableMarkers : markers;
  const fitSignature = [
    Array.isArray(center) ? center.join(",") : "",
    (routeCoords || []).length,
    routeCoords?.[0]?.join?.(",") || "",
    routeCoords?.[routeCoords.length - 1]?.join?.(",") || "",
    ...(fitMarkers || []).map((m) => `${m.key}:${m.lat},${m.lng}`),
  ].join("|");

  useEffect(() => {
    const points = [
      ...(Array.isArray(routeCoords) ? routeCoords : []),
      ...(fitMarkers || []).map((m) => [m.lat, m.lng]),
    ].filter((point) => Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]));

    if (points.length > 1) {
      map.fitBounds(points, { padding: [42, 42], maxZoom: 15 });
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    if (Array.isArray(center)) map.setView(center, 13);
  }, [fitSignature, map]);

  return null;
}

function KeepMarkerVisible({ markers, followMarkerKey }) {
  const map = useMap();
  const marker = (markers || []).find((item) => item.key === followMarkerKey);

  useEffect(() => {
    if (!marker || !Number.isFinite(marker.lat) || !Number.isFinite(marker.lng)) return;
    const point = L.latLng(marker.lat, marker.lng);
    const comfortableBounds = map.getBounds().pad(-0.18);
    if (!comfortableBounds.contains(point)) {
      map.panTo(point, { animate: true, duration: 0.75 });
    }
  }, [marker?.lat, marker?.lng, followMarkerKey, map]);

  return null;
}

function MapMarker({ marker }) {
  const icon = useMemo(
    () => createIcon({
      color: marker.color || "#111827",
      kind: marker.kind || "point",
      label: marker.label || "",
      animated: Boolean(marker.animated),
    }),
    [marker.color, marker.kind, marker.label, marker.animated]
  );

  return (
    <Marker position={[marker.lat, marker.lng]} icon={icon}>
      <Popup>
        <div className="text-xs">
          <div className="font-bold text-slate-950">{marker.title || "Marker"}</div>
          {marker.subtitle ? <div className="mt-1 text-slate-500">{marker.subtitle}</div> : null}
        </div>
      </Popup>
    </Marker>
  );
}

export default function LiveMap({ height = 260, center, markers = [], routeCoords = [], className = "", onMapClick = null, followMarkerKey = null }) {
  const mapCenter = useMemo(() => center || defaultCenter, [center]);
  const mapHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div className={`quickride-map w-full overflow-hidden rounded-[30px] border border-white/70 bg-sky-100 shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${onMapClick ? "quickride-map-select" : ""} ${className}`} style={{ height: mapHeight }}>
      <style>{`.quickride-moving-marker { transition: transform 2200ms linear !important; will-change: transform; }`}</style>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        attributionControl={true}
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        {onMapClick ? <MapTapHandler onMapClick={onMapClick} /> : null}
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {Array.isArray(routeCoords) && routeCoords.length > 1 && (
          <Polyline positions={routeCoords} weight={6} opacity={0.85} color="#111827" />
        )}
        {markers.map((marker) => <MapMarker key={marker.key} marker={marker} />)}
        <FitMapBounds center={mapCenter} markers={markers} routeCoords={routeCoords} />
        {followMarkerKey ? <KeepMarkerVisible markers={markers} followMarkerKey={followMarkerKey} /> : null}
      </MapContainer>
    </div>
  );
}
