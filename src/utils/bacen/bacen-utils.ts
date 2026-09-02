import { Country } from '@/utils/country/country'
import { cleanString } from '../string-util';


/**
 * Retrieves the numeric BACEN code given a country's name.
 * Returns the code as a number, or undefined if no match is found.
 */
export function getCountryCodeByName(nameInput: string): number | undefined {
  if (!nameInput) return undefined;

  const normalizedInput = cleanString(nameInput);

  // 1. Try an exact normalized match first
  const exactMatch = Country.find(
    (country) => cleanString(country.name) === normalizedInput
  );

  if (exactMatch) {
    return exactMatch.id;
  }

  // 2. Fallback to a partial/fuzzy match if the exact match fails
  // (e.g., input "Taiwan" will match "Formosa (Taiwan)")
  const fuzzyMatch = Country.find((country) => {
    const normalizedCountryName = cleanString(country.name);
    return (
      normalizedCountryName.includes(normalizedInput) || 
      normalizedInput.includes(normalizedCountryName)
    );
  });

  return fuzzyMatch ? fuzzyMatch.id : undefined;
}