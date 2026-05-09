import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin,
  InfoWindow,
  useMap,
  Circle,
  useApiIsLoaded
} from '@vis.gl/react-google-maps';
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

const REGION_DATA = {
  '강서구': { center: { lat: 37.5509, lng: 126.8497 }, color: '#ef4444' }, // 마곡/가양 중심
  '양천구': { center: { lat: 37.5169, lng: 126.8665 }, color: '#3b82f6' }, // 목동 중심
  '영등포구': { center: { lat: 37.5264, lng: 126.8962 }, color: '#a855f7' }, // 여의도/영등포 중심
};

const REGION_COLORS = {
  '강서구': '#ef4444', 
  '양천구': '#3b82f6', 
  '영등포구': '#a855f7', 
};

function MapHandler({ 
  selectedCompany, 
  companies,
  isGeocodingComplete
}: { 
  selectedCompany: Company | undefined,
  companies: Company[],
  isGeocodingComplete: boolean
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

  // Initial fit bounds - Waits for geocoding to finish for all companies
  const [initialFitDone, setInitialFitDone] = useState(false);

  useEffect(() => {
    if (!map || companies.length === 0 || initialFitDone || !isGeocodingComplete) return;
    
    const companiesWithCoords = companies.filter(c => c.lat !== undefined && c.lng !== undefined);
    if (companiesWithCoords.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    companiesWithCoords.forEach(company => bounds.extend({ lat: company.lat!, lng: company.lng! }));
    
    // Optimized padding for high-resolution display of all companies
    map.fitBounds(bounds, {
      top: 100,
      right: 100,
      bottom: 120,
      left: 100
    });
    setInitialFitDone(true);
  }, [map, companies, initialFitDone, isGeocodingComplete]); 

  return null;
}

function GeocodingLayer({ 
  companies, 
  onGeocoded,
  onComplete
}: { 
  companies: Company[], 
  onGeocoded: (id: string, lat: number, lng: number) => void,
  onComplete: () => void
}) {
  const apiIsLoaded = useApiIsLoaded();

  useEffect(() => {
    if (!apiIsLoaded) return;

    const geocoder = new google.maps.Geocoder();
    let pending = companies.filter(c => c.lat === undefined || c.lng === undefined).length;
    
    if (pending === 0) {
      onComplete();
      return;
    }

    companies.forEach(company => {
      if (company.lat === undefined || company.lng === undefined) {
        geocoder.geocode({ address: company.address }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const { lat, lng } = results[0].geometry.location;
            onGeocoded(company.id, lat(), lng());
          } else {
            console.error(`Geocoding failed for ${company.name}: ${status}`);
          }
          
          pending--;
          if (pending === 0) {
            onComplete();
          }
        });
      }
    });
  }, [apiIsLoaded, companies]);

  return null;
}

export default function MapContainer({ 
  companies: initialCompanies, 
  filters,
  onSelectCompany,
  onHoverCompany,
  selectedCompanyId,
  hoveredCompanyId
}: MapContainerProps) {
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

  const [geocodedCoords, setGeocodedCoords] = useState<Record<string, { lat: number, lng: number }>>({});
  const [isGeocodingComplete, setIsGeocodingComplete] = useState(false);

  const handleGeocoded = useCallback((id: string, lat: number, lng: number) => {
    setGeocodedCoords(prev => ({ ...prev, [id]: { lat, lng } }));
  }, []);

  const companies = useMemo(() => {
    return initialCompanies.map(company => ({
      ...company,
      lat: company.lat ?? geocodedCoords[company.id]?.lat,
      lng: company.lng ?? geocodedCoords[company.id]?.lng,
    }));
  }, [initialCompanies, geocodedCoords]);

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
            isGeocodingComplete={isGeocodingComplete}
          />

          <GeocodingLayer 
            companies={initialCompanies} 
            onGeocoded={handleGeocoded} 
            onComplete={() => setIsGeocodingComplete(true)}
          />

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
