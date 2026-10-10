export const validateMoroccanCIN = (cin: string): boolean => {
  if (!cin) return false;
  const clean = cin.trim().toUpperCase();
  // CIN marocaine : 1 ou 2 lettres suivies de 4 à 6 chiffres
  return /^[A-Z]{1,2}[0-9]{4,6}$/.test(clean);
};
