import React, { useState } from 'react';
import { NewsArticle, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Newspaper, Calendar, Clock, ArrowRight, X, Sparkles } from 'lucide-react';

interface NewsAgendaProps {
  articles: NewsArticle[];
  lang: Language;
}

export const NewsAgenda: React.FC<NewsAgendaProps> = ({ articles, lang }) => {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10 animate-in fade-in duration-300">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
          <Newspaper className="w-3.5 h-3.5 text-emerald-700" />
          {t.news.tagline}
        </span>
        <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.news.title}
        </h2>
        <p className="text-sm text-slate-600">
          {t.news.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedArticle(item)}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer group"
          >
            <div>
              {/* Image banner */}
              <div className="aspect-[13/10] overflow-hidden relative bg-slate-200">
                {/* Fond flou de la même image : l'affiche entière reste visible, quel que soit son format */}
                <img src={item.imageUrl} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-70" />
                <img
                  src={item.imageUrl}
                  alt={item.titleFr}
                  className="relative w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Text content */}
              <div className="p-6 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold px-2 py-0.5 rounded bg-emerald-700 text-white">
                    {isAr ? item.categoryAr : item.categoryFr}
                  </span>
                  <span dir="ltr" className="font-medium text-slate-500">{item.date}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-emerald-700 transition-colors">
                  {isAr ? item.titleAr : item.titleFr}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {isAr ? item.excerptAr : item.excerptFr}
                </p>
              </div>
            </div>

            <div className="p-6 pt-0 flex items-center justify-between text-xs text-emerald-800 font-bold border-t border-slate-100 mt-2">
              <span className="flex items-center gap-1 group-hover:underline">
                <span>{t.news.readMore}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
              </span>
              <span className="text-slate-400 font-normal flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {isAr ? item.readTimeAr : item.readTimeFr}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="relative h-64 sm:h-96 shrink-0 bg-slate-100">
              <img
                src={selectedArticle.imageUrl}
                alt={selectedArticle.titleFr}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/60 text-white hover:bg-slate-950 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                  {isAr ? selectedArticle.categoryAr : selectedArticle.categoryFr}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-4">
              <div className="text-xs text-slate-400">{selectedArticle.date}</div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {isAr ? selectedArticle.titleAr : selectedArticle.titleFr}
              </h2>
              <div className="text-sm text-slate-700 leading-relaxed space-y-3 font-normal">
                <p>{isAr ? selectedArticle.contentAr : selectedArticle.contentFr}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              >
                {t.news.backToNews}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
