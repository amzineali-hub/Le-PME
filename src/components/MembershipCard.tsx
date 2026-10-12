import React, { useRef, useState } from 'react';
import { Member, Language } from '../types';
import { CardBack, CardFront, CARD_HEIGHT, CARD_WIDTH } from './MembershipCardFaces';
import { cardFileName, downloadDataUrl, faceToPng, printCardImages } from '../utils/cardImage';
import { Download, Printer, RotateCw, Loader2 } from 'lucide-react';

interface MembershipCardProps {
  member: Member;
  lang: Language;
  showActions?: boolean;
}

/**
 * Carte de membre : affichage retournable (recto/verso) + export en IMAGE haute définition (PNG), plus de PDF.
 * Les faces exportées sont rendues à plat, hors écran, pour une image nette et sans effet 3D.
 */
export const MembershipCard: React.FC<MembershipCardProps> = ({ member, lang, showActions = true }) => {
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState<'' | 'download' | 'print'>('');
  const [error, setError] = useState('');
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const isAr = lang === 'ar';

  const capture = async (): Promise<[string, string]> => {
    if (!frontRef.current || !backRef.current) throw new Error('card not mounted');
    const front = await faceToPng(frontRef.current);
    const back = await faceToPng(backRef.current);
    return [front, back];
  };

  const handleDownload = async () => {
    setBusy('download');
    setError('');
    try {
      const [front, back] = await capture();
      downloadDataUrl(front, cardFileName(member.membershipNumber, 'recto'));
      // Petit délai : certains navigateurs ignorent deux téléchargements déclenchés au même instant.
      await new Promise((r) => setTimeout(r, 350));
      downloadDataUrl(back, cardFileName(member.membershipNumber, 'verso'));
    } catch {
      setError(isAr ? 'تعذر إنشاء صورة البطاقة، حاول مرة أخرى.' : 'Impossible de générer l’image de la carte, réessayez.');
    } finally {
      setBusy('');
    }
  };

  const handlePrint = async () => {
    setBusy('print');
    setError('');
    try {
      const [front, back] = await capture();
      const opened = printCardImages([front, back], `Carte PME ${member.membershipNumber}`);
      if (!opened) {
        setError(isAr ? 'المتصفح منع نافذة الطباعة، اسمح بالنوافذ المنبثقة.' : 'Le navigateur a bloqué la fenêtre d’impression : autorisez les fenêtres pop-up.');
      }
    } catch {
      setError(isAr ? 'تعذر إنشاء صورة البطاقة، حاول مرة أخرى.' : 'Impossible de générer l’image de la carte, réessayez.');
    } finally {
      setBusy('');
    }
  };

  const btn = 'flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60';

  return (
    <div className="flex flex-col items-center">
      {/* Carte retournable (3D) */}
      <div
        className="w-full max-w-[480px] h-[290px] [perspective:1000px] cursor-pointer group"
        onClick={() => setFlipped(!flipped)}
        title={isAr ? 'انقر لقلب البطاقة' : 'Cliquez pour retourner la carte'}
      >
        <div
          className={`relative w-full h-full rounded-2xl shadow-2xl transition-transform duration-700 [transform-style:preserve-3d] ${
            flipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          <CardFront member={member} lang={lang} className="absolute inset-0 w-full h-full [backface-visibility:hidden]" />
          <CardBack member={member} lang={lang} className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]" />
        </div>
      </div>

      {/* Faces à plat, hors écran, chacune dans son propre cadre (aucun décalage) : source de l'image haute définition */}
      <div aria-hidden="true" style={{ position: 'fixed', left: -10000, top: 0, width: CARD_WIDTH, height: CARD_HEIGHT, pointerEvents: 'none' }}>
        <div ref={frontRef} style={{ width: CARD_WIDTH, height: CARD_HEIGHT, position: 'relative' }}>
          <CardFront member={member} lang={lang} showFlipHint={false} className="absolute inset-0 w-full h-full !shadow-none" />
        </div>
      </div>
      <div aria-hidden="true" style={{ position: 'fixed', left: -10000, top: CARD_HEIGHT + 40, width: CARD_WIDTH, height: CARD_HEIGHT, pointerEvents: 'none' }}>
        <div ref={backRef} style={{ width: CARD_WIDTH, height: CARD_HEIGHT, position: 'relative' }}>
          <CardBack member={member} lang={lang} className="absolute inset-0 w-full h-full !shadow-none" />
        </div>
      </div>

      {showActions && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => setFlipped(!flipped)} className={`${btn} bg-slate-200 hover:bg-slate-300 text-slate-800`}>
            <RotateCw className="w-3.5 h-3.5 text-slate-700" />
            <span>{flipped ? (isAr ? 'عرض الوجه الأمامي' : 'Voir Recto') : isAr ? 'عرض الوجه الخلفي' : 'Voir Verso'}</span>
          </button>

          <button onClick={handleDownload} disabled={busy !== ''} className={`${btn} bg-teal-700 hover:bg-teal-800 text-white`}>
            {busy === 'download' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isAr ? 'تحميل صورة البطاقة (HD)' : 'Télécharger l’image HD'}</span>
          </button>

          <button onClick={handlePrint} disabled={busy !== ''} className={`${btn} bg-emerald-700 hover:bg-emerald-800 text-white`}>
            {busy === 'print' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
            <span>{isAr ? 'طباعة البطاقة' : 'Imprimer la carte'}</span>
          </button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
};
