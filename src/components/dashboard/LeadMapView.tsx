"use client";

import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { DashboardMapMarker } from "@/actions/metrics";
import "leaflet/dist/leaflet.css";

function FitBounds({ markers }: { markers: DashboardMapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 12);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 });
  }, [map, markers]);

  return null;
}

function markerRadius(count: number, maxCount: number): number {
  if (count <= 1) return 8;
  const scale = count / Math.max(maxCount, 1);
  return Math.round(10 + scale * 14);
}

export function LeadMapView({
  markers,
  dark,
}: {
  markers: DashboardMapMarker[];
  dark: boolean;
}) {
  const maxCount = useMemo(() => Math.max(...markers.map((m) => m.count), 1), [markers]);

  const center = useMemo((): [number, number] => {
    const lat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
    const lng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;
    return [lat, lng];
  }, [markers]);

  const tileUrl = dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution = dark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <MapContainer
      center={center}
      zoom={10}
      className="h-full w-full rounded-xl"
      scrollWheelZoom={false}
      attributionControl
    >
      <TileLayer url={tileUrl} attribution={attribution} />
      <FitBounds markers={markers} />
      {markers.map((m) => (
        <CircleMarker
          key={m.id}
          center={[m.lat, m.lng]}
          radius={markerRadius(m.count, maxCount)}
          pathOptions={{
            color: "#6d28d9",
            fillColor: "#7c3aed",
            fillOpacity: 0.88,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-slate-900">{m.label}</p>
              {m.city ? <p className="text-slate-600">{m.city}</p> : null}
              {m.count > 1 ? (
                <p className="mt-1 font-medium text-violet-700">{m.count} leads</p>
              ) : null}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
