import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { Language } from '../types';
import { registerVisit, VisitStats } from '../services/visitService';
import { VISITORS_START } from '../data/siteStats';

interface VisitorCounterProps {
  lang: Language;
}

/** Fait défiler un nombre de 0 jusqu'à `target` (sans animation si l'utilisateur la désactive). */
function useCountUp(target: number, durationMs = 1600): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || target <= 0) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

/** Compteur de visiteurs du pied de page. N'affiche rien tant que les chiffres ne sont pas disponibles. */
export const VisitorCounter: React.FC<VisitorCounterProps> = ({ lang }) => {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const isAr = lang === 'ar';
  const offset = VISITORS_START - 1;
  const shown = useCountUp(stats && stats.unique > 0 ? stats.unique + offset : 0);

  useEffect(() => {
    let alive = true;
    registerVisit().then((s) => {
      if (alive) setStats(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!stats || stats.unique <= 0) return null;
  const fmt = (n: number) => n.toLocaleString(isAr ? 'ar-MA-u-nu-latn' : 'fr-FR');

  return (
    <div
      className="pme-visitors inline-flex items-center gap-4 px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl text-white"
      title={isAr ? `عدد الزيارات: ${fmt(stats.total + offset)}` : `${fmt(stats.total + offset)} visites au total`}
      aria-label={`${fmt(stats.unique + offset)} ${isAr ? 'زائر' : 'visiteurs'}`}
    >
      <Eye className="pme-visitors-eye w-7 h-7 sm:w-9 sm:h-9 text-amber-300 drop-shadow" aria-hidden="true" />
      <span
        className="text-4xl sm:text-5xl font-black tabular-nums leading-none"
        style={{ textShadow: '0 3px 0 rgba(6, 78, 59, 0.9), 0 6px 10px rgba(0, 0, 0, 0.3)' }}
      >
        {fmt(shown)}
      </span>
      <span className="text-lg sm:text-2xl font-extrabold" style={{ textShadow: '0 2px 0 rgba(6, 78, 59, 0.9)' }}>
        {isAr ? 'زائر' : 'visiteurs'}
      </span>
    </div>
  );
};
