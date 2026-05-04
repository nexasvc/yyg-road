import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CompanyLogoProps {
  src: string;
  name: string;
  className?: string;
  iconSize?: number;
}

export default function CompanyLogo({ src, name, className, iconSize = 24 }: CompanyLogoProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const getImagePath = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/')) return path;
    
    const baseUrl = import.meta.env.BASE_URL.endsWith('/') 
      ? import.meta.env.BASE_URL 
      : `${import.meta.env.BASE_URL}/`;
      
    return `${baseUrl}${path}`;
  };

  const finalSrc = getImagePath(src);

  if (!src || error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-50 text-gray-300 flex-shrink-0",
        className
      )}>
        <Building2 size={iconSize} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className={cn("relative flex-shrink-0 overflow-hidden bg-white", className)}>
      <img
        src={finalSrc}
        alt={`${name} logo`}
        className="w-full h-full object-contain p-1"
        onError={() => setError(true)}
      />
    </div>
  );
}
