/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Language,
  Member,
  DebateTopic,
  CitizenPoll,
  DebateComment,
  PartyEvent,
  PartyDocument,
} from './types';
import {
  INITIAL_EVENTS,
  PARTY_DOCUMENTS,
  INITIAL_NEWS,
} from './data/mockData';
import { describeError, logoutMember, watchSession } from './services/memberService';
import {
  addDebateComment,
  castDebateVote,
  castPollVote,
  createDebate,
  createPoll,
  setPollStatus,
  subscribeDebateComments,
  subscribeDebates,
  subscribeMyVotes,
  subscribePolls,
} from './services/communityService';
import { TRANSLATIONS } from './data/translations';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { ManifestoSection } from './components/ManifestoSection';
import { RegionsSection } from './components/RegionsSection';
import { RegistrationForm } from './components/RegistrationForm';
import { MemberPortal } from './components/MemberPortal';
import { CitizenForum } from './components/CitizenForum';
import { PollsConsultation } from './components/PollsConsultation';
import { EventsManager } from './components/EventsManager';
import { DocumentaryResources } from './components/DocumentaryResources';
import { NewsAgenda } from './components/NewsAgenda';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { WhatsAppButton } from './components/WhatsAppButton';
import { IntroSplash } from './components/IntroSplash';
import { PosterGallery } from './components/PosterGallery';
import { GALLERY_BANDS } from './data/gallery';
import { LogoUploaderModal } from './components/LogoUploaderModal';

export default function App() {
  const [lang, setLang] = useState<Language>('fr');
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState<boolean>(false);
  const [preselectedRegionId, setPreselectedRegionId] = useState<string | undefined>(undefined);

  // Dynamic party state
  // Forum et sondages : données réelles (Firestore), en direct
  const [debates, setDebates] = useState<DebateTopic[]>([]);
  const [polls, setPolls] = useState<CitizenPoll[]>([]);
  const [activeDebateId, setActiveDebateId] = useState<string | null>(null);
  const [debateComments, setDebateComments] = useState<DebateComment[]>([]);
  const [myVotes, setMyVotes] = useState<{ debates: Record<string, 'for' | 'against' | 'neutral'>; polls: Record<string, string> }>({
    debates: {},
    polls: {},
  });
  const [notice, setNotice] = useState<string>('');
  const [events, setEvents] = useState<PartyEvent[]>(INITIAL_EVENTS);
  const [documents, setDocuments] = useState<PartyDocument[]>(PARTY_DOCUMENTS);

  // Restore the Firebase session (and follow sign-out) on load
  useEffect(() => watchSession(setCurrentUser), []);

  const handleLogout = () => {
    logoutMember().finally(() => {
      setCurrentUser(null);
      setCurrentTab('home');
    });
  };

  const showError = (err: unknown) => {
    const code = String((err as { code?: string })?.code || '');
    const isAr = lang === 'ar';
    setNotice(
      code.includes('permission-denied')
        ? isAr
          ? 'تعذر تنفيذ العملية. تأكد من تسجيل دخولك كمنخرط.'
          : 'Action refusée. Vérifiez que vous êtes connecté en tant qu’adhérent.'
        : describeError(err, isAr)
    );
    window.setTimeout(() => setNotice(''), 6000);
  };

  // Les lectures publiques (forum, sondages) ne doivent pas déranger le visiteur en cas d'échec
  const logError = (err: unknown) => console.warn('[PME] lecture impossible :', err);

  useEffect(() => {
    const u1 = subscribeDebates(setDebates, logError);
    const u2 = subscribePolls(setPolls, logError);
    return () => {
      u1();
      u2();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setMyVotes({ debates: {}, polls: {} });
      return;
    }
    return subscribeMyVotes(currentUser.id, setMyVotes, logError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    setDebateComments([]);
    if (!activeDebateId) return;
    return subscribeDebateComments(activeDebateId, setDebateComments, logError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDebateId]);

  // Vues « personnalisées » : on y ajoute le vote du membre connecté
  const debatesView = debates.map((d) => ({ ...d, userVote: myVotes.debates[d.id] }));
  const pollsView = polls.map((p) => {
    const mine = myVotes.polls[p.id];
    return { ...p, votedUserIds: mine && currentUser ? [currentUser.id] : [], userVotedOptionId: mine };
  });
  const commentsView: Record<string, DebateComment[]> = activeDebateId ? { [activeDebateId]: debateComments } : {};

  // Sync RTL / LTR on html root
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (lang === 'ar') {
      document.body.classList.add('font-arabic');
    } else {
      document.body.classList.remove('font-arabic');
    }
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'fr' ? 'ar' : 'fr'));
  };

  // ================= POLLS & VOTES HANDLERS =================
  // Un membre = un vote par sondage : garanti par firestore.rules (identifiant pollId_uid).
  const handleVotePoll = (pollId: string, optionId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    castPollVote(pollId, currentUser.id, optionId).catch(showError);
  };

  // Admin: créer un sondage
  const handleCreatePoll = (pollData: Omit<CitizenPoll, 'id' | 'totalVotes' | 'votedUserIds'>) => {
    if (!currentUser) return;
    createPoll(currentUser, pollData).catch(showError);
  };

  // Admin: ouvrir / clore un sondage
  const handleTogglePollStatus = (pollId: string) => {
    const poll = polls.find((p) => p.id === pollId);
    if (!poll) return;
    setPollStatus(pollId, poll.status === 'open' ? 'closed' : 'open').catch(showError);
  };

  // ================= EVENTS HANDLERS =================
  const handleRegisterEvent = (eventId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        if (ev.registeredMemberIds.includes(currentUser.id)) return ev;
        return {
          ...ev,
          registeredMemberIds: [...ev.registeredMemberIds, currentUser.id],
        };
      })
    );
  };

  const handleUnregisterEvent = (eventId: string) => {
    if (!currentUser) return;
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        return {
          ...ev,
          registeredMemberIds: ev.registeredMemberIds.filter((id) => id !== currentUser.id),
          reminderSubscribedMemberIds: ev.reminderSubscribedMemberIds.filter(
            (id) => id !== currentUser.id
          ),
        };
      })
    );
  };

  const handleToggleReminder = (eventId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const isSubscribed = ev.reminderSubscribedMemberIds.includes(currentUser.id);
        return {
          ...ev,
          reminderSubscribedMemberIds: isSubscribed
            ? ev.reminderSubscribedMemberIds.filter((id) => id !== currentUser.id)
            : [...ev.reminderSubscribedMemberIds, currentUser.id],
        };
      })
    );
  };

  const handleCreateEvent = (
    eventData: Omit<PartyEvent, 'id' | 'registeredMemberIds' | 'reminderSubscribedMemberIds'>
  ) => {
    const newEvent: PartyEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
      registeredMemberIds: currentUser ? [currentUser.id] : [],
      reminderSubscribedMemberIds: currentUser ? [currentUser.id] : [],
    };
    setEvents([newEvent, ...events]);
  };

  // ================= DOCUMENTARY RESOURCES HANDLERS =================
  const handleUploadDocument = (
    docData: Omit<PartyDocument, 'id' | 'downloadsCount'>
  ) => {
    const newDoc: PartyDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      downloadsCount: 1,
    };
    setDocuments([newDoc, ...documents]);
  };

  const handleDownloadDocument = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, downloadsCount: d.downloadsCount + 1 } : d))
    );
  };

  // ================= CITIZEN DEBATES HANDLERS =================
  const handleAddDebate = (
    data: Omit<DebateTopic, 'id' | 'votesFor' | 'votesAgainst' | 'votesNeutral' | 'commentsCount'>
  ) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    createDebate(currentUser, data).catch(showError);
  };

  const handleVoteDebate = (debateId: string, voteType: 'for' | 'against' | 'neutral') => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    castDebateVote(debateId, currentUser.id, voteType, myVotes.debates[debateId]).catch(showError);
  };

  const handleAddComment = (debateId: string, content: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    addDebateComment(debateId, currentUser, content).catch(showError);
  };

  const handleMemberRegistered = (member: Member) => {
    setCurrentUser(member);
  };

  const handleSelectRegionToJoin = (regionId: string) => {
    setPreselectedRegionId(regionId);
    setCurrentTab('registration');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-emerald-700 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        lang={lang}
        onToggleLang={toggleLanguage}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenLogoModal={() => setIsLogoModalOpen(true)}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <div className="space-y-20">
            <HeroSection
              lang={lang}
              onJoinClick={() => {
                setCurrentTab('registration');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onForumClick={() => {
                setCurrentTab('forum');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onExploreRegions={() => {
                setCurrentTab('regions');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenLogoModal={() => setIsLogoModalOpen(true)}
            />

            <section className="px-4 sm:px-6">
              <ManifestoSection lang={lang} />
            </section>

            <section>
              <PosterGallery
                images={GALLERY_BANDS[0]}
                lang={lang}
                eyebrow={{ fr: "Notre vision", ar: "رؤيتنا" }}
                title={{ fr: "Le PME en images", ar: "حزب المغرب الصاعد في صور" }}
                subtitle={{ fr: "Innovation, développement scientifique et jeunesse au cœur de notre projet.", ar: "الابتكار والتنمية العلمية والشباب في صلب مشروعنا." }}
              />
            </section>

            <section className="px-4 sm:px-6">
              <RegionsSection
                lang={lang}
                onSelectRegionToJoin={handleSelectRegionToJoin}
              />
            </section>

            {/* Polls & Consultations Showcase on Home */}
            <section className="px-4 sm:px-6">
              <PollsConsultation
                polls={pollsView}
                currentUser={currentUser}
                lang={lang}
                onVotePoll={handleVotePoll}
                onCreatePoll={handleCreatePoll}
                onTogglePollStatus={handleTogglePollStatus}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            </section>

            <section>
              <PosterGallery
                images={GALLERY_BANDS[1]}
                lang={lang}
                eyebrow={{ fr: "Nos messages", ar: "رسائلنا" }}
                title={{ fr: "Nos valeurs, nos idées", ar: "قيمنا وأفكارنا" }}
                subtitle={{ fr: "Formation, compétences, engagement citoyen : découvrez nos messages.", ar: "التكوين والكفاءات والالتزام المواطن: اكتشفوا رسائلنا." }}
              />
            </section>

            {/* Events Showcase on Home */}
            <section className="px-4 sm:px-6">
              <EventsManager
                events={events}
                currentUser={currentUser}
                lang={lang}
                onRegisterEvent={handleRegisterEvent}
                onUnregisterEvent={handleUnregisterEvent}
                onToggleReminder={handleToggleReminder}
                onCreateEvent={handleCreateEvent}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            </section>

            <section>
              <PosterGallery
                images={GALLERY_BANDS[2]}
                lang={lang}
                eyebrow={{ fr: "Rejoignez le mouvement", ar: "انضموا إلى الحركة" }}
                title={{ fr: "Ensemble pour un Maroc émergent", ar: "معاً من أجل مغرب صاعد" }}
                subtitle={{ fr: "Une politique autrement, ouverte à toutes et à tous.", ar: "سياسة بشكل مختلف، مفتوحة للجميع." }}
              />
            </section>

            {/* Documentary Resources Showcase on Home */}
            <section className="px-4 sm:px-6">
              <DocumentaryResources
                documents={documents}
                currentUser={currentUser}
                lang={lang}
                onUploadDocument={handleUploadDocument}
                onDownloadDocument={handleDownloadDocument}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            </section>

            <section className="px-4 sm:px-6">
              <NewsAgenda articles={INITIAL_NEWS} lang={lang} />
            </section>
          </div>
        )}

        {currentTab === 'manifesto' && (
          <div className="py-12 px-4 sm:px-6">
            <ManifestoSection lang={lang} />
          </div>
        )}

        {currentTab === 'regions' && (
          <div className="py-12 px-4 sm:px-6">
            <RegionsSection
              lang={lang}
              onSelectRegionToJoin={handleSelectRegionToJoin}
            />
          </div>
        )}

        {currentTab === 'registration' && (
          <div className="py-12 px-4 sm:px-6">
            <RegistrationForm
              lang={lang}
              preselectedRegionId={preselectedRegionId}
              onRegistered={handleMemberRegistered}
              onGoToPortal={() => {
                setCurrentTab('portal');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onGoToForum={() => {
                setCurrentTab('forum');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {currentTab === 'portal' && (
          <div className="py-12 px-4 sm:px-6">
            {currentUser ? (
              <MemberPortal
                member={currentUser}
                lang={lang}
                onMemberUpdated={(patch) => setCurrentUser((u) => (u ? { ...u, ...patch } : u))}
                onGoToForum={() => {
                  setCurrentTab('forum');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onGoToConsultations={() => {
                  setCurrentTab('consultations');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onGoToEvents={() => {
                  setCurrentTab('events');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onGoToResources={() => {
                  setCurrentTab('resources');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onLogout={handleLogout}
              />
            ) : (
              <div className="max-w-md mx-auto text-center py-16 space-y-4">
                <h3 className="text-xl font-bold text-slate-800">
                  {lang === 'ar' ? 'فضاء خاص بالمنخرطين' : 'Espace réservé aux adhérents'}
                </h3>
                <p className="text-sm text-slate-500">
                  {lang === 'ar'
                    ? 'يرجى تسجيل الدخول أو ملء استمارة الانخراط للولوج إلى بطاقتك الحزبية.'
                    : 'Veuillez vous connecter ou adhérer en ligne pour accéder à votre espace.'}
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs"
                  >
                    {TRANSLATIONS[lang].nav.login}
                  </button>
                  <button
                    onClick={() => setCurrentTab('registration')}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                  >
                    {TRANSLATIONS[lang].nav.membership}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'consultations' && (
          <div className="py-12 px-4 sm:px-6">
            <PollsConsultation
              polls={pollsView}
              currentUser={currentUser}
              lang={lang}
              onVotePoll={handleVotePoll}
              onCreatePoll={handleCreatePoll}
              onTogglePollStatus={handleTogglePollStatus}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          </div>
        )}

        {currentTab === 'events' && (
          <div className="py-12 px-4 sm:px-6">
            <EventsManager
              events={events}
              currentUser={currentUser}
              lang={lang}
              onRegisterEvent={handleRegisterEvent}
              onUnregisterEvent={handleUnregisterEvent}
              onToggleReminder={handleToggleReminder}
              onCreateEvent={handleCreateEvent}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          </div>
        )}

        {currentTab === 'resources' && (
          <div className="py-12 px-4 sm:px-6">
            <DocumentaryResources
              documents={documents}
              currentUser={currentUser}
              lang={lang}
              onUploadDocument={handleUploadDocument}
              onDownloadDocument={handleDownloadDocument}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          </div>
        )}

        {currentTab === 'forum' && (
          <div className="py-12 px-4 sm:px-6">
            <CitizenForum
              debates={debatesView}
              comments={commentsView}
              onActiveDebateChange={setActiveDebateId}
              currentUser={currentUser}
              lang={lang}
              onAddDebate={handleAddDebate}
              onVoteDebate={handleVoteDebate}
              onAddComment={handleAddComment}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          </div>
        )}

        {currentTab === 'admin' && (
          <div className="py-12 px-4 sm:px-6">
            <AdminPanel currentUser={currentUser} lang={lang} />
          </div>
        )}

        {currentTab === 'news' && (
          <div className="py-12 px-4 sm:px-6">
            <NewsAgenda articles={INITIAL_NEWS} lang={lang} />
          </div>
        )}
      </main>

      {/* Official Footer */}
      <Footer
        lang={lang}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectRegion={(regId) => {
          handleSelectRegionToJoin(regId);
        }}
      />

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <AuthModal
          lang={lang}
          onLoginSuccess={(member) => {
            setCurrentUser(member);
            setCurrentTab('portal');
          }}
          onGoToRegistration={() => {
            setCurrentTab('registration');
          }}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {notice && (
        <div
          role="alert"
          className="fixed bottom-24 start-4 end-4 sm:end-auto sm:max-w-md z-[80] px-4 py-3 rounded-2xl bg-red-600 text-white text-sm font-semibold shadow-xl"
        >
          {notice}
        </div>
      )}

      <IntroSplash lang={lang} />
      <WhatsAppButton lang={lang} />

      {/* Official Party Logo Manager (Logo PME.png) */}
      <LogoUploaderModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
