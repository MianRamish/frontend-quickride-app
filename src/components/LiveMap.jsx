<<<<<<< HEAD
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, useMap, useMapEvents } from "react-leaflet";
=======
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";

<<<<<<< HEAD
const defaultCenter = [6.5244, 3.3792];
=======
const defaultCenter = [43.6532, -79.3832];
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7

const createIcon = (color = "#111827") =>
  L.divIcon({
    className: "",
    html: `<div style="width:34px;height:34px;border-radius:18px;background:${color};border:4px solid white;box-shadow:0 10px 25px rgba(15,23,42,.28);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:999px;background:white"></div></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });

<<<<<<< HEAD
function MapTapHandler({ onMapClick }) {
  useMapEvents({
    click(event) {
      onMapClick?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

=======
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
function FitMapBounds({ center, markers, routeCoords }) {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...(Array.isArray(routeCoords) ? routeCoords : []),
      ...(markers || []).map((m) => [m.lat, m.lng]),
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
  }, [center, markers, routeCoords, map]);

  return null;
}

<<<<<<< HEAD
export default function LiveMap({ height = 260, center, markers = [], routeCoords = [], className = "", onMapClick = null }) {
=======
export default function LiveMap({ height = 260, center, markers = [], routeCoords = [], className = "" }) {
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
  const mapCenter = useMemo(() => center || defaultCenter, [center]);
  const mapHeight = typeof height === "number" ? `${height}px` : height;

  return (
<<<<<<< HEAD
    <div className={`quickride-map w-full overflow-hidden rounded-[30px] border border-white/70 bg-sky-100 shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${onMapClick ? "quickride-map-select" : ""} ${className}`} style={{ height: mapHeight }}>
=======
    <div className={`quickride-map w-full overflow-hidden rounded-[30px] border border-white/70 bg-sky-100 shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${className}`} style={{ height: mapHeight }}>
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        attributionControl={true}
<<<<<<< HEAD
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        {onMapClick ? <MapTapHandler onMapClick={onMapClick} /> : null}
=======
        zoomControl={true}
      >
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {Array.isArray(routeCoords) && routeCoords.length > 1 && (
          <Polyline positions={routeCoords} weight={6} opacity={0.85} color="#111827" />
        )}
        {markers.map((m) => (
          <Marker key={m.key} position={[m.lat, m.lng]} icon={createIcon(m.color || "#111827")}>
            <Popup>
              <div className="text-xs">
                <div className="font-bold text-slate-950">{m.title || "Marker"}</div>
                {m.subtitle ? <div className="mt-1 text-slate-500">{m.subtitle}</div> : null}
              </div>
            </Popup>
          </Marker>
        ))}
        <FitMapBounds center={mapCenter} markers={markers} routeCoords={routeCoords} />
      </MapContainer>
    </div>
  );
}
