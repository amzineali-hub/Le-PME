import React from 'react';
import { Language } from '../types';
import { PARTY_PHONE_DISPLAY, PARTY_PHONE_E164 } from '../data/siteStats';
import { WhatsAppIcon } from './WhatsAppIcon';

interface WhatsAppButtonProps {
  lang: Language;
}

// Bouton flottant : ouvre une conversation WhatsApp avec le numéro principal du parti.
// Le personnage (PNG à fond transparent) est assis sur le bouton et suit son défilement.
export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const text = isAr
    ? 'مرحباً، أود الحصول على معلومات حول حزب المغرب الصاعد.'
    : 'Bonjour, je souhaite des informations sur le Parti du Maroc Émergeant.';
  const href = `https://wa.me/${PARTY_PHONE_E164}?text=${encodeURIComponent(text)}`;
  const label = isAr ? 'تواصل معنا عبر واتساب' : 'Nous contacter sur WhatsApp';

  return (
    <div className="fixed bottom-5 end-5 z-30 flex flex-col items-center print:hidden">
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} tabIndex={-1} className="block -mb-2.5 relative z-10">
        <img
          src="/mascot.png"
          alt=""
          draggable={false}
          className="w-20 sm:w-32 h-auto select-none drop-shadow-[0_8px_8px_rgba(15,23,42,0.35)]"
        />
      </a>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="relative z-20 flex items-center gap-2 rounded-full bg-emerald-600 text-white font-bold text-sm px-4 py-3 shadow-lg"
        style={{ ['--edge' as string]: '#064e3b', ['--glow' as string]: 'rgba(6,78,59,.35)' }}
      >
        <WhatsAppIcon className="w-6 h-6" />
        <span className="hidden sm:flex flex-col leading-tight">
          <span className="text-sm">{isAr ? 'واتساب' : 'WhatsApp'}</span>
          <span dir="ltr" className="text-[11px] font-semibold opacity-90">
            {PARTY_PHONE_DISPLAY}
          </span>
        </span>
      </a>
    </div>
  );
};
