'use client';

import React from 'react';

interface ValentinaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withText?: boolean;
  theme?: 'light' | 'dark';
}

export const ValentinaLogo: React.FC<ValentinaLogoProps> = ({
  size = 'md',
  className = '',
  withText = false,
  theme = 'light',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Isotipo Oficial Valentina: Cinta Geométrica en V con Gradiente Iris -> Cyan */}
      <div className={`${sizeMap[size]} relative flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <linearGradient id="valVGradient" x1="120" y1="130" x2="390" y2="390" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <filter id="valVGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#8B5CF6" floodOpacity="0.35" />
            </filter>
          </defs>

          <g filter="url(#valVGlow)">
            {/* Brazo Izquierdo Exterior */}
            <path
              d="M120 136L228 376C242 406 270 406 284 376L392 136"
              stroke="url(#valVGradient)"
              strokeWidth="38"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Brazo Interior con Cinta Continua */}
            <path
              d="M168 136L236 294C244 312 268 312 276 294L344 136"
              stroke="url(#valVGradient)"
              strokeWidth="28"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.88"
            />

            {/* Núcleo Central de Retorno / Precisión */}
            <circle cx="256" cy="356" r="16" fill="#06B6D4" />
          </g>
        </svg>
      </div>

      {withText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-extrabold tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-[#1f1f1f]'
              } text-base`}
            >
              VALENTINA
            </span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#e8f0fe] text-[#0b57d0] border border-[#d3e3fd]">
              AI
            </span>
          </div>
          <span className="text-[11px] text-[#747775] font-medium tracking-wide">
            Consola de Operaciones
          </span>
        </div>
      )}
    </div>
  );
};
