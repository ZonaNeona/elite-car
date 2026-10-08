import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Площадки Car City / ELITE CAR (координаты — геокодер OpenStreetMap по публичным адресам)
const COORDS: Record<string, [number, number]> = {
  vernadskogo: [55.68292, 37.49362],
  mitino: [55.84892, 37.37918],
  kuntsevo: [55.70841, 37.41092],
};
// Подложка OpenStreetMap (без API-ключа, с указанием авторства); в тёмной теме затемняется CSS-фильтром
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">участники OpenStreetMap</a>';

type Branch = { id: string; name?: string; address?: string; [key: string]: unknown };

export function BranchMap({ branches, counts }: { branches: Branch[]; counts: Record<string, number> }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!box.current) return;
    const map = L.map(box.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 18 }).addTo(map);
    const points: L.LatLng[] = [];
    for (const b of branches) {
      const c = COORDS[b.id];
      if (!c) continue;
      const ll = L.latLng(c[0], c[1]);
      points.push(ll);
      L.marker(ll, {
        icon: L.divIcon({
          className: "map-pin",
          html: `<span>${counts[b.id] ?? ""}</span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
        title: b.name,
      })
        .bindTooltip(`<strong>${b.name}</strong><br>${b.address}`, { direction: "top", offset: [0, -16] })
        .addTo(map);
    }
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [36, 36] });
    // карточка могла поменять размер после первой отрисовки
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(box.current);
    return () => {
      resize.disconnect();
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches.map((b) => b.id).join(), JSON.stringify(counts)]);
  return <div className="branch-leaflet" ref={box} />;
}
