import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import { Globe } from 'lucide-react';

export const Logo = () => {
  const { settings } = useSettings();
  
  return (
    <div className="flex flex-col items-center mb-8 md:mb-12">
      <div className="w-28 h-28 md:w-36 md:h-36 bg-brand-primary/10 rounded-full flex items-center justify-center border border-brand-primary/20 relative overflow-hidden shadow-2xl">
        {settings?.logoUrl ? (
          <img src={settings.logoUrl} className="w-full h-full object-cover relative z-10" alt="Logo" />
        ) : (
          <div className="relative scale-75 md:scale-110">
            <div className="w-12 h-14 bg-white rounded-sm border-2 border-brand-primary flex items-center justify-center transform -rotate-3">
              <div className="w-8 h-1 bg-brand-primary/10 mb-1" />
              <div className="w-8 h-1 bg-brand-primary/10 mb-1" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-primary rounded-full flex items-center justify-center text-[8px] font-black text-white">PLV</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logo;
