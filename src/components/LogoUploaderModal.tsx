import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, RefreshCw, Image as ImageIcon, Sparkles, ShieldCheck } from 'lucide-react';
import { saveOfficialLogo, resetOfficialLogo, getStoredLogo } from '../utils/logoStorage';
import { PartyLogo } from './PartyLogo';
import { Language } from '../types';

interface LogoUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const LogoUploaderModal: React.FC<LogoUploaderModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(getStoredLogo());
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAr = lang === 'ar';

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (previewUrl) {
      await saveOfficialLogo(previewUrl, selectedFile?.name || 'Logo PME.png');
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    }
  };

  const handleReset = () => {
    resetOfficialLogo();
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 text-white shadow-2xl space-y-6"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isAr ? 'إدارة الشعار الرسمي للحزب' : 'Logo Officiel du Parti (Logo PME.png)'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'قم باختيار أو إفلات ملف Logo PME.png ليظهر فوراً على كامل المنصة'
                  : 'Sélectionnez votre fichier Logo PME.png pour l\'appliquer instantanément sur tout le site'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-xl p-8 text-center cursor-pointer transition-colors bg-emerald-950/20 hover:bg-emerald-950/30 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/svg+xml, image/webp"
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-200">
                {isAr ? 'انقر لاختيار ملف Logo PME.png من جهازك' : 'Cliquez ici pour sélectionner Logo PME.png'}
              </p>
              <p className="text-xs text-slate-400">
                {isAr ? 'أو اسحب وأفلت الملف داخل هذا المربع (PNG, JPG, SVG)' : 'Ou glissez-déposez le fichier ici (PNG, JPG, SVG)'}
              </p>
            </div>
            {selectedFile && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedFile.name}
              </span>
            )}
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isAr ? 'معاينة حية على المنصة :' : 'Aperçu en direct :'}</span>
            <span className="text-emerald-400 font-mono">
              {previewUrl ? 'Logo personnalisé actif' : 'Logo vectoriel standard'}
            </span>
          </div>

          <div className="flex items-center justify-around py-3 bg-slate-900/80 rounded-lg p-2">
            <div className="text-center space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">En-tête</span>
              <PartyLogo size="md" lang={lang} inverted />
            </div>
            <div className="text-center space-y-1 hidden sm:block">
              <span className="text-[10px] text-slate-500 uppercase block">Bannière</span>
              <PartyLogo size="lg" lang={lang} inverted stacked showText={false} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            onClick={handleReset}
            type="button"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {isAr ? 'استعادة الشعار الأصلي' : 'Réinitialiser au logo par défaut'}
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              type="button"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors"
            >
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              onClick={handleSave}
              disabled={!previewUrl}
              type="button"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  {isAr ? 'تم الحفظ بنجاح!' : 'Enregistré avec succès !'}
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  {isAr ? 'تأكيد وحفظ الشعار' : 'Appliquer comme Logo Officiel'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
