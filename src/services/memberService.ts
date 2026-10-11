import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ElectoralStatus, Member } from '../types';
import { DocKind, statusField } from '../utils/dossier';
import { base64ToBytes, bytesToBase64, jpegToPdf } from '../utils/imagePdf';

export type NewMemberData = Omit<Member, 'id' | 'role' | 'status' | 'isElectorallyVerified' | 'isEmailVerified' | 'electoralStatus'>;

export interface ElectoralProof {
  dataUrl: string;
  mime: 'application/pdf';
  name: string;
}

// La fiche (image ou PDF) est stockée dans Firestore (plan gratuit, sans Cloud Storage).
// Les documents Firestore sont limités à 1 Mo : on compresse les images et on borne les PDF.
// Un document Firestore pèse 1 Mo au plus ; le base64 ajoute 33 % : 690 Ko de PDF tiennent dans 950 000 caractères.
const MAX_PDF_BYTES = 690 * 1024;
const MAX_PROOF_CHARS = 950_000;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type Drawable = { source: CanvasImageSource; width: number; height: number; close?: () => void };

// Décode l'image en tenant compte de l'orientation EXIF des photos de téléphone.
async function decodeImage(file: File): Promise<Drawable> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // format non géré par createImageBitmap : repli sur <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('file-type'));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function encodeJpeg(canvas: HTMLCanvasElement, startQuality: number, maxChars: number): string {
  for (let q = startQuality; q >= 0.3; q -= 0.1) {
    const out = canvas.toDataURL('image/jpeg', q);
    if (out.length <= maxChars) return out;
  }
  throw new Error('file-too-large');
}

function newCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('file-type');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  return { canvas, ctx };
}

/** Redimensionne en conservant les proportions (fiche électorale, lisible jusqu'à 1600 px). */
async function compressImage(file: File, maxSide: number, startQuality: number, maxChars: number): Promise<string> {
  const img = await decodeImage(file);
  try {
    const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
    const { canvas, ctx } = newCanvas(Math.round(img.width * ratio), Math.round(img.height * ratio));
    ctx.drawImage(img.source, 0, 0, canvas.width, canvas.height);
    return encodeJpeg(canvas, startQuality, maxChars);
  } finally {
    img.close?.();
  }
}

/** Photo d'identité : recadrage portrait 4:5 centré, 300x375 px. */
async function portraitPhoto(file: File): Promise<string> {
  const img = await decodeImage(file);
  try {
    const W = 300;
    const H = 375;
    const scale = Math.max(W / img.width, H / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const { canvas, ctx } = newCanvas(W, H);
    ctx.drawImage(img.source, (W - dw) / 2, (H - dh) / 2, dw, dh);
    return encodeJpeg(canvas, 0.85, 150_000);
  } finally {
    img.close?.();
  }
}


export const preparePhoto = (file: File) => portraitPhoto(file);

/**
 * Convertit une capture d'écran (JPG, PNG, WebP…) en PDF d'une page, dans le navigateur.
 * On réduit l'image (1600 px max) et on baisse la qualité JPEG jusqu'à ce que le PDF tienne dans la limite.
 */
async function imageToPdfProof(file: File): Promise<ElectoralProof> {
  const img = await decodeImage(file);
  try {
    const ratio = Math.min(1, 1600 / Math.max(img.width, img.height));
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const { canvas, ctx } = newCanvas(w, h);
    ctx.drawImage(img.source, 0, 0, w, h);
    for (let q = 0.85; q >= 0.35; q -= 0.1) {
      const jpegUrl = canvas.toDataURL('image/jpeg', q);
      const pdf = jpegToPdf(base64ToBytes(jpegUrl.slice(jpegUrl.indexOf(',') + 1)), w, h);
      if (pdf.length <= MAX_PDF_BYTES) {
        const base = file.name.replace(/\.[^.]+$/, '').slice(0, 100) || 'capture';
        return { dataUrl: `data:application/pdf;base64,${bytesToBase64(pdf)}`, mime: 'application/pdf', name: `${base}.pdf` };
      }
    }
    throw new Error('file-too-large');
  } finally {
    img.close?.();
  }
}

/**
 * Pièce du dossier envoyée en ligne (fiche d'inscription électorale) : on stocke toujours un PDF.
 * - un PDF est contrôlé (extension, signature « %PDF », taille) ;
 * - une image (capture d'écran du site du ministère) est convertie en PDF automatiquement.
 */
export async function prepareElectoralProof(file: File): Promise<ElectoralProof> {
  if (file.type.startsWith('image/')) return imageToPdfProof(file);
  const looksPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!looksPdf) throw new Error('file-type');
  if (file.size > MAX_PDF_BYTES) throw new Error('file-too-large');
  const head = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
  if (!head.startsWith('%PDF')) throw new Error('file-type');
  const dataUrl = (await readAsDataUrl(file)).replace(/^data:[^;]*;base64,/, 'data:application/pdf;base64,');
  if (dataUrl.length > MAX_PROOF_CHARS) throw new Error('file-too-large');
  return { dataUrl, mime: 'application/pdf', name: file.name.slice(0, 120) };
}


export async function registerMember(
  data: NewMemberData,
  password: string,
  proof: ElectoralProof
): Promise<Member> {
  const cred = await createUserWithEmailAndPassword(auth, data.email, password);
  const uid = cred.user.uid;
  const member: Member = {
    ...data,
    id: uid,
    role: 'member',
    status: 'pending_verification',
    isElectorallyVerified: false,
    isEmailVerified: false,
    electoralStatus: 'submitted',
    electoralProofName: proof.name,
  };
  const { id: _id, electoralDetails: _details, ...stored } = member;

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'members', uid), { ...stored, createdAt: serverTimestamp() });
    // Verrou d'unicité : échoue si cette CIN est déjà inscrite.
    batch.set(doc(db, 'cins', data.cin), { uid });
    // La fiche électorale est obligatoire : elle est écrite dans la même opération que la fiche adhérent.
    batch.set(doc(db, 'proofs', uid), { ...proof, uploadedAt: serverTimestamp() });
    await batch.commit();
  } catch (err) {
    // On ne laisse pas de compte d'authentification orphelin (ex. CIN déjà inscrite).
    await deleteUser(cred.user).catch(() => undefined);
    throw err;
  }
  return member;
}

export async function submitElectoralProof(uid: string, proof: ElectoralProof): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, 'proofs', uid), { ...proof, uploadedAt: serverTimestamp() });
  batch.update(doc(db, 'members', uid), { electoralStatus: 'submitted', electoralProofName: proof.name });
  await batch.commit();
}

export async function fetchMember(uid: string): Promise<Member | null> {
  const snap = await getDoc(doc(db, 'members', uid));
  return snap.exists() ? ({ ...(snap.data() as Omit<Member, 'id'>), id: uid } as Member) : null;
}

export async function loginMember(email: string, password: string): Promise<Member> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const member = await fetchMember(cred.user.uid);
  if (!member) {
    await signOut(auth);
    throw new Error('member-not-found');
  }
  return member;
}

export const logoutMember = () => signOut(auth);

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim());

export function watchSession(callback: (member: Member | null) => void): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return callback(null);
    // Pendant l'inscription le compte existe avant sa fiche : on n'efface alors pas la session.
    try {
      const member = await fetchMember(user.uid);
      if (member) callback(member);
    } catch {
      // fiche momentanément illisible : on garde l'état courant
    }
  });
}

/** Message lisible (FR/AR) pour une erreur Firebase ou de préparation de fichier. */
export function describeError(err: unknown, isAr: boolean): string {
  const code = String((err as { code?: string; message?: string })?.code || (err as Error)?.message || '');
  const m = (fr: string, ar: string) => (isAr ? ar : fr);
  if (code.includes('email-already-in-use')) return m('Cette adresse email possède déjà un compte.', 'هذا البريد الإلكتروني مسجل مسبقاً.');
  if (code.includes('weak-password')) return m('Mot de passe trop faible (8 caractères minimum).', 'كلمة المرور ضعيفة (8 أحرف على الأقل).');
  if (code.includes('invalid-email')) return m('Adresse email invalide.', 'بريد إلكتروني غير صالح.');
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return m('Email ou mot de passe incorrect.', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  if (code.includes('too-many-requests')) return m('Trop de tentatives. Réessayez dans quelques minutes.', 'محاولات كثيرة. أعد المحاولة بعد دقائق.');
  if (code.includes('network')) return m('Problème de connexion internet.', 'مشكل في الاتصال بالإنترنت.');
  if (code.includes('permission-denied')) return m('Cette CIN est déjà inscrite ou l’accès a été refusé.', 'رقم البطاقة الوطنية مسجل مسبقاً أو تم رفض الطلب.');
  if (code.includes('file-too-large')) return m('PDF trop volumineux (700 Ko maximum). Réduisez-le (numérisation en 150 dpi, niveaux de gris).', 'ملف PDF كبير جداً (700 كيلوبايت كحد أقصى). قلّص حجمه (مسح بدقة 150 نقطة، تدرج رمادي).');
  if (code.includes('file-type')) return m('Format non accepté : PDF ou capture d’écran (image) uniquement.', 'صيغة غير مقبولة: ملف PDF أو لقطة شاشة (صورة) فقط.');
  if (code.includes('member-not-found')) return m('Aucune fiche adhérent associée à ce compte.', 'لا توجد بطاقة منخرط مرتبطة بهذا الحساب.');
  return m('Une erreur est survenue. Veuillez réessayer.', 'حدث خطأ. يرجى المحاولة مرة أخرى.');
}

// ---------------------------------------------------------------------------
// Administration (réservée aux rôles admin / bureau_politique par firestore.rules)
// ---------------------------------------------------------------------------

export async function listAllMembers(): Promise<Member[]> {
  const snap = await getDocs(collection(db, 'members'));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Member, 'id'>), id: d.id }) as Member);
}

export type StoredDocument = { dataUrl: string; mime: string; name: string };

/** Fiche électorale déposée à l'inscription (seule pièce stockée en ligne ; les autres sont remises en main propre). */
export async function fetchElectoralProof(uid: string): Promise<StoredDocument | null> {
  const snap = await getDoc(doc(db, 'proofs', uid));
  return snap.exists() ? (snap.data() as StoredDocument) : null;
}

/**
 * Valide, refuse ou remet en attente une ou plusieurs pièces du dossier (ex. les trois pièces papier
 * reçues en main propre). Autorisé à l'administration et au coordinateur de la région du membre.
 */
export async function setDocumentDecision(member: Member, kinds: DocKind[], decision: ElectoralStatus): Promise<Partial<Member>> {
  const patch: Partial<Member> = {};
  for (const k of kinds) patch[statusField(k)] = decision;
  const after: Member = { ...member, ...patch };
  await updateDoc(doc(db, 'members', member.id), { ...patch });
  // Le statut du compte découle des pièces ; on le recalcule côté affichage (isDossierComplete), pas en base.
  void after;
  return patch;
}

/** Membres des régions suivies par un coordinateur (une requête par région : exigé par les règles de sécurité). */
export async function listMembersForRegions(regionIds: string[]): Promise<Member[]> {
  const snaps = await Promise.all(regionIds.map((r) => getDocs(query(collection(db, 'members'), where('regionId', '==', r)))));
  return snaps.flatMap((snap) => snap.docs.map((d) => ({ ...(d.data() as Omit<Member, 'id'>), id: d.id }) as Member));
}

/** Réservé à l'administration : nomme (ou retire) un coordinateur régional et fixe ses régions. */
export async function setMemberRole(uid: string, role: Member['role'], regions: string[]): Promise<void> {
  await updateDoc(doc(db, 'members', uid), {
    role,
    coordinatorRegions: role === 'regional_coordinator' ? regions : [],
  });
}

// ---------------------------------------------------------------------------
// Profil
// ---------------------------------------------------------------------------

/** Champs que l'adhérent peut modifier lui-même (le rôle, le statut et la CIN restent protégés par les règles). */
export interface MemberProfilePatch {
  firstNameFr: string;
  lastNameFr: string;
  firstNameAr: string;
  lastNameAr: string;
  phone: string;
  profession: string;
  commune: string;
  photoUrl: string;
}

export async function updateMemberProfile(uid: string, patch: MemberProfilePatch): Promise<void> {
  await updateDoc(doc(db, 'members', uid), { ...patch });
}

/** Réservé à l'administration : titre affiché sur le profil et la carte (ex. « Fondateur »). */
export async function setMemberBadge(uid: string, badge: string, badgeAr: string): Promise<void> {
  await updateDoc(doc(db, 'members', uid), {
    contributionBadge: badge.trim().slice(0, 60),
    contributionBadgeAr: badgeAr.trim().slice(0, 60),
  });
}

/** Réservé à l'administration : rattache un adhérent à une autre région (et province). */
export async function setMemberRegion(uid: string, regionId: string, province: string): Promise<void> {
  await updateDoc(doc(db, 'members', uid), { regionId, province });
}
