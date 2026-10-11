import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, ShieldAlert, X } from 'lucide-react';
import { Language } from '../types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantWidgetProps {
  lang: Language;
}

const MAX_CHARS = 800;
const MAX_HISTORY = 12;

const TEXT = {
  fr: {
    launcher: 'Assistant IA',
    title: 'Assistant IA du PME',
    subtitle: 'Projet du parti et adhésion',
    greeting:
      'Bonjour ! Je suis l’assistant IA du Parti du Maroc Émergeant. Posez-moi vos questions sur le projet du parti ou sur l’adhésion — en français, en arabe ou en darija.',
    placeholder: 'Votre question…',
    send: 'Envoyer',
    close: 'Fermer l’assistant',
    open: 'Ouvrir l’assistant IA',
    disclaimer: 'Réponses générées par une IA, à vérifier. Ne partagez ici ni CIN, ni mot de passe.',
    thinking: 'Je réfléchis…',
    suggestions: [
      'Quels sont les objectifs du parti ?',
      'Comment adhérer et quels documents fournir ?',
      'Que propose le parti pour l’éducation et la santé ?',
    ],
    errors: {
      rate_limited: 'Vous avez posé beaucoup de questions. Patientez quelques minutes avant de réessayer.',
      not_configured: 'L’assistant n’est pas encore activé. Contactez le parti : developpementistes@gmail.com.',
      busy: 'L’assistant est très sollicité en ce moment. Réessayez dans un instant.',
      too_long: 'Votre message est trop long. Essayez de le raccourcir.',
      forbidden: 'Cet assistant n’est disponible que sur le site officiel du parti.',
      blocked: 'Je ne peux pas répondre à cette question. Reformulez-la ou contactez le parti.',
      network: 'Connexion impossible. Vérifiez votre internet et réessayez.',
      unavailable: 'L’assistant est momentanément indisponible. Réessayez plus tard.',
    },
  },
  ar: {
    launcher: 'المساعد الذكي',
    title: 'المساعد الذكي للحزب',
    subtitle: 'مشروع الحزب والانخراط',
    greeting:
      'مرحباً! أنا المساعد الذكي لحزب المغرب الصاعد. اسألني عن مشروع الحزب أو عن الانخراط، بالعربية أو الدارجة أو الفرنسية.',
    placeholder: 'اكتب سؤالك…',
    send: 'إرسال',
    close: 'إغلاق المساعد',
    open: 'فتح المساعد الذكي',
    disclaimer: 'الأجوبة مولّدة بالذكاء الاصطناعي وقد تحتاج إلى تحقق. لا تشارك هنا رقم بطاقتك الوطنية أو كلمة المرور.',
    thinking: 'كنفكر…',
    suggestions: [
      'ما هي أهداف الحزب؟',
      'كيفاش نخرط فالحزب وشنو هي الوثائق اللي خاصني؟',
      'شنو كيقترح الحزب فالتعليم والصحة؟',
    ],
    errors: {
      rate_limited: 'سألت أسئلة كثيرة. انتظر بضع دقائق قبل المحاولة من جديد.',
      not_configured: 'المساعد لم يُفعَّل بعد. تواصل مع الحزب: developpementistes@gmail.com.',
      busy: 'المساعد عليه ضغط كبير حالياً. أعد المحاولة بعد لحظات.',
      too_long: 'رسالتك طويلة جداً. حاول اختصارها.',
      forbidden: 'هذا المساعد متوفر فقط في الموقع الرسمي للحزب.',
      blocked: 'لا أستطيع الجواب عن هذا السؤال. أعد صياغته أو تواصل مع الحزب.',
      network: 'تعذر الاتصال. تحقق من الإنترنت وأعد المحاولة.',
      unavailable: 'المساعد غير متاح مؤقتاً. أعد المحاولة لاحقاً.',
    },
  },
} as const;

type ErrorKey = keyof (typeof TEXT)['fr']['errors'];

export const AssistantWidget: React.FC<AssistantWidgetProps> = ({ lang }) => {
  const t = TEXT[lang];
  const isAr = lang === 'ar';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, error, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = useCallback(
    async (raw: string) => {
      const question = raw.trim().slice(0, MAX_CHARS);
      if (!question || loading) return;
      const next: ChatMessage[] = [...messages, { role: 'user', content: question }];
      setMessages(next);
      setInput('');
      setError(null);
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const timer = window.setTimeout(() => controller.abort(), 40_000);
      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: next.slice(-MAX_HISTORY) }),
          signal: controller.signal,
        });
        let data: { reply?: string; error?: string; blocked?: boolean } = {};
        try {
          data = await res.json();
        } catch {
          // réponse non JSON (ex. fonction absente en développement)
        }
        if (res.ok && data.reply) {
          setMessages([...next, { role: 'assistant', content: data.reply }]);
        } else if (res.ok && data.blocked) {
          setError('blocked');
        } else {
          const key = (data.error ?? '') as ErrorKey | '';
          setError(key && key in t.errors ? key : 'unavailable');
        }
      } catch {
        setError('network');
      } finally {
        window.clearTimeout(timer);
        setLoading(false);
      }
    },
    [messages, loading, t.errors]
  );

  return (
    <div className="print:hidden">
      {open && (
        <section
          role="dialog"
          aria-label={t.title}
          className="fixed z-[65] bottom-24 start-3 end-3 sm:end-auto sm:start-5 sm:w-[24rem] max-h-[min(34rem,calc(100dvh-8rem))] flex flex-col rounded-3xl bg-white border-2 border-[#0e6a8c] shadow-[0_6px_0_#08394d,0_22px_40px_rgba(8,57,77,0.35)] overflow-hidden"
        >
          <header className="flex items-center gap-3 px-4 py-3 bg-[#0e6a8c] text-white">
            <img src="/logo.png?v=2" alt="" className="w-10 h-10 rounded-full bg-white p-0.5 object-contain shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm leading-tight truncate">{t.title}</h2>
                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black">IA</span>
              </div>
              <p className="text-[11px] text-white/80 truncate">{t.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.close}
              className="p-1.5 rounded-full text-white/90 hover:bg-white/15"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-slate-50" aria-live="polite">
            <div dir={isAr ? 'rtl' : 'ltr'} className="max-w-[88%] rounded-2xl rounded-ss-sm bg-white border border-slate-200 px-3 py-2 text-[13px] leading-relaxed text-slate-800">
              {t.greeting}
            </div>

            {messages.length === 0 && (
              <div className="flex flex-col items-start gap-2 pt-1">
                {t.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    dir="auto"
                    className="text-start px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  dir="auto"
                  className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-emerald-700 text-white rounded-ee-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-ss-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.thinking}</span>
              </div>
            )}

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-800">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span dir="auto">{t.errors[error]}</span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="border-t border-slate-200 bg-white p-2.5"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                dir="auto"
                rows={1}
                value={input}
                maxLength={MAX_CHARS}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    ask(input);
                  }
                }}
                placeholder={t.placeholder}
                className="flex-1 resize-none max-h-24 px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label={t.send}
                className="shrink-0 p-2.5 rounded-xl bg-emerald-700 text-white disabled:opacity-50"
              >
                <Send className={`w-4 h-4 ${isAr ? '-scale-x-100' : ''}`} />
              </button>
            </div>
            <p dir={isAr ? 'rtl' : 'ltr'} className="mt-1.5 text-[10px] leading-snug text-slate-500">
              {t.disclaimer}
            </p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t.close : t.open}
        aria-expanded={open}
        className="fixed z-[64] bottom-5 start-4 sm:start-5 flex items-center gap-2 rounded-full bg-slate-900 text-white font-bold text-sm px-4 py-3"
      >
        {open ? <X className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        <span className="hidden sm:inline">{t.launcher}</span>
      </button>
    </div>
  );
};
