import React, { useState } from 'react';
import { DocStatus, Language, Member } from '../types';
import { describeError, prepareElectoralProof, submitDocument } from '../services/memberService';
import { printRegistrationSheet } from '../utils/registrationSheet';
import { DOC_KINDS, DOC_LABELS, DocKind, docStatusOf, dossierProgress, statusField } from '../utils/dossier';
import { CheckCircle2, Clock, Download, ExternalLink, FileQuestion, Loader2, Printer, UploadCloud, XCircle } from 'lucide-react';

interface DossierCardProps {
  member: Member;
  lang: Language;
  onMemberUpdated?: (patch: Partial<Member>) => void;
}

const STATUS_UI: Record<DocStatus, { fr: string; ar: string; tone: string; Icon: React.ElementType }> = {
  none: { fr: 'À déposer', ar: 'لم يُودع', tone: 'bg-slate-100 text-slate-700 border-slate-300', Icon: FileQuestion },
  submitted: { fr: 'En contrôle', ar: 'قيد المراجعة', tone: 'bg-amber-100 text-amber-900 border-amber-300', Icon: Clock },
  verified: { fr: 'Validée', ar: 'تم التحقق', tone: 'bg-emerald-100 text-emerald-900 border-emerald-300', Icon: CheckCircle2 },
  rejected: { fr: 'À redéposer', ar: 'مرفوضة', tone: 'bg-red-100 text-red-900 border-red-300', Icon: XCircle },
};

/**
 * Dossier d'adhésion : les quatre pièces à fournir (engagement signé et légalisé, CIN recto/verso,
 * fiche électorale). La carte de membre fondateur reste « en instance » tant qu'elles ne sont pas toutes validées.
 */
export const DossierCard: React.FC<DossierCardProps> = ({ member, lang, onMemberUpdated }) => {
  const isAr = lang === 'ar';
  const [local, setLocal] = useState<Partial<Record<DocKind, DocStatus>>>({});
  const [busy, setBusy] = useState<DocKind | null>(null);
  const [error, setError] = useState('');

  const statusOf = (k: DocKind): DocStatus => local[k] ?? docStatusOf(member, k);
  const view: Member = { ...member, ...Object.fromEntries(Object.entries(local).map(([k, v]) => [statusField(k as DocKind), v])) };
  const progress = dossierProgress(view);

  const handleFile = (kind: DocKind) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(kind);
    setError('');
    try {
      await submitDocument(member.id, kind, await prepareElectoralProof(file));
      setLocal((prev) => ({ ...prev, [kind]: 'submitted' }));
      onMemberUpdated?.({ [statusField(kind)]: 'submitted' });
    } catch (err) {
      setError(describeError(err, isAr));
    } finally {
      setBusy(null);
    }
  };

  const complete = progress === DOC_KINDS.length;

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
          const ui = STATUS_UI[st];
          const canUpload = st === 'none' || st === 'rejected';
          return (
            <li key={kind} className="rounded-xl bg-white border border-slate-200 p-3 space-y-2">
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

              {canUpload && (
                <div className="flex flex-wrap gap-2">
                  {kind === 'electoral' && (
                    <a
                      href="https://www.listeselectorales.ma"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تحقق من قيدي' : 'Vérifier mon inscription'}</span>
                    </a>
                  )}
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white cursor-pointer">
                    {busy === kind ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                    <span>{st === 'rejected' ? (isAr ? 'إعادة الإيداع' : 'Redéposer') : isAr ? 'إيداع' : 'Déposer'}</span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleFile(kind)}
                      disabled={busy !== null}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="text-[11px] text-slate-600">
        {isAr
          ? 'ملفات PDF فقط، 700 كيلوبايت كحد أقصى لكل وثيقة. لا يطلع على الوثائق إلا مسؤولو الحزب المخولون.'
          : 'PDF uniquement, 700 Ko maximum par pièce. Seuls les responsables habilités du parti consultent ces documents.'}
      </p>
      {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
};
