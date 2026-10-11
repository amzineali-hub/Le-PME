import React from 'react';
import { Facebook, MapPin, MessageCircle, Quote } from 'lucide-react';
import { Language } from '../types';
import founder from '../../knowledge/fondateur.json';
import { PARTY_PHONE_E164 } from '../data/siteStats';

interface FounderSectionProps {
  lang: Language;
}

/**
 * Section « Le fondateur » : le texte vient de knowledge/fondateur.json, la même source que celle de l'assistant IA
 * (une seule version à tenir à jour). L'adresse email personnelle n'y figure volontairement pas.
 */
export const FounderSection: React.FC<FounderSectionProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const pick = (o: { ar: string; fr: string }) => (isAr ? o.ar : o.fr);

  return (
    <section id="fondateur" className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-8 space-y-2">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
          {isAr ? 'من يقف وراء المشروع' : 'L’homme derrière le projet'}
        </span>
        <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-slate-900">
          {isAr ? 'مؤسس الحزب' : 'Le fondateur du parti'}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Identité */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-center space-y-4">
          <img
            src="/fondateur.jpg"
            alt={pick(founder.name)}
            loading="lazy"
            className="w-40 h-40 sm:w-48 sm:h-48 rounded-full object-cover mx-auto border-4 border-white ring-4 ring-[#0e6a8c] shadow-lg"
          />
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900">{pick(founder.name)}</h3>
            <p className="text-sm font-bold text-teal-700">{pick(founder.headline)}</p>
            <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>{pick(founder.city)}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <a
              href={`https://wa.me/${PARTY_PHONE_E164}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isAr ? 'تواصل عبر واتساب' : 'Écrire sur WhatsApp'}</span>
            </a>
            <a
              href={founder.facebookGroup}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold"
            >
              <Facebook className="w-4 h-4 text-[#0e6a8c]" />
              <span>{isAr ? 'مجموعة فيسبوك' : 'Groupe Facebook'}</span>
            </a>
          </div>
        </div>

        {/* Parcours */}
        <div className="lg:col-span-3 space-y-5">
          <blockquote className="relative bg-white rounded-3xl border border-slate-200 p-6 sm:p-7">
            <Quote className="absolute top-4 end-5 w-8 h-8 text-teal-100" aria-hidden="true" />
            <h3 className="text-base font-extrabold text-slate-900 mb-2 pe-8">{pick(founder.profileTitle)}</h3>
            <p className="text-sm sm:text-[15px] leading-loose text-slate-700 pe-8">{pick(founder.profile)}</p>
          </blockquote>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-3">
            <h3 className="text-base font-extrabold text-slate-900">{isAr ? 'المسؤوليات' : 'Responsabilités'}</h3>
            <ul className="space-y-2">
              {founder.roles.map((r) => (
                <li key={r.fr} className="flex items-start gap-2.5 text-sm font-semibold text-slate-800">
                  <span className="mt-2 w-2 h-2 shrink-0 rounded-full bg-emerald-600" />
                  <span>{pick(r)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-3">
            <h3 className="text-base font-extrabold text-slate-900">{isAr ? 'الكفاءات' : 'Compétences'}</h3>
            <div className="flex flex-wrap gap-2">
              {founder.skills.map((s) => (
                <span key={s.fr} className="px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900">
                  {pick(s)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
