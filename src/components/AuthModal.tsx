import React, { useState } from 'react';
import { Member, Language } from '../types';
import { loginMember, resetPassword, describeError } from '../services/memberService';
import { Mail, KeyRound, Loader2, X } from 'lucide-react';

interface AuthModalProps {
  lang: Language;
  onLoginSuccess: (member: Member) => void;
  onGoToRegistration: () => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  lang,
  onLoginSuccess,
  onGoToRegistration,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const isAr = lang === 'ar';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim() || !password) {
      setError(isAr ? 'أدخل بريدك الإلكتروني وكلمة المرور' : 'Saisissez votre email et votre mot de passe');
      return;
    }
    setBusy(true);
    try {
      const member = await loginMember(email, password);
      onLoginSuccess(member);
      onClose();
    } catch (err) {
      setError(describeError(err, isAr));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError(isAr ? 'أدخل بريدك الإلكتروني أولاً' : 'Saisissez d’abord votre email');
      return;
    }
    try {
      await resetPassword(email);
      setInfo(
        isAr
          ? 'إذا كان هذا البريد مسجلاً، فقد أُرسل إليه رابط إعادة التعيين.'
          : 'Si cet email est enregistré, un lien de réinitialisation vient de lui être envoyé.'
      );
    } catch (err) {
      setError(describeError(err, isAr));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 space-y-6 relative overflow-hidden max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label={isAr ? 'إغلاق' : 'Fermer'}
          className="absolute top-5 end-5 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2 pt-2">
          <img src="/logo.png?v=2" alt="PME" className="h-28 w-auto mx-auto" />
          <h3 className="text-xl font-extrabold text-slate-900 mt-2">
            {isAr ? 'تسجيل دخول المنخرطين' : 'Espace Membre Sécurisé'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'ادخل إلى فضاء المنخرط وبطاقتك الحزبية.'
              : 'Accédez à votre espace adhérent, vos votes civiques et votre carte numérique.'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {isAr ? 'البريد الإلكتروني' : 'Adresse email'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@domaine.ma"
                className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {isAr ? 'كلمة المرور' : 'Mot de passe'}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-emerald-700 hover:underline mt-1.5"
            >
              {isAr ? 'نسيت كلمة المرور؟' : 'Mot de passe oublié ?'}
            </button>
          </div>

          {error && <p className="text-red-600 text-xs font-medium">{error}</p>}
          {info && <p className="text-emerald-700 text-xs font-medium">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {isAr ? 'تسجيل الدخول إلى فضاء المنخرط' : 'Se Connecter à mon Espace'}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            {isAr ? 'لست منخرطاً بعد؟' : 'Vous n’êtes pas encore adhérent ?'}{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoToRegistration();
              }}
              className="font-bold text-emerald-700 hover:underline"
            >
              {isAr ? 'انخرط الآن' : 'Adhérer en ligne maintenant'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
