import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import { MarkerClusterer, Marker } from '@googlemaps/markerclusterer';
import { Company } from '../../types/company';
import { Compass } from 'lucide-react';

interface MapContainerProps {
  companies: Company[];
  filters?: {
    searchTerm: string;
    selectedRegions: string[];
    selectedCerts: string[];
  };
  onSelectCompany: (company: Company | null) => void;
  onHoverCompany: (id: string | null) => void;
  selectedCompanyId?: string;
  hoveredCompanyId?: string | null;
}

const DEFAULT_CENTER = { lat: 37.53, lng: 126.87 };
const DEFAULT_ZOOM = 13;

const REGION_COLORS = {
  '강서구': '#ef4444', 
  '양천구': '#3b82f6', 
  '영등포구': '#a855f7', 
};

function MapHandler({ 
  selectedCompany, 
  companies
}: { 
  selectedCompany: Company | undefined,
  companies: Company[]
}) {
  const map = useMap();

  // Focus on selected company
  useEffect(() => {
    if (!map || !selectedCompany || selectedCompany.lat === undefined) return;
    
    const targetPos = { lat: selectedCompany.lat, lng: selectedCompany.lng! };
    const bounds = map.getBounds();
    
    if (bounds && !bounds.contains(targetPos)) {
      const isPC = window.innerWidth >= 1024;
      if (isPC) {
        map.panTo(targetPos);
        setTimeout(() => {
          map.panBy(-200, 0); 
        }, 100);
      } else {
        map.panTo(targetPos);
      }
    }
  }, [map, selectedCompany?.id]);

  // Initial fit bounds
  const [initialFitDone, setInitialFitDone] = useState(false);

  useEffect(() => {
    if (!map || companies.length === 0 || initialFitDone) return;
    
    const companiesWithCoords = companies.filter(c => c.lat !== undefined && c.lng !== undefined);
    if (companiesWithCoords.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    companiesWithCoords.forEach(company => bounds.extend({ lat: company.lat!, lng: company.lng! }));
    
    map.fitBounds(bounds, {
      top: 100,
      right: 100,
      bottom: 120,
      left: 100
    });
    setInitialFitDone(true);
  }, [map, companies, initialFitDone]); 

  return null;
}

/**
 * Marker Clustering Component
 */
const MarkersWithClustering = ({ 
  companies, 
  onSelectCompany, 
  selectedCompanyId, 
  hoveredCompanyId 
}: { 
  companies: Company[], 
  onSelectCompany: (company: Company) => void,
  selectedCompanyId?: string,
  hoveredCompanyId?: string | null
}) => {
  const map = useMap();
  const [markers, setMarkers] = useState<{[key: string]: Marker}>({});
  const clusterer = useRef<MarkerClusterer | null>(null);

  // Initialize clusterer
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }

    return () => {
      if (clusterer.current) {
        clusterer.current.clearMarkers();
        clusterer.current.setMap(null);
        clusterer.current = null;
      }
    };
  }, [map]);

  // Update markers and clusters
  useEffect(() => {
    if (!clusterer.current) return;

    clusterer.current.clearMarkers();
    clusterer.current.addMarkers(Object.values(markers));
  }, [markers]);

  const setMarkerRef = useCallback((marker: Marker | null, key: string) => {
    if (marker && markers[key]) return;
    if (!marker && !markers[key]) return;

    setMarkers(prev => {
      if (marker) {
        return {...prev, [key]: marker};
      } else {
        const newMarkers = {...prev};
        delete newMarkers[key];
        return newMarkers;
      }
    });
  }, [markers]);

  return (
    <>
      {companies.map((company) => {
        if (company.lat === undefined || company.lng === undefined) return null;

        const isHovered = hoveredCompanyId === company.id;
        const isSelected = selectedCompanyId === company.id;
        
        return (
          <AdvancedMarker
            key={company.id}
            position={{ lat: company.lat, lng: company.lng }}
            onClick={() => onSelectCompany(company)}
            zIndex={isHovered || isSelected ? 100 : 1}
            ref={marker => setMarkerRef(marker as unknown as Marker, company.id)}
          >
            <Pin 
              background={REGION_COLORS[company.region]} 
              borderColor={'#ffffff'} 
              glyphColor={'#ffffff'}
              scale={isSelected ? 1.3 : isHovered ? 1.2 : 1}
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
};

export default function MapContainer({ 
  companies, 
  onSelectCompany,
  selectedCompanyId,
  hoveredCompanyId
}: MapContainerProps) {
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const activeInfoWindowCompany = selectedCompany;

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="w-full h-full relative">
        <Map
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          mapId={MAP_ID}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
        >
          <MapHandler 
            selectedCompany={selectedCompany} 
            companies={companies}
          />

          <MarkersWithClustering 
            companies={companies}
            onSelectCompany={onSelectCompany}
            selectedCompanyId={selectedCompanyId}
            hoveredCompanyId={hoveredCompanyId}
          />

          {activeInfoWindowCompany && activeInfoWindowCompany.lat !== undefined && (
            <InfoWindow
              position={{ lat: activeInfoWindowCompany.lat, lng: activeInfoWindowCompany.lng! }}
              pixelOffset={[0, -10]}
              disableAutoPan={false}
              headerDisabled={true}
              onCloseClick={() => onSelectCompany(null)}
            >
              <div 
                className="flex items-center gap-3 p-1.5 min-w-[180px] cursor-pointer active:bg-gray-50 transition-colors"
                onClick={() => onSelectCompany(activeInfoWindowCompany)}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-white">
                  <img 
                    src={activeInfoWindowCompany.logo} 
                    alt="" 
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNkNGRiZTkiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0zIDIxVjdMMTIgM0wyMSA3VjIxSDN6Ii8+PHBhdGggZD0iTTkgMjFWOXoiLz48cGF0aCBkPSJNMTUgMjFWMTN6Ii8+PC9zdmc+';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-brand-primary uppercase tracking-wider mb-0.5">
                    {activeInfoWindowCompany.industry}
                  </p>
                  <h4 className="text-xs font-black text-gray-900 truncate leading-tight">
                    {activeInfoWindowCompany.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-gray-400 font-medium">
                      {activeInfoWindowCompany.region}
                    </p>
                    <p className="text-[9px] font-black text-brand-primary/60 animate-pulse">
                      자세히 보기 →
                    </p>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>

        <MapInnerControl DEFAULT_CENTER={DEFAULT_CENTER} DEFAULT_ZOOM={DEFAULT_ZOOM} />
      </div>
    </APIProvider>
  );
}

function MapControl({ onRecenter }: { onRecenter: () => void }) {
  return (
    <button
      onClick={onRecenter}
      className="absolute right-3 top-20 p-2.5 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors z-20 text-gray-600"
      title="지도를 초기 위치로 이동"
    >
      <Compass size={20} />
    </button>
  );
}

function MapInnerControl({ DEFAULT_CENTER, DEFAULT_ZOOM }: { DEFAULT_CENTER: { lat: number, lng: number }, DEFAULT_ZOOM: number }) {
  const map = useMap();
  
  const handleRecenter = () => {
    if (map) {
      map.panTo(DEFAULT_CENTER);
      map.setZoom(DEFAULT_ZOOM);
    }
  };

  return <MapControl onRecenter={handleRecenter} />;
}
