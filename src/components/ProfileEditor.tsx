import React, { useState } from 'react';
import { Language, Member } from '../types';
import { MemberProfilePatch, describeError, preparePhoto, updateMemberProfile } from '../services/memberService';
import { Camera, Loader2, X } from 'lucide-react';

interface ProfileEditorProps {
  member: Member;
  lang: Language;
  onClose: () => void;
  onSaved: (patch: MemberProfilePatch) => void;
}

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 text-sm outline-none';

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ member, lang, onClose, onSaved }) => {
  const isAr = lang === 'ar';
  const [firstNameFr, setFirstNameFr] = useState(member.firstNameFr);
  const [lastNameFr, setLastNameFr] = useState(member.lastNameFr);
  const [firstNameAr, setFirstNameAr] = useState(member.firstNameAr);
  const [lastNameAr, setLastNameAr] = useState(member.lastNameAr);
  const [phone, setPhone] = useState(member.phone);
  const [profession, setProfession] = useState(member.profession);
  const [commune, setCommune] = useState(member.commune);
  const [photoUrl, setPhotoUrl] = useState(member.photoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      setPhotoUrl(await preparePhoto(file));
    } catch (err) {
      setError(describeError(err, isAr));
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstNameFr.trim() || !lastNameFr.trim()) {
      setError(isAr ? 'الاسم الشخصي والعائلي مطلوبان' : 'Le prénom et le nom sont requis');
      return;
    }
    const patch: MemberProfilePatch = {
      firstNameFr: firstNameFr.trim(),
      lastNameFr: lastNameFr.trim(),
      firstNameAr: firstNameAr.trim() || firstNameFr.trim(),
      lastNameAr: lastNameAr.trim() || lastNameFr.trim(),
      phone: phone.trim(),
      profession: profession.trim(),
      commune: commune.trim(),
      photoUrl,
    };
    setBusy(true);
    setError('');
    try {
      await updateMemberProfile(member.id, patch);
      onSaved(patch);
      onClose();
    } catch (err) {
      setError(describeError(err, isAr));
    } finally {
      setBusy(false);
    }
  };

  const label = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm">
      <form
        onSubmit={save}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[94vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
          <h3 className="text-lg font-extrabold text-slate-900">{isAr ? 'تعديل ملفي الشخصي' : 'Modifier mon profil'}</h3>
          <button type="button" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Fermer'} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img src={photoUrl} alt="" className="w-24 h-28 rounded-xl object-cover border-2 border-emerald-600 bg-slate-100" />
              <label className="absolute -bottom-2 -right-2 p-2 rounded-full bg-emerald-700 text-white shadow-lg cursor-pointer">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-slate-500">
              {isAr ? 'اضغط على الكاميرا لتغيير صورتك. تُضغط الصورة تلقائياً.' : 'Touchez l’appareil photo pour changer votre photo. Elle est compressée automatiquement.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>{isAr ? 'الاسم الشخصي (فرنسية)' : 'Prénom (français)'} *</label>
              <input className={inputCls} value={firstNameFr} onChange={(e) => setFirstNameFr(e.target.value)} />
            </div>
            <div>
              <label className={label}>{isAr ? 'الاسم العائلي (فرنسية)' : 'Nom (français)'} *</label>
              <input className={inputCls} value={lastNameFr} onChange={(e) => setLastNameFr(e.target.value)} />
            </div>
            <div dir="rtl">
              <label className={label}>الاسم الشخصي (بالعربية)</label>
              <input className={`${inputCls} text-right font-arabic`} value={firstNameAr} onChange={(e) => setFirstNameAr(e.target.value)} />
            </div>
            <div dir="rtl">
              <label className={label}>الاسم العائلي (بالعربية)</label>
              <input className={`${inputCls} text-right font-arabic`} value={lastNameAr} onChange={(e) => setLastNameAr(e.target.value)} />
            </div>
            <div>
              <label className={label}>{isAr ? 'الهاتف' : 'Téléphone'}</label>
              <input className={inputCls} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className={label}>{isAr ? 'المهنة' : 'Profession'}</label>
              <input className={inputCls} value={profession} onChange={(e) => setProfession(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>{isAr ? 'الجماعة / المدينة' : 'Commune / Ville'}</label>
              <input className={inputCls} value={commune} onChange={(e) => setCommune(e.target.value)} />
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            {isAr
              ? 'لا يمكن تعديل رقم البطاقة الوطنية والبريد والجهة بنفسك: تواصل مع الإدارة.'
              : 'La CIN, l’email et la région ne sont pas modifiables ici : contactez l’administration.'}
          </p>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 px-5 py-4 bg-white border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold">
            {isAr ? 'إلغاء' : 'Annuler'}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-bold disabled:opacity-60"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isAr ? 'حفظ' : 'Enregistrer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
