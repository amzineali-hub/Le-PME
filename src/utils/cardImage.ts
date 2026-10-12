import { toPng } from 'html-to-image';

/**
 * Export de la carte de membre en IMAGE haute définition (PNG), jamais en PDF.
 * La face est rendue à 4 fois sa taille d'affichage (480 px -> 1920 px de large, soit plus de 500 dpi au format carte).
 */
const PIXEL_RATIO = 4;

export async function faceToPng(node: HTMLElement): Promise<string> {
  // Les polices (arabe notamment) doivent être chargées avant la capture, sinon le texte change de forme.
  try {
    await document.fonts?.ready;
  } catch {
    /* ignoré : la capture reste possible avec les polices disponibles */
  }
  return toPng(node, { pixelRatio: PIXEL_RATIO, cacheBust: true });
}

const safeName = (s: string) => s.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'membre';

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function cardFileName(membershipNumber: string, side: 'recto' | 'verso'): string {
  return `Carte-PME-${safeName(membershipNumber)}-${side}.png`;
}

/**
 * Imprime les images de la carte (recto puis verso) à leur taille réelle (85,6 × 54 mm) sur une feuille A4,
 * via une fenêtre dédiée et autonome, comme les autres documents imprimables du site.
 * Renvoie false si le navigateur a bloqué l'ouverture de la fenêtre.
 */
export function printCardImages(images: string[], title: string): boolean {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return false;
  const imgs = images.map((src) => `<img src="${src}" alt="">`).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title.replace(/[<>&]/g, '')}</title>
<style>
  @page { size: A4; margin: 12mm; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { display: flex; flex-direction: column; align-items: center; gap: 10mm; }
  img { width: 85.6mm; height: auto; display: block; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style></head><body>${imgs}
<script>
  var imgs = Array.prototype.slice.call(document.images), left = imgs.length;
  function done() { if (--left <= 0) { setTimeout(function () { window.focus(); window.print(); }, 150); } }
  imgs.forEach(function (i) { if (i.complete) done(); else { i.onload = done; i.onerror = done; } });
<\/script></body></html>`);
  w.document.close();
  return true;
}
