import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ElectoralStatus, Language, Member } from '../types';
import { MOROCCAN_REGIONS } from '../data/regions';
import { DOC_KINDS, DOC_LABELS, DocKind, docStatusOf, dossierProgress, dossierState } from '../utils/dossier';
import {
  describeError,
  listMembersForRegions,
  setMemberRole,
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
  none: { fr: 'Dossier incomplet', ar: 'ملف ناقص', tone: 'bg-slate-100 text-slate-700 border-slate-300', icon: FileQuestion },
};

const statusOf = (m: Member): ElectoralStatus => dossierState(m);

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, lang }) => {
  const isAr = lang === 'ar';
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'bureau_politique';
  const isCoordinator = currentUser?.role === 'regional_coordinator';
  const myRegions = currentUser?.coordinatorRegions ?? [];
  const allowed = isStaff || (isCoordinator && myRegions.length > 0);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('none');
  const [regionFilter, setRegionFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Member | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Le coordinateur ne charge que les membres de ses régions ; l'administration charge tout.
      setMembers(isStaff ? await listAllMembers() : await listMembersForRegions(myRegions));
    } catch (err) {
      setError(describeError(err, isAr));
    } finally {
      setLoading(false);
    }
  }, [isAr, isStaff, myRegions.join(',')]);

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

  const filters: Filter[] = ['none', 'rejected', 'verified', 'all'];

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          {MOROCCAN_REGIONS.filter((r) => isStaff || myRegions.includes(r.id)).map((r) => (
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
        <MemberDetail
          member={selected}
          lang={lang}
          canAdmin={isStaff}
          selfId={currentUser?.id}
          onClose={() => setSelected(null)}
          onDecided={handleDecided}
          onRegionChanged={handleRegionChanged}
        />
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
  canAdmin: boolean;
  selfId?: string;
}

const MemberDetail: React.FC<MemberDetailProps> = ({ member, lang, onClose, onDecided, onRegionChanged, canAdmin, selfId }) => {
  const isAr = lang === 'ar';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [badge, setBadge] = useState(member.contributionBadge || '');
  const [badgeAr, setBadgeAr] = useState(member.contributionBadgeAr || '');
  const [badgeSaved, setBadgeSaved] = useState(false);
  const [newRegionId, setNewRegionId] = useState(member.regionId);
  const [newProvince, setNewProvince] = useState(member.province);
  const [regionSaved, setRegionSaved] = useState(false);
  const [roleSel, setRoleSel] = useState<Member['role']>(member.role);
  const [regionsSel, setRegionsSel] = useState<string[]>(member.coordinatorRegions ?? []);
  const [roleSaved, setRoleSaved] = useState(false);
  const region = MOROCCAN_REGIONS.find((r) => r.id === member.regionId);
  const [kind, setKind] = useState<DocKind>(DOC_KINDS.find((k) => docStatusOf(member, k) !== 'verified') ?? DOC_KINDS[0]);
  const status = docStatusOf(member, kind);

  const decide = async (decision: ElectoralStatus, kinds: DocKind[] = [kind]) => {
    setBusy(true);
    setError('');
    try {
      const patch = await setDocumentDecision(member, kinds, decision);
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

          {canAdmin && (
            <>
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
            <h4 className="font-bold text-slate-900 mb-2">{isAr ? 'الدور والجهات المتابعة' : 'Rôle et régions suivies'}</h4>
            <div className="flex flex-col gap-3">
              <select
                value={roleSel}
                onChange={(e) => {
                  setRoleSel(e.target.value as Member['role']);
                  setRoleSaved(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="member">{isAr ? 'منخرط' : 'Adhérent'}</option>
                <option value="regional_coordinator">{isAr ? 'منسق جهوي' : 'Coordinateur régional'}</option>
                <option value="bureau_politique">{isAr ? 'المكتب السياسي (صلاحيات كاملة)' : 'Bureau politique (accès complet)'}</option>
              </select>
              {roleSel === 'regional_coordinator' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {MOROCCAN_REGIONS.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={regionsSel.includes(r.id)}
                        onChange={(e) => {
                          setRegionsSel((prev) => (e.target.checked ? [...prev, r.id] : prev.filter((x) => x !== r.id)));
                          setRoleSaved(false);
                        }}
                      />
                      <span>{isAr ? r.nameAr : r.nameFr}</span>
                    </label>
                  ))}
                </div>
              )}
              <div>
                <button
                  type="button"
                  disabled={busy || (roleSel === 'regional_coordinator' && regionsSel.length === 0) || (roleSel === member.role && roleSel !== 'regional_coordinator')}
                  onClick={async () => {
                    setBusy(true);
                    setError('');
                    try {
                      await setMemberRole(member.id, roleSel, regionsSel);
                      onDecided(member.id, { role: roleSel, coordinatorRegions: roleSel === 'regional_coordinator' ? regionsSel : [] });
                      setRoleSaved(true);
                    } catch (err) {
                      setError(describeError(err, isAr));
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-bold disabled:opacity-50"
                >
                  {isAr ? 'حفظ الدور' : 'Enregistrer le rôle'}
                </button>
                {roleSaved && <span className="ms-3 text-xs text-emerald-700 font-semibold">{isAr ? 'تم الحفظ' : 'Rôle enregistré'}</span>}
              </div>
            </div>
          </div>

            </>
          )}

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
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 space-y-2">
              <p>
                {isAr
                  ? 'وثيقة ورقية: يتم التحقق منها بتسلم النسخة الأصلية من المنخرط. لا يوجد ملف مخزن على الإنترنت.'
                  : 'Pièce papier : elle se contrôle en main propre sur l’original remis par l’adhérent. Aucun fichier n’est stocké en ligne.'}
              </p>
              <p className="text-xs">
                {kind === 'electoral'
                  ? isAr
                    ? 'قارن الاسم ورقم البطاقة الوطنية ومكتب التصويت في اللقطة المطبوعة مع بيانات الملف. عند الشك، أعد التحقق عبر الرقم 2727.'
                    : 'Comparez le nom, la CIN et le bureau de vote de la capture imprimée avec la fiche ci-dessus. En cas de doute, refaites la vérification par SMS au 2727.'
                  : isAr
                  ? 'تحقق من أن الاسم ورقم البطاقة الوطنية والتوقيع المصادق عليه تطابق بيانات الملف أعلاه.'
                  : 'Vérifiez que le nom, le numéro de CIN et la signature légalisée correspondent aux données de la fiche ci-dessus.'}
              </p>
            </div>
          </div>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-white border-t border-slate-100">
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border ${STATUS_META[status].tone}`}>
            {isAr ? STATUS_META[status].ar : STATUS_META[status].fr}
          </span>
          <div className="flex flex-wrap gap-2">
            {selfId !== member.id && DOC_KINDS.some((k) => docStatusOf(member, k) !== 'verified') && (
              <button
                onClick={() => decide('verified', DOC_KINDS)}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-60"
              >
                {isAr ? 'استلام الملف كاملاً (4 وثائق مطابقة)' : 'Dossier complet reçu : 4 pièces conformes'}
              </button>
            )}
            {status !== 'rejected' && (
              <button
                onClick={() => decide('rejected')}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-sm font-bold disabled:opacity-60"
              >
                {isAr ? 'وثيقة غير مطابقة' : 'Pièce non conforme'}
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
                disabled={busy}
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
