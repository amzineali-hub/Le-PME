import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { MOROCCAN_REGIONS } from '../data/regions';
import { TRANSLATIONS } from '../data/translations';
import { AVATAR_OPTIONS } from '../data/mockData';
import { Language, Member } from '../types';
import { validateMoroccanCIN } from '../services/electoralService';
import {
  ElectoralProof,
  describeError,
  prepareElectoralProof,
  preparePhoto,
  registerMember,
} from '../services/memberService';
import { printRegistrationSheet } from '../utils/registrationSheet';
import { MembershipCard } from './MembershipCard';
import {
  User,
  ShieldCheck,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Phone,
  FileCheck2,
  Lock,
  Vote,
  Printer,
  UploadCloud,
  ExternalLink
} from 'lucide-react';

interface RegistrationFormProps {
  lang: Language;
  onRegistered: (member: Member) => void;
  onGoToPortal: () => void;
  onGoToForum: () => void;
  preselectedRegionId?: string;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  lang,
  onRegistered,
  onGoToPortal,
  onGoToForum,
  preselectedRegionId,
}) => {
  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [firstNameFr, setFirstNameFr] = useState('');
  const [lastNameFr, setLastNameFr] = useState('');
  const [firstNameAr, setFirstNameAr] = useState('');
  const [lastNameAr, setLastNameAr] = useState('');
  const [cin, setCin] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [photoUrl, setPhotoUrl] = useState<string>(AVATAR_OPTIONS[0]);

  const [regionId, setRegionId] = useState<string>(preselectedRegionId || 'rabat-sale-kenitra');
  const [province, setProvince] = useState<string>('Rabat');
  const [commune, setCommune] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [commissionInterest, setCommissionInterest] = useState('Économie & Emploi');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fiche d'inscription sur les listes électorales (déposée par l'adhérent)
  const [proof, setProof] = useState<ElectoralProof | null>(null);
  const [proofBusy, setProofBusy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoCustom, setPhotoCustom] = useState(false);

  // Registered Member
  const [createdMember, setCreatedMember] = useState<Member | null>(null);

  const selectedRegion = MOROCCAN_REGIONS.find((r) => r.id === regionId) || MOROCCAN_REGIONS[0];

  // Handle region switch and update province choices
  const handleRegionChange = (newRegionId: string) => {
    setRegionId(newRegionId);
    const reg = MOROCCAN_REGIONS.find((r) => r.id === newRegionId);
    if (reg) {
      setProvince(reg.provincesFr[0] || reg.capitalFr);
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!firstNameFr.trim()) newErrors.firstNameFr = isAr ? 'يرجى إدخال الاسم الشخصي' : 'Le prénom est requis';
    if (!lastNameFr.trim()) newErrors.lastNameFr = isAr ? 'يرجى إدخال الاسم العائلي' : 'Le nom de famille est requis';
    if (!cin.trim()) {
      newErrors.cin = isAr ? 'رقم البطاقة الوطنية مطلوب' : 'Le numéro CIN est requis';
    } else if (!validateMoroccanCIN(cin)) {
      newErrors.cin = isAr
        ? 'صيغة البطاقة الوطنية غير صحيحة (مثال: AB123456)'
        : 'Format CIN invalide (ex: AB123456 ou BE78901)';
    }
    if (!birthDate) {
      newErrors.birthDate = isAr ? 'تاريخ الازدياد مطلوب' : 'Date de naissance requise';
    } else {
      const limit = new Date();
      limit.setFullYear(limit.getFullYear() - 18);
      if (new Date(birthDate) > limit) {
        newErrors.birthDate = isAr ? 'يجب أن يكون عمرك 18 سنة على الأقل' : 'L’adhésion est réservée aux personnes majeures (18 ans)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim() || !email.includes('@')) {
      newErrors.email = isAr ? 'عنوان البريد الإلكتروني غير صالح' : 'Adresse email valide requise';
    }
    if (!phone.trim()) {
      newErrors.phone = isAr ? 'رقم الهاتف مطلوب للتواصل' : 'Numéro de téléphone mobile requis';
    }
    if (!regionId) {
      newErrors.regionId = isAr ? 'يرجى اختيار جهتك' : 'Veuillez sélectionner votre région';
    }
    if (password.length < 8) {
      newErrors.password = isAr ? 'كلمة المرور: 8 أحرف على الأقل' : 'Mot de passe : 8 caractères minimum';
    } else if (password !== password2) {
      newErrors.password2 = isAr ? 'كلمتا المرور غير متطابقتين' : 'Les deux mots de passe sont différents';
    }
    if (!termsAccepted) {
      newErrors.terms = isAr ? 'يجب الموافقة على شروط الانخراط' : 'Veuillez accepter les statuts du parti';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Étape 2 -> 3 : dépôt (facultatif) de la fiche d'inscription sur les listes électorales
  const handleGoToProofStep = () => {
    if (validateStep2()) setCurrentStep(3);
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setProofBusy(true);
    setSubmitError('');
    try {
      setProof(await prepareElectoralProof(file));
    } catch (err) {
      setProof(null);
      setSubmitError(describeError(err, isAr));
    } finally {
      setProofBusy(false);
    }
  };

  // Création du compte + de la fiche adhérent, puis émission de la carte
  const handleSubmitRegistration = async () => {
    if (!proof) {
      setSubmitError(isAr ? 'وصل القيد في اللوائح الانتخابية إلزامي.' : 'La fiche d’inscription électorale est obligatoire.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const regionCode = selectedRegion.code;
      const randomSerial = Math.floor(10000 + Math.random() * 90000);
      const newMember = await registerMember(
        {
          membershipNumber: `PME-2026-${regionCode}-${randomSerial}`,
          firstNameFr: firstNameFr.trim(),
          lastNameFr: lastNameFr.trim(),
          firstNameAr: firstNameAr.trim() || firstNameFr.trim(),
          lastNameAr: lastNameAr.trim() || lastNameFr.trim(),
          cin: cin.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          birthDate,
          gender,
          regionId,
          province,
          commune: commune || selectedRegion.capitalFr,
          profession: profession || (isAr ? 'عضو ملتزم' : 'Adhérent actif'),
          photoUrl,
          commissionInterest,
          joinedDate: new Date().toLocaleDateString('fr-FR'),
          validUntil: '31/12/2027',
          contributionBadge: 'Adhérent Émergeant',
        },
        password,
        proof
      );

      setCreatedMember(newMember);
      onRegistered(newMember);
      setCurrentStep(5);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0e6a8c', '#10b981', '#f59e0b', '#fbbf24', '#ffffff'],
        });
      } catch {
        // ignore
      }
    } catch (err) {
      setSubmitError(describeError(err, isAr));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Photo d'adhérent : redimensionnée et compressée avant stockage
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError('');
    try {
      setPhotoUrl(await preparePhoto(file));
      setPhotoCustom(true);
    } catch (err) {
      setPhotoError(describeError(err, isAr));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Step Indicator Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-8">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {[
            { num: 1, label: t.registration.step1 },
            { num: 2, label: t.registration.step2 },
            { num: 3, label: isAr ? '3. القيد الانتخابي' : '3. Liste électorale' },
            { num: 5, label: isAr ? '4. بطاقة الانخراط' : '4. Fiche & Carte' },
          ].map((s, idx) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <div key={s.num} className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : isActive
                      ? 'bg-emerald-700 text-white ring-4 ring-emerald-100 shadow-md'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-xs font-semibold whitespace-nowrap hidden sm:inline ${
                    isActive ? 'text-emerald-800' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
                {idx < 3 && <span className="w-6 sm:w-10 h-0.5 bg-slate-200 hidden sm:block mx-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Step Cards */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-10 transition-all">
        {/* ================= STEP 1: IDENTITY & CIN ================= */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                {t.registration.badge}
              </span>
              <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                {t.registration.title}
              </h2>
              <p className="text-slate-600 text-sm mt-1">{t.registration.subtitle}</p>
            </div>

            {/* Photo Selection Section */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <label className="block text-sm font-bold text-slate-800 mb-3">
                {t.registration.form.photoLabel}
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Active Photo Preview */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-emerald-600 shadow-md bg-white">
                    <img src={photoUrl} alt="Photo Preview" className="w-full h-full object-cover" />
                  </div>
                  <label className="absolute -bottom-2 -right-2 p-2 rounded-full bg-emerald-700 text-white shadow-lg cursor-pointer hover:bg-emerald-800 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>

                <div className="space-y-3 flex-1 text-center sm:text-left">
                  <div className="text-xs text-slate-500">{t.registration.form.photoHelp}</div>
                  {photoError && <p className="text-red-600 text-xs font-semibold">{photoError}</p>}
                  {photoCustom && !photoError && (
                    <p className="text-emerald-700 text-xs font-semibold">
                      {isAr ? '✓ تم اختيار صورتك الشخصية' : '✓ Votre photo est prête'}
                    </p>
                  )}
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm transition-colors">
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.registration.form.photoUploadBtn}</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                  {/* Preset Avatars */}
                  <div>
                    <span className="text-xs font-medium text-slate-600 block mb-1.5">
                      {t.registration.form.orSelectAvatar}
                    </span>
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      {AVATAR_OPTIONS.map((avatar, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPhotoUrl(avatar);
                            setPhotoCustom(false);
                            setPhotoError('');
                          }}
                          className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all ${
                            photoUrl === avatar
                              ? 'border-emerald-600 scale-105 shadow-md ring-2 ring-emerald-200'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={avatar} alt="Avatar option" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Details Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* French Names */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.registration.form.firstNameFr} *
                </label>
                <input
                  type="text"
                  value={firstNameFr}
                  onChange={(e) => setFirstNameFr(e.target.value)}
                  placeholder="Ex: Yassine"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm outline-none transition-all"
                />
                {errors.firstNameFr && <p className="text-red-500 text-xs mt-1">{errors.firstNameFr}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.registration.form.lastNameFr} *
                </label>
                <input
                  type="text"
                  value={lastNameFr}
                  onChange={(e) => setLastNameFr(e.target.value)}
                  placeholder="Ex: El Amrani"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm outline-none transition-all"
                />
                {errors.lastNameFr && <p className="text-red-500 text-xs mt-1">{errors.lastNameFr}</p>}
              </div>

              {/* Arabic Names */}
              <div dir="rtl">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.registration.form.firstNameAr}
                </label>
                <input
                  type="text"
                  value={firstNameAr}
                  onChange={(e) => setFirstNameAr(e.target.value)}
                  placeholder="مثال: ياسين"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm outline-none transition-all font-arabic text-right"
                />
              </div>

              <div dir="rtl">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.registration.form.lastNameAr}
                </label>
                <input
                  type="text"
                  value={lastNameAr}
                  onChange={(e) => setLastNameAr(e.target.value)}
                  placeholder="مثال: العمراني"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm outline-none transition-all font-arabic text-right"
                />
              </div>

              {/* Moroccan CIN Input */}
              <div className="md:col-span-2 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    {t.registration.form.cinLabel} *
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isAr ? 'رقم فريد لكل منخرط' : 'Une CIN = une seule adhésion'}</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={cin}
                    onChange={(e) => setCin(e.target.value.toUpperCase())}
                    placeholder={t.registration.form.cinPlaceholder}
                    className="w-full ps-4 pe-4 sm:pe-20 py-3.5 rounded-xl border-2 border-emerald-300 bg-white font-mono font-bold text-base tracking-wider sm:tracking-widest text-slate-900 uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 outline-none transition-all shadow-inner"
                  />
                  <div className="hidden sm:block absolute end-3.5 top-4 text-xs font-bold text-slate-400 pointer-events-none">
                    CIN-MA
                  </div>
                </div>
                <p className="text-xs text-emerald-800 mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t.registration.form.cinHelp}</span>
                </p>
                {errors.cin && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.cin}</p>}
              </div>

              {/* Birth Date & Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.registration.form.birthDate} *
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm outline-none transition-all"
                />
                {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.registration.form.gender} *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('M')}
                    className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all ${
                      gender === 'M'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.registration.form.genderM}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('F')}
                    className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all ${
                      gender === 'F'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.registration.form.genderF}
                  </button>
                </div>
              </div>
            </div>

            {/* Next Step Button */}
            <div className="pt-4 flex sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setCurrentStep(2);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98"
              >
                <span>{t.registration.form.nextBtn}</span>
                <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: REGION & CONTACT ================= */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                <span>{lang === 'ar' ? 'الانتماء الجهوي وبيانات الاتصال' : 'Ancrage Territorial & Contact'}</span>
              </span>
              <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                {lang === 'ar' ? 'حدد جهتك ضمن جهات المملكة الـ12' : 'Votre Région parmi les 12 Régions du Royaume'}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                {lang === 'ar'
                  ? 'يتطلب الانخراط في الحزب تحديد جهة إقامتكم لربطكم بالتنسيقية المحلية والتحقق من التسجيل باللوائح الانتخابية التابعة لنفوذها الترابي.'
                  : 'L’adhésion est rattachée à l’une des 12 coordinations régionales pour l’animation politique et le ciblage électoral.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Region Select */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>{t.registration.form.regionLabel} *</span>
                  <span className="text-emerald-700 text-[11px] font-semibold">12 Régions du Maroc</span>
                </label>
                <select
                  value={regionId}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-800 bg-white outline-none transition-all shadow-sm cursor-pointer"
                >
                  {MOROCCAN_REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nameFr} — {r.nameAr} ({r.capitalFr})
                    </option>
                  ))}
                </select>
                {errors.regionId && <p className="text-red-500 text-xs mt-1">{errors.regionId}</p>}

                {/* Selected Region info pill */}
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-900">
                      {isAr ? selectedRegion.nameAr : selectedRegion.nameFr}
                    </span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span>{isAr ? `الشيف-ليو: ${selectedRegion.capitalAr}` : `Chef-lieu: ${selectedRegion.capitalFr}`}</span>
                  </div>
                  <div className="text-emerald-700 font-bold">
                    {selectedRegion.membersCount.toLocaleString()} {t.hero.statMembers}
                  </div>
                </div>
              </div>

              {/* Province / Préfecture */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.registration.form.provinceLabel} *
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 bg-white outline-none transition-all"
                >
                  {selectedRegion.provincesFr.map((p, idx) => (
                    <option key={p} value={p}>
                      {p} {selectedRegion.provincesAr[idx] ? `(${selectedRegion.provincesAr[idx]})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commune / Ville */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.registration.form.communeLabel}
                </label>
                <input
                  type="text"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  placeholder={t.registration.form.communePlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 text-sm outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t.registration.form.email} *</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom.prenom@exemple.ma"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 text-sm outline-none transition-all"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isAr ? 'كلمة المرور' : 'Mot de passe'} *</span>
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isAr ? '8 أحرف على الأقل' : '8 caractères minimum'}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 text-sm outline-none transition-all"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isAr ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'} *</span>
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 text-sm outline-none transition-all"
                />
                {errors.password2 && <p className="text-red-500 text-xs mt-1">{errors.password2}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t.registration.form.phone} *</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 61 23 45 67"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 text-sm outline-none transition-all"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Profession */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.registration.form.professionLabel}
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder={t.registration.form.professionPlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 text-sm outline-none transition-all"
                />
              </div>

              {/* Commission Interest */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.registration.form.commissionLabel}
                </label>
                <select
                  value={commissionInterest}
                  onChange={(e) => setCommissionInterest(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 bg-white outline-none transition-all"
                >
                  <option value="Économie & Emploi">{t.forum.categories.economy}</option>
                  <option value="Santé & Protection Sociale">{t.forum.categories.health_social}</option>
                  <option value="Éducation & Jeunesse">{t.forum.categories.education_youth}</option>
                  <option value="Eau & Transition Écologique">{t.forum.categories.water_ecology}</option>
                  <option value="Gouvernance & Numérique">{t.forum.categories.governance}</option>
                  <option value="Développement Régional">{t.forum.categories.regional_development}</option>
                </select>
              </div>

              {/* Terms Checkbox */}
              <div className="md:col-span-2 pt-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 mt-0.5 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    {t.registration.form.termsLabel}
                  </span>
                </label>
                {errors.terms && <p className="text-red-500 text-xs mt-1">{errors.terms}</p>}
              </div>
            </div>

            {/* Nav Buttons */}
            <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors"
              >
                <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                <span>{t.registration.form.backBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleGoToProofStep}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98"
              >
                <Vote className="w-4 h-4 text-emerald-300" />
                <span>{t.registration.form.nextBtn}</span>
                <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: DÉPÔT DE LA FICHE ÉLECTORALE ================= */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                <Vote className="w-8 h-8 text-emerald-700" />
              </div>
              <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isAr ? 'القيد في اللوائح الانتخابية' : 'Inscription sur les listes électorales'}
              </h2>
              <p className="text-slate-600 text-sm">
                {isAr
                  ? 'أدخل إلى موقع اللوائح الانتخابية، تأكد من قيدك، والتقط صورة للشاشة (لقطة) ثم أرفقها هنا. هذه الوثيقة إلزامية للانخراط كعضو مؤسس.'
                  : 'Rendez-vous sur le site des listes électorales, vérifiez votre inscription, faites une capture d’écran de la page de résultat, puis joignez-la ici. Cette pièce est obligatoire pour être membre fondateur.'}
              </p>
            </div>

            <div className="max-w-xl mx-auto space-y-5">
              <a
                href="https://www.listeselectorales.ma"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 text-emerald-900 font-bold text-sm hover:bg-emerald-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{isAr ? 'فتح www.listeselectorales.ma والتحقق من قيدي' : 'Ouvrir www.listeselectorales.ma et vérifier mon inscription'}</span>
              </a>

              <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 p-6 text-center transition-colors">
                {proofBusy ? (
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                ) : proof ? (
                  <FileCheck2 className="w-8 h-8 text-emerald-600 mx-auto" />
                ) : (
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                )}
                <div className="mt-2 text-sm font-semibold text-slate-800 break-all">
                  {proof
                    ? proof.name
                    : isAr
                    ? 'اضغط لاختيار لقطة الشاشة (أو ملف PDF)'
                    : 'Touchez pour choisir votre capture d’écran (ou un PDF)'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {isAr ? 'تتحول اللقطة تلقائياً إلى PDF (700 كيلوبايت كحد أقصى)' : 'La capture est convertie automatiquement en PDF (700 Ko maximum)'}
                </div>
                <input
                  type="file"
                  accept="application/pdf,.pdf,image/*"
                  onChange={handleProofUpload}
                  className="hidden"
                />
              </label>

              <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 text-xs text-amber-900 leading-relaxed">
                {isAr
                  ? 'بعد التسجيل، ستسلّم الوثائق الورقية لمنسق جهتك: الالتزام الموقع والمصادق عليه ونسخة من بطاقتك الوطنية (الوجه والظهر). تبقى بطاقة العضو المؤسس في انتظار الوثائق المصادق عليها.'
                  : 'Après l’inscription, vous remettrez à votre coordinateur régional les pièces papier : l’engagement signé et légalisé, et la photocopie de votre CIN (recto et verso). Votre carte de membre fondateur reste en instance jusqu’à validation de toutes les pièces.'}
              </div>

              <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  {isAr
                    ? 'لا يطلع على هذا الملف إلا مسؤولو الحزب المخولون لمراقبة القيد.'
                    : 'Seuls les responsables habilités du parti peuvent consulter ce document, uniquement pour contrôler votre inscription.'}
                </span>
              </p>

              {submitError && <p className="text-red-600 text-sm font-medium text-center">{submitError}</p>}
            </div>

            <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors"
              >
                <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                <span>{t.registration.form.backBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitRegistration}
                disabled={isSubmitting || proofBusy || !proof}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-3.5 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-300" />}
                <span>
                  {proof
                    ? isAr ? 'إنهاء الانخراط' : 'Finaliser mon adhésion'
                    : isAr ? 'أرفق لقطة الشاشة للمتابعة' : 'Joignez la capture pour continuer'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: SUCCESS & CARD ================= */}
        {currentStep === 5 && createdMember && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
            <div className="space-y-2 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'ar' ? 'تم تسجيل طلب انخراطكم' : 'Adhésion enregistrée'}</span>
              </div>
              <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-slate-900">
                {t.registration.successStep.title}
              </h2>
              <p className="text-slate-600 text-sm">
                {t.registration.successStep.subtitle}
              </p>
            </div>

            {/* Official Digital Membership Card Display */}
            <div className="py-2">
              <MembershipCard member={createdMember} lang={lang} />
            </div>

            {/* Fiche récapitulative d'adhésion */}
            <div className="max-w-xl mx-auto rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <p className="text-sm text-slate-700">
                {isAr
                  ? 'اطبع بطاقة تلخيص انخراطك أو احفظها بصيغة PDF للاحتفاظ بها.'
                  : 'Imprimez votre fiche récapitulative d’adhésion ou enregistrez-la en PDF pour la conserver.'}
              </p>
              <button
                type="button"
                onClick={() => printRegistrationSheet(createdMember)}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold py-3 px-6 rounded-xl shadow-sm text-sm transition-colors"
              >
                <Printer className="w-4 h-4 text-emerald-700" />
                <span>{isAr ? 'طباعة / حفظ بطاقة التلخيص' : 'Imprimer / Enregistrer la fiche (PDF)'}</span>
              </button>
            </div>

            {/* Next Steps: Access Portal or Forum */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={onGoToPortal}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98 text-sm"
              >
                <FileCheck2 className="w-4 h-4 text-emerald-300" />
                <span>{t.registration.successStep.accessPortalBtn}</span>
              </button>

              <button
                type="button"
                onClick={onGoToForum}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-all text-sm"
              >
                <Vote className="w-4 h-4 text-amber-400" />
                <span>{t.registration.successStep.goToForumBtn}</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
