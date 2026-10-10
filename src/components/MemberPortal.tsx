import React, { useState } from 'react';
import { Member, Language } from '../types';
import { MOROCCAN_REGIONS } from '../data/regions';
import { TRANSLATIONS } from '../data/translations';
import { PARTY_DOCUMENTS } from '../data/mockData';
import { MembershipCard } from './MembershipCard';
import { ElectoralProofCard } from './ElectoralProofCard';
import { ProfileEditor } from './ProfileEditor';
import { MemberProfilePatch } from '../services/memberService';
import {
  ShieldCheck,
  Award,
  Vote,
  FileText,
  Users,
  MapPin,
  Download,
  Calendar,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  LogOut,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

interface MemberPortalProps {
  member: Member;
  lang: Language;
  onGoToForum: () => void;
  onGoToConsultations: () => void;
  onGoToEvents?: () => void;
  onGoToResources?: () => void;
  onLogout: () => void;
  onMemberUpdated?: (patch: MemberProfilePatch) => void;
}

export const MemberPortal: React.FC<MemberPortalProps> = ({
  member,
  lang,
  onGoToForum,
  onGoToConsultations,
  onGoToEvents,
  onGoToResources,
  onLogout,
  onMemberUpdated,
}) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'card' | 'documents' | 'region' | 'activity'>('overview');
  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';

  const memberRegion = MOROCCAN_REGIONS.find((r) => r.id === member.regionId) || MOROCCAN_REGIONS[3];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Profile Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-800/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-24 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl bg-slate-800">
                <img
                  src={member.photoUrl}
                  alt={`${member.firstNameFr} ${member.lastNameFr}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {member.electoralStatus === 'verified' && (
                <span className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold shadow">
                  ✓
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {member.firstNameFr} {member.lastNameFr.toUpperCase()}
                </h1>
                {member.firstNameAr && (
                  <span className="font-arabic font-bold text-amber-300 text-sm">
                    ({member.firstNameAr} {member.lastNameAr})
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  {isAr
                    ? member.contributionBadgeAr || (member.contributionBadge && member.contributionBadge !== 'Adhérent Émergeant' ? member.contributionBadge : 'منخرط صاعد')
                    : member.contributionBadge || 'Adhérent Certifié'}
                </span>
              </div>

              <div className="text-xs text-emerald-200/90 flex items-center gap-3 flex-wrap">
                <span className="font-mono bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50">
                  {member.membershipNumber}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? memberRegion.nameAr : memberRegion.nameFr}</span>
                </span>
                <span className="text-emerald-300/60">•</span>
                <span>{t.portal.since} {member.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions at Top */}
          <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
            <button
              onClick={() => setActiveTab('card')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md active:scale-95"
            >
              <Award className="w-4 h-4" />
              <span>{t.nav.myCard}</span>
            </button>

            <button
              onClick={() => setEditingProfile(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
            >
              <span>{isAr ? 'تعديل ملفي' : 'Modifier mon profil'}</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
              title={t.nav.logout}
            >
              <LogOut className="w-4 h-4 text-red-300" />
              <span className="hidden sm:inline">{t.nav.logout}</span>
            </button>
          </div>
        </div>
      </div>

      <ElectoralProofCard member={member} lang={lang} />

      {editingProfile && (
        <ProfileEditor
          member={member}
          lang={lang}
          onClose={() => setEditingProfile(false)}
          onSaved={(patch) => onMemberUpdated?.(patch)}
        />
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: t.portal.tabs.overview, icon: Users },
          { id: 'card', label: t.portal.tabs.myCard, icon: Award },
          { id: 'documents', label: t.portal.tabs.documents, icon: FileText },
          { id: 'region', label: t.portal.tabs.committee, icon: MapPin },
          { id: 'activity', label: t.portal.tabs.activity, icon: Vote },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">{t.portal.stats.votingPower}</span>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{t.portal.stats.votingPowerVal}</span>
              </div>
              <div className="text-[11px] text-slate-400">Consultations internes & Congrès</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">{t.portal.stats.regionalRank}</span>
              <div className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                {isAr ? memberRegion.nameAr : memberRegion.nameFr}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">
                Coordination #{memberRegion.code}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">{t.portal.stats.contributions}</span>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                12 Débats
              </div>
              <div className="text-[11px] text-slate-400">3 propositions adoptées</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">{t.portal.stats.points}</span>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-600">
                450 Pts
              </div>
              <div className="text-[11px] text-amber-700 font-medium">Rang : Militant Émérite</div>
            </div>
          </div>

          {/* Quick Action Grid */}
          <div className="bg-gradient-to-br from-emerald-50/60 to-white p-6 sm:p-8 rounded-3xl border border-emerald-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t.portal.quickActions.title}</h3>
                <p className="text-xs text-slate-600">Vos opportunités d’engagement et de vote au sein du parti.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                Session 2026
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={onGoToForum}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left space-y-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-slate-900">{t.portal.quickActions.proposeLaw}</div>
                <div className="text-xs text-slate-500">Débattre et voter sur les propositions des adhérents.</div>
              </button>

              <button
                onClick={onGoToConsultations}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left space-y-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Vote className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-slate-900">
                  {isAr ? 'المشاركة في الاستفتاء الحزبي' : 'Voter aux Référendums'}
                </div>
                <div className="text-xs text-slate-500">Prenez part aux grandes décisions d’orientation politique.</div>
              </button>

              <button
                onClick={() => setActiveTab('region')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left space-y-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-slate-900">{t.portal.quickActions.contactCoordinator}</div>
                <div className="text-xs text-slate-500">Participer aux assemblées de section locales.</div>
              </button>

              <button
                onClick={() => (onGoToResources ? onGoToResources() : setActiveTab('documents'))}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left space-y-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-slate-900">{t.portal.quickActions.downloadKit}</div>
                <div className="text-xs text-slate-500">Statuts, argumentaires et supports officiels.</div>
              </button>
            </div>
          </div>

          {/* Upcoming Internal Events */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <span>Agenda Réservé aux Membres</span>
              </h3>
              {onGoToEvents && (
                <button
                  onClick={onGoToEvents}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Tous les événements</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              <div className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    14 Octobre 2026 • 19h00 (Visioconférence)
                  </span>
                  <div className="font-bold text-slate-900 text-sm mt-1">
                    Webinaire National : « Stratégie pour la Souveraineté de l’Eau et l’Agroécologie »
                  </div>
                  <div className="text-xs text-slate-500">Avec le Secrétaire Général et la Commission Écologie.</div>
                </div>
                <button className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shrink-0">
                  Participer en Direct
                </button>
              </div>

              <div className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                    22 Octobre 2026 • Présentiel
                  </span>
                  <div className="font-bold text-slate-900 text-sm mt-1">
                    Congrès Régional Annuel — {isAr ? memberRegion.nameAr : memberRegion.nameFr}
                  </div>
                  <div className="text-xs text-slate-500">Élection des représentants provinciaux et ateliers de propositions.</div>
                </div>
                <button className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shrink-0">
                  Réserver ma place
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: MY CARD ================= */}
      {activeTab === 'card' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 text-center space-y-6 animate-in fade-in duration-200">
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-extrabold text-slate-900">{t.portal.tabs.myCard}</h3>
            <p className="text-xs text-slate-500">
              Votre carte numérique officielle est valable dans toutes les représentations du parti et lors des scrutins internes.
            </p>
          </div>

          <div className="py-4">
            <MembershipCard member={member} lang={lang} />
          </div>
        </div>
      )}

      {/* ================= TAB 3: DOCUMENTS ================= */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">{t.portal.documentsTitle}</h3>
            <p className="text-xs text-slate-500 mt-1">{t.portal.documentsDesc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PARTY_DOCUMENTS.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50/50 hover:bg-white transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase font-mono">
                      {doc.fileFormat} • {doc.fileSize}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{isAr ? doc.titleAr : doc.titleFr}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isAr ? doc.descriptionAr : doc.descriptionFr}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{doc.date}</span>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(isAr ? `جاري تحميل ${doc.titleAr}...` : `Téléchargement du document ${doc.titleFr} en cours...`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.portal.downloadFile}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: REGIONAL COMMITTEE ================= */}
      {activeTab === 'region' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                {isAr ? 'التنسيقية الجهوية الرسمية' : 'Coordination Régionale Officielle'}
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {isAr ? memberRegion.nameAr : memberRegion.nameFr}
              </h3>
              <p className="text-xs text-slate-500">{memberRegion.descriptionFr}</p>
            </div>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {memberRegion.membersCount.toLocaleString()} {t.regions.membersInRegion}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coordinator Contact Card */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                {t.regions.coordinator}
              </span>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow">
                  {memberRegion.coordinatorName.substring(0, 2)}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{memberRegion.coordinatorName}</h4>
                  <div className="text-xs text-emerald-700 font-medium">Secrétaire Régional Élu</div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-700" />
                  <span className="font-mono">{memberRegion.coordinatorEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>Siège Régional : {memberRegion.capitalFr}</span>
                </div>
              </div>

              <button
                onClick={() => alert(`Message envoyé à la coordination de ${memberRegion.nameFr}`)}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-colors"
              >
                {t.regions.contactCoordination}
              </button>
            </div>

            {/* Provinces in this region */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                {t.regions.provinces} ({memberRegion.provincesFr.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {memberRegion.provincesFr.map((p, idx) => (
                  <span
                    key={p}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 shadow-2xs"
                  >
                    {p} {memberRegion.provincesAr[idx] ? `• ${memberRegion.provincesAr[idx]}` : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: ACTIVITY & CONTRIBUTIONS ================= */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">{t.portal.tabs.activity}</h3>
              <p className="text-xs text-slate-500">Historique de vos votes et contributions enregistrés.</p>
            </div>
            <button
              onClick={onGoToForum}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
            >
              Nouveau Débat
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Vote Pour
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">
                  Exonération d’IS sur 3 ans et Fonds Souverain pour les Startups des Jeunes
                </h4>
                <div className="text-xs text-slate-500">Commission Économie & Emploi</div>
              </div>
              <span className="text-xs text-slate-400">Hier</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Consultation
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">
                  Priorité budgétaire PLF 2026 : Réforme hospitalière de proximité
                </h4>
                <div className="text-xs text-slate-500">Scrutin interne certifié</div>
              </div>
              <span className="text-xs text-slate-400">Il y a 3 jours</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
