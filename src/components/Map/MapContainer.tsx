import { useState, useCallback } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin,
  InfoWindow
} from '@vis.gl/react-google-maps';
import { Company } from '../../types/company';

interface MapContainerProps {
  companies: Company[];
  onSelectCompany: (company: Company) => void;
  onHoverCompany: (id: string | null) => void;
  selectedCompanyId?: string;
  hoveredCompanyId?: string | null;
}

const REGION_COLORS = {
  '강서구': '#ef4444', // Red-500
  '양천구': '#3b82f6', // Blue-500
  '영등포구': '#10b981', // Emerald-500
};

export default function MapContainer({ 
  companies, 
  onSelectCompany,
  onHoverCompany,
  selectedCompanyId,
  hoveredCompanyId
}: MapContainerProps) {
  // Replace with your actual API key or use an environment variable
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

  const hoveredCompany = companies.find(c => c.id === hoveredCompanyId);

  const handleMarkerMouseEnter = (id: string) => {
    if (window.matchMedia('(hover: hover)').matches) {
      onHoverCompany(id);
    }
  };

  const handleMarkerMouseLeave = () => {
    if (window.matchMedia('(hover: hover)').matches) {
      onHoverCompany(null);
    }
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="w-full h-full relative">
        <Map
          defaultCenter={{ lat: 37.53, lng: 126.87 }}
          defaultZoom={13}
          mapId={MAP_ID}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
        >
          {companies.map((company) => {
            const isHovered = hoveredCompanyId === company.id;
            const isSelected = selectedCompanyId === company.id;
            
            return (
              <AdvancedMarker
                key={company.id}
                position={{ lat: company.lat, lng: company.lng }}
                onClick={() => onSelectCompany(company)}
                onMouseEnter={() => handleMarkerMouseEnter(company.id)}
                onMouseLeave={handleMarkerMouseLeave}
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

          {hoveredCompany && (
            <InfoWindow
              position={{ lat: hoveredCompany.lat, lng: hoveredCompany.lng }}
              pixelOffset={[0, -10]}
              disableAutoPan={true}
              headerDisabled={true}
            >
              <div className="p-1 min-w-[120px]">
                <p className="text-[10px] font-bold text-gray-400 mb-0.5">{hoveredCompany.industry}</p>
                <p className="text-xs font-black text-gray-900">{hoveredCompany.name}</p>
                <div className="flex gap-1 mt-1">
                  {hoveredCompany.certifications.slice(0, 2).map(cert => (
                    <span key={cert} className="text-[8px] font-bold text-brand-primary px-1 py-0.5 bg-brand-primary/5 rounded">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>
    </APIProvider>
  );
}
