import { useState } from 'react';
import MapContainer from './components/Map/MapContainer';
import Sidebar from './components/Layout/Sidebar';
import MobileOverlay from './components/Layout/MobileOverlay';
import CompanyDetail from './components/Company/CompanyDetail';
import CompanyLogo from './components/Company/CompanyLogo';
import { useCompanies } from './hooks/useCompanies';
import { Company } from './types/company';
import { motion, AnimatePresence } from 'framer-motion';
import { List, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from './lib/utils';

function App() {
  const { companies, loading, error, filters } = useCompanies();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsListOpen(false); // Close list when a company is selected
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-400">기업 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <List size={32} />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">데이터 로드 실패</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-gray-900 text-white font-bold rounded-2xl"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white">
      {/* Desktop Sidebar (lg:block) */}
      <div className="hidden lg:block w-[400px] h-full flex-shrink-0">
        <Sidebar 
          companies={companies} 
          filters={filters} 
          onSelectCompany={handleSelectCompany}
          selectedCompanyId={selectedCompany?.id}
        />
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-full">
        {/* Mobile Overlay Filters */}
        <div className="lg:hidden">
          <MobileOverlay filters={filters} />
        </div>

        <MapContainer 
          companies={companies} 
          onSelectCompany={handleSelectCompany}
          selectedCompanyId={selectedCompany?.id}
        />

        {/* Mobile Collapsible List Button */}
        <div className="lg:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => setIsListOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-full shadow-2xl font-bold text-sm transition-transform active:scale-95"
          >
            <List size={18} />
            목록 보기
            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">
              {companies.length}
            </span>
          </button>
        </div>

        {/* Mobile List Drawer */}
        <AnimatePresence>
          {isListOpen && (
            <div className="lg:hidden fixed inset-0 z-[120]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsListOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] h-[85vh] flex flex-col overflow-hidden shadow-2xl pointer-events-auto"
              >
                {/* Drawer Handle & Header */}
                <div 
                  className="p-4 flex flex-col items-center border-b border-gray-50"
                  onClick={() => setIsListOpen(false)}
                >
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-4" />
                  <div className="w-full px-4 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">기업 리스트 ({companies.length})</h3>
                    <button className="text-gray-400">
                      <ChevronDown size={24} />
                    </button>
                  </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                  {companies.map(company => (
                    <button
                      key={company.id}
                      onClick={() => handleSelectCompany(company)}
                      className="w-full p-4 rounded-2xl text-left bg-white border border-gray-100 shadow-sm active:bg-gray-50 transition-colors"
                    >
                      <div className="flex gap-4">
                        <CompanyLogo 
                          src={company.logo} 
                          name={company.name} 
                          className="w-12 h-12 rounded-xl border border-gray-50"
                          iconSize={20}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              company.region === '강서구' ? "bg-red-500" :
                              company.region === '양천구' ? "bg-blue-500" : "bg-emerald-500"
                            )} />
                            <p className="text-[10px] font-bold text-gray-400">{company.industry}</p>
                          </div>
                          <h3 className="font-bold text-gray-900 truncate">{company.name}</h3>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {company.certifications.map(cert => (
                              <span key={cert} className="text-[9px] font-black text-brand-primary px-1.5 py-0.5 bg-brand-primary/5 rounded">
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {companies.length === 0 && (
                    <div className="py-20 text-center">
                      <p className="text-sm text-gray-400">결과가 없습니다.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail View (Modal/Bottom Sheet) */}
      <CompanyDetail 
        company={selectedCompany} 
        onClose={() => setSelectedCompany(null)} 
      />
    </div>
  );
}

export default App;
