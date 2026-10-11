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
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
      title={isAr ? `عدد الزيارات: ${fmt(stats.total + offset)}` : `${fmt(stats.total + offset)} visites au total`}
    >
      <Eye className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
      <span className="font-bold text-white">{fmt(stats.unique + offset)}</span>
      <span>{isAr ? 'زائر' : 'visiteurs'}</span>
    </div>
  );
};
