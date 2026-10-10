import React, { useState } from 'react';
import { ElectoralStatus, Language, Member } from '../types';
import { describeError, prepareElectoralProof, submitElectoralProof } from '../services/memberService';
import { printRegistrationSheet } from '../utils/registrationSheet';
import { ExternalLink, FileCheck2, Loader2, Printer, UploadCloud } from 'lucide-react';

interface ElectoralProofCardProps {
  member: Member;
  lang: Language;
}

export const ElectoralProofCard: React.FC<ElectoralProofCardProps> = ({ member, lang }) => {
  const isAr = lang === 'ar';
  const [status, setStatus] = useState<ElectoralStatus>(member.electoralStatus ?? 'none');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await submitElectoralProof(member.id, await prepareElectoralProof(file));
      setStatus('submitted');
    } catch (err) {
      setError(describeError(err, isAr));
    } finally {
      setBusy(false);
    }
  };

  const message: Record<ElectoralStatus, string> = {
    none: isAr
      ? 'لم تُودع بعد وصل قيدك في اللوائح الانتخابية.'
      : 'Vous n’avez pas encore déposé votre fiche d’inscription sur les listes électorales.',
    submitted: isAr
      ? 'تم إيداع الوصل، وهو في انتظار مراجعة مسؤولي الحزب.'
      : 'Fiche déposée : elle sera contrôlée par les responsables du parti.',
    verified: isAr ? 'تم التحقق من قيدك في اللوائح الانتخابية.' : 'Votre inscription sur les listes électorales est vérifiée.',
    rejected: isAr
      ? 'تم رفض الوصل المودع، يرجى إيداع وصل واضح.'
      : 'La fiche déposée a été refusée : merci d’en déposer une lisible et à jour.',
  };

  const canUpload = status === 'none' || status === 'rejected';
  const tone =
    status === 'verified'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
      : status === 'rejected'
      ? 'border-red-300 bg-red-50 text-red-900'
      : 'border-amber-300 bg-amber-50 text-amber-900';

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${tone}`}>
      <div className="flex items-start gap-3">
        <FileCheck2 className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-sm">{isAr ? 'القيد في اللوائح الانتخابية' : 'Inscription sur les listes électorales'}</div>
          <p className="text-xs leading-relaxed">{message[status]}</p>
          {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {canUpload && (
          <>
            <a
              href="https://www.listeselectorales.ma"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-100"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحقق من قيدي' : 'Vérifier mon inscription'}</span>
            </a>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>{isAr ? 'إيداع الوصل' : 'Déposer ma fiche'}</span>
              <input type="file" accept="image/*,application/pdf" onChange={handleFile} disabled={busy} className="hidden" />
            </label>
          </>
        )}
        <button
          type="button"
          onClick={() => printRegistrationSheet({ ...member, electoralStatus: status })}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-100"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>{isAr ? 'بطاقة التلخيص' : 'Fiche d’adhésion'}</span>
        </button>
      </div>
    </div>
  );
};
