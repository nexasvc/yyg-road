import { useState, useCallback, useEffect } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin,
  InfoWindow,
  useMap,
  Circle
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
  '강서구': { center: { lat: 37.5509, lng: 126.8497 }, color: '#ef4444' },
  '양천구': { center: { lat: 37.5169, lng: 126.8665 }, color: '#3b82f6' },
  '영등포구': { center: { lat: 37.5264, lng: 126.8962 }, color: '#a855f7' },
};

const REGION_COLORS = {
  '강서구': '#ef4444', // Red-500
  '양천구': '#3b82f6', // Blue-500
  '영등포구': '#a855f7', // Purple-500
};

function MapHandler({ 
  selectedCompany, 
  companies,
  filters
}: { 
  selectedCompany: Company | undefined,
  companies: Company[],
  filters?: MapContainerProps['filters']
}) {
  const map = useMap();

  // Focus on selected company only if it's outside the current viewport
  useEffect(() => {
    if (!map || !selectedCompany) return;
    
    const targetPos = { lat: selectedCompany.lat, lng: selectedCompany.lng };
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

  // Handle zooming to selected region or general filtering
  useEffect(() => {
    if (!map || selectedCompany) return;

    const hasActiveFilters = 
      (filters?.selectedRegions && filters.selectedRegions.length > 0) || 
      (filters?.selectedCerts && filters.selectedCerts.length > 0) ||
      (filters?.searchTerm && filters.searchTerm.length > 0);

    if (filters?.selectedRegions && filters.selectedRegions.length === 1) {
      // Specific logic for single region selection
      const regionName = filters.selectedRegions[0];
      const region = REGION_DATA[regionName as keyof typeof REGION_DATA];
      if (region) {
        map.panTo(region.center);
        map.setZoom(14); 
      }
    } else if (hasActiveFilters && companies.length > 0) {
      // General logic for multiple filters: show all results
      const bounds = new google.maps.LatLngBounds();
      companies.forEach(company => bounds.extend({ lat: company.lat, lng: company.lng }));
      
      const timer = setTimeout(() => {
        map.fitBounds(bounds, {
          top: 100,
          right: window.innerWidth >= 1024 ? 480 : 80, // Leave space for side panels
          bottom: window.innerWidth < 1024 ? 450 : 120,
          left: 80
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [map, filters?.selectedRegions, filters?.selectedCerts, filters?.searchTerm, !!selectedCompany, companies.length]);

  // Initial fit bounds only
  useEffect(() => {
    if (!map || companies.length === 0) return;
    
    // Only auto-fit once when map loads and companies are fetched
    const bounds = new google.maps.LatLngBounds();
    companies.forEach(company => bounds.extend({ lat: company.lat, lng: company.lng }));
    
    map.fitBounds(bounds, {
      top: 100,
      right: 80,
      bottom: 120,
      left: 80
    });
  }, [map, companies.length === 0]); // Trigger only when companies transition from 0 to N

  return null;
}

export default function MapContainer({ 
  companies, 
  filters,
  onSelectCompany,
  onHoverCompany,
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
            filters={filters}
          />

          {/* Active Area Highlights */}
          {filters?.selectedRegions.map(regionName => {
            const data = REGION_DATA[regionName as keyof typeof REGION_DATA];
            if (!data) return null;
            return (
              <Circle
                key={regionName}
                center={data.center}
                radius={2500}
                fillColor={data.color}
                fillOpacity={0.1}
                strokeColor={data.color}
                strokeOpacity={0.3}
                strokeWeight={2}
              />
            );
          })}

          {companies.map((company) => {
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

          {activeInfoWindowCompany && (
            <InfoWindow
              position={{ lat: activeInfoWindowCompany.lat, lng: activeInfoWindowCompany.lng }}
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
