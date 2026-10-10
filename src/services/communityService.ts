import {
  addDoc,
  collection,
  doc,
  FieldPath,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { CitizenPoll, DebateComment, DebateTopic, Member, PollOption } from '../types';

type VoteType = 'for' | 'against' | 'neutral';

const formatDate = (value: unknown): string => {
  const ts = value instanceof Timestamp ? value : null;
  if (!ts) return '';
  const d = ts.toDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const snapData = (d: QueryDocumentSnapshot<DocumentData>) => d.data({ serverTimestamps: 'estimate' });

// ---------------------------------------------------------------------------
// Lecture en temps réel
// ---------------------------------------------------------------------------

export function subscribeDebates(cb: (debates: DebateTopic[]) => void, onError?: (e: unknown) => void) {
  return onSnapshot(
    query(collection(db, 'debates'), orderBy('createdAt', 'desc')),
    (snap) =>
      cb(
        snap.docs.map((d) => {
          const x = snapData(d);
          return {
            id: d.id,
            category: x.category,
            titleFr: x.titleFr,
            titleAr: x.titleAr || x.titleFr,
            authorName: x.authorName,
            authorRegion: x.authorRegion,
            authorRole: x.authorRole,
            createdAt: formatDate(x.createdAt),
            contentFr: x.contentFr,
            contentAr: x.contentAr || x.contentFr,
            votesFor: x.votesFor ?? 0,
            votesAgainst: x.votesAgainst ?? 0,
            votesNeutral: x.votesNeutral ?? 0,
            commentsCount: x.commentsCount ?? 0,
            status: x.status ?? 'open',
            tags: x.tags ?? [],
          } as DebateTopic;
        })
      ),
    onError
  );
}

export function subscribeDebateComments(debateId: string, cb: (c: DebateComment[]) => void, onError?: (e: unknown) => void) {
  return onSnapshot(
    query(collection(db, 'debates', debateId, 'comments'), orderBy('createdAt', 'desc')),
    (snap) =>
      cb(
        snap.docs.map((d) => {
          const x = snapData(d);
          return {
            id: d.id,
            debateId,
            authorName: x.authorName,
            authorRegion: x.authorRegion,
            content: x.content,
            createdAt: formatDate(x.createdAt),
            likes: 0,
          } as DebateComment;
        })
      ),
    onError
  );
}

export function subscribePolls(cb: (polls: CitizenPoll[]) => void, onError?: (e: unknown) => void) {
  return onSnapshot(
    query(collection(db, 'polls'), orderBy('createdAtTs', 'desc')),
    (snap) =>
      cb(
        snap.docs.map((d) => {
          const x = snapData(d);
          const counts: Record<string, number> = x.counts ?? {};
          const options: PollOption[] = (x.options ?? []).map((o: PollOption) => ({ ...o, votes: counts[o.id] ?? 0 }));
          return {
            id: d.id,
            questionFr: x.questionFr,
            questionAr: x.questionAr || x.questionFr,
            descriptionFr: x.descriptionFr ?? '',
            descriptionAr: x.descriptionAr || x.descriptionFr || '',
            categoryFr: x.categoryFr ?? '',
            categoryAr: x.categoryAr ?? '',
            deadline: x.deadline ?? '',
            status: x.status ?? 'open',
            type: x.type ?? 'consultation',
            totalVotes: x.totalVotes ?? 0,
            options,
            votedUserIds: [],
            createdBy: x.createdBy,
            createdAt: x.createdAt,
          } as CitizenPoll;
        })
      ),
    onError
  );
}

/** Votes du membre connecté (une seule requête, filtrée sur son uid). */
export function subscribeMyVotes(
  uid: string,
  cb: (v: { debates: Record<string, VoteType>; polls: Record<string, string> }) => void,
  onError?: (e: unknown) => void
) {
  let debates: Record<string, VoteType> = {};
  let polls: Record<string, string> = {};
  const emit = () => cb({ debates: { ...debates }, polls: { ...polls } });
  const u1 = onSnapshot(
    query(collection(db, 'debateVotes'), where('uid', '==', uid)),
    (snap) => {
      debates = {};
      snap.docs.forEach((d) => {
        const x = d.data();
        debates[x.debateId] = x.vote;
      });
      emit();
    },
    onError
  );
  const u2 = onSnapshot(
    query(collection(db, 'pollVotes'), where('uid', '==', uid)),
    (snap) => {
      polls = {};
      snap.docs.forEach((d) => {
        const x = d.data();
        polls[x.pollId] = x.optionId;
      });
      emit();
    },
    onError
  );
  return () => {
    u1();
    u2();
  };
}

// ---------------------------------------------------------------------------
// Écriture (chaque écriture est validée côté serveur par firestore.rules)
// ---------------------------------------------------------------------------

const fullName = (m: Member) => `${m.firstNameFr} ${m.lastNameFr}`;
const isStaff = (m: Member) => m.role === 'admin' || m.role === 'bureau_politique';
const roleLabel = (m: Member) => (isStaff(m) && m.contributionBadge ? m.contributionBadge : 'Membre Adhérent PME');

export async function createDebate(
  member: Member,
  data: Pick<DebateTopic, 'category' | 'titleFr' | 'titleAr' | 'contentFr' | 'contentAr' | 'tags'>
): Promise<void> {
  await addDoc(collection(db, 'debates'), {
    category: data.category,
    titleFr: data.titleFr,
    titleAr: data.titleAr,
    contentFr: data.contentFr,
    contentAr: data.contentAr,
    tags: data.tags.slice(0, 6),
    authorId: member.id,
    authorName: fullName(member),
    authorRegion: member.province,
    authorRole: roleLabel(member),
    createdAt: serverTimestamp(),
    votesFor: 0,
    votesAgainst: 0,
    votesNeutral: 0,
    commentsCount: 0,
    status: 'open',
  });
}

/** Un membre = un vote par débat ; il peut changer d'avis (les compteurs suivent). */
export async function castDebateVote(debateId: string, uid: string, vote: VoteType, previous: VoteType | undefined): Promise<void> {
  if (previous === vote) return;
  const key: Record<VoteType, string> = { for: 'votesFor', against: 'votesAgainst', neutral: 'votesNeutral' };
  const batch = writeBatch(db);
  batch.set(doc(db, 'debateVotes', `${debateId}_${uid}`), { debateId, uid, vote, at: serverTimestamp() });
  const counters: Record<string, ReturnType<typeof increment>> = { [key[vote]]: increment(1) };
  if (previous) counters[key[previous]] = increment(-1);
  batch.update(doc(db, 'debates', debateId), counters);
  await batch.commit();
}

export async function addDebateComment(debateId: string, member: Member, content: string): Promise<void> {
  const batch = writeBatch(db);
  const ref = doc(collection(db, 'debates', debateId, 'comments'));
  batch.set(ref, {
    authorId: member.id,
    authorName: fullName(member),
    authorRegion: member.province,
    content,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, 'debates', debateId), { commentsCount: increment(1) });
  await batch.commit();
}

export async function createPoll(
  member: Member,
  data: Omit<CitizenPoll, 'id' | 'totalVotes' | 'votedUserIds' | 'options'> & { options: PollOption[] }
): Promise<void> {
  const counts: Record<string, number> = {};
  data.options.forEach((o) => {
    counts[o.id] = 0;
  });
  await addDoc(collection(db, 'polls'), {
    questionFr: data.questionFr,
    questionAr: data.questionAr,
    descriptionFr: data.descriptionFr,
    descriptionAr: data.descriptionAr,
    categoryFr: data.categoryFr,
    categoryAr: data.categoryAr,
    deadline: data.deadline,
    status: 'open',
    type: data.type,
    options: data.options.map(({ id, textFr, textAr }) => ({ id, textFr, textAr })),
    counts,
    totalVotes: 0,
    createdBy: fullName(member),
    createdAt: new Date().toISOString().split('T')[0],
    createdAtTs: serverTimestamp(),
  });
}

export async function setPollStatus(pollId: string, status: 'open' | 'closed'): Promise<void> {
  await updateDoc(doc(db, 'polls', pollId), { status });
}

/** Un membre = un seul vote par sondage, définitif. */
export async function castPollVote(pollId: string, uid: string, optionId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, 'pollVotes', `${pollId}_${uid}`), { pollId, uid, optionId, at: serverTimestamp() });
  // FieldPath : l'identifiant de l'option peut contenir des tirets
  batch.update(doc(db, 'polls', pollId), new FieldPath('counts', optionId), increment(1), 'totalVotes', increment(1));
  await batch.commit();
}
