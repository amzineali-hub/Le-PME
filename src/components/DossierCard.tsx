import React, { useState } from 'react';
import { DocStatus, Language, Member } from '../types';
import { describeError, prepareElectoralProof, submitElectoralProof } from '../services/memberService';
import { printRegistrationSheet } from '../utils/registrationSheet';
import { DOC_KINDS, DOC_LABELS, DocKind, docStatusOf, dossierProgress, isPostal, statusField } from '../utils/dossier';
import { CheckCircle2, Clock, Download, ExternalLink, FileQuestion, Loader2, Printer, UploadCloud, XCircle } from 'lucide-react';

interface DossierCardProps {
  member: Member;
  lang: Language;
  onMemberUpdated?: (patch: Partial<Member>) => void;
}

// Libellés d'état : les pièces papier se « remettent », la fiche électorale se « dépose » en ligne.
const statusUi = (kind: DocKind, st: DocStatus, isAr: boolean) => {
  const postal = isPostal(kind);
  const map: Record<DocStatus, { fr: string; ar: string; tone: string; Icon: React.ElementType }> = {
    none: {
      fr: postal ? 'À remettre' : 'À déposer',
      ar: postal ? 'للتسليم' : 'لم يُودع',
      tone: 'bg-slate-100 text-slate-700 border-slate-300',
      Icon: FileQuestion,
    },
    submitted: { fr: 'En contrôle', ar: 'قيد المراجعة', tone: 'bg-amber-100 text-amber-900 border-amber-300', Icon: Clock },
    verified: {
      fr: postal ? 'Reçue et conforme' : 'Validée',
      ar: postal ? 'مستلمة ومطابقة' : 'تم التحقق',
      tone: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      Icon: CheckCircle2,
    },
    rejected: {
      fr: postal ? 'À refaire' : 'À redéposer',
      ar: postal ? 'للتصحيح' : 'مرفوضة',
      tone: 'bg-red-100 text-red-900 border-red-300',
      Icon: XCircle,
    },
  };
  const x = map[st];
  return { label: isAr ? x.ar : x.fr, tone: x.tone, Icon: x.Icon };
};

/**
 * Dossier d'adhésion. La fiche électorale est déposée en ligne (PDF ou capture d'écran) ; l'engagement signé et
 * légalisé et la CIN recto/verso sont remis en main propre au coordinateur régional, qui les valide.
 * La carte de membre fondateur reste « en instance » tant que les quatre pièces ne sont pas validées.
 */
export const DossierCard: React.FC<DossierCardProps> = ({ member, lang, onMemberUpdated }) => {
  const isAr = lang === 'ar';
  const [local, setLocal] = useState<Partial<Record<DocKind, DocStatus>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const statusOf = (k: DocKind): DocStatus => local[k] ?? docStatusOf(member, k);
  const view: Member = { ...member, ...Object.fromEntries(Object.entries(local).map(([k, v]) => [statusField(k as DocKind), v])) };
  const progress = dossierProgress(view);
  const complete = progress === DOC_KINDS.length;

  const handleSlip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await submitElectoralProof(member.id, await prepareElectoralProof(file));
      setLocal((prev) => ({ ...prev, electoral: 'submitted' }));
      onMemberUpdated?.({ electoralStatus: 'submitted' });
    } catch (err) {
      setError(describeError(err, isAr));
    } finally {
      setBusy(false);
    }
  };

  const steps = isAr
    ? [
        'حمّل نموذج الالتزام واطبعه ووقّعه.',
        'صادق على التوقيع لدى الجهة المختصة (المقاطعة أو الجماعة).',
        'أرفق نسخة من بطاقتك الوطنية (الوجه والظهر).',
        'سلّم الملف لمنسق جهتك. سيعلمك الحزب بكيفية الاتصال به.',
      ]
    : [
        'Téléchargez l’engagement, imprimez-le et signez-le.',
        'Faites légaliser la signature (arrondissement ou commune).',
        'Joignez une photocopie de votre CIN, recto et verso.',
        'Remettez le dossier à votre coordinateur régional : le parti vous indiquera comment le joindre.',
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
            onClick={() => printRegistrationSheet(view)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isAr ? 'بطاقة التلخيص' : 'Fiche d’adhésion'}</span>
          </button>
        </div>
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DOC_KINDS.map((kind) => {
          const st = statusOf(kind);
          const ui = statusUi(kind, st, isAr);
          const canUploadSlip = kind === 'electoral' && (st === 'none' || st === 'rejected');
          return (
            <li key={kind} className="rounded-xl bg-white border border-slate-200 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900">{isAr ? DOC_LABELS[kind].ar : DOC_LABELS[kind].fr}</div>
                  <div className="text-[11px] text-slate-500">{isAr ? DOC_LABELS[kind].hintAr : DOC_LABELS[kind].hintFr}</div>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold border ${ui.tone}`}>
                  <ui.Icon className="w-3 h-3" />
                  <span>{ui.label}</span>
                </span>
              </div>

              {canUploadSlip && (
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://www.listeselectorales.ma"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تحقق من قيدي' : 'Vérifier mon inscription'}</span>
                  </a>
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white cursor-pointer">
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                    <span>{st === 'rejected' ? (isAr ? 'إعادة الإيداع' : 'Redéposer') : isAr ? 'إيداع' : 'Déposer'}</span>
                    <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleSlip} disabled={busy} className="hidden" />
                  </label>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!complete && (
        <div className="rounded-xl bg-white/70 border border-amber-200 p-3 space-y-1.5">
          <div className="text-xs font-bold text-slate-900">
            {isAr ? 'كيف تستكمل ملفك الورقي؟' : 'Comment compléter votre dossier papier ?'}
          </div>
          <ol className="list-decimal ps-5 text-xs text-slate-700 space-y-1">
            {steps.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </div>
      )}

      <p className="text-[11px] text-slate-600">
        {isAr
          ? 'تُقبل لقطة شاشة أو ملف PDF (700 كيلوبايت كحد أقصى) لوصل القيد، وتحوَّل اللقطة تلقائياً إلى PDF. لا يطلع على الوثائق إلا المسؤولون المخولون.'
          : 'Pour la fiche électorale : PDF ou capture d’écran (700 Ko max), convertie automatiquement en PDF. Seuls les responsables habilités consultent ces documents.'}
      </p>
      {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
};
