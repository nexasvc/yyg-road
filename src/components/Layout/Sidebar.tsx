import { Search, Filter, MapPin, Building2, ChevronRight, RotateCcw } from 'lucide-react';
import { Company, Region, Certification } from '../../types/company';
import { cn } from '../../lib/utils';
import CompanyLogo from '../Company/CompanyLogo';

interface SidebarProps {
  companies: Company[];
  filters: {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    selectedRegions: Region[];
    setSelectedRegions: (regions: Region[]) => void;
    selectedCerts: Certification[];
    setSelectedCerts: (certs: Certification[]) => void;
    resetFilters: () => void;
  };
  onSelectCompany: (company: Company | null) => void;
  onHoverCompany: (id: string | null) => void;
  selectedCompanyId?: string;
  hoveredCompanyId?: string | null;
}

const REGIONS: Region[] = ['강서구', '양천구', '영등포구'];
const CERTS: Certification[] = ['벤처', '이노비즈', '강소기업'];

export default function Sidebar({ 
  companies, 
  filters, 
  onSelectCompany, 
  onHoverCompany,
  selectedCompanyId,
  hoveredCompanyId
}: SidebarProps) {
  const toggleRegion = (region: Region) => {
    if (filters.selectedRegions.includes(region)) {
      filters.setSelectedRegions(filters.selectedRegions.filter(r => r !== region));
    } else {
      filters.setSelectedRegions([...filters.selectedRegions, region]);
    }
  };

  const toggleCert = (cert: Certification) => {
    if (filters.selectedCerts.includes(cert)) {
      filters.setSelectedCerts(filters.selectedCerts.filter(c => c !== cert));
    } else {
      filters.setSelectedCerts([...filters.selectedCerts, cert]);
    }
  };

  const handleMouseEnter = (id: string) => {
    if (window.matchMedia('(hover: hover)').matches) {
      onHoverCompany(id);
    }
  };

  const handleMouseLeave = () => {
    if (window.matchMedia('(hover: hover)').matches) {
      onHoverCompany(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-gray-100 shadow-xl z-10">
      {/* Search & Filters */}
      <div className="p-6 border-b border-gray-50 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <MapPin className="text-brand-primary" fill="currentColor" fillOpacity={0.2} />
            기업 맵 포털
          </h1>
          {(filters.searchTerm || filters.selectedRegions.length > 0 || filters.selectedCerts.length > 0) && (
            <button 
              onClick={filters.resetFilters}
              className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-brand-primary transition-colors group"
            >
              <RotateCcw size={12} className="group-active:rotate-[-180deg] transition-transform duration-500" />
              초기화
            </button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="기업명, 산업군 검색..."
            value={filters.searchTerm}
            onChange={(e) => filters.setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
          />
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">지역별 필터</p>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map(region => (
              <button
                key={region}
                onClick={() => toggleRegion(region)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                  filters.selectedRegions.includes(region)
                    ? "bg-brand-primary border-brand-primary text-white shadow-md shadow-brand-primary/20"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">인증 유형</p>
          <div className="flex flex-wrap gap-2">
            {CERTS.map(cert => (
              <button
                key={cert}
                onClick={() => toggleCert(cert)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                  filters.selectedCerts.includes(cert)
                    ? "bg-brand-secondary border-brand-secondary text-white shadow-md shadow-brand-secondary/20"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                {cert}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-3">
          <div className="px-2 flex justify-between items-center">
            <p className="text-xs font-bold text-gray-400">총 {companies.length}개 기업</p>
          </div>
          
          {companies.map(company => (
            <button
              key={company.id}
              onClick={() => onSelectCompany(company)}
              onMouseEnter={() => handleMouseEnter(company.id)}
              onMouseLeave={handleMouseLeave}
              className={cn(
                "w-full p-4 rounded-2xl text-left transition-all border group",
                selectedCompanyId === company.id
                  ? "bg-brand-primary/5 border-brand-primary/20 ring-1 ring-brand-primary/10"
                  : hoveredCompanyId === company.id
                    ? "bg-gray-50 border-gray-200 shadow-sm"
                    : "bg-white border-transparent hover:bg-gray-50"
              )}
            >
              <div className="flex gap-4">
                <CompanyLogo 
                  src={company.logo} 
                  name={company.name} 
                  className="w-12 h-12 rounded-xl border border-gray-100"
                  iconSize={20}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      company.region === '강서구' ? "bg-gangseo" :
                      company.region === '양천구' ? "bg-yangcheon" : "bg-yeongdeungpo"
                    )} />
                    <p className="text-[10px] font-bold text-gray-400">{company.industry}</p>
                  </div>
                  <h3 className="font-bold text-gray-900 truncate group-hover:text-brand-primary transition-colors">
                    {company.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {company.certifications.slice(0, 2).map(cert => (
                      <span key={cert} className="text-[9px] font-black text-brand-primary px-1.5 py-0.5 bg-brand-primary/5 rounded">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 self-center group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
          
          {companies.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <div className="inline-flex p-4 bg-gray-50 rounded-full text-gray-300">
                <Building2 size={32} />
              </div>
              <p className="text-sm text-gray-400 font-medium">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
