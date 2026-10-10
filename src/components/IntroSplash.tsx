import React, { useCallback, useEffect, useState } from 'react';
import { Language } from '../types';

interface IntroSplashProps {
  lang: Language;
}

// Le bouton « Entrer » devient actif quand l'affiche a fini de grandir.
const READY_AFTER_MS = 3600;

/**
 * Introduction à l'ouverture du site : l'affiche du parti « sort de l'écran » en grandissant,
 * s'arrête à sa taille maximale, et le visiteur doit cliquer sur « Entrer sur le site » pour continuer
 * (ni fermeture automatique, ni clic n'importe où, ni touche Échap).
 * Ce clic est aussi le premier geste du visiteur : il autorise le son de la vidéo de l'accueil.
 * Affichée à chaque ouverture du site ; `?nointro` dans l'adresse la désactive (outils de test).
 */
export const IntroSplash: React.FC<IntroSplashProps> = ({ lang }) => {
  const [visible, setVisible] = useState(
    () => typeof window === 'undefined' || !new URLSearchParams(window.location.search).has('nointro')
  );
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const isAr = lang === 'ar';

  const enter = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 700);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => setReady(true), READY_AFTER_MS);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'حزب المغرب الصاعد' : 'Parti du Maroc Émergeant'}
      className={`fixed inset-0 z-[100] overflow-hidden bg-slate-950 transition-opacity duration-700 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Fond : la même affiche, floutée, pour remplir l'écran quel que soit son format */}
      <img
        src="/intro-poster.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-60"
      />
      <div className="absolute inset-0 bg-slate-950/40" />

      {/* L'affiche et le bouton forment un bloc centré (horizontalement et verticalement).
          La hauteur de l'affiche s'adapte à la fenêtre (dvh = hauteur visible réelle sur mobile). */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-3 py-4 [perspective:1400px]">
        <div className="pme-intro-emerge">
          <div className="pme-intro-grow">
            <img
              src="/intro-poster.jpg"
              alt={isAr ? 'حزب المغرب الصاعد - السياسة بشكل مختلف' : 'Le Parti du Maroc Émergent - La politique autrement'}
              className="block w-auto h-auto max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-9rem)] object-contain rounded-2xl shadow-[0_30px_120px_rgba(0,0,0,0.65)] select-none"
              style={{ maxHeight: 'calc(100dvh - 9rem)' }}
              draggable={false}
            />
          </div>
        </div>

        <div className="pme-intro-cta flex justify-center">
          <button
            type="button"
            onClick={enter}
            disabled={!ready}
            autoFocus
            className={`px-8 py-3.5 rounded-full bg-emerald-700 text-white font-extrabold text-base sm:text-lg shadow-xl ${
              ready ? 'pme-intro-pulse' : 'opacity-70'
            }`}
          >
            {isAr ? 'ادخل إلى الموقع' : 'Entrer sur le site'}
          </button>
        </div>
      </div>
    </div>
  );
};
