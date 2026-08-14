/**
 * MOD-97 checksum validation per ISO 13616.
 *
 * Steps:
 * 1. Move the first 4 characters to the end
 * 2. Replace each letter with two digits (A=10, B=11, ..., Z=35)
 * 3. Compute the remainder when divided by 97
 * 4. The result must equal 1
 */
export function validateMod97(iban: string): boolean {
  // Move first 4 chars to end
  const rearranged = iban.substring(4) + iban.substring(0, 4);

  // Replace letters with numbers
  let numericString = '';
  for (const char of rearranged) {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      // A-Z → 10-35
      numericString += String(code - 55);
    } else {
      numericString += char;
    }
  }

  // Compute mod 97 using BigInt to avoid overflow
  const remainder = BigInt(numericString) % 97n;
  return remainder === 1n;
}
