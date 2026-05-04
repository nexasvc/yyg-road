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
  selectedCompanyId?: string;
}

const REGION_COLORS = {
  '강서구': '#ef4444', // Red-500
  '양천구': '#3b82f6', // Blue-500
  '영등포구': '#10b981', // Emerald-500
};

export default function MapContainer({ 
  companies, 
  onSelectCompany,
  selectedCompanyId 
}: MapContainerProps) {
  // Replace with your actual API key or use an environment variable
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

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
          {companies.map((company) => (
            <AdvancedMarker
              key={company.id}
              position={{ lat: company.lat, lng: company.lng }}
              onClick={() => onSelectCompany(company)}
            >
              <Pin 
                background={REGION_COLORS[company.region]} 
                borderColor={'#ffffff'} 
                glyphColor={'#ffffff'}
                scale={selectedCompanyId === company.id ? 1.2 : 1}
              />
            </AdvancedMarker>
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}
