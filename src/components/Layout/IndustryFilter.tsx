import { 
  Monitor, 
  FlaskConical, 
  Truck, 
  Hammer, 
  Briefcase, 
  Factory 
} from 'lucide-react';
import { cn } from '../../lib/utils';

const INDUSTRIES = [
  { id: 'IT/SW', label: 'IT/SW', icon: Monitor },
  { id: '바이오', label: '바이오', icon: FlaskConical },
  { id: '유통', label: '유통', icon: Truck },
  { id: '건설', label: '건설', icon: Hammer },
  { id: '서비스', label: '서비스', icon: Briefcase },
  { id: '제조', label: '제조', icon: Factory },
];

interface IndustryFilterProps {
  selectedIndustry: string | null;
  onSelectIndustry: (id: string | null) => void;
  className?: string;
}

export default function IndustryFilter({ 
  selectedIndustry, 
  onSelectIndustry,
  className 
}: IndustryFilterProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto no-scrollbar pb-2", className)}>
      <button
        onClick={() => onSelectIndustry(null)}
        className={cn(
          "flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border",
          !selectedIndustry 
            ? "bg-gray-900 text-white border-gray-900 shadow-md" 
            : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
        )}
      >
        전체
      </button>
      {INDUSTRIES.map((industry) => {
        const Icon = industry.icon;
        const isSelected = selectedIndustry === industry.id;
        
        return (
          <button
            key={industry.id}
            onClick={() => onSelectIndustry(isSelected ? null : industry.id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border",
              isSelected 
                ? "bg-brand-primary text-white border-brand-primary shadow-md" 
                : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
            )}
          >
            <Icon size={14} />
            {industry.label}
          </button>
        );
      })}
    </div>
  );
}
