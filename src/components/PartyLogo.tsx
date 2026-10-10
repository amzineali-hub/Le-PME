import React, { useState, useEffect } from 'react';
import { getStoredLogo, subscribeToLogoChanges, CANDIDATE_LOGO_PATHS } from '../utils/logoStorage';

interface PartyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
  inverted?: boolean;
  lang?: 'fr' | 'ar';
  stacked?: boolean;
  onUploadClick?: () => void;
}

export const PartyLogo: React.FC<PartyLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  inverted = false,
  lang = 'fr',
  stacked = false,
  onUploadClick,
}) => {
  const [customLogo, setCustomLogo] = useState<string | null>(getStoredLogo());
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [hasImageLoaded, setHasImageLoaded] = useState<boolean>(false);
  const [allFailed, setAllFailed] = useState<boolean>(false);

  // Listen to global logo updates
  useEffect(() => {
    const unsubscribe = subscribeToLogoChanges((newLogo) => {
      setCustomLogo(newLogo);
      if (newLogo) {
        setHasImageLoaded(false);
        setAllFailed(false);
        setCandidateIndex(0);
      }
    });
    return unsubscribe;
  }, []);

  const sizeMap = {
    sm: { icon: 'w-9 h-9', main: 'text-xs', tifinagh: 'text-[9px]', sub: 'text-[9px]' },
    md: { icon: 'w-12 h-12', main: 'text-sm sm:text-base', tifinagh: 'text-[10px]', sub: 'text-xs' },
    lg: { icon: 'w-16 h-16', main: 'text-lg', tifinagh: 'text-xs', sub: 'text-sm' },
    xl: { icon: 'w-24 h-24 sm:w-28 sm:h-28', main: 'text-2xl sm:text-3xl', tifinagh: 'text-xs sm:text-sm', sub: 'text-sm sm:text-base' },
    hero: { icon: 'w-full h-full', main: 'text-2xl', tifinagh: 'text-xs', sub: 'text-sm' },
  };

  const { icon, main, tifinagh, sub } = sizeMap[size];

  // Current image source to attempt:
  // 1. If customLogo is set in localStorage, use that first
  // 2. Otherwise try candidate paths one by one (/Logo PME.png, /logo.png, etc.)
  const currentSrc = customLogo
    ? customLogo
    : candidateIndex < CANDIDATE_LOGO_PATHS.length
    ? CANDIDATE_LOGO_PATHS[candidateIndex]
    : null;

  const handleImageError = () => {
    if (customLogo) {
      // If the custom base64/url failed, clear and fall back to candidates
      setCustomLogo(null);
      setCandidateIndex(0);
    } else if (candidateIndex + 1 < CANDIDATE_LOGO_PATHS.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setAllFailed(true);
    }
  };

  const handleImageLoad = () => {
    setHasImageLoaded(true);
    setAllFailed(false);
  };

  return (
    <div
      className={`select-none ${
        stacked
          ? 'flex flex-col items-center text-center gap-3'
          : 'flex items-center gap-3'
      } ${className}`}
    >
      {/* Emblem: displays Logo PME.png image when available, with fallback to vector */}
      <div
        className={`relative ${icon} shrink-0 group transition-transform duration-300 hover:scale-105 cursor-pointer`}
        onClick={onUploadClick}
        title={onUploadClick ? 'Cliquez pour configurer ou changer le logo officiel (Logo PME.png)' : undefined}
      >
        {currentSrc && !allFailed ? (
          <img
            key={currentSrc}
            src={currentSrc}
            alt="Logo Officiel - Parti du Maroc Émergeant"
            className="w-full h-full object-contain drop-shadow-md rounded-lg"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          /* High-Fidelity Vector Fallback Emblem matching the Party Identity */
          <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-md"
          >
            <defs>
              <linearGradient id="headTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="60%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#0e7490" />
              </linearGradient>

              <linearGradient id="gearGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0e4352" />
                <stop offset="100%" stopColor="#06222b" />
              </linearGradient>

              <linearGradient id="gearGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#155e71" />
                <stop offset="100%" stopColor="#092f39" />
              </linearGradient>

              <filter id="chipGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Human Profile Silhouette */}
            <path
              d="M 86 98 
                 C 80 97, 72 92, 65 82 
                 C 58 75, 52 68, 47 62 
                 C 44 60, 41 60, 39 59 
                 C 36 57, 35 55, 36 53 
                 C 33 53, 31 51, 32 49 
                 C 34 48, 36 48, 36 47 
                 C 34 46, 32 45, 32 43 
                 C 32 41, 34 40, 36 40 
                 C 35 38, 27 34, 27 30 
                 C 27 27, 33 24, 35 19 
                 C 38 11, 48 4, 68 4 
                 C 88 4, 102 16, 102 36 
                 C 102 52, 98 64, 94 74 
                 C 90 84, 88 93, 86 98 Z"
              fill="url(#headTealGrad)"
            />

            {/* Brain Cavity & Microchip */}
            <path
              d="M 50 14 
                 C 62 10, 78 12, 85 20 
                 C 92 27, 90 40, 80 44 
                 C 70 48, 54 46, 48 38 
                 C 43 32, 42 20, 50 14 Z"
              fill="#062731"
              opacity={0.8}
              filter="url(#chipGlow)"
            />

            {/* Central node & Circuit Traces */}
            <circle cx="66" cy="28" r="9" fill="#38bdf8" />
            <circle cx="66" cy="28" r="5" fill="#082f3b" />
            <circle cx="66" cy="28" r="2.5" fill="#e0f2fe" />

            {/* Traces */}
            <path d="M 57 24 H 46 V 32 H 42" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="42" cy="32" r="1.5" fill="#38bdf8" />
            <path d="M 57 28 H 44" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="44" cy="28" r="1.5" fill="#38bdf8" />
            <path d="M 58 33 H 50 V 38 H 48" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="48" cy="38" r="1.5" fill="#38bdf8" />

            <path d="M 75 24 H 84 V 20 H 87" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="87" cy="20" r="1.5" fill="#38bdf8" />
            <path d="M 75 28 H 86" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="86" cy="28" r="1.5" fill="#38bdf8" />
            <path d="M 74 32 H 82 V 37 H 85" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="85" cy="37" r="1.5" fill="#38bdf8" />

            {/* Industrial Gears */}
            <g transform="translate(86, 42)">
              <circle cx="0" cy="0" r="12" fill="url(#gearGrad2)" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <rect
                  key={i}
                  x="-2.5"
                  y="-15"
                  width="5"
                  height="5"
                  rx="1"
                  fill="url(#gearGrad2)"
                  transform={`rotate(${angle})`}
                />
              ))}
              <circle cx="0" cy="0" r="6" fill="#061c23" />
              <circle cx="0" cy="0" r="3" fill="#22d3ee" />
            </g>

            <g transform="translate(80, 60)">
              <circle cx="0" cy="0" r="17" fill="url(#gearGrad1)" />
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                <rect
                  key={i}
                  x="-3"
                  y="-21"
                  width="6"
                  height="6"
                  rx="1"
                  fill="url(#gearGrad1)"
                  transform={`rotate(${angle})`}
                />
              ))}
              <circle cx="0" cy="0" r="10" fill="url(#gearGrad1)" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                <circle key={i} cx="0" cy="-7" r="1.2" fill="#38bdf8" transform={`rotate(${angle})`} />
              ))}
              <circle cx="0" cy="0" r="4.5" fill="#38bdf8" />
              <circle cx="0" cy="0" r="2" fill="#04161c" />
            </g>

            <g transform="translate(68, 76)">
              <circle cx="0" cy="0" r="9" fill="url(#gearGrad2)" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <rect
                  key={i}
                  x="-2"
                  y="-11"
                  width="4"
                  height="3.5"
                  rx="0.8"
                  fill="url(#gearGrad2)"
                  transform={`rotate(${angle})`}
                />
              ))}
              <circle cx="0" cy="0" r="4" fill="#061c23" />
              <circle cx="0" cy="0" r="2" fill="#22d3ee" />
            </g>
          </svg>
        )}
      </div>

      {/* Official Typography */}
      {showText && (
        <div
          className={`flex flex-col leading-tight ${
            stacked ? 'items-center text-center' : 'items-start text-left'
          }`}
        >
          {/* Line 1: Arabic Name in bright cyan */}
          <div
            className={`font-black tracking-tight text-[#22d3ee] drop-shadow-xs ${main}`}
            style={{ fontFamily: 'Tajawal, Alexandria, sans-serif' }}
          >
            حزب المغرب الصاعد
          </div>

          {/* Line 2: Constitutional Tifinagh Inscription matching the emblem */}
          <div
            className={`font-mono font-bold tracking-widest text-[#38bdf8] ${tifinagh}`}
            title="ⵜⴰⵎⴰⵣⵉⵖⵜ"
          >
            • ⵔ • ⵚ • ⴱ • ⵇ &nbsp;|&nbsp; ⵍ ⵎ ⵖ ⵔ ⵉ ⴱ &nbsp;• 匚 • ⵎ • ⵚ
          </div>

          {/* Line 3: French Name in bold clean white */}
          <div
            className={`font-black uppercase tracking-wider ${inverted ? 'text-white' : 'text-slate-900'} drop-shadow-xs ${sub}`}
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            LE PARTI DU MAROC EMERGENT
          </div>
        </div>
      )}
    </div>
  );
};
