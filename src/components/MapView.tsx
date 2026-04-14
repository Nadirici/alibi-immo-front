"use client";
import { useEffect, useRef } from "react";
import type { Transaction } from "@/types";

interface Props {
  transactions: Transaction[];
}

function priceColor(priceM2: number): string {
  if (priceM2 < 3000) return "#6B8F71";       // vert sage
  if (priceM2 < 5000) return "#F59E0B";        // amber
  if (priceM2 < 8000) return "#EF4444";        // rouge
  return "#7C3AED";                            // violet = très cher
}

export default function MapView({ transactions }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Import dynamique de Leaflet (évite SSR)
    import("leaflet").then((L) => {
      // Fix icône par défaut Leaflet
      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView([48.85, 2.15], 10);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      transactions.forEach((t) => {
        if (!t.lat || !t.lng) return;
        const priceM2 = t.surface > 0 ? Math.round(t.price / t.surface) : 0;
        const color = priceColor(priceM2);

        const marker = L.circleMarker([t.lat, t.lng], {
          radius: 6,
          fillColor: color,
          color: "#fff",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.85,
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 13px; min-width: 180px">
            <strong>${t.address ?? t.commune_name}</strong><br/>
            <span style="color: #C4622D; font-weight: bold">${t.price.toLocaleString("fr-FR")} €</span><br/>
            ${t.surface} m² · ${priceM2.toLocaleString("fr-FR")} €/m²<br/>
            <span style="color: #999">${t.date_mutation}</span>
          </div>
        `);

        marker.addTo(map);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} className="w-full h-full rounded-xl" />;
}
