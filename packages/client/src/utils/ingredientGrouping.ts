/**
 * Utility functions for grouping similar ingredients in grocery lists
 */

// Common units and measurements to remove
const UNITS = [
  // Volume
  'cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons', 'tsp',
  'fluid ounce', 'fluid ounces', 'fl oz', 'pint', 'pints', 'quart', 'quarts', 'gallon', 'gallons',
  'liter', 'liters', 'l', 'milliliter', 'milliliters', 'ml',

  // Weight
  'pound', 'pounds', 'lb', 'lbs', 'ounce', 'ounces', 'oz',
  'gram', 'grams', 'g', 'kilogram', 'kilograms', 'kg',

  // Count
  'piece', 'pieces', 'whole', 'clove', 'cloves', 'head', 'heads',
  'bunch', 'bunches', 'stalk', 'stalks', 'sprig', 'sprigs',
  'can', 'cans', 'jar', 'jars', 'package', 'packages', 'box', 'boxes',
  'slice', 'slices', 'sheet', 'sheets',

  // Common descriptors
  'large', 'medium', 'small', 'fresh', 'dried', 'frozen', 'canned',
  'chopped', 'diced', 'sliced', 'minced', 'crushed', 'ground',
  'finely', 'coarsely', 'roughly',
  'optional', 'to taste', 'as needed',
];

// Common prepositions and articles to remove
const STOP_WORDS = ['of', 'the', 'a', 'an', 'for', 'or', 'and'];

/**
 * Normalize an ingredient text to extract the core ingredient name
 * Removes quantities, units, and common descriptors
 */
export function normalizeIngredientName(ingredientText: string): string {
  let normalized = ingredientText.toLowerCase().trim();

  // Remove content in parentheses (e.g., "garlic (minced)" -> "garlic")
  normalized = normalized.replace(/\([^)]*\)/g, '').trim();

  // Remove fractions and numbers (including decimals)
  // e.g., "1/2", "2.5", "1-2"
  normalized = normalized.replace(/\d+([\/\-\.]\d+)?/g, '').trim();

  // Remove units (must be whole words)
  const unitsPattern = new RegExp(`\\b(${UNITS.join('|')})\\b`, 'gi');
  normalized = normalized.replace(unitsPattern, '').trim();

  // Remove stop words
  const stopWordsPattern = new RegExp(`\\b(${STOP_WORDS.join('|')})\\b`, 'gi');
  normalized = normalized.replace(stopWordsPattern, '').trim();

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Remove leading/trailing commas and hyphens
  normalized = normalized.replace(/^[,\-\s]+|[,\-\s]+$/g, '').trim();

  return normalized;
}

/**
 * Get a sort key for an ingredient that groups similar items together
 * Returns the normalized ingredient name for sorting
 */
export function getIngredientSortKey(ingredientText: string): string {
  const normalized = normalizeIngredientName(ingredientText);

  // If normalization resulted in empty string, use original text
  return normalized || ingredientText.toLowerCase();
}
