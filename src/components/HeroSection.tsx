import React, { useEffect, useRef, useState } from 'react';
import { TRANSLATIONS } from '../data/translations';
import { Language } from '../types';
import { MEMBERS_COUNT } from '../data/siteStats';
import { ArrowRight, ShieldCheck, Users, Vote, Sparkles, CheckCircle2, Volume2, VolumeX } from 'lucide-react';

// Même diamètre pour le logo et la vidéo : 16 rem sur mobile, 20 rem sur tablette, 23 rem sur grand écran
const CIRCLE = 'w-64 h-64 md:w-80 md:h-80 lg:w-[23rem] lg:h-[23rem] rounded-full';

interface HeroSectionProps {
  lang: Language;
  onJoinClick: () => void;
  onForumClick: () => void;
  onExploreRegions: () => void;
  onOpenLogoModal?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  lang,
  onJoinClick,
  onForumClick,
  onExploreRegions,
  onOpenLogoModal,
}) => {
  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);

  // Tente le son d'emblée ; si le navigateur refuse, démarre en muet puis active le son au premier geste.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    const unlock = () => {
      events.forEach((e) => window.removeEventListener(e, unlock));
      v.muted = false;
      v.play().then(() => setSoundOn(true)).catch(() => undefined);
    };
    v.muted = false;
    v.play()
      .then(() => setSoundOn(true))
      .catch(() => {
        v.muted = true;
        v.play().catch(() => undefined);
        events.forEach((e) => window.addEventListener(e, unlock, { once: true }));
      });
    return () => events.forEach((e) => window.removeEventListener(e, unlock));
  }, []);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = soundOn;
    if (!soundOn) {
      v.currentTime = 0;
      v.play().catch(() => undefined);
    }
    setSoundOn(!soundOn);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6">
      {/* Decorative Moroccan Subtle Geometry and Glow */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f59e0b_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
        {/* Emblem & Badge */}
        <div className="flex flex-col items-center gap-4">
          {/* Signature dorée (PNG sans fond) */}
          <img
            src="/le-pme-gold.png"
            alt="Le PME"
            draggable={false}
            className="w-56 sm:w-72 h-auto select-none drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]"
          />

          {/* Logo à gauche, vidéo à droite (positions fixées même en arabe) */}
          <div dir="ltr" className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-14">
            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-white/25 blur-3xl pointer-events-none" />
              <div className={`relative ${CIRCLE} bg-gradient-to-b from-white to-slate-100 shadow-[0_0_80px_rgba(255,255,255,0.35)] ring-1 ring-white/70 flex items-center justify-center`}>
                <img
                  src="/logo.png?v=2"
                  alt="Parti du Maroc Émergeant — حزب المغرب الصاعد"
                  className="w-[69%] h-[80%] object-contain"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
              <div className={`relative ${CIRCLE} overflow-hidden bg-slate-950 shadow-[0_0_60px_rgba(16,185,129,0.35)] ring-4 ring-white/80`}>
                <video
                  ref={videoRef}
                  src="/video-pme.mp4"
                  autoPlay
                  loop
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover"
                  aria-label={isAr ? 'فيديو تقديم حزب المغرب الصاعد' : 'Vidéo de présentation du Parti du Maroc Émergeant'}
                />
                {/* Les navigateurs n'autorisent l'autoplay qu'en muet : le son s'active d'un clic */}
                <button
                  type="button"
                  onClick={toggleSound}
                  className="absolute bottom-[9%] left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/90 hover:bg-white text-slate-900 text-xs font-bold shadow-lg cursor-pointer"
                  aria-label={soundOn ? (isAr ? 'كتم الصوت' : 'Couper le son') : (isAr ? 'تشغيل الصوت' : 'Activer le son')}
                >
                  {soundOn ? <Volume2 className="w-4 h-4 text-emerald-700" /> : <VolumeX className="w-4 h-4 text-emerald-700" />}
                  <span>{soundOn ? (isAr ? 'كتم الصوت' : 'Couper le son') : (isAr ? 'تشغيل الصوت' : 'Activer le son')}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center justify-center gap-2.5 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold bg-amber-400/15 text-amber-300 border border-amber-400/35 backdrop-blur-md max-w-3xl leading-relaxed text-center shadow-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block shrink-0" />
            <span className={`${isAr ? 'font-arabic' : 'font-sans'} font-semibold tracking-wide`}>
              {t.hero.badge}
            </span>
          </div>
        </div>

        {/* Main Title & Slogan */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none">
            <span>{t.hero.titleMain} </span>
            <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-300 bg-clip-text text-transparent">
              {t.hero.titleHighlight}
            </span>
          </h1>

          <p className="text-base sm:text-xl text-emerald-100/90 font-medium max-w-3xl mx-auto leading-relaxed">
            « {t.slogan} »
          </p>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t.hero.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
          <button
            onClick={onJoinClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-950/60 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-200" />
            <span>{t.hero.joinBtn}</span>
            <ArrowRight className={`w-4 h-4 transition-transform ${isAr ? 'group-hover:-translate-x-1 rotate-180' : 'group-hover:translate-x-1'}`} />
          </button>

          <button
            onClick={onForumClick}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 hover:text-white font-bold text-sm sm:text-base transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Vote className="w-4 h-4 text-amber-400" />
            <span>{t.hero.forumBtn}</span>
          </button>

          <button
            onClick={onExploreRegions}
            className="w-full sm:w-auto px-5 py-4 rounded-xl text-emerald-300 hover:text-emerald-100 font-bold text-xs sm:text-sm underline underline-offset-4 decoration-emerald-500/40 hover:decoration-emerald-300 transition-colors cursor-pointer"
          >
            {t.hero.exploreRegions}
          </button>
        </div>

        {/* Real-time National Figures */}
        <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <bdi dir="ltr" className="block text-xl sm:text-2xl font-black text-amber-400">
              {MEMBERS_COUNT.toLocaleString('fr-FR')}
            </bdi>
            <div className="text-[11px] sm:text-xs text-slate-300 mt-1 font-medium">{t.hero.statMembers}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <bdi dir="ltr" className="block text-xl sm:text-2xl font-black text-emerald-400">12 / 12</bdi>
            <div className="text-[11px] sm:text-xs text-slate-300 mt-1 font-medium">{t.hero.statRegions}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <bdi dir="ltr" className="block text-xl sm:text-2xl font-black text-amber-400">340+</bdi>
            <div className="text-[11px] sm:text-xs text-slate-300 mt-1 font-medium">{t.hero.statProposals}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <bdi dir="ltr" className="block text-xl sm:text-2xl font-black text-teal-300">100%</bdi>
            <div className="text-[11px] sm:text-xs text-slate-300 mt-1 font-medium">{t.hero.statVerified}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
