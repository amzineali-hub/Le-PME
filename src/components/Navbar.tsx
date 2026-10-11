import React, { useState } from 'react';
import { Member, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { PartyLogo } from './PartyLogo';
import {
  Menu,
  X,
  Globe,
  User,
  Award,
  Vote,
  ShieldCheck,
  LogOut,
  Image as ImageIcon,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: Member | null;
  lang: Language;
  onToggleLang: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenLogoModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  lang,
  onToggleLang,
  onOpenAuthModal,
  onLogout,
  onOpenLogoModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';

  const navLinks = [
    { id: 'home', label: t.nav.home },
    { id: 'manifesto', label: t.nav.manifesto },
    { id: 'regions', label: t.nav.regions },
    { id: 'consultations', label: t.nav.consultations },
    { id: 'events', label: t.nav.events },
    { id: 'resources', label: t.nav.resources },
    { id: 'forum', label: t.nav.forum },
    { id: 'news', label: t.nav.news },
    ...(currentUser && (currentUser.role === 'admin' || currentUser.role === 'bureau_politique' || currentUser.role === 'regional_coordinator')
      ? [{ id: 'admin', label: isAr ? 'الإدارة' : 'Administration' }]
      : []),
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        {/* Brand / Logo with click-to-edit support */}
        <div
          onClick={() => handleNavClick('home')}
          className="cursor-pointer shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <img src="/logo.png?v=2" alt="PME" className="h-12 w-auto shrink-0" />
            <div className="hidden sm:block min-[1560px]:hidden min-[1700px]:block leading-tight whitespace-nowrap">
              <div className="text-sm font-extrabold text-slate-900">Parti du Maroc Émergeant</div>
              <div className="text-sm font-bold text-teal-700 font-arabic">حزب المغرب الصاعد</div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden min-[1560px]:flex items-center gap-0.5 min-w-0 mx-2">
          {navLinks.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-2.5 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'text-emerald-800 bg-emerald-50 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Toggle Button */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            title="Changer de langue / تغيير اللغة"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'fr' ? 'العربية' : 'Français'}</span>
          </button>

          {/* User state */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavClick('portal')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'portal'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.firstNameFr}
                  className="w-5 h-5 rounded-full object-cover border border-emerald-400"
                />
                <span className="hidden sm:inline">{currentUser.firstNameFr}</span>
                {(currentUser.role === 'bureau_politique' || currentUser.role === 'admin') && (
                  <span className="hidden md:inline px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                    {t.nav.adminBadge}
                  </span>
                )}
                <span className="sm:hidden">{t.nav.memberPortal}</span>
              </button>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors hidden sm:block cursor-pointer"
                title={t.nav.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuthModal}
                className="hidden sm:block px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                {t.nav.login}
              </button>

              <button
                onClick={() => handleNavClick('registration')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>{t.nav.membership}</span>
              </button>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-[1560px]:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="min-[1560px]:hidden border-t border-slate-200 bg-white px-4 py-6 space-y-3 shadow-xl animate-in slide-in-from-top-2">
          <div className="space-y-1">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-bold ${
                  currentTab === item.id
                    ? 'text-emerald-800 bg-emerald-50'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}

            {currentUser && (
              <button
                onClick={() => handleNavClick('portal')}
                className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-bold text-emerald-800 bg-emerald-50 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>{t.nav.memberPortal}</span>
              </button>
            )}

          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {!currentUser && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal();
                }}
                className="w-full py-3 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 text-center"
              >
                {t.nav.login}
              </button>
            )}

            {currentUser && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 text-center"
              >
                {t.nav.logout}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
