import { motion } from 'framer-motion';
import { Info, MapPin, Building2, Users, Heart, ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AboutPageProps {
  onBack: () => void;
}

export default function AboutPage({ onBack }: AboutPageProps) {
  const regions = [
    { name: '영등포구', desc: '금융과 IT의 중심지', color: 'bg-yeongdeungpo' },
    { name: '양천구', desc: '교육과 주거의 핵심', color: 'bg-yangcheon' },
    { name: '강서구', desc: '바이오와 항공의 메카', color: 'bg-gangseo' },
  ];

  return (
    <div className="fixed inset-0 bg-white z-[150] overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10 px-6 py-4 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 group"
        >
          <ArrowLeft size={20} className="text-gray-600 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold text-gray-900">지도로 돌아가기</span>
        </button>
        <div className="flex items-center gap-2">
          <img src="/assets/logos/samsung.png" alt="Logo" className="w-6 h-6 grayscale opacity-50" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Seoul Southern Employment</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 md:mb-24"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-black mb-6">
            <Info size={14} />
            SERVICE INTRODUCTION
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
            서울남부권의 <br />
            <span className="text-brand-primary">영양가 많은 기업 로드</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
            서울남부고용노동지청이 엄선한 영등포구, 양천구, 강서구의 
            강소기업과 우수 중소기업을 한눈에 확인하세요.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20 md:mb-32">
          {[
            {
              icon: <ShieldCheck className="text-brand-primary" size={32} />,
              title: "신뢰할 수 있는 정보",
              desc: "고용노동부가 인증한 강소기업, 벤처기업, 이노비즈 정보를 바탕으로 검증된 기업만을 소개합니다."
            },
            {
              icon: <MapPin className="text-brand-secondary" size={32} />,
              title: "지역 특화 탐색",
              desc: "서울 남부 지역(영등포, 양천, 강서)에 최적화된 위치 기반 서비스를 통해 가까운 우수 기업을 찾을 수 있습니다."
            },
            {
              icon: <Users className="text-orange-500" size={32} />,
              title: "구직자 중심",
              desc: "단순한 기업 명단을 넘어 복지, 근무 환경, 기업 문화 등 구직자가 궁금해하는 실질적인 정보를 제공합니다."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (i + 1) }}
              className="p-8 rounded-[32px] bg-gray-50 border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
            >
              <div className="mb-6 p-4 bg-white rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Regions Section */}
        <section className="mb-20 md:mb-32">
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">영양가 있는 기업 로드</h2>
              <p className="text-gray-500 font-medium italic">서울 남부 3개 구의 특색 있는 기업들을 탐방해보세요.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {regions.map((region, i) => (
              <div key={region.name} className="relative group overflow-hidden rounded-[24px]">
                <div className={cn("absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity", region.color)} />
                <div className="relative p-8 border border-gray-100 rounded-[24px]">
                  <div className={cn("w-2 h-2 rounded-full mb-4", region.color)} />
                  <h4 className="text-xl font-black text-gray-900 mb-2">{region.name}</h4>
                  <p className="text-gray-500 text-sm font-bold">{region.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Info */}
        <div className="bg-gray-900 rounded-[40px] p-8 md:p-16 text-white text-center">
          <div className="inline-flex p-4 bg-white/10 rounded-full mb-8">
            <Building2 size={40} className="text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black mb-6">서울남부고용노동지청 운영</h2>
          <p className="text-gray-400 font-medium mb-12 max-w-xl mx-auto leading-relaxed">
            지역 내 우수한 일자리를 발굴하고 구직자들에게 매칭해 드립니다. <br />
            취업 성공을 위한 든든한 파트너가 되어 드리겠습니다.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="https://www.moel.go.kr/seoulnambu/index.do" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-gray-900 font-black rounded-2xl hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              공식 웹사이트 방문
              <ExternalLink size={18} />
            </a>
            <button 
              onClick={onBack}
              className="px-8 py-4 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-colors"
            >
              기업 지도 탐색하기
            </button>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="mt-12 text-center">
          <p className="text-[11px] font-bold text-gray-300 uppercase tracking-[0.2em]">
            © 2024 Seoul Southern District Office of Employment and Labor. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
