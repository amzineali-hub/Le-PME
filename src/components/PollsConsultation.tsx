import React, { useState } from 'react';
import { CitizenPoll, Language, Member, PollOption } from '../types';
import { TRANSLATIONS } from '../data/translations';
import {
  Vote,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  Plus,
  Lock,
  Unlock,
  AlertCircle,
  BarChart3,
  Check,
  X,
  HelpCircle,
  Layers,
  ChevronRight,
  Award
} from 'lucide-react';

interface PollsConsultationProps {
  polls: CitizenPoll[];
  currentUser: Member | null;
  lang: Language;
  onVotePoll: (pollId: string, optionId: string) => void;
  onCreatePoll: (pollData: Omit<CitizenPoll, 'id' | 'totalVotes' | 'votedUserIds'>) => void;
  onTogglePollStatus: (pollId: string) => void;
  onOpenAuthModal: () => void;
}

export const PollsConsultation: React.FC<PollsConsultationProps> = ({
  polls,
  currentUser,
  lang,
  onVotePoll,
  onCreatePoll,
  onTogglePollStatus,
  onOpenAuthModal,
}) => {
  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'closed'>('all');
  const [selectedOptionByPoll, setSelectedOptionByPoll] = useState<Record<string, string>>({});
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Poll Form State
  const [newQuestionFr, setNewQuestionFr] = useState('');
  const [newQuestionAr, setNewQuestionAr] = useState('');
  const [newDescFr, setNewDescFr] = useState('');
  const [newDescAr, setNewDescAr] = useState('');
  const [newCategoryFr, setNewCategoryFr] = useState('Programme National');
  const [newType, setNewType] = useState<CitizenPoll['type']>('consultation');
  const [newDeadline, setNewDeadline] = useState('2026-12-31');
  const [newOptions, setNewOptions] = useState<Array<{ textFr: string; textAr: string }>>([
    { textFr: 'Oui, favorable', textAr: 'نعم، أوافق' },
    { textFr: 'Non, défavorable', textAr: 'لا، أعارض' },
    { textFr: 'Favorable avec amendement', textAr: 'موافق مع تعديل' },
  ]);
  const [createError, setCreateError] = useState<string>('');

  const isAdmin = currentUser?.role === 'bureau_politique' || currentUser?.role === 'admin';

  // Filter polls
  const filteredPolls = polls.filter((p) => {
    if (activeTab === 'open') return p.status === 'open';
    if (activeTab === 'closed') return p.status === 'closed';
    return true;
  });

  const handleSelectOption = (pollId: string, optionId: string) => {
    setSelectedOptionByPoll((prev) => ({ ...prev, [pollId]: optionId }));
  };

  const handleCastVote = (poll: CitizenPoll) => {
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }

    if (poll.status === 'closed') return;
    if (poll.votedUserIds.includes(currentUser.id)) return;

    const chosen = selectedOptionByPoll[poll.id];
    if (!chosen) return;

    onVotePoll(poll.id, chosen);
  };

  const handleAddOptionField = () => {
    setNewOptions([...newOptions, { textFr: '', textAr: '' }]);
  };

  const handleRemoveOptionField = (idx: number) => {
    if (newOptions.length <= 2) return;
    setNewOptions(newOptions.filter((_, i) => i !== idx));
  };

  const handleOptionChange = (idx: number, field: 'textFr' | 'textAr', val: string) => {
    const updated = [...newOptions];
    updated[idx][field] = val;
    setNewOptions(updated);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = newOptions.filter((o) => o.textFr.trim().length > 0);
    if (validOptions.length < 2) {
      setCreateError(t.consultations.modal.minOptionsError);
      return;
    }

    const formattedOptions: PollOption[] = validOptions.map((opt, i) => ({
      id: `opt-${Date.now()}-${i}`,
      textFr: opt.textFr.trim(),
      textAr: opt.textAr.trim() || opt.textFr.trim(),
      votes: 0,
    }));

    onCreatePoll({
      questionFr: newQuestionFr.trim(),
      questionAr: newQuestionAr.trim() || newQuestionFr.trim(),
      descriptionFr: newDescFr.trim(),
      descriptionAr: newDescAr.trim() || newDescFr.trim(),
      categoryFr: newCategoryFr,
      categoryAr: isAr ? 'المجال الوطني' : newCategoryFr,
      deadline: newDeadline,
      status: 'open',
      type: newType,
      options: formattedOptions,
      createdBy: currentUser ? `${currentUser.firstNameFr} ${currentUser.lastNameFr}` : 'Bureau Politique PME',
      createdAt: new Date().toISOString().split('T')[0],
    });

    // Reset form
    setNewQuestionFr('');
    setNewQuestionAr('');
    setNewDescFr('');
    setNewDescAr('');
    setCreateError('');
    setShowCreateModal(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
            <Vote className="w-3.5 h-3.5 text-amber-700" />
            {t.consultations.tagline}
          </span>
          <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.consultations.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {t.consultations.subtitle}
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 w-fit">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{t.consultations.singleVoteRule}</span>
          </div>
        </div>

        {/* Admin Action: Create New Poll */}
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98 text-xs sm:text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.consultations.createPollBtn}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.consultations.filterAll} ({polls.length})
          </button>
          <button
            onClick={() => setActiveTab('open')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'open' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.consultations.activePolls} ({polls.filter((p) => p.status === 'open').length})
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'closed' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.consultations.closedPolls} ({polls.filter((p) => p.status === 'closed').length})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {currentUser ? (
            <span className="text-emerald-700 font-bold">
              ✓ Adhérent : {currentUser.firstNameFr} {currentUser.lastNameFr} ({currentUser.membershipNumber})
            </span>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="text-amber-700 hover:underline font-bold"
            >
              🔒 {t.consultations.mustBeMember}
            </button>
          )}
        </div>
      </div>

      {/* Grid of Polls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPolls.map((poll) => {
          const isClosed = poll.status === 'closed';
          const hasVoted = Boolean(currentUser && poll.votedUserIds.includes(currentUser.id));
          const selectedOptionId = selectedOptionByPoll[poll.id] || poll.userVotedOptionId;

          // Find the leading option (winner)
          const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);
          const leadingOptionId = sortedOptions[0]?.id;

          return (
            <div
              key={poll.id}
              className={`bg-white rounded-3xl border transition-all p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6 ${
                isClosed
                  ? 'border-slate-300 bg-slate-50/40'
                  : 'border-slate-200 hover:border-emerald-500 hover:shadow-md'
              }`}
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isClosed
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {isClosed ? t.consultations.statusClosed : t.consultations.statusOpen}
                    </span>

                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {t.consultations.types[poll.type]}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t.consultations.deadlineLabel} {poll.deadline}</span>
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug">
                  {isAr ? poll.questionAr : poll.questionFr}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr ? poll.descriptionAr : poll.descriptionFr}
                </p>
              </div>

              {/* Voting Options & Results Bar */}
              <div className="space-y-2.5">
                {poll.options.map((opt) => {
                  const percentage =
                    poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                  const isSelected = selectedOptionId === opt.id;
                  const isLeading = isClosed && opt.id === leadingOptionId && opt.votes > 0;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        if (!isClosed && !hasVoted) {
                          handleSelectOption(poll.id, opt.id);
                        }
                      }}
                      className={`relative p-3.5 rounded-2xl border transition-all overflow-hidden ${
                        !isClosed && !hasVoted ? 'cursor-pointer hover:border-emerald-400' : 'cursor-default'
                      } ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-200'
                          : 'border-slate-200 bg-white'
                      } ${isLeading ? 'ring-2 ring-amber-400 border-amber-500 bg-amber-50/30' : ''}`}
                    >
                      {/* Visual vote distribution bar */}
                      {(isClosed || hasVoted) && (
                        <div
                          className={`absolute inset-y-0 left-0 transition-all duration-700 pointer-events-none ${
                            isLeading ? 'bg-amber-100/60' : 'bg-emerald-100/50'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      )}

                      <div className="relative z-10 flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-2.5 font-semibold text-slate-800">
                          {/* Radio radio selector if voting open and not voted */}
                          {!isClosed && !hasVoted ? (
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-400 bg-white'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          ) : isLeading ? (
                            <Award className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                          )}

                          <span className={isSelected ? 'text-emerald-950 font-bold' : ''}>
                            {isAr ? opt.textAr : opt.textFr}
                          </span>
                        </div>

                        {/* Aggregated anonymous percentage */}
                        {(isClosed || hasVoted) && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {percentage}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({opt.votes.toLocaleString()} {isAr ? 'صوت' : 'v.'})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status / CTA Footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800 font-mono">
                    {poll.totalVotes.toLocaleString()}
                  </span>{' '}
                  <span className="text-slate-500">{t.consultations.totalVotesLabel}</span>
                  {hasVoted && (
                    <span className="inline-flex items-center gap-1 ml-2 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t.consultations.alreadyVotedBadge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Member Action: Cast Vote Button */}
                  {!isClosed && !hasVoted && (
                    <button
                      onClick={() => handleCastVote(poll)}
                      disabled={!selectedOptionByPoll[poll.id]}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95"
                    >
                      {t.consultations.voteNow}
                    </button>
                  )}

                  {/* Admin action: Close or Reopen Poll */}
                  {isAdmin && (
                    <button
                      onClick={() => onTogglePollStatus(poll.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs border border-slate-200 transition-colors"
                      title={isClosed ? t.consultations.reopenPollAction : t.consultations.closePollAction}
                    >
                      {isClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Certified result notice for closed polls */}
              {isClosed && (
                <div className="bg-amber-500/10 border border-amber-300/40 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{t.consultations.results.certifiedLabel}</span>
                  </div>
                  <span className="text-[10px] text-amber-800 font-mono">PME-ELECT-AUDIT-OK</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin Modal: Create Poll */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Administration Centrale PME
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  {t.consultations.modal.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.consultations.modal.desc}
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
                  {createError}
                </div>
              )}

              {/* Question FR & AR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.consultations.modal.fieldQuestionFr}
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuestionFr}
                    onChange={(e) => setNewQuestionFr(e.target.value)}
                    placeholder="Ex: Approuvez-vous la création de..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 outline-none"
                  />
                </div>

                <div dir="rtl">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.consultations.modal.fieldQuestionAr}
                  </label>
                  <input
                    type="text"
                    value={newQuestionAr}
                    onChange={(e) => setNewQuestionAr(e.target.value)}
                    placeholder="مثال: هل توافقون على إحداث..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 outline-none font-arabic text-right"
                  />
                </div>
              </div>

              {/* Description FR & AR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.consultations.modal.fieldDescFr}
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={newDescFr}
                    onChange={(e) => setNewDescFr(e.target.value)}
                    placeholder="Expliquez la portée du vote et son impact..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 outline-none"
                  />
                </div>

                <div dir="rtl">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.consultations.modal.fieldDescAr}
                  </label>
                  <textarea
                    rows={2}
                    value={newDescAr}
                    onChange={(e) => setNewDescAr(e.target.value)}
                    placeholder="بيان الأسباب والسياق الوطني للاقتراع..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 outline-none font-arabic text-right"
                  />
                </div>
              </div>

              {/* Category, Type & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.consultations.modal.fieldCategory}
                  </label>
                  <select
                    value={newCategoryFr}
                    onChange={(e) => setNewCategoryFr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                  >
                    <option value="Programme National">Programme National</option>
                    <option value="Démocratie Interne">Démocratie Interne</option>
                    <option value="Transition Écologique">Transition Écologique</option>
                    <option value="Économie & Emploi">Économie & Emploi</option>
                    <option value="Développement Régional">Développement Régional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.consultations.modal.fieldType}
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                  >
                    <option value="consultation">{t.consultations.types.consultation}</option>
                    <option value="referendum">{t.consultations.types.referendum}</option>
                    <option value="internal_election">{t.consultations.types.internal_election}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.consultations.modal.fieldDeadline}
                  </label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Options list */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {t.consultations.modal.optionsTitle}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOptionField}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    {t.consultations.modal.addOptionBtn}
                  </button>
                </div>

                <div className="space-y-2">
                  {newOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400 w-5">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        required
                        value={opt.textFr}
                        onChange={(e) => handleOptionChange(idx, 'textFr', e.target.value)}
                        placeholder={`${t.consultations.modal.optionFrPlaceholder} ${idx + 1}`}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                      />
                      <input
                        type="text"
                        dir="rtl"
                        value={opt.textAr}
                        onChange={(e) => handleOptionChange(idx, 'textAr', e.target.value)}
                        placeholder={`${t.consultations.modal.optionArPlaceholder} ${idx + 1}`}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none font-arabic text-right"
                      />
                      {newOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {t.consultations.modal.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md active:scale-95 transition-all"
                >
                  {t.consultations.modal.submitBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
