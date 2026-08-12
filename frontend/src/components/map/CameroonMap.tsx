import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Listing } from "@/lib/cameroon-data";
import { cn } from "@/lib/utils";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BOUNDS = { minLng: 8.4, maxLng: 16.3, minLat: 1.6, maxLat: 13.2 };
const DEFAULT_CENTER: [number, number] = [6.0, 12.5];

type Props = {
  listings: Listing[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  className?: string;
  showCities?: boolean;
};

// Component to handle map interactions like zooming to active marker
function MapInteractions({ activeId, listings }: { activeId?: string | null; listings: Listing[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (activeId) {
      const active = listings.find((l) => l.id === activeId);
      if (active) {
        map.flyTo([active.lat, active.lng], 10, {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      }
    } else {
      // Fit all listings
      if (listings.length > 0) {
        const bounds = L.latLngBounds(listings.map(l => [l.lat, l.lng]));
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
      }
    }
  }, [activeId, listings, map]);

  return null;
}

// Function to create a custom div icon mimicking the previous styling
const createCustomIcon = (price: number, isActive: boolean) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="num whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium shadow-[0_6px_18px_-6px_rgba(14,22,38,0.5)] border transition-colors ${
      isActive
        ? 'bg-departure-navy text-cloud-white border-departure-navy'
        : 'bg-cloud-white text-ink-90 border-ink-90/10 hover:bg-departure-navy hover:text-cloud-white'
    }">$${price}</div>`,
    iconSize: [40, 24],
    iconAnchor: [20, 12],
  });
};

export function CameroonMap({
  listings,
  activeId,
  onSelect,
  onHover,
  className,
}: Props) {
  const mapRef = useRef<L.Map>(null);
  
  const tileUrl = import.meta.env.VITE_STADIA_MAPS_API_KEY 
    ? `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_STADIA_MAPS_API_KEY}`
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div className={cn("relative overflow-hidden bg-runway-sand/40 rounded-xl", className)}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={6}
        className="w-full h-full z-0"
        ref={mapRef}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          url={tileUrl}
        />
        
        {listings.map((l) => {
          const isActive = activeId === l.id;
          return (
            <Marker
              key={l.id}
              position={[l.lat, l.lng]}
              icon={createCustomIcon(l.usd, isActive)}
              eventHandlers={{
                click: () => onSelect?.(l.id),
                mouseover: () => onHover?.(l.id),
                mouseout: () => onHover?.(null),
              }}
              zIndexOffset={isActive ? 1000 : 0}
            />
          );
        })}

        <MapInteractions activeId={activeId} listings={listings} />
      </MapContainer>
      
      {/* Controls Overlay */}
      <div className="absolute right-3 top-3 flex flex-col bg-cloud-white rounded-md overflow-hidden border border-ink-90/10 shadow-sm z-[1000]">
        <button onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in" className="w-9 h-9 text-lg leading-none hover:bg-runway-sand">＋</button>
        <div className="h-px bg-ink-90/10" />
        <button onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out" className="w-9 h-9 text-lg leading-none hover:bg-runway-sand">－</button>
      </div>
      <button
        onClick={() => {
           if (listings.length > 0) {
              const bounds = L.latLngBounds(listings.map(l => [l.lat, l.lng]));
              mapRef.current?.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
            }
        }}
        className="absolute left-3 bottom-3 num text-[10px] uppercase tracking-[0.2em] bg-cloud-white border border-ink-90/10 px-3 py-2 rounded-md hover:bg-runway-sand z-[1000] shadow-sm"
      >
        Reset view
      </button>
      <span className="absolute right-3 bottom-3 num text-[10px] uppercase tracking-[0.2em] text-ink-60 bg-cloud-white/80 px-2 py-1 rounded z-[1000] backdrop-blur-sm shadow-sm border border-cloud-white">
        Cameroon · {listings.length} stays
      </span>
    </div>
  );
}
