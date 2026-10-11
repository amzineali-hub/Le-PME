import React from 'react';
import { DocStatus, Language, Member } from '../types';
import { printRegistrationSheet } from '../utils/registrationSheet';
import { DOC_KINDS, DOC_LABELS, DocKind, docStatusOf, dossierProgress } from '../utils/dossier';
import { AlertTriangle, CheckCircle2, Download, ExternalLink, FileQuestion, Printer, XCircle } from 'lucide-react';

interface DossierCardProps {
  member: Member;
  lang: Language;
}

const STATUS_UI: Record<'none' | 'verified' | 'rejected', { fr: string; ar: string; tone: string; Icon: React.ElementType }> = {
  none: { fr: 'À remettre', ar: 'للتسليم', tone: 'bg-slate-100 text-slate-700 border-slate-300', Icon: FileQuestion },
  verified: { fr: 'Reçue et conforme', ar: 'مستلمة ومطابقة', tone: 'bg-emerald-100 text-emerald-900 border-emerald-300', Icon: CheckCircle2 },
  rejected: { fr: 'À refaire', ar: 'للتصحيح', tone: 'bg-red-100 text-red-900 border-red-300', Icon: XCircle },
};

const uiOf = (st: DocStatus) => STATUS_UI[st === 'verified' ? 'verified' : st === 'rejected' ? 'rejected' : 'none'];

/**
 * Dossier d'adhésion : les quatre pièces sont remises en papier au coordinateur régional, qui les valide.
 * La carte de membre fondateur reste « en instance » tant qu'elles ne sont pas toutes validées.
 */
export const DossierCard: React.FC<DossierCardProps> = ({ member, lang }) => {
  const isAr = lang === 'ar';
  const progress = dossierProgress(member);
  const complete = progress === DOC_KINDS.length;

  const steps = isAr
    ? [
        'حمّل نموذج الالتزام واطبعه ووقّعه.',
        'صادق على التوقيع لدى الجهة المختصة (المقاطعة أو الجماعة).',
        'تأكد من قيدك في اللوائح الانتخابية على www.listeselectorales.ma، وإذا لم يشتغل الموقع أرسل رقم بطاقتك إلى 2727 أو استعمل تطبيق MonBV، ثم اطبع لقطة الشاشة.',
        'أرفق نسخة من بطاقتك الوطنية (الوجه والظهر).',
        'سلّم الملف كاملاً لمنسق جهتك: يعلمك الحزب بكيفية الاتصال به.',
      ]
    : [
        'Téléchargez l’engagement, imprimez-le et signez-le.',
        'Faites légaliser la signature (arrondissement ou commune).',
        'Vérifiez votre inscription sur www.listeselectorales.ma ; si le site ne répond pas, envoyez votre CIN par SMS au 2727 ou utilisez l’appli MonBV, puis imprimez la capture d’écran.',
        'Joignez une photocopie de votre CIN, recto et verso.',
        'Remettez le dossier complet à votre coordinateur régional : le parti vous indiquera comment le joindre.',
      ];

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${complete ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="font-extrabold text-slate-900">{isAr ? 'ملف الانخراط' : 'Dossier d’adhésion'}</div>
          <p className="text-xs text-slate-700 leading-relaxed mt-1">
            {complete
              ? isAr
                ? 'ملفك مكتمل وموثق: بطاقة العضو المؤسس سارية.'
                : 'Votre dossier est complet et validé : votre carte de membre fondateur est active.'
              : isAr
              ? `بطاقة العضو المؤسس في انتظار الوثائق المصادق عليها (${progress}/${DOC_KINDS.length}).`
              : `Votre carte de membre fondateur reste en instance tant que les ${DOC_KINDS.length} pièces ne sont pas validées (${progress}/${DOC_KINDS.length}).`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <a
            href="/engagement-modele.pdf"
            download="Engagement-PME.pdf"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحميل نموذج الالتزام' : 'Télécharger l’engagement'}</span>
          </a>
          <button
            type="button"
            onClick={() => printRegistrationSheet(member)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isAr ? 'طباعة بطاقة التلخيص' : 'Imprimer la fiche d’adhésion'}</span>
          </button>
        </div>
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DOC_KINDS.map((kind: DocKind) => {
          const ui = uiOf(docStatusOf(member, kind));
          return (
            <li key={kind} className="rounded-xl bg-white border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900">{isAr ? DOC_LABELS[kind].ar : DOC_LABELS[kind].fr}</div>
                  <div className="text-[11px] text-slate-500">{isAr ? DOC_LABELS[kind].hintAr : DOC_LABELS[kind].hintFr}</div>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold border ${ui.tone}`}>
                  <ui.Icon className="w-3 h-3" />
                  <span>{isAr ? ui.ar : ui.fr}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {!complete && (
        <div id="dossier-papier" className="urgent-panel p-4 sm:p-5 space-y-3 scroll-mt-28">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="urgent-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>{isAr ? 'عاجل' : 'URGENT'}</span>
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {isAr ? 'كيف تستكمل ملفك الورقي؟' : 'Comment compléter votre dossier papier ?'}
              </h3>
            </div>
            <a
              href="https://www.listeselectorales.ma"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800 underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>listeselectorales.ma</span>
            </a>
          </div>
          <ol className="space-y-2">
            {steps.map((x, i) => (
              <li key={x} className="flex items-start gap-3">
                <span className="w-6 h-6 shrink-0 rounded-full bg-red-700 text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
                <span className="text-sm font-bold text-slate-900 leading-snug">{x}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
