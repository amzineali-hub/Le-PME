import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ElectoralStatus, Language, Member } from '../types';
import { MOROCCAN_REGIONS } from '../data/regions';
import { DOC_KINDS, DOC_LABELS, DocKind, docStatusOf, dossierProgress, dossierState } from '../utils/dossier';
import {
  describeError,
  fetchMemberDocument,
  listAllMembers,
  setDocumentDecision,
  setMemberBadge,
  setMemberRegion,
} from '../services/memberService';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileQuestion,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: Member | null;
  lang: Language;
}

type Filter = 'all' | ElectoralStatus;

const STATUS_META: Record<ElectoralStatus, { fr: string; ar: string; tone: string; icon: React.ElementType }> = {
  submitted: { fr: 'À contrôler', ar: 'للمراجعة', tone: 'bg-amber-100 text-amber-900 border-amber-300', icon: Clock },
  verified: { fr: 'Dossier complet', ar: 'ملف مكتمل', tone: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: CheckCircle2 },
  rejected: { fr: 'À corriger', ar: 'للتصحيح', tone: 'bg-red-100 text-red-900 border-red-300', icon: XCircle },
  none: { fr: 'Incomplet', ar: 'ناقص', tone: 'bg-slate-100 text-slate-700 border-slate-300', icon: FileQuestion },
};

const statusOf = (m: Member): ElectoralStatus => dossierState(m);

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, lang }) => {
  const isAr = lang === 'ar';
  const allowed = currentUser?.role === 'admin' || currentUser?.role === 'bureau_politique';

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('submitted');
  const [regionFilter, setRegionFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Member | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setMembers(await listAllMembers());
    } catch (err) {
      setError(describeError(err, isAr));
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: members.length, none: 0, submitted: 0, verified: 0, rejected: 0 };
    members.forEach((m) => {
      c[statusOf(m)] += 1;
    });
    return c;
  }, [members]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => filter === 'all' || statusOf(m) === filter)
      .filter((m) => regionFilter === 'all' || m.regionId === regionFilter)
      .filter(
        (m) =>
          !q ||
          `${m.firstNameFr} ${m.lastNameFr} ${m.firstNameAr} ${m.lastNameAr} ${m.cin} ${m.email} ${m.membershipNumber}`
            .toLowerCase()
            .includes(q)
      )
      .sort((a, b) => b.membershipNumber.localeCompare(a.membershipNumber));
  }, [members, filter, regionFilter, query]);

  if (!allowed) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-3">
        <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="text-xl font-bold text-slate-800">{isAr ? 'فضاء محجوز للإدارة' : 'Espace réservé à l’administration'}</h3>
        <p className="text-sm text-slate-500">
          {isAr ? 'ليست لديك صلاحية الولوج إلى هذه الصفحة.' : 'Vous n’avez pas les droits pour accéder à cette page.'}
        </p>
      </div>
    );
  }

  const handleRegionChanged = (uid: string, regionId: string, province: string) => {
    setMembers((prev) => prev.map((m) => (m.id === uid ? { ...m, regionId, province } : m)));
    setSelected((s) => (s && s.id === uid ? { ...s, regionId, province } : s));
  };

  const handleDecided = (uid: string, patch: Partial<Member>) => {
    setMembers((prev) => prev.map((m) => (m.id === uid ? { ...m, ...patch } : m)));
    setSelected((s) => (s && s.id === uid ? { ...s, ...patch } : s));
  };

  const filters: Filter[] = ['submitted', 'verified', 'rejected', 'none', 'all'];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isAr ? 'إدارة المنخرطين' : 'Administration des adhérents'}
          </h2>
          <p className="text-sm text-slate-500">
            {isAr ? 'مراجعة وصول القيد في اللوائح الانتخابية والمصادقة على الانخراطات.' : 'Contrôlez les fiches d’inscription électorale et validez les adhésions.'}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{isAr ? 'تحديث' : 'Actualiser'}</span>
        </button>
      </div>

      {/* Compteurs / filtres de statut */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {filters.map((f) => {
          const meta = f === 'all' ? null : STATUS_META[f];
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-start rounded-2xl border p-3 transition-all ${
                active ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-2xl font-black text-slate-900">{counts[f]}</div>
              <div className="text-xs font-semibold text-slate-600">
                {f === 'all' ? (isAr ? 'الكل' : 'Tous') : isAr ? meta!.ar : meta!.fr}
              </div>
            </button>
          );
        })}
      </div>

      {/* Recherche & région */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم، البطاقة الوطنية، البريد…' : 'Rechercher : nom, CIN, email, matricule…'}
            className="w-full ps-10 pe-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 bg-white"
          />
        </div>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-300 text-sm bg-white"
        >
          <option value="all">{isAr ? 'كل الجهات' : 'Toutes les régions'}</option>
          {MOROCCAN_REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {isAr ? r.nameAr : r.nameFr}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-sm">
          {isAr ? 'لا يوجد منخرطون في هذه الحالة.' : 'Aucun adhérent dans cette catégorie.'}
        </div>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {visible.map((m) => {
            const meta = STATUS_META[statusOf(m)];
            const Icon = meta.icon;
            const region = MOROCCAN_REGIONS.find((r) => r.id === m.regionId);
            return (
              <li key={m.id}>
                <button
                  onClick={() => setSelected(m)}
                  className="w-full text-start flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-sm transition-all"
                >
                  <img src={m.photoUrl} alt="" className="w-12 h-14 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 truncate">
                      {m.firstNameFr} {m.lastNameFr.toUpperCase()}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {m.cin} • {isAr ? region?.nameAr : region?.nameFr}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate">{m.membershipNumber}</div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold border ${meta.tone}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{isAr ? meta.ar : meta.fr}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected && (
        <MemberDetail member={selected} lang={lang} onClose={() => setSelected(null)} onDecided={handleDecided} onRegionChanged={handleRegionChanged} />
      )}
    </div>
  );
};

interface MemberDetailProps {
  member: Member;
  lang: Language;
  onClose: () => void;
  onDecided: (uid: string, patch: Partial<Member>) => void;
  onRegionChanged: (uid: string, regionId: string, province: string) => void;
}

const MemberDetail: React.FC<MemberDetailProps> = ({ member, lang, onClose, onDecided, onRegionChanged }) => {
  const isAr = lang === 'ar';
  const [proof, setProof] = useState<{ dataUrl: string; mime: string; name: string } | null>(null);
  const [proofLoading, setProofLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [badge, setBadge] = useState(member.contributionBadge || '');
  const [badgeAr, setBadgeAr] = useState(member.contributionBadgeAr || '');
  const [badgeSaved, setBadgeSaved] = useState(false);
  const [newRegionId, setNewRegionId] = useState(member.regionId);
  const [newProvince, setNewProvince] = useState(member.province);
  const [regionSaved, setRegionSaved] = useState(false);
  const region = MOROCCAN_REGIONS.find((r) => r.id === member.regionId);
  const firstToCheck = DOC_KINDS.find((k) => docStatusOf(member, k) === 'submitted') ?? DOC_KINDS[0];
  const [kind, setKind] = useState<DocKind>(firstToCheck);
  const status = docStatusOf(member, kind);

  useEffect(() => {
    let cancelled = false;
    setProofLoading(true);
    setProof(null);
    fetchMemberDocument(member.id, kind)
      .then((p) => !cancelled && setProof(p))
      .catch((err) => !cancelled && setError(describeError(err, isAr)))
      .finally(() => !cancelled && setProofLoading(false));
    return () => {
      cancelled = true;
    };
  }, [member.id, kind, isAr]);

  const decide = async (decision: ElectoralStatus) => {
    setBusy(true);
    setError('');
    try {
      const patch = await setDocumentDecision(member, kind, decision);
      onDecided(member.id, patch);
    } catch (err) {
      setError(describeError(err, isAr));
    } finally {
      setBusy(false);
    }
  };

  const rows: Array<[string, string, string]> = [
    ['CIN', 'البطاقة الوطنية', member.cin],
    ['Naissance', 'الازدياد', member.birthDate],
    ['Email', 'البريد', member.email],
    ['Téléphone', 'الهاتف', member.phone],
    ['Région', 'الجهة', (isAr ? region?.nameAr : region?.nameFr) ?? member.regionId],
    ['Province', 'الإقليم', member.province],
    ['Commune', 'الجماعة', member.commune],
    ['Profession', 'المهنة', member.profession],
    ['Inscription', 'تاريخ الانخراط', member.joinedDate],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[94vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <img src={member.photoUrl} alt="" className="w-12 h-14 rounded-lg object-cover border border-slate-200 shrink-0" />
            <div className="min-w-0">
              <div className="font-extrabold text-slate-900 truncate">
                {member.firstNameFr} {member.lastNameFr.toUpperCase()}
              </div>
              <div className="text-xs text-slate-500 font-arabic truncate">
                {member.firstNameAr} {member.lastNameAr}
              </div>
              <div className="text-[11px] font-mono text-slate-400">{member.membershipNumber}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Fermer'} className="p-2 rounded-full hover:bg-slate-100 shrink-0">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {rows.map(([fr, ar, v]) => (
              <div key={fr} className="flex justify-between gap-3 border-b border-slate-100 pb-1.5">
                <dt className="text-slate-500">{isAr ? ar : fr}</dt>
                <dd className="font-semibold text-slate-900 text-end break-all">{v || '—'}</dd>
              </div>
            ))}
          </dl>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">{isAr ? 'الجهة والإقليم' : 'Région et province'}</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={newRegionId}
                onChange={(e) => {
                  const r = MOROCCAN_REGIONS.find((x) => x.id === e.target.value);
                  setNewRegionId(e.target.value);
                  setNewProvince(r?.provincesFr[0] || r?.capitalFr || '');
                  setRegionSaved(false);
                }}
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {MOROCCAN_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {isAr ? r.nameAr : r.nameFr}
                  </option>
                ))}
              </select>
              <select
                value={newProvince}
                onChange={(e) => {
                  setNewProvince(e.target.value);
                  setRegionSaved(false);
                }}
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {(MOROCCAN_REGIONS.find((r) => r.id === newRegionId)?.provincesFr ?? []).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy || (newRegionId === member.regionId && newProvince === member.province)}
                onClick={async () => {
                  setBusy(true);
                  setError('');
                  try {
                    await setMemberRegion(member.id, newRegionId, newProvince);
                    onRegionChanged(member.id, newRegionId, newProvince);
                    setRegionSaved(true);
                  } catch (err) {
                    setError(describeError(err, isAr));
                  } finally {
                    setBusy(false);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-bold disabled:opacity-50"
              >
                {isAr ? 'نقل' : 'Changer'}
              </button>
            </div>
            {regionSaved && <p className="text-xs text-emerald-700 font-semibold mt-1.5">{isAr ? 'تم تحديث الجهة' : 'Région mise à jour'}</p>}
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">{isAr ? 'اللقب المعروض' : 'Titre affiché (ex. Fondateur)'}</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={badge}
                onChange={(e) => {
                  setBadge(e.target.value);
                  setBadgeSaved(false);
                }}
                maxLength={60}
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
              <input
                value={badgeAr}
                dir="rtl"
                placeholder="اللقب بالعربية (مثال: المؤسس)"
                onChange={(e) => {
                  setBadgeAr(e.target.value);
                  setBadgeSaved(false);
                }}
                maxLength={60}
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-arabic outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError('');
                  try {
                    await setMemberBadge(member.id, badge, badgeAr);
                    setBadgeSaved(true);
                  } catch (err) {
                    setError(describeError(err, isAr));
                  } finally {
                    setBusy(false);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-bold disabled:opacity-60"
              >
                {isAr ? 'حفظ' : 'Enregistrer'}
              </button>
            </div>
            {badgeSaved && <p className="text-xs text-emerald-700 font-semibold mt-1.5">{isAr ? 'تم الحفظ' : 'Titre enregistré'}</p>}
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">
              {isAr ? 'وثائق الملف' : 'Pièces du dossier'} ({dossierProgress(member)}/{DOC_KINDS.length})
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {DOC_KINDS.map((k) => {
                const st = docStatusOf(member, k);
                const meta = STATUS_META[st];
                const active = k === kind;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border ${
                      active ? 'border-emerald-600 ring-2 ring-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <meta.icon className="w-3.5 h-3.5" />
                    <span>{isAr ? DOC_LABELS[k].ar : DOC_LABELS[k].fr}</span>
                  </button>
                );
              })}
            </div>
            {proofLoading ? (
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            ) : !proof ? (
              <p className="text-sm text-slate-500 p-4 rounded-xl bg-slate-50 border border-slate-200">
                {isAr ? 'لم يودع المنخرط هذه الوثيقة بعد.' : 'L’adhérent n’a pas encore déposé cette pièce.'}
              </p>
            ) : proof.mime === 'application/pdf' ? (
              <div className="space-y-2">
                <iframe src={proof.dataUrl} title={proof.name} className="w-full h-[55vh] rounded-xl border border-slate-200" />
                <a href={proof.dataUrl} download={proof.name} className="text-sm font-semibold text-emerald-700 hover:underline">
                  {isAr ? 'تحميل الملف' : 'Télécharger le PDF'} ({proof.name})
                </a>
              </div>
            ) : (
              <a href={proof.dataUrl} target="_blank" rel="noopener noreferrer">
                <img src={proof.dataUrl} alt={proof.name} className="w-full max-h-[60vh] object-contain rounded-xl border border-slate-200 bg-slate-50" />
              </a>
            )}
          </div>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-white border-t border-slate-100">
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border ${STATUS_META[status].tone}`}>
            {isAr ? STATUS_META[status].ar : STATUS_META[status].fr}
          </span>
          <div className="flex flex-wrap gap-2">
            {status !== 'rejected' && (
              <button
                onClick={() => decide('rejected')}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-sm font-bold disabled:opacity-60"
              >
                {isAr ? 'رفض الوثيقة' : 'Refuser cette pièce'}
              </button>
            )}
            {status === 'verified' && (
              <button
                onClick={() => decide('submitted')}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-bold disabled:opacity-60"
              >
                {isAr ? 'إرجاع للمراجعة' : 'Remettre à contrôler'}
              </button>
            )}
            {status !== 'verified' && (
              <button
                onClick={() => decide('verified')}
                disabled={busy || !proof}
                title={!proof ? (isAr ? 'لا توجد وثيقة' : 'Aucune pièce à valider') : undefined}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold disabled:opacity-50"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isAr ? 'المصادقة على الوثيقة' : 'Valider cette pièce'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
