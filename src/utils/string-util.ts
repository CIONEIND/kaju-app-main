export function capitalizeWords(str: string) {
  if (!str) return '';

  return str
    .split(' ')
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
}

export function capitalizeFirstLetter(str: string) {
  if (!str) return ''; // Handle empty strings safely
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

 /**
 * Normalizes a string by stripping accents, removing special characters, 
 * converting to lowercase, and trimming whitespace.
 */
export function cleanString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Removes accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")      // Removes spaces, commas, and parentheses
    .trim();
}