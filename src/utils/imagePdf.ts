/**
 * Enveloppe une image JPEG dans un PDF d'une page, directement dans le navigateur (aucune dépendance).
 * Sert à convertir une capture d'écran (ex. la page « Vérifiez votre inscription sur les listes électorales »)
 * en PDF, puisque les pièces du dossier sont stockées uniquement au format PDF.
 */

const encoder = new TextEncoder();

export function base64ToBytes(base64: string): Uint8Array {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/** Construit un PDF valide (table xref comprise) contenant une seule image JPEG pleine page. */
export function jpegToPdf(jpeg: Uint8Array, widthPx: number, heightPx: number): Uint8Array {
  // 1 px d'écran = 0,75 pt : la page a la taille naturelle de l'image.
  const pw = Math.max(1, Math.round(widthPx * 0.75));
  const ph = Math.max(1, Math.round(heightPx * 0.75));

  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (data: string | Uint8Array) => {
    const bytes = typeof data === 'string' ? encoder.encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  };
  const beginObject = (n: number) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
  };

  const content = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;

  push('%PDF-1.4\n');
  beginObject(1);
  push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  beginObject(2);
  push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  beginObject(3);
  push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
  beginObject(4);
  push(
    `<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`
  );
  push(jpeg);
  push('\nendstream\nendobj\n');
  beginObject(5);
  push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);

  const xrefOffset = length;
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  for (let n = 1; n <= 5; n++) xref += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  push(xref);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}
