import { useState, useMemo } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { type Listing } from '@/lib/cameroon-data'; // Use existing mock data
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';

type Props = {
  listings: Listing[];
  activeId?: string | null;
  onSelect?: (id: string | null) => void;
  className?: string;
};

export function ExploreMap({ listings, activeId, onSelect, className }: Props) {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState({
    longitude: 12.5,
    latitude: 6.0,
    zoom: 5
  });

  return (
    <div className={cn("relative w-full h-full", className)}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        interactiveLayerIds={['clusters']}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        <GeolocateControl position="bottom-right" />

        {listings.map((listing) => {
          const isActive = activeId === listing.id;
          return (
            <Marker
              key={listing.id}
              longitude={listing.lng}
              latitude={listing.lat}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                onSelect?.(listing.id);
                navigate({ to: '/stays/$stayId', params: { stayId: listing.id } });
              }}
              style={{ zIndex: isActive ? 10 : 1 }}
            >
              <div 
                className={cn(
                  "px-3 py-1.5 rounded-[var(--radius-button)] font-medium text-sm transition-all duration-300 shadow-card cursor-pointer border",
                  isActive 
                    ? "bg-primary text-primary-foreground border-primary scale-110" 
                    : "bg-card text-card-foreground border-border hover:scale-105"
                )}
              >
                ${listing.usd}
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
