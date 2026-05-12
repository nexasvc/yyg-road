import { useState, useEffect, useMemo, useRef } from 'react';
import { Company, Region, Certification } from '../types/company';
import Fuse from 'fuse.js';
import { trackEvent } from '../lib/ga4';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<Certification[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  // Tracking search term with debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        trackEvent('Search', 'Engagement', searchTerm);
      }, 1000);
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm]);

  // Tracking filter changes
  useEffect(() => {
    if (selectedRegions.length > 0) {
      trackEvent('Filter_Region', 'Engagement', selectedRegions.join(','));
    }
  }, [selectedRegions]);

  useEffect(() => {
    if (selectedCerts.length > 0) {
      trackEvent('Filter_Cert', 'Engagement', selectedCerts.join(','));
    }
  }, [selectedCerts]);

  useEffect(() => {
    if (selectedIndustry) {
      trackEvent('Filter_Industry', 'Engagement', selectedIndustry);
    }
  }, [selectedIndustry]);

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
        setLastUpdated(data.lastUpdated || null);
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Initialize Fuse.js
  const fuse = useMemo(() => {
    return new Fuse(companies, {
      keys: [
        { name: 'name', weight: 1.0 },
        { name: 'industry', weight: 0.7 },
        { name: 'description', weight: 0.4 }
      ],
      threshold: 0.3, // Lower threshold means more strict matching
      ignoreLocation: true,
      useExtendedSearch: true
    });
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    // 1. Basic Filters (Region, Certs, Industry Selection, Visibility)
    let filtered = companies.filter((company) => {
      if (company.map_display_status !== 'VISIBLE') return false;

      const matchesRegion = 
        selectedRegions.length === 0 || selectedRegions.includes(company.region);
      
      const matchesCert = 
        selectedCerts.length === 0 || 
        company.certifications.some(cert => selectedCerts.includes(cert));

      const matchesIndustrySelection = 
        !selectedIndustry || company.industry.includes(selectedIndustry);

      return matchesRegion && matchesCert && matchesIndustrySelection;
    });

    // 2. Fuzzy Search
    if (searchTerm.trim()) {
      const results = fuse.search(searchTerm);
      const matchedIds = new Set(results.map(r => r.item.id));
      filtered = filtered.filter(c => matchedIds.has(c.id));
      
      // Sort by Fuse.js score (optional, but good for relevance)
      // Fuse results are already sorted by score.
      const scoreMap = new Map(results.map(r => [r.item.id, r.score ?? 1]));
      filtered.sort((a, b) => (scoreMap.get(a.id) ?? 1) - (scoreMap.get(b.id) ?? 1));
    }

    return filtered;
  }, [companies, searchTerm, selectedRegions, selectedCerts, selectedIndustry, fuse]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRegions([]);
    setSelectedCerts([]);
    setSelectedIndustry(null);
  };

  return {
    companies: filteredCompanies,
    allCompanies: companies,
    lastUpdated,
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
