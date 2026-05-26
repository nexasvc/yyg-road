import { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin,
  InfoWindow,
  useMap
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

const REGION_COLORS = {
  '강서구': '#ef4444', 
  '양천구': '#3b82f6', 
  '영등포구': '#8b5cf6', 
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
      const isPC = window.innerWidth >= 768;
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
 * Individual Marker Component
 */
const CompanyMarker = memo(({ 
  company, 
  isSelected, 
  onSelectCompany
}: { 
  company: Company, 
  isSelected: boolean, 
  onSelectCompany: (company: Company) => void
}) => {
  const isHiring = company.jobs?.saramin || company.jobs?.jobkorea || company.jobs?.work24;

  return (
    <AdvancedMarker
      position={{ lat: company.lat!, lng: company.lng! }}
      onClick={() => onSelectCompany(company)}
      zIndex={isSelected ? 1000 : 1}
    >
      <div className="relative">
        {isHiring && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white z-10 animate-pulse shadow-sm" />
        )}
        <Pin 
          background={REGION_COLORS[company.region]} 
          borderColor={isSelected ? '#000000' : '#ffffff'} 
          glyphColor={'#ffffff'}
          scale={isSelected ? 1.4 : 1}
        />
      </div>
    </AdvancedMarker>
  );
});

export default function MapContainer({ 
  companies, 
  onSelectCompany,
  selectedCompanyId
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

          {companies.map((company) => {
            if (company.lat === undefined || company.lng === undefined) return null;
            const isSelected = selectedCompanyId === company.id;
            
            return (
              <CompanyMarker
                key={company.id}
                company={company}
                isSelected={isSelected}
                onSelectCompany={onSelectCompany}
              />
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
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-xs font-black text-gray-900 truncate leading-tight flex-1">
                      {activeInfoWindowCompany.name}
                    </h4>
                    {(activeInfoWindowCompany.jobs?.saramin || activeInfoWindowCompany.jobs?.jobkorea || activeInfoWindowCompany.jobs?.work24) && (
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    )}
                  </div>
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
