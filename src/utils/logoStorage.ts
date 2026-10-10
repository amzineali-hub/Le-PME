// Utility to manage official Party Logo storage and real-time synchronization

const STORAGE_KEY = 'pme_official_party_logo';
const LOGO_EVENT = 'pme-logo-updated';

export const CANDIDATE_LOGO_PATHS = [
  '/Logo PME.png',
  '/Logo%20PME.png',
  '/logo.png',
  '/logo-pme.png',
  '/Public/Logo PME.png',
  '/Public/logo.png',
];

export function getStoredLogo(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export async function saveOfficialLogo(dataUrl: string, fileName: string = 'Logo PME.png'): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, dataUrl);
    window.dispatchEvent(new CustomEvent(LOGO_EVENT, { detail: dataUrl }));
  }

  // Also try to persist to server public folder via API
  try {
    await fetch('/api/upload-logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, fileName }),
    });
  } catch (err) {
    console.warn('Could not persist logo to server disk:', err);
  }
}

export function resetOfficialLogo(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(LOGO_EVENT, { detail: null }));
  }
}

export function subscribeToLogoChanges(callback: (logoUrl: string | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<string | null>;
    callback(customEvent.detail);
  };

  window.addEventListener(LOGO_EVENT, handler);
  return () => window.removeEventListener(LOGO_EVENT, handler);
}
