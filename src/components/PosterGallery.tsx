import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { GalleryImage } from '../data/gallery';
import { Language } from '../types';

interface PosterGalleryProps {
  images: GalleryImage[];
  lang: Language;
  eyebrow: { fr: string; ar: string };
  title: { fr: string; ar: string };
  subtitle?: { fr: string; ar: string };
}

/**
 * Bande d'affiches : carrousel à défilement fluide (tactile ou boutons)
 * + visionneuse plein écran avec navigation clavier.
 */
export const PosterGallery: React.FC<PosterGalleryProps> = ({ images, lang, eyebrow, title, subtitle }) => {
  const isAr = lang === 'ar';
  const scroller = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const go = useCallback(
    (dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + images.length) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (open === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, go]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-8 px-4 space-y-2">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
          {isAr ? eyebrow.ar : eyebrow.fr}
        </span>
        <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{isAr ? title.ar : title.fr}</h2>
        {subtitle && <p className="text-sm text-slate-600">{isAr ? subtitle.ar : subtitle.fr}</p>}
      </div>

      <div className="relative">
        <div
          ref={scroller}
          dir="ltr"
          className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 sm:px-6 pt-2 pb-8"
        >
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`${isAr ? 'تكبير الملصق' : 'Agrandir l’affiche'} ${i + 1}`}
              className="snap-center shrink-0 h-[22rem] sm:h-[26rem] rounded-2xl bg-white p-1.5 overflow-hidden border border-slate-200 group"
              style={{ aspectRatio: `${img.w} / ${img.h}` }}
            >
              <img
                src={img.src}
                alt=""
                loading="lazy"
                draggable={false}
                className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label={isAr ? 'السابق' : 'Précédent'}
          className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white border border-slate-300"
        >
          <ChevronLeft className="w-5 h-5 text-slate-800" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label={isAr ? 'التالي' : 'Suivant'}
          className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white border border-slate-300"
        >
          <ChevronRight className="w-5 h-5 text-slate-800" />
        </button>
      </div>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-3 sm:p-8"
        >
          <img
            src={images[open].src}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full object-contain rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(null);
            }}
            aria-label={isAr ? 'إغلاق' : 'Fermer'}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label={isAr ? 'السابق' : 'Précédent'}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white"
          >
            <ChevronLeft className="w-6 h-6 text-slate-900" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label={isAr ? 'التالي' : 'Suivant'}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white"
          >
            <ChevronRight className="w-6 h-6 text-slate-900" />
          </button>
          <div className="absolute bottom-4 inset-x-0 text-center text-white/80 text-xs font-semibold">
            {open + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
};
