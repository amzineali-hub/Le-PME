import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { Language } from '../types';
import { registerVisit, VisitStats } from '../services/visitService';
import { VISITORS_START } from '../data/siteStats';

interface VisitorCounterProps {
  lang: Language;
}

/** Petit compteur de visiteurs affiché dans le pied de page. N'affiche rien tant que les chiffres ne sont pas disponibles. */
export const VisitorCounter: React.FC<VisitorCounterProps> = ({ lang }) => {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const isAr = lang === 'ar';

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
  const offset = VISITORS_START - 1;
  const fmt = (n: number) => n.toLocaleString(isAr ? 'ar-MA-u-nu-latn' : 'fr-FR');

  return (
    <div
      className="inline-flex items-center gap-4 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-emerald-700 text-white border border-emerald-500 shadow-[0_7px_0_#064e3b] sm:text-lg"
      title={isAr ? `عدد الزيارات: ${fmt(stats.total + offset)}` : `${fmt(stats.total + offset)} visites au total`}
    >
      <Eye className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" aria-hidden="true" />
      <span className="text-3xl sm:text-4xl font-black tabular-nums leading-none">{fmt(stats.unique + offset)}</span>
      <span className="font-extrabold">{isAr ? 'زائر لموقعنا' : 'visiteurs sur notre site'}</span>
    </div>
  );
};
