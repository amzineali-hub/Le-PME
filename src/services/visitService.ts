import { doc, getDoc, increment, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Compteur de visiteurs : un seul document public `stats/visits` { total, unique }.
 * - `total`  : nombre de visites (une par session de navigateur) ;
 * - `unique` : nombre d'appareils distincts (un drapeau est gardé dans le navigateur du visiteur).
 * Aucune donnée personnelle n'est enregistrée : ni adresse IP, ni identifiant, ni historique.
 */
export interface VisitStats {
  total: number;
  unique: number;
}

const SESSION_KEY = 'pme_visit_counted';
const DEVICE_KEY = 'pme_visitor_seen';
const ref = () => doc(db, 'stats', 'visits');

const safeGet = (store: 'session' | 'local', key: string): string | null => {
  try {
    return (store === 'session' ? sessionStorage : localStorage).getItem(key);
  } catch {
    return null;
  }
};
const safeSet = (store: 'session' | 'local', key: string) => {
  try {
    (store === 'session' ? sessionStorage : localStorage).setItem(key, '1');
  } catch {
    /* navigation privée : on compte simplement à chaque session */
  }
};

export async function readVisitStats(): Promise<VisitStats | null> {
  try {
    const snap = await getDoc(ref());
    if (!snap.exists()) return null;
    const d = snap.data();
    return { total: Number(d.total) || 0, unique: Number(d.unique) || 0 };
  } catch {
    return null;
  }
}

/** Compte la visite en cours (au plus une fois par session) puis renvoie les totaux à jour. */
export async function registerVisit(): Promise<VisitStats | null> {
  // Pas de comptage en développement local.
  if (import.meta.env.DEV) return readVisitStats();
  if (safeGet('session', SESSION_KEY)) return readVisitStats();
  safeSet('session', SESSION_KEY);

  const newDevice = !safeGet('local', DEVICE_KEY);
  const inc = newDevice ? 1 : 0;
  try {
    try {
      await updateDoc(ref(), { total: increment(1), unique: increment(inc) });
    } catch (err) {
      // Le document n'existe pas encore : première visite de tous les temps.
      if ((err as { code?: string })?.code === 'not-found') {
        await setDoc(ref(), { total: 1, unique: 1 });
      } else {
        throw err;
      }
    }
    if (newDevice) safeSet('local', DEVICE_KEY);
  } catch {
    /* le compteur ne doit jamais gêner la navigation */
  }
  return readVisitStats();
}
