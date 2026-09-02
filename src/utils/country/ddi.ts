import { cleanString } from '../string-util';
import { Country } from './country';

/**
 * Retrieves the official country dialing code (DDI) given a country's name.
 * Returns the DDI string (without the '+' prefix), or undefined if not found.
 */
export function getDdiByCountryName(countryName: string): string | undefined {
  if (!countryName) return undefined;

  const normalizedInput = cleanString(countryName);

  // 1. Try a clean, exact matching pass
  const exactMatch = Country.find(
    (country) => cleanString(country.name) === normalizedInput
  );

  if (exactMatch) {
    return exactMatch.ddi;
  }

  // 2. Fallback to a partial/fuzzy match if exact match fails
  // (e.g., inputting "Taiwan" will catch "Formosa (Taiwan)")
  const fuzzyMatch = Country.find((country) => {
    const normalizedCountryName = cleanString(country.name);
    return (
      normalizedCountryName.includes(normalizedInput) || 
      normalizedInput.includes(normalizedCountryName)
    );
  });

  return fuzzyMatch ? fuzzyMatch.ddi : undefined;
}