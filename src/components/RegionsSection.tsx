import React, { useState } from 'react';
import { MOROCCAN_REGIONS } from '../data/regions';
import { TRANSLATIONS } from '../data/translations';
import { MoroccanRegion, Language } from '../types';
import { MapPin, Users, Mail, ArrowRight, Search, Building2 } from 'lucide-react';

interface RegionsSectionProps {
  lang: Language;
  onSelectRegionToJoin: (regionId: string) => void;
}

export const RegionsSection: React.FC<RegionsSectionProps> = ({
  lang,
  onSelectRegionToJoin,
}) => {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<MoroccanRegion | null>(MOROCCAN_REGIONS[0]);
  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';

  const filtered = MOROCCAN_REGIONS.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchFr = r.nameFr.toLowerCase().includes(q) || r.provincesFr.some((p) => p.toLowerCase().includes(q));
    const matchAr = r.nameAr.includes(q) || r.provincesAr.some((p) => p.includes(q));
    return matchFr || matchAr;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
          {t.regions.tagline}
        </span>
        <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.regions.title}
        </h2>
        <p className="text-sm text-slate-600">
          {t.regions.subtitle}
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-md mx-auto relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.regions.searchPlaceholder}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white shadow-xs text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none"
        />
      </div>

      {/* Grid of the 12 Regions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((region) => {
          return (
            <div
              key={region.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-emerald-500 transition-all space-y-4 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-900 text-emerald-200">
                    {region.code}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{region.membersCount.toLocaleString()} {isAr ? 'منخرط' : 'membres'}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {isAr ? region.nameAr : region.nameFr}
                  </h3>
                  <div className="text-xs text-slate-500 font-medium">
                    {isAr ? region.nameFr : region.nameAr} • {isAr ? `المركز: ${region.capitalAr}` : `Chef-lieu: ${region.capitalFr}`}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr ? region.descriptionAr : region.descriptionFr}
                </p>

                {/* Provinces mini tag cloud */}
                <div className="pt-1">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">
                    {t.regions.provinces} :
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {region.provincesFr.slice(0, 4).map((p, idx) => (
                      <span
                        key={p}
                        className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                      >
                        {isAr ? region.provincesAr[idx] || p : p}
                      </span>
                    ))}
                    {region.provincesFr.length > 4 && (
                      <span className="text-[10px] text-slate-400 px-1 py-0.5">
                        +{region.provincesFr.length - 4} autres
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => onSelectRegionToJoin(region.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white transition-all shadow-xs group-hover:shadow"
                >
                  <span>{t.regions.joinFromRegion}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
