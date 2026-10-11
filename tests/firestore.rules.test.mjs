/**
 * Tests des règles de sécurité Firestore (66 cas : inscription, profil, coordinateurs, forum, sondages).
 *
 * Lancer (Java 11+ requis par l'émulateur) :
 *   npm i --no-save firebase-tools @firebase/rules-unit-testing
 *   npx firebase emulators:exec --only firestore --project demo-pme "node tests/firestore.rules.test.mjs"
 * (firebase.json doit déclarer firestore.rules et l'émulateur firestore sur 127.0.0.1:8080)
 */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, getDocs, setDoc, updateDoc, collection, query, where, writeBatch, increment, serverTimestamp, addDoc,
} from 'firebase/firestore';
import fs from 'fs';

const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const env = await initializeTestEnvironment({
  projectId: 'demo-pme',
  firestore: { rules, host: '127.0.0.1', port: 8080 },
});

const A = 'rabat-sale-kenitra';
const B = 'casablanca-settat';
const base = (uid, regionId, extra = {}) => ({
  membershipNumber: 'PME-2026-X-1', firstNameFr: 'Ali', lastNameFr: uid, firstNameAr: 'علي', lastNameAr: 'x',
  cin: 'AB' + (100000 + Math.abs([...uid].reduce((a, c) => a + c.charCodeAt(0), 0))),
  email: uid + '@x.ma', phone: '+2126', birthDate: '1980-01-01', gender: 'M', regionId, province: 'Rabat', commune: 'Rabat',
  profession: 'x', photoUrl: 'data:image/jpeg;base64,AAAA', commissionInterest: 'x', joinedDate: '10/10/2026', validUntil: '31/12/2027',
  contributionBadge: 'Adhérent Émergeant', role: 'member', status: 'pending_verification', isElectorallyVerified: false,
  isEmailVerified: false, electoralStatus: 'none', ...extra,
});
const pdf = (n = 1000) => ({ dataUrl: 'data:application/pdf;base64,' + 'A'.repeat(n), mime: 'application/pdf', name: 'c.pdf' });

// ---- seed (rules disabled)
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'members', 'admin'), base('admin', A, { role: 'admin' }));
  await setDoc(doc(db, 'members', 'coord'), base('coord', A, { role: 'regional_coordinator', coordinatorRegions: [A] }));
  await setDoc(doc(db, 'members', 'alice'), base('alice', A));
  await setDoc(doc(db, 'members', 'bob'), base('bob', B));
  await setDoc(doc(db, 'members', 'full'), base('full', A, { electoralStatus: 'verified', engagementStatus: 'verified', cinRectoStatus: 'verified', cinVersoStatus: 'verified' }));
  await setDoc(doc(db, 'debates', 'd1'), { category: 'economy', titleFr: 't', titleAr: '', contentFr: 'c', contentAr: '', tags: [], authorId: 'bob', authorName: 'Ali bob', authorRegion: 'Rabat', authorRole: 'Membre Adhérent PME', createdAt: new Date(), votesFor: 0, votesAgainst: 0, votesNeutral: 0, commentsCount: 0, status: 'open' });
  await setDoc(doc(db, 'polls', 'p1'), { questionFr: 'q', options: [{ id: 'o-1', textFr: 'a', textAr: 'a' }, { id: 'o-2', textFr: 'b', textAr: 'b' }], counts: { 'o-1': 0, 'o-2': 0 }, totalVotes: 0, status: 'open', type: 'consultation', createdAtTs: new Date() });
  await setDoc(doc(db, 'polls', 'p2'), { questionFr: 'q', options: [{ id: 'o-1', textFr: 'a', textAr: 'a' }], counts: { 'o-1': 0 }, totalVotes: 0, status: 'open', type: 'internal_election', createdAtTs: new Date() });
  await setDoc(doc(db, 'polls', 'p3'), { questionFr: 'q', options: [{ id: 'o-1', textFr: 'a', textAr: 'a' }], counts: { 'o-1': 0 }, totalVotes: 0, status: 'closed', type: 'consultation', createdAtTs: new Date() });
});

let pass = 0, fail = 0;
const results = [];
const t = async (name, fn) => {
  try { await fn(); pass++; results.push('  ok  ' + name); }
  catch (e) { fail++; results.push('  XX  ' + name + '  -> ' + String(e.message).split('\n')[0].slice(0, 110)); }
};
const as = (uid) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const ok = (p) => assertSucceeds(p);
const no = (p) => assertFails(p);

// ===================== INSCRIPTION =====================
const signup = (uid, over = {}, { lock = uid, cinOver } = {}) => {
  const db = as(uid);
  const data = { ...base(uid, A, { cin: cinOver ?? 'ZZ' + (200000 + uid.length) }), createdAt: serverTimestamp(), ...over };
  const batch = writeBatch(db);
  batch.set(doc(db, 'members', uid), data);
  batch.set(doc(db, 'cins', data.cin), { uid: lock });
  return batch.commit();
};
await t('inscription valide (fiche + verrou CIN)', () => ok(signup('newbie1', {}, { cinOver: 'ZZ100001' })));
await t('inscription refusée : titre « Fondateur » auto-attribué', () => no(signup('newbie2', { contributionBadge: 'Fondateur' }, { cinOver: 'ZZ100002' })));
await t('inscription refusée : pièce « validée » injectée', () => no(signup('newbie3', { engagementStatus: 'verified' }, { cinOver: 'ZZ100003' })));
await t('inscription refusée : rôle admin', () => no(signup('newbie4', { role: 'admin' }, { cinOver: 'ZZ100004' })));
await t('inscription refusée : coordinatorRegions injecté', () => no(signup('newbie5', { coordinatorRegions: [A] }, { cinOver: 'ZZ100005' })));
await t('inscription refusée : fiche électorale déjà « validée »', () => no(signup('newbie6', { electoralStatus: 'verified' }, { cinOver: 'ZZ100006' })));
await t('inscription refusée : champ inconnu (stockage de fichier)', () => no(signup('newbie6b', { electoralProofName: 'x.pdf' }, { cinOver: 'ZZ100016' })));
await t('inscription refusée : verrou CIN au nom d\'un autre', () => no(signup('newbie7', {}, { cinOver: 'ZZ100007', lock: 'bob' })));
await t('inscription refusée : CIN déjà inscrite', () => no(signup('newbie8', {}, { cinOver: 'ZZ100001' })));
await t('inscription refusée : CIN au mauvais format', () => no(signup('newbie9', {}, { cinOver: 'zz-1' })));

// ===================== PROFIL / DOSSIER (adhérent) =====================
await t('adhérent modifie son profil (nom, téléphone)', () => ok(updateDoc(doc(as('alice'), 'members', 'alice'), { firstNameFr: 'Aliou', phone: '+2127' })));
await t('adhérent ne peut pas changer son rôle', () => no(updateDoc(doc(as('alice'), 'members', 'alice'), { role: 'admin' })));
await t('adhérent ne peut pas s\'attribuer un titre', () => no(updateDoc(doc(as('alice'), 'members', 'alice'), { contributionBadge: 'Fondateur' })));
await t('adhérent ne peut pas valider ses pièces', () => no(updateDoc(doc(as('alice'), 'members', 'alice'), { engagementStatus: 'verified' })));
await t('adhérent ne peut pas valider sa fiche électorale', () => no(updateDoc(doc(as('alice'), 'members', 'alice'), { electoralStatus: 'verified' })));
await t('adhérent ne peut pas changer sa région', () => no(updateDoc(doc(as('alice'), 'members', 'alice'), { regionId: B })));
await t('adhérent ne peut pas se faire coordinateur', () => no(updateDoc(doc(as('alice'), 'members', 'alice'), { coordinatorRegions: [A, B] })));
await t('adhérent lit sa propre fiche', () => ok(getDoc(doc(as('alice'), 'members', 'alice'))));
await t('adhérent ne lit pas la fiche d\'un autre', () => no(getDoc(doc(as('alice'), 'members', 'bob'))));
await t('adhérent ne liste pas les membres', () => no(getDocs(collection(as('alice'), 'members'))));
await t('plus aucune pièce stockée : collection proofs fermée', () => no(getDoc(doc(as('alice'), 'proofs', 'alice'))));

// ===================== COORDINATEUR (région A) =====================
await t('coordinateur lit un membre de sa région', () => ok(getDoc(doc(as('coord'), 'members', 'alice'))));
await t('coordinateur ne lit pas un membre d\'une autre région', () => no(getDoc(doc(as('coord'), 'members', 'bob'))));
await t('coordinateur liste sa région (where regionId == A)', () => ok(getDocs(query(collection(as('coord'), 'members'), where('regionId', '==', A)))));
await t('coordinateur ne liste pas une autre région', () => no(getDocs(query(collection(as('coord'), 'members'), where('regionId', '==', B)))));
await t('coordinateur ne liste pas tout sans filtre', () => no(getDocs(collection(as('coord'), 'members'))));
await t('coordinateur valide les pièces papier d\'un membre de sa région', () => ok(updateDoc(doc(as('coord'), 'members', 'alice'), { engagementStatus: 'verified', cinRectoStatus: 'verified', cinVersoStatus: 'verified' })));
await t('coordinateur valide la fiche électorale de sa région', () => ok(updateDoc(doc(as('coord'), 'members', 'alice'), { electoralStatus: 'verified' })));
await t('coordinateur ne valide pas hors de sa région', () => no(updateDoc(doc(as('coord'), 'members', 'bob'), { engagementStatus: 'verified' })));
await t('coordinateur ne change pas la région d\'un membre', () => no(updateDoc(doc(as('coord'), 'members', 'alice'), { regionId: B })));
await t('coordinateur ne change pas un rôle', () => no(updateDoc(doc(as('coord'), 'members', 'alice'), { role: 'admin' })));
await t('coordinateur ne donne pas de titre', () => no(updateDoc(doc(as('coord'), 'members', 'alice'), { contributionBadge: 'Fondateur' })));
await t('coordinateur ne valide pas son propre dossier', () => no(updateDoc(doc(as('coord'), 'members', 'coord'), { engagementStatus: 'verified' })));
await t('coordinateur : valeur d\'état invalide refusée', () => no(updateDoc(doc(as('coord'), 'members', 'alice'), { engagementStatus: 'ok' })));

// ===================== ADMIN =====================
await t('admin liste tous les membres', () => ok(getDocs(collection(as('admin'), 'members'))));
await t('admin nomme un coordinateur', () => ok(updateDoc(doc(as('admin'), 'members', 'bob'), { role: 'regional_coordinator', coordinatorRegions: [B] })));
await t('admin ne peut pas écrire dans proofs (fermée)', () => no(setDoc(doc(as('admin'), 'proofs', 'alice'), { dataUrl: 'x', mime: 'application/pdf', name: 'a.pdf', uploadedAt: new Date() })));

// ===================== FORUM =====================
const debate = (over = {}) => ({ category: 'economy', titleFr: 'Titre', titleAr: '', contentFr: 'Contenu', contentAr: '', tags: ['x'], authorId: 'alice', authorName: 'Aliou alice', authorRegion: 'Rabat', authorRole: 'Membre Adhérent PME', createdAt: serverTimestamp(), votesFor: 0, votesAgainst: 0, votesNeutral: 0, commentsCount: 0, status: 'open', ...over });
await t('lecture publique des débats (visiteur)', () => ok(getDocs(collection(anon(), 'debates'))));
await t('visiteur ne publie pas', () => no(addDoc(collection(anon(), 'debates'), debate())));
await t('membre publie un débat', () => ok(addDoc(collection(as('alice'), 'debates'), debate())));
await t('débat refusé : nom usurpé', () => no(addDoc(collection(as('alice'), 'debates'), debate({ authorName: 'Fondateur X' }))));
await t('débat refusé : compteurs truqués', () => no(addDoc(collection(as('alice'), 'debates'), debate({ votesFor: 50 }))));
await t('débat refusé : rôle usurpé', () => no(addDoc(collection(as('alice'), 'debates'), debate({ authorRole: 'Fondateur' }))));

const vote = (uid, debateId, v, counters) => {
  const db = as(uid); const b = writeBatch(db);
  b.set(doc(db, 'debateVotes', `${debateId}_${uid}`), { debateId, uid, vote: v, at: serverTimestamp() });
  b.update(doc(db, 'debates', debateId), counters);
  return b.commit();
};
await t('premier vote « pour » : compteur +1', () => ok(vote('alice', 'd1', 'for', { votesFor: increment(1) })));
await t('changement « contre » : +1 contre, -1 pour', () => ok(vote('alice', 'd1', 'against', { votesAgainst: increment(1), votesFor: increment(-1) })));
await t('vote refusé : compteur +2', () => no(vote('full', 'd1', 'for', { votesFor: increment(2) })));
await t('vote refusé : compteur sans vote (bourrage)', () => no(updateDoc(doc(as('full'), 'debates', 'd1'), { votesFor: increment(1) })));
await t('vote refusé : pour un autre membre', () => {
  const db = as('full'); const b = writeBatch(db);
  b.set(doc(db, 'debateVotes', 'd1_bob'), { debateId: 'd1', uid: 'bob', vote: 'for', at: serverTimestamp() });
  b.update(doc(db, 'debates', 'd1'), { votesFor: increment(1) });
  return no(b.commit());
});
await t('lecture de son propre vote seulement', async () => {
  await ok(getDocs(query(collection(as('alice'), 'debateVotes'), where('uid', '==', 'alice'))));
  await no(getDocs(query(collection(as('alice'), 'debateVotes'), where('uid', '==', 'bob'))));
});
await t('commentaire + compteur +1', () => {
  const db = as('alice'); const b = writeBatch(db);
  b.set(doc(collection(db, 'debates', 'd1', 'comments')), { authorId: 'alice', authorName: 'Aliou alice', authorRegion: 'Rabat', content: 'Bonjour', createdAt: serverTimestamp() });
  b.update(doc(db, 'debates', 'd1'), { commentsCount: increment(1) });
  return ok(b.commit());
});
await t('compteur de commentaires +5 refusé', () => no(updateDoc(doc(as('alice'), 'debates', 'd1'), { commentsCount: increment(5) })));
await t('commentaire refusé : nom usurpé', () => no(addDoc(collection(as('alice'), 'debates', 'd1', 'comments'), { authorId: 'alice', authorName: 'Autre', authorRegion: 'Rabat', content: 'x', createdAt: serverTimestamp() })));

// ===================== SONDAGES =====================
const pvote = (uid, pollId, opt) => {
  const db = as(uid); const b = writeBatch(db);
  b.set(doc(db, 'pollVotes', `${pollId}_${uid}`), { pollId, uid, optionId: opt, at: serverTimestamp() });
  b.update(doc(db, 'polls', pollId), { [`counts.${opt}`]: increment(1), totalVotes: increment(1) });
  return b.commit();
};
await t('lecture publique des sondages', () => ok(getDocs(collection(anon(), 'polls'))));
await t('membre vote une fois (option à tiret)', () => ok(pvote('alice', 'p1', 'o-1')));
await t('second vote du même membre refusé', () => no(pvote('alice', 'p1', 'o-2')));
await t('vote refusé : sondage clos', () => no(pvote('bob', 'p3', 'o-1')));
await t('scrutin interne refusé : dossier incomplet', () => no(pvote('newbie1', 'p2', 'o-1')));
await t('scrutin interne accepté : dossier complet', () => ok(pvote('full', 'p2', 'o-1')));
await t('compteur de sondage truqué (+5) refusé', () => no(updateDoc(doc(as('bob'), 'polls', 'p1'), { totalVotes: increment(5), 'counts.o-1': increment(5) })));
await t('membre ne crée pas de sondage', () => no(addDoc(collection(as('alice'), 'polls'), { questionFr: 'x', options: [], counts: {}, totalVotes: 0, status: 'open', type: 'consultation' })));
await t('admin crée un sondage', () => ok(addDoc(collection(as('admin'), 'polls'), { questionFr: 'x', options: [], counts: {}, totalVotes: 0, status: 'open', type: 'consultation' })));
await t('admin clôt un sondage', () => ok(updateDoc(doc(as('admin'), 'polls', 'p1'), { status: 'closed' })));
await t('membre ne clôt pas un sondage', () => no(updateDoc(doc(as('alice'), 'polls', 'p1'), { status: 'closed' })));

// ===================== ACCÈS INTERDITS =====================
await t('collection inconnue interdite', () => no(getDocs(collection(as('admin'), 'secrets'))));
await t('verrous CIN illisibles', () => no(getDoc(doc(as('admin'), 'cins', 'AB100000'))));
await t('visiteur ne lit aucun membre', () => no(getDoc(doc(anon(), 'members', 'alice'))));

console.log(results.join('\n'));
console.log(`\n${pass} réussis, ${fail} échecs sur ${pass + fail} tests`);
await env.cleanup();
process.exit(fail ? 1 : 0);
