import { DocStatus, Member } from '../types';

/** Pièces du dossier d'adhésion que chaque membre doit déposer et que l'administration valide une à une. */
export type DocKind = 'engagement' | 'cinRecto' | 'cinVerso' | 'electoral';

export const DOC_KINDS: DocKind[] = ['engagement', 'cinRecto', 'cinVerso', 'electoral'];

/** Pièces papier : remises en main propre (ou par courrier) au coordinateur régional, jamais téléversées. */
export const POSTAL_KINDS: DocKind[] = ['engagement', 'cinRecto', 'cinVerso'];
export const isPostal = (k: DocKind): boolean => POSTAL_KINDS.includes(k);

export const DOC_LABELS: Record<DocKind, { fr: string; ar: string; hintFr: string; hintAr: string }> = {
  engagement: {
    fr: 'Engagement signé et légalisé',
    ar: 'الالتزام الموقع والمصادق عليه',
    hintFr: 'Original signé, signature légalisée, à remettre au coordinateur.',
    hintAr: 'النسخة الأصلية الموقعة والمصادق عليها، تسلم للمنسق.',
  },
  cinRecto: {
    fr: 'CIN — recto',
    ar: 'البطاقة الوطنية — الوجه',
    hintFr: 'Photocopie du recto, à remettre au coordinateur.',
    hintAr: 'نسخة الوجه الأمامي، تسلم للمنسق.',
  },
  cinVerso: {
    fr: 'CIN — verso',
    ar: 'البطاقة الوطنية — الظهر',
    hintFr: 'Photocopie du verso, à remettre au coordinateur.',
    hintAr: 'نسخة الوجه الخلفي، تسلم للمنسق.',
  },
  electoral: {
    fr: 'Fiche d’inscription sur les listes électorales',
    ar: 'وصل القيد في اللوائح الانتخابية',
    hintFr: 'Capture de la page du ministère, du SMS de réponse (2727) ou de l’appli MonBV.',
    hintAr: 'لقطة لصفحة الوزارة أو لرسالة الرد (2727) أو لتطبيق MonBV.',
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
