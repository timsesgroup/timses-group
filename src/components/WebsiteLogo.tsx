import React from 'react';

interface WebsiteLogoProps {
  website: string;
  className?: string;
}

export const WebsiteLogo: React.FC<WebsiteLogoProps> = ({ website, className = 'h-4 object-contain' }) => {
  const web = (website || 'studiobet78').toLowerCase();
  switch (web) {
    case 'studiobet78':
      return <img src="https://static.aptaptkaisjds.com/assets/logo_studiobet78.png" alt="studiobet78" className={className} />;
    case 'bigbet78':
      return <img src="https://asset01.source-static.us/assets/rajaplay/bigbet78/components/logo-bigbet78-250px.png" alt="bigbet78" className={className} />;
    case 'piala45':
      return <img src="https://static.aptaptkaisjds.com/assets/images/piala45/logo/logo-piala45-v2.webp" alt="piala45" className={`${className} bg-slate-900 rounded px-1`} />;
    case 'bambu189':
      return <img src="https://asset01.source-static.us/assets/rajaplay/bambu189/components/logo-1000px.png" alt="bambu189" className={className} />;
    default:
      return <span className="font-bold">🌐 {website}</span>;
  }
};
