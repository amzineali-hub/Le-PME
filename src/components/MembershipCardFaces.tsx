import React from 'react';
import { Member, Language } from '../types';
import { MOROCCAN_REGIONS } from '../data/regions';
import { TRANSLATIONS } from '../data/translations';
import { DOC_KINDS, DOC_LABELS, docStatusOf, dossierProgress, isDossierComplete } from '../utils/dossier';
import { ShieldCheck, QrCode, CheckCircle2, RotateCw } from 'lucide-react';

/** Taille de référence d'une face de carte (format carte bancaire, ~1,65:1). L'export image l'agrandit par un facteur de pixels. */
export const CARD_WIDTH = 480;
export const CARD_HEIGHT = 290;

interface FaceProps {
  member: Member;
  lang: Language;
  /** Classes de placement supplémentaires (empilement 3D pour l'affichage, rien pour l'export à plat). */
  className?: string;
  /** Affiche l'indication « Cliquer pour verso » (inutile sur l'image exportée). */
  showFlipHint?: boolean;
}

// Masque la CIN (ex. AB123456 -> AB****56)
const maskCin = (cin: string) => {
  if (!cin || cin.length < 4) return cin;
  return `${cin.substring(0, 2)}${'*'.repeat(cin.length - 4)}${cin.substring(cin.length - 2)}`;
};

export const CardFront: React.FC<FaceProps> = ({ member, lang, className = '', showFlipHint = true }) => {
  const t = TRANSLATIONS[lang];
  const complete = isDossierComplete(member);
  const progress = dossierProgress(member);
  const region = MOROCCAN_REGIONS.find((r) => r.id === member.regionId);
  const regionName = lang === 'ar' ? region?.nameAr || member.regionId : region?.nameFr || member.regionId;

  // Bandeau diagonal (en arabe uniquement, quelle que soit la langue du site) tant que le dossier est incomplet.
  const ribbon = !complete ? (
    <div
      aria-hidden="true"
      className="card-ribbon pointer-events-none absolute left-1/2 top-1/2 z-20 w-[170%] -translate-x-1/2 -translate-y-1/2 -rotate-[24deg]"
    >
      <div
        dir="rtl"
        className="font-arabic text-center text-white font-extrabold text-[15px] sm:text-base tracking-wide py-1 bg-red-700/85 border-y-2 border-amber-300 shadow-[0_4px_14px_rgba(0,0,0,0.45)]"
      >
        في انتظار الوثائق المصادق عليها
      </div>
    </div>
  ) : null;

  return (
    <div
      className={`card-face rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 text-white p-5 border-2 border-amber-500/60 shadow-2xl flex flex-col justify-between ${className}`}
    >
      {/* Geometric Moroccan Watermark Background */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[radial-gradient(#f59e0b_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
      {ribbon}

      {/* Header: Kingdom & Party */}
      <div className="relative z-10 flex items-start justify-between border-b border-amber-400/30 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-full bg-white p-1 shrink-0 flex items-center justify-center shadow">
            <img src="/logo.png?v=2" alt="PME" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-[10px] tracking-widest uppercase font-semibold text-amber-300 flex items-center gap-1">
              <span>{t.card.republic}</span>
              <span className="text-white/40">•</span>
              <span>{t.card.cardTitle}</span>
            </div>
            <div className="font-extrabold text-xs sm:text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>Parti du Maroc Émergeant</span>
              <span className="text-amber-400">|</span>
              <span className="font-arabic font-bold text-amber-200">حزب المغرب الصاعد</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              complete
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>
              {complete
                ? lang === 'ar' ? 'موثق رسمياً' : 'Certifié'
                : lang === 'ar' ? 'قيد المراجعة' : 'En cours de validation'}
            </span>
          </span>
          <div className="text-[9px] text-amber-300/80 mt-0.5">{t.card.validity}</div>
        </div>
      </div>

      {/* Body: Photo + Member Info */}
      <div className="relative z-10 flex items-center gap-4 py-1">
        <div className="relative shrink-0">
          <div className="w-20 h-24 rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-lg bg-slate-800">
            <img
              src={member.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
              alt={`${member.firstNameFr} ${member.lastNameFr}`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-bold shadow">
            ★
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div>
            <div className="text-xs text-amber-300 font-medium">{lang === 'ar' ? 'الاسم والنسب' : 'Nom & Prénom'}</div>
            <div className="font-bold text-sm sm:text-base text-white tracking-wide truncate">
              {member.firstNameFr} {member.lastNameFr.toUpperCase()}
            </div>
            {(member.firstNameAr || member.lastNameAr) && (
              <div className="font-arabic font-bold text-xs text-emerald-200 truncate">
                {member.firstNameAr} {member.lastNameAr}
              </div>
            )}
            {member.contributionBadge && member.contributionBadge !== 'Adhérent Émergeant' && (
              <div className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold">
                {lang === 'ar' ? member.contributionBadgeAr || member.contributionBadge : member.contributionBadge}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11px]">
            <div className="whitespace-nowrap">
              <span className="text-slate-400">{t.card.matricule}</span>{' '}
              <span className="font-mono font-bold text-amber-200">{member.membershipNumber}</span>
            </div>
            <div className="whitespace-nowrap">
              <span className="text-slate-400">{t.card.cin}</span>{' '}
              <span className="font-mono font-bold text-white">{maskCin(member.cin)}</span>
            </div>
            <div className="basis-full truncate">
              <span className="text-slate-400">{t.card.region}</span>{' '}
              <span className="font-semibold text-emerald-300">{regionName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="relative z-10 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px] text-slate-300">
        <div className="flex items-center gap-1 text-emerald-300 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {complete
              ? lang === 'ar' ? 'الملف مكتمل وموثق' : 'Dossier complet et validé'
              : lang === 'ar'
              ? `الملف: ${progress}/${DOC_KINDS.length} وثائق مصادق عليها`
              : `Dossier : ${progress}/${DOC_KINDS.length} pièces validées`}
          </span>
        </div>
        {showFlipHint && (
          <div className="flex items-center gap-1.5 text-white font-bold text-[11px]">
            <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
            <span>{lang === 'ar' ? 'انقر للظهر' : 'Cliquer pour verso'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const CardBack: React.FC<FaceProps> = ({ member, lang, className = '' }) => {
  const t = TRANSLATIONS[lang];
  const progress = dossierProgress(member);

  return (
    <div
      className={`card-face rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 text-white p-5 border-2 border-amber-500/60 shadow-2xl flex flex-col justify-between ${className}`}
    >
      {/* Magnetic/Security Header band */}
      <div className="w-full h-7 bg-slate-900 rounded border border-slate-700/80 flex items-center px-3 justify-between">
        <span className="text-[9px] font-mono tracking-widest text-amber-400">{t.card.securityChip}</span>
        <span className="text-[9px] text-slate-400 font-mono">PME-SEC-TLS13-MA</span>
      </div>

      {/* Dossier detail block & QR */}
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="space-y-1.5 text-[10px] flex-1">
          <div className="text-amber-300 font-bold uppercase tracking-wider text-[9px]">
            {lang === 'ar' ? 'ملف الانخراط' : 'Dossier d’adhésion'} ({progress}/{DOC_KINDS.length})
          </div>
          <ul className="text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800 space-y-0.5">
            {DOC_KINDS.map((kind) => {
              const st = docStatusOf(member, kind);
              const tone =
                st === 'verified' ? 'text-emerald-400' : st === 'rejected' ? 'text-red-400' : st === 'submitted' ? 'text-amber-300' : 'text-slate-500';
              const word =
                st === 'verified'
                  ? lang === 'ar' ? 'مصادق' : 'validée'
                  : st === 'submitted'
                  ? lang === 'ar' ? 'قيد المراجعة' : 'en contrôle'
                  : st === 'rejected'
                  ? lang === 'ar' ? 'مرفوضة' : 'refusée'
                  : lang === 'ar' ? 'ناقصة' : 'manquante';
              return (
                <li key={kind} className="flex items-center justify-between gap-2">
                  <span className="truncate">{lang === 'ar' ? DOC_LABELS[kind].ar : DOC_LABELS[kind].fr}</span>
                  <span className={`font-semibold shrink-0 ${tone}`}>{word}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* QR Code Container */}
        <div className="text-center shrink-0">
          <div className="p-2 bg-white rounded-xl shadow-md border-2 border-amber-400 flex items-center justify-center">
            <div className="w-16 h-16 bg-slate-900 rounded p-1 flex flex-col items-center justify-center text-white">
              <QrCode className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
          <span className="text-[8px] text-amber-300 block mt-1 font-mono">{member.membershipNumber}</span>
        </div>
      </div>

      {/* Bottom: Signature & Official Seal */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
        <div>
          <div>{t.card.signatureLabel}</div>
          <div className="font-serif italic text-amber-300 font-bold text-xs tracking-wider">Ali Amzine</div>
        </div>
        <div className="text-right">
          <div className="text-emerald-400 font-semibold">{t.card.officialSeal}</div>
          <div className="text-slate-500 text-[8px]">Rabat • Royaume du Maroc</div>
        </div>
      </div>
    </div>
  );
};
