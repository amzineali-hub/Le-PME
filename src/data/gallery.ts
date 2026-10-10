// Affiches du parti affichées dans les galeries de l'accueil (fichiers dans /public/gallery).
export interface GalleryImage {
  src: string;
  w: number;
  h: number;
}

const sizes: Array<[number, number]> = [
  [1027, 1100], [1080, 1080], [1100, 647], [843, 1084], [843, 1084], [856, 1100],
  [1100, 1100], [856, 1100], [1100, 778], [1100, 619], [778, 1100], [500, 500],
  [778, 1100], [711, 939], [778, 1100], [778, 1100], [856, 1100], [778, 1100],
  [778, 1100], [778, 1100], [778, 1100], [856, 1100], [778, 1100], [778, 1100],
];

export const GALLERY: GalleryImage[] = sizes.map(([w, h], i) => ({
  src: `/gallery/p${String(i + 1).padStart(2, '0')}.jpg`,
  w,
  h,
}));

// Trois bandes de huit affiches, insérées entre les sections de l'accueil.
export const GALLERY_BANDS = [GALLERY.slice(0, 8), GALLERY.slice(8, 16), GALLERY.slice(16, 24)];
