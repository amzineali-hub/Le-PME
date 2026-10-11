import React from 'react';
import { TRANSLATIONS } from '../data/translations';
import { MOROCCAN_REGIONS } from '../data/regions';
import { Language } from '../types';
import { PartyLogo } from './PartyLogo';
import { ShieldCheck, Mail, Phone, MapPin, Heart } from 'lucide-react';
import { PARTY_EMAIL, PARTY_FACEBOOK_URL, PARTY_PHONE_DISPLAY, PARTY_PHONE_E164 } from '../data/siteStats';
import { FacebookIcon } from './FacebookIcon';
import { WhatsAppIcon } from './WhatsAppIcon';
import { VisitorCounter } from './VisitorCounter';

interface FooterProps {
  lang: Language;
  onSelectTab: (tab: string) => void;
  onSelectRegion: (regionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, onSelectTab, onSelectRegion }) => {
  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';

  return (
    <footer className="bg-slate-950 text-white border-t border-slate-900 mt-20 pt-16 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Col (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <PartyLogo size="lg" lang={lang} inverted />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {t.footer.desc}
            </p>

            {/* National Motto */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-amber-300 font-bold text-xs tracking-wider">
              <span>🇲🇦</span>
              <span className="font-arabic">{t.footer.motto}</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400 pt-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{t.footer.headquarters}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`mailto:${PARTY_EMAIL}`} dir="ltr" className="font-mono hover:text-white">{t.footer.email}</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`tel:+${PARTY_PHONE_E164}`} dir="ltr" className="font-mono hover:text-white">{t.footer.phone}</a>
              </div>
              <div className="flex items-center gap-2">
                <WhatsAppIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={`https://wa.me/${PARTY_PHONE_E164}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="font-mono hover:text-white"
                >
                  {PARTY_PHONE_DISPLAY}
                </a>
                <span className="font-semibold text-emerald-300">WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <FacebookIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={PARTY_FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-300 hover:text-white"
                >
                  {isAr ? 'صفحتنا على فيسبوك' : 'Notre page Facebook'}
                </a>
              </div>
            </div>
          </div>

          {/* Quick Nav */}
          <div className="space-y-3 text-xs">
            <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
              {t.footer.sections.nav}
            </div>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button onClick={() => onSelectTab('home')} className="hover:text-white transition-colors">
                  {t.nav.home}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('manifesto')} className="hover:text-white transition-colors">
                  {t.nav.manifesto}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('registration')} className="hover:text-white transition-colors text-emerald-400 font-semibold">
                  {t.nav.membership}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('consultations')} className="hover:text-white transition-colors">
                  {t.nav.consultations}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('events')} className="hover:text-white transition-colors">
                  {t.nav.events}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('resources')} className="hover:text-white transition-colors">
                  {t.nav.resources}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('forum')} className="hover:text-white transition-colors">
                  {t.nav.forum}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('news')} className="hover:text-white transition-colors">
                  {t.nav.news}
                </button>
              </li>
            </ul>
          </div>

          {/* Regional hubs */}
          <div className="space-y-3 text-xs">
            <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
              {t.footer.sections.regions}
            </div>
            <ul className="space-y-2 text-slate-400">
              {MOROCCAN_REGIONS.slice(0, 6).map((reg) => (
                <li key={reg.id}>
                  <button
                    onClick={() => {
                      onSelectTab('regions');
                      onSelectRegion(reg.id);
                    }}
                    className="hover:text-emerald-300 transition-colors truncate text-left max-w-[180px]"
                  >
                    {isAr ? reg.nameAr : reg.nameFr}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Security & CNDP */}
          <div className="space-y-3 text-xs">
            <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
              Sécurité & Données
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Toutes les données relatives à la CIN et aux vérifications des listes électorales sont chiffrées selon les standards de la Commission Nationale de contrôle de la protection des Données à caractère Personnel (CNDP).
            </p>
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Chiffrement AES-256 & TLS 1.3</span>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>{t.footer.copyright}</div>
          <VisitorCounter lang={lang} />
          <div className="flex items-center gap-1 text-[11px]">
            <span>Plateforme Citoyenne du Parti du Maroc Émergeant</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
