import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Language, Member } from '../types';
import { DOC_KINDS, dossierProgress, isDossierComplete } from '../utils/dossier';

interface UrgentReminderProps {
  member: Member;
  lang: Language;
}

const VISIBLE_MS = 9000;

/**
 * Rappel qui surgit à chaque ouverture de l'espace membre tant que le dossier papier n'est pas complet.
 * Il se referme tout seul après quelques secondes (barre de compte à rebours) ou d'un clic ;
 * le survol suspend le compte à rebours pour laisser le temps de lire.
 */
export const UrgentReminder: React.FC<UrgentReminderProps> = ({ member, lang }) => {
  const isAr = lang === 'ar';
  const [open, setOpen] = useState(() => !isDossierComplete(member));
  const [reduced, setReduced] = useState(false);

  // Animations désactivées : on retombe sur un simple minuteur.
  useEffect(() => {
    const q = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    setReduced(!!q?.matches);
  }, []);
  useEffect(() => {
    if (!open || !reduced) return;
    const t = window.setTimeout(() => setOpen(false), VISIBLE_MS);
    return () => window.clearTimeout(t);
  }, [open, reduced]);

  if (!open || isDossierComplete(member)) return null;

  const progress = dossierProgress(member);

  const goToDossier = () => {
    setOpen(false);
    document.getElementById('dossier-papier')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="fixed top-24 inset-x-0 z-[60] flex justify-center px-3 pointer-events-none print:hidden">
      <div
        role="alert"
        className="urgent-panel pme-urgent-pop pointer-events-auto relative w-full max-w-xl overflow-hidden"
      >
        <div className="flex items-start gap-3 p-4 pe-11">
          <span className="urgent-badge shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>{isAr ? 'عاجل' : 'URGENT'}</span>
          </span>
          <div className="min-w-0 space-y-1">
            <div className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
              {isAr ? 'هل سلّمت ملفك الورقي لمنسق جهتك؟' : 'Avez-vous remis votre dossier papier à votre coordinateur régional ?'}
            </div>
            <div className="text-xs font-semibold text-slate-700">
              {isAr
                ? `بطاقة العضو المؤسس في انتظار الوثائق المصادق عليها (${progress}/${DOC_KINDS.length}): الالتزام الموقع، نسخة البطاقة الوطنية، وصل القيد في اللوائح الانتخابية.`
                : `Votre carte de membre fondateur reste en instance (${progress}/${DOC_KINDS.length} pièces validées) : engagement signé, photocopie de CIN, fiche électorale.`}
            </div>
            <button
              type="button"
              onClick={goToDossier}
              className="mt-1 inline-flex items-center px-3 py-1.5 rounded-lg bg-red-700 text-white text-xs font-bold"
            >
              {isAr ? 'عرض الخطوات' : 'Voir les étapes'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={isAr ? 'إغلاق' : 'Fermer'}
          className="absolute top-2 end-2 p-1.5 rounded-full text-slate-500 hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Compte à rebours : la barre se vide, puis le rappel se ferme (survol = pause) */}
        <div className="h-1.5 bg-red-100">
          <div
            className="pme-urgent-countdown h-full bg-red-600"
            style={{ animationDuration: `${VISIBLE_MS}ms` }}
            onAnimationEnd={() => setOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};
