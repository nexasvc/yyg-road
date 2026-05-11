import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  X, 
  MapPin, 
  Building2, 
  Users, 
  Trophy, 
  Heart, 
  Globe,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ImageIcon
} from 'lucide-react';
import { Company } from '../../types/company';
import { useState, useEffect } from 'react';
import CompanyLogo from './CompanyLogo';
import { trackEvent } from '../../lib/ga4';

interface CompanyDetailProps {
  company: Company | null;
  onClose: () => void;
}

const CERT_FULL_NAMES: Record<string, string> = {
  '지역우수': '지역우수',
  '지역맞춤': '지역맞춤형 고용촉진장려금 참여기업',
  '청년도약': '청년일자자리도약장려금 참여기업'
};

export default function CompanyDetail({ company, onClose }: CompanyDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const handleWebsiteVisit = () => {
    if (company) {
      trackEvent("Visit_Website", "Conversion", company.name);
    }
  };

  useEffect(() => {
    setCurrentImageIndex(0);
    setImageErrors({});
  }, [company?.id]);

  const getImagePath = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    // If the path already includes the base, don't add it again
    if (base && cleanPath.startsWith(base)) return cleanPath;
    
    return `${base}${cleanPath}`;
  };

  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!company?.images) return;
    setCurrentImageIndex((prev) => (prev + 1) % company.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!company?.images) return;
    setCurrentImageIndex((prev) => (prev - 1 + company.images.length) % company.images.length);
  };

  const hasImages = company?.images && company.images.length > 0;
  const isCurrentImageBroken = imageErrors[currentImageIndex];

  return (
    <AnimatePresence>
      {company && (
        <div className="fixed inset-0 lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[400px] z-[150] flex items-end justify-center lg:items-stretch lg:p-0 pointer-events-none">
          <Helmet>
            <title>{`${company.name} | 기업성장 브릿지 Map`}</title>
            <meta name="description" content={`${company.name}은(는) ${company.region}에 위치한 ${company.industry} 분야의 유망 기업입니다. ${company.description}`} />
            <meta property="og:title" content={`${company.name} - 기업성장 브릿지 Map`} />
            <meta property="og:description" content={`${company.name}의 기업 정보, 복지, 채용 정보를 확인하세요.`} />
            <meta property="og:image" content={company.logo} />
          </Helmet>
          {/* Backdrop - Now non-blocking on mobile to allow map interaction */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/10 lg:hidden pointer-events-none"
          />

          <motion.div
            drag={window.innerWidth < 1024 ? "y" : false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (window.innerWidth >= 1024) return;
              const windowHeight = window.innerHeight;
              const draggedDistance = info.offset.y;
              const velocity = info.velocity.y;

              // More flexible close condition: requires dragging down more than 50% or very fast flick
              if (draggedDistance > windowHeight * 0.5 || velocity > 800) {
                onClose();
              }
            }}
            initial={window.innerWidth < 1024 ? { y: '100%' } : { x: '100%' }}
            animate={window.innerWidth < 1024 ? { y: 0 } : { x: 0 }}
            exit={window.innerWidth < 1024 ? { y: '100%' } : { x: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300 
            }}
            className="relative w-full lg:w-full bg-white rounded-t-[32px] lg:rounded-none overflow-hidden shadow-2xl max-h-[95vh] lg:max-h-none h-[85vh] lg:h-full flex flex-col pointer-events-auto border-l border-gray-100"
          >
            <div className="lg:hidden w-full py-4 flex flex-col items-center cursor-grab active:cursor-grabbing flex-shrink-0 z-50">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
            </div>

            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 bg-gray-100/80 hover:bg-gray-200 backdrop-blur-md rounded-full text-gray-500 z-40 transition-colors border border-white/20 shadow-sm"
            >
              <X size={20} />
            </button>

            <div className="relative h-[144px] bg-gray-100 overflow-hidden group flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10 pointer-events-none" />
              <AnimatePresence mode="wait">
                {hasImages && !isCurrentImageBroken ? (
                  <motion.img 
                    key={currentImageIndex}
                    src={getImagePath(company.images[currentImageIndex])} 
                    alt={`${company.name} image ${currentImageIndex + 1}`} 
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={() => handleImageError(currentImageIndex)}
                  />
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-50 text-gray-300 relative"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    <ImageIcon size={40} strokeWidth={1.5} />
                    <span className="text-xs font-medium">
                      {hasImages ? '이미지를 불러올 수 없습니다' : '등록된 이미지가 없습니다'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {company.images && company.images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/10 hover:bg-black/30 backdrop-blur-md rounded-full text-white z-20 transition-all opacity-0 group-hover:opacity-100 border border-white/10">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/10 hover:bg-black/30 backdrop-blur-md rounded-full text-white z-20 transition-all opacity-0 group-hover:opacity-100 border border-white/10">
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 p-1.5 bg-black/10 backdrop-blur-md rounded-full border border-white/5">
                    {company.images.map((_, idx) => (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/40'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-7 space-y-8">
              <div className="flex items-start gap-4">
                <CompanyLogo 
                  src={company.logo} 
                  name={company.name} 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-gray-100 shadow-sm"
                  iconSize={32}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {company.certifications.map(cert => (
                      <span 
                        key={cert} 
                        title={CERT_FULL_NAMES[cert]}
                        className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[9px] font-black rounded-md uppercase tracking-widest cursor-help"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 leading-tight truncate">
                    {company.name}
                  </h2>
                  <div className="flex flex-col gap-1 text-sm text-gray-500 mt-1 font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-brand-primary" />
                      <span>{company.region}</span>
                      <span className="text-gray-200">|</span>
                      <span>{company.industry}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {company.address}
                    </div>
                  </div>
                </div>
              </div>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-brand-primary rounded-full" />
                  <h3 className="text-base font-black text-gray-900">기업 소개</h3>
                </div>
                <p className="text-gray-600 leading-relaxed text-sm bg-gray-50/50 p-5 rounded-2xl border border-gray-100/50">
                  {company.description}
                </p>
              </section>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-3 shadow-sm hover:border-brand-primary/20 transition-colors">
                  <div className="p-2.5 bg-blue-50 rounded-xl"><Users size={18} className="text-blue-600" /></div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">구성원</p>
                    <p className="text-sm font-black text-gray-900">{company.employees}명</p>
                  </div>
                </div>
                <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-3 shadow-sm hover:border-brand-primary/20 transition-colors">
                  <div className="p-2.5 bg-orange-50 rounded-xl"><Trophy size={18} className="text-orange-600" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">주요 수상</p>
                    <p className="text-sm font-black text-gray-900 truncate">{company.awards[0] || '-'}</p>
                  </div>
                </div>
              </div>

              <section className="space-y-4">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Heart size={18} className="text-pink-500 fill-pink-500" />
                  복지 및 혜택
                </h3>
                <div className="flex flex-wrap gap-2">
                  {company.benefits.map(benefit => (
                    <span key={benefit} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-[11px] font-bold rounded-xl border border-gray-100 shadow-sm hover:bg-white hover:border-brand-primary/20 transition-all cursor-default">
                      {benefit}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="p-6 pt-2 border-t border-gray-100 bg-white">
              <a 
                href={company.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={handleWebsiteVisit}
                className="flex items-center justify-center gap-3 w-full py-4 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 hover:bg-blue-600 transition-all active:scale-[0.98]"
              >
                <Globe size={18} />
                공식 웹사이트 방문
                <ExternalLink size={16} />
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
