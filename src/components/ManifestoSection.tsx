import React from 'react';
import { TRANSLATIONS } from '../data/translations';
import { Language } from '../types';
import { Briefcase, HeartHandshake, Map, Droplets, ShieldCheck, Sparkles } from 'lucide-react';

interface ManifestoSectionProps {
  lang: Language;
}

export const ManifestoSection: React.FC<ManifestoSectionProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';

  const pillars = [
    {
      icon: Briefcase,
      title: t.manifesto.pillar1Title,
      desc: t.manifesto.pillar1Desc,
      tag: isAr ? 'اقتصاد 2030' : 'Économie 2030',
      color: 'from-amber-500 to-yellow-600',
    },
    {
      icon: HeartHandshake,
      title: t.manifesto.pillar2Title,
      desc: t.manifesto.pillar2Desc,
      tag: isAr ? 'التضامن' : 'Solidarité',
      color: 'from-emerald-600 to-teal-700',
    },
    {
      icon: Map,
      title: t.manifesto.pillar3Title,
      desc: t.manifesto.pillar3Desc,
      tag: isAr ? '12 جهة' : '12 Régions',
      color: 'from-blue-600 to-indigo-700',
    },
    {
      icon: Droplets,
      title: t.manifesto.pillar4Title,
      desc: t.manifesto.pillar4Desc,
      tag: isAr ? 'خطة الماء والطاقة' : 'Plan Eau & Énergie',
      color: 'from-teal-600 to-cyan-700',
    },
    {
      icon: ShieldCheck,
      title: t.manifesto.pillar5Title,
      desc: t.manifesto.pillar5Desc,
      tag: isAr ? 'الرقمنة والنزاهة' : 'Numérique & Intégrité',
      color: 'from-emerald-700 to-green-800',
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          {t.manifesto.tagline}
        </span>
        <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.manifesto.title}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {t.manifesto.subtitle}
        </p>
      </div>

      {/* 5 Strategic Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className={`bg-white rounded-3xl border border-slate-200 p-7 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between ${
                idx === 0 ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${pillar.color} text-white flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {pillar.tag}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {pillar.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>

              <div className="pt-2 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <span>{isAr ? 'برنامج الحزب المعتمد' : 'Axe Prioritaire PME'}</span>
                <span>•</span>
                <span>{isAr ? 'أفق 2030' : 'Cap 2030'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
