import { DocStatus, Member } from '../types';

/** Pièces du dossier d'adhésion que chaque membre doit déposer et que l'administration valide une à une. */
export type DocKind = 'engagement' | 'cinRecto' | 'cinVerso' | 'electoral';

export const DOC_KINDS: DocKind[] = ['engagement', 'cinRecto', 'cinVerso', 'electoral'];

export const DOC_LABELS: Record<DocKind, { fr: string; ar: string; hintFr: string; hintAr: string }> = {
  engagement: {
    fr: 'Engagement signé et légalisé',
    ar: 'الالتزام الموقع والمصادق عليه',
    hintFr: 'Photo ou PDF de l’engagement, signature légalisée.',
    hintAr: 'صورة أو PDF للالتزام مع التوقيع المصادق عليه.',
  },
  cinRecto: {
    fr: 'CIN — recto',
    ar: 'البطاقة الوطنية — الوجه',
    hintFr: 'Face avant de votre carte nationale.',
    hintAr: 'الوجه الأمامي لبطاقتك الوطنية.',
  },
  cinVerso: {
    fr: 'CIN — verso',
    ar: 'البطاقة الوطنية — الظهر',
    hintFr: 'Face arrière de votre carte nationale.',
    hintAr: 'الوجه الخلفي لبطاقتك الوطنية.',
  },
  electoral: {
    fr: 'Fiche d’inscription sur les listes électorales',
    ar: 'وصل القيد في اللوائح الانتخابية',
    hintFr: 'Photo ou PDF de la fiche délivrée par le ministère de l’Intérieur.',
    hintAr: 'صورة أو PDF للوصل الصادر عن وزارة الداخلية.',
  },
};

/** Champ du profil qui porte l'état de chaque pièce (électoral : champ historique). */
export const statusField = (kind: DocKind): 'electoralStatus' | 'engagementStatus' | 'cinRectoStatus' | 'cinVersoStatus' =>
  kind === 'electoral' ? 'electoralStatus' : (`${kind}Status` as 'engagementStatus' | 'cinRectoStatus' | 'cinVersoStatus');

export const docStatusOf = (m: Member, kind: DocKind): DocStatus => m[statusField(kind)] ?? 'none';

export const dossierProgress = (m: Member): number => DOC_KINDS.filter((k) => docStatusOf(m, k) === 'verified').length;

/** La carte de membre n'est « certifiée » que lorsque les quatre pièces sont validées. */
export const isDossierComplete = (m: Member): boolean => dossierProgress(m) === DOC_KINDS.length;

/** État global du dossier, pour les listes et filtres de l'administration. */
export function dossierState(m: Member): DocStatus {
  if (isDossierComplete(m)) return 'verified';
  const statuses = DOC_KINDS.map((k) => docStatusOf(m, k));
  if (statuses.includes('submitted')) return 'submitted';
  if (statuses.includes('rejected')) return 'rejected';
  return 'none';
}
