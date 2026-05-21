import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";

const defaultCenter = [43.6532, -79.3832];

const createIcon = (color = "#111827") =>
  L.divIcon({
    className: "",
    html: `<div style="width:34px;height:34px;border-radius:18px;background:${color};border:4px solid white;box-shadow:0 10px 25px rgba(15,23,42,.28);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:999px;background:white"></div></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });

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

export default function LiveMap({ height = 260, center, markers = [], routeCoords = [], className = "" }) {
  const mapCenter = useMemo(() => center || defaultCenter, [center]);
  const mapHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div className={`quickride-map w-full overflow-hidden rounded-[30px] border border-white/70 bg-sky-100 shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${className}`} style={{ height: mapHeight }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        attributionControl={true}
        zoomControl={true}
      >
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
