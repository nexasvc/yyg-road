import { useState, useEffect, useMemo } from 'react';
import { Company, Region, Certification } from '../types/company';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<Certification[]>([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        // Use BASE_URL for correct path in both dev and production
        const baseUrl = import.meta.env.BASE_URL.endsWith('/') 
          ? import.meta.env.BASE_URL 
          : `${import.meta.env.BASE_URL}/`;
          
        const response = await fetch(`${baseUrl}data/companies.json?t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch companies');
        const data = await response.json();
        setCompanies(data.companies);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const matchesSearch = 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRegion = 
        selectedRegions.length === 0 || selectedRegions.includes(company.region);
      
      const matchesCert = 
        selectedCerts.length === 0 || 
        company.certifications.some(cert => selectedCerts.includes(cert));

      return matchesSearch && matchesRegion && matchesCert;
    });
  }, [companies, searchTerm, selectedRegions, selectedCerts]);

  return {
    companies: filteredCompanies,
    allCompanies: companies,
    loading,
    error,
    filters: {
      searchTerm,
      setSearchTerm,
      selectedRegions,
      setSelectedRegions,
      selectedCerts,
      setSelectedCerts,
    }
  };
}
