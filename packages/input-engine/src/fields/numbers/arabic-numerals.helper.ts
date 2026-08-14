/** Normalize Arabic-Indic numerals (٠-٩) to Western Arabic (0-9) */
export function normalizeArabicNumerals(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}
