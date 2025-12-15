import React from 'react';

export type LogoVariant = 'home' | 'fm' | 'sk8' | 'games' | 'tv';

interface Props {
  variant?: LogoVariant;
  className?: string;
}

export default function Logo({ variant = 'home', className = '' }: Props) {
  // Common base styles: Bebas Neue font, uppercase, tight tracking
  // Added relative to ensure height matches text exactly for alignment and forces update
  const containerClass = `relative inline-flex items-baseline leading-none tracking-tight font-['Bebas_Neue'] ${className}`;
  
  // The suffix is usually colored red (#c52323) and slightly smaller (0.8em)
  const suffixClass = "text-[#c52323] text-[0.8em] ml-[2px]";

  return (
    <div className={containerClass} style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
      <span className="text-white">INVERT</span>
      
      {variant === 'home' && (
        <span className={suffixClass}>61</span>
      )}

      {variant === 'fm' && (
        <span className={suffixClass}>FM</span>
      )}

      {variant === 'sk8' && (
        <span className={suffixClass}>SK8</span>
      )}

      {variant === 'tv' && (
        <span className={suffixClass}>TV</span>
      )}

      {variant === 'games' && (
        <span className={`${suffixClass} self-center flex items-center`}>
            {/* Simple Smiley SVG */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[0.8em] h-[0.8em]" style={{ transform: 'translateY(1px)' }}>
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
        </span>
      )}
    </div>
  );
}