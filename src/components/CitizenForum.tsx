import React, { useState, useEffect } from 'react';
import { DebateTopic, DebateComment, Member, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { MOROCCAN_REGIONS } from '../data/regions';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Filter,
  Plus,
  Share2,
  Tag,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ShieldCheck,
  Search,
  Sparkles
} from 'lucide-react';

interface CitizenForumProps {
  debates: DebateTopic[];
  comments: Record<string, DebateComment[]>;
  currentUser: Member | null;
  lang: Language;
  onAddDebate: (newDebate: Omit<DebateTopic, 'id' | 'votesFor' | 'votesAgainst' | 'votesNeutral' | 'commentsCount'>) => void;
  onVoteDebate: (debateId: string, voteType: 'for' | 'against' | 'neutral') => void;
  onAddComment: (debateId: string, commentText: string) => void;
  onOpenAuthModal: () => void;
  onActiveDebateChange?: (debateId: string | null) => void;
}

export const CitizenForum: React.FC<CitizenForumProps> = ({
  debates,
  comments,
  currentUser,
  lang,
  onAddDebate,
  onVoteDebate,
  onAddComment,
  onActiveDebateChange,
  onOpenAuthModal,
}) => {
  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDebateId, setActiveDebateId] = useState<string | null>(debates[0]?.id || null);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [showNewProposalModal, setShowNewProposalModal] = useState<boolean>(false);

  // New proposal form state
  const [newTitleFr, setNewTitleFr] = useState('');
  const [newCategory, setNewCategory] = useState<DebateTopic['category']>('economy');
  const [newContentFr, setNewContentFr] = useState('');
  const [newRegion, setNewRegion] = useState('National');

  const categories = [
    { id: 'all', label: t.forum.categories.all },
    { id: 'economy', label: t.forum.categories.economy },
    { id: 'health_social', label: t.forum.categories.health_social },
    { id: 'education_youth', label: t.forum.categories.education_youth },
    { id: 'water_ecology', label: t.forum.categories.water_ecology },
    { id: 'governance', label: t.forum.categories.governance },
    { id: 'regional_development', label: t.forum.categories.regional_development },
  ];

  // Filtered debates
  const filteredDebates = debates.filter((d) => {
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
    if (selectedRegionFilter !== 'all' && d.authorRegion !== selectedRegionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFr = d.titleFr.toLowerCase().includes(q) || d.contentFr.toLowerCase().includes(q);
      const matchAr = d.titleAr.includes(q) || d.contentAr.includes(q);
      if (!matchFr && !matchAr) return false;
    }
    return true;
  });

  const activeDebate = debates.find((d) => d.id === activeDebateId) || filteredDebates[0] || debates[0];
  const activeComments = (activeDebate ? comments[activeDebate.id] : []) || [];

  useEffect(() => {
    onActiveDebateChange?.(activeDebate?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDebate?.id]);

  const handleVote = (voteType: 'for' | 'against' | 'neutral') => {
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    if (activeDebate) {
      onVoteDebate(activeDebate.id, voteType);
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    if (!newCommentText.trim() || !activeDebate) return;
    onAddComment(activeDebate.id, newCommentText.trim());
    setNewCommentText('');
  };

  const handleSubmitNewProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    if (!newTitleFr.trim() || !newContentFr.trim()) return;

    onAddDebate({
      category: newCategory,
      titleFr: newTitleFr.trim(),
      titleAr: newTitleFr.trim(),
      authorName: `${currentUser.firstNameFr} ${currentUser.lastNameFr}`,
      authorRegion: currentUser.province || 'Rabat',
      authorRole: 'Membre Adhérent PME',
      createdAt: 'À l’instant',
      contentFr: newContentFr.trim(),
      contentAr: newContentFr.trim(),
      status: 'open',
      tags: ['Citoyen', 'Proposition', newCategory],
    });

    setNewTitleFr('');
    setNewContentFr('');
    setShowNewProposalModal(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Forum Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            {t.forum.tagline}
          </span>
          <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.forum.title}
          </h2>
          <p className="text-sm text-slate-600">{t.forum.subtitle}</p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) {
              onOpenAuthModal();
            } else {
              setShowNewProposalModal(true);
            }
          }}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98 shrink-0 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t.forum.newDebateBtn}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'البحث في المقترحات والنقاشات...' : 'Rechercher un sujet ou mot-clé...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>

          {/* Regional Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedRegionFilter}
              onChange={(e) => setSelectedRegionFilter(e.target.value)}
              className="w-full md:w-48 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 cursor-pointer"
            >
              <option value="all">{t.regions.filterAll}</option>
              {MOROCCAN_REGIONS.map((r) => (
                <option key={r.id} value={r.nameFr}>
                  {isAr ? r.nameAr : r.nameFr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Forum Split View: Debate List & Active Debate Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Debate Topics List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>{filteredDebates.length} Débats Citoyens</span>
            <span>Trié par : Pertinence</span>
          </div>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {filteredDebates.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
                Aucun débat ne correspond à votre filtre.
              </div>
            ) : (
              filteredDebates.map((debate) => {
                const isActive = activeDebate?.id === debate.id;
                const totalVotes = debate.votesFor + debate.votesAgainst + debate.votesNeutral;
                const forPercent = totalVotes > 0 ? Math.round((debate.votesFor / totalVotes) * 100) : 0;

                return (
                  <div
                    key={debate.id}
                    onClick={() => setActiveDebateId(debate.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      isActive
                        ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-100'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {t.forum.categories[debate.category] || debate.category}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {debate.createdAt}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                      {isAr ? debate.titleAr : debate.titleFr}
                    </h3>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {isAr ? debate.contentAr : debate.contentFr}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          {forPercent}%
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {debate.commentsCount}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        {debate.authorRegion}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Full Debate Details, Voting, and Comments (7 cols) */}
        {activeDebate && (
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
            {/* Header info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {t.forum.categories[activeDebate.category] || activeDebate.category}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    activeDebate.status === 'adopted_in_program'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : activeDebate.status === 'under_review'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {activeDebate.status === 'adopted_in_program'
                    ? t.forum.statusAdopted
                    : activeDebate.status === 'under_review'
                    ? t.forum.statusReview
                    : t.forum.statusOpen}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {isAr ? activeDebate.titleAr : activeDebate.titleFr}
              </h2>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-800">{activeDebate.authorName}</span>
                <span>•</span>
                <span className="text-emerald-700">{activeDebate.authorRole}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {activeDebate.authorRegion}
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="text-sm text-slate-700 leading-relaxed space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
              <p>{isAr ? activeDebate.contentAr : activeDebate.contentFr}</p>
            </div>

            {/* Voting Bar & Buttons */}
            <div className="space-y-3 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Vote Démocratique des Adhérents</span>
                <span>
                  {activeDebate.votesFor + activeDebate.votesAgainst + activeDebate.votesNeutral} votes
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                {(() => {
                  const total = activeDebate.votesFor + activeDebate.votesAgainst + activeDebate.votesNeutral || 1;
                  const forP = (activeDebate.votesFor / total) * 100;
                  const againstP = (activeDebate.votesAgainst / total) * 100;
                  const neutralP = (activeDebate.votesNeutral / total) * 100;

                  return (
                    <>
                      <div style={{ width: `${forP}%` }} className="bg-emerald-600 h-full" title="Pour" />
                      <div style={{ width: `${againstP}%` }} className="bg-rose-500 h-full" title="Contre" />
                      <div style={{ width: `${neutralP}%` }} className="bg-amber-400 h-full" title="En débat" />
                    </>
                  );
                })()}
              </div>

              {/* Vote CTA Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => handleVote('for')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeDebate.userVote === 'for'
                      ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-300'
                      : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{t.forum.voteFor} ({activeDebate.votesFor})</span>
                </button>

                <button
                  onClick={() => handleVote('against')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeDebate.userVote === 'against'
                      ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300'
                      : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-300'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>{t.forum.voteAgainst} ({activeDebate.votesAgainst})</span>
                </button>

                <button
                  onClick={() => handleVote('neutral')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeDebate.userVote === 'neutral'
                      ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                      : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-300'
                  }`}
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  <span>{t.forum.voteNeutral} ({activeDebate.votesNeutral})</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>Interventions & Débats ({activeComments.length})</span>
              </h3>

              {/* Add Comment Box */}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={
                    currentUser
                      ? t.forum.addCommentPlaceholder
                      : isAr
                      ? 'سجل دخولك أو انخرط للمشاركة في النقاش...'
                      : 'Connectez-vous pour intervenir dans le débat...'
                  }
                  disabled={!currentUser}
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none disabled:bg-slate-100"
                />
                <button
                  type="submit"
                  aria-label={t.forum.sendComment}
                  disabled={!currentUser || !newCommentText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.forum.sendComment}</span>
                </button>
              </form>

              {/* Comment Items */}
              <div className="space-y-3">
                {activeComments.map((comment) => (
                  <div key={comment.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{comment.authorName}</span>
                      <span className="text-[11px] text-slate-400">{comment.createdAt}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{comment.content}</p>
                    <div className="text-[11px] text-emerald-700 font-medium">
                      Région : {comment.authorRegion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Proposal Modal */}
      {showNewProposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-extrabold text-slate-900">{t.forum.modalTitle}</h3>
              <p className="text-xs text-slate-500 mt-1">{t.forum.modalDesc}</p>
            </div>

            <form onSubmit={handleSubmitNewProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.forum.fieldTitle} *
                </label>
                <input
                  type="text"
                  required
                  value={newTitleFr}
                  onChange={(e) => setNewTitleFr(e.target.value)}
                  placeholder="Ex: Soutien aux coopératives d’arganier par l’énergie solaire..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.forum.fieldCategory} *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:border-emerald-600 outline-none"
                  >
                    <option value="economy">{t.forum.categories.economy}</option>
                    <option value="health_social">{t.forum.categories.health_social}</option>
                    <option value="education_youth">{t.forum.categories.education_youth}</option>
                    <option value="water_ecology">{t.forum.categories.water_ecology}</option>
                    <option value="governance">{t.forum.categories.governance}</option>
                    <option value="regional_development">{t.forum.categories.regional_development}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.forum.fieldRegion}
                  </label>
                  <select
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:border-emerald-600 outline-none"
                  >
                    <option value="National">National (Toutes les 12 régions)</option>
                    {MOROCCAN_REGIONS.map((r) => (
                      <option key={r.id} value={r.nameFr}>
                        {isAr ? r.nameAr : r.nameFr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.forum.fieldContent} *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newContentFr}
                  onChange={(e) => setNewContentFr(e.target.value)}
                  placeholder={t.forum.fieldContentPlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewProposalModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {t.forum.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md"
                >
                  {t.forum.submitProposalBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
