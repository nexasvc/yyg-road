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
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const base = import.meta.env.BASE_URL.replace(/\/$/, '');
        const url = `${base}/data/companies.json?t=${Date.now()}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch companies: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (!data || !data.companies) throw new Error('Invalid data format: companies field missing');
        setCompanies(data.companies);
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      // Only show visible companies
      if (company.map_display_status !== 'VISIBLE') return false;

      const matchesSearch = 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRegion = 
        selectedRegions.length === 0 || selectedRegions.includes(company.region);
      
      const matchesCert = 
        selectedCerts.length === 0 || 
        company.certifications.some(cert => selectedCerts.includes(cert));

      const matchesIndustry = 
        !selectedIndustry || company.industry.includes(selectedIndustry);

      return matchesSearch && matchesRegion && matchesCert && matchesIndustry;
    });
  }, [companies, searchTerm, selectedRegions, selectedCerts, selectedIndustry]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRegions([]);
    setSelectedCerts([]);
    setSelectedIndustry(null);
  };

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
      selectedIndustry,
      setSelectedIndustry,
      resetFilters
    }
  };
}
