import { GroceryCategory } from '@recipe-planner/shared';

// Keyword mappings for ingredient categorization
const categoryKeywords: Record<GroceryCategory, string[]> = {
  [GroceryCategory.PRODUCE]: [
    'tomato', 'lettuce', 'onion', 'garlic', 'carrot', 'potato', 'celery',
    'pepper', 'cucumber', 'spinach', 'broccoli', 'cauliflower', 'zucchini',
    'apple', 'banana', 'orange', 'lemon', 'lime', 'avocado', 'mushroom',
    'corn', 'bean', 'pea', 'herb', 'parsley', 'cilantro', 'basil', 'thyme',
    'rosemary', 'oregano', 'mint', 'dill', 'sage', 'vegetable', 'fruit',
    'berry', 'strawberry', 'blueberry', 'raspberry', 'grape', 'melon',
    'kale', 'chard', 'arugula', 'cabbage', 'squash', 'eggplant',
  ],
  [GroceryCategory.MEAT_SEAFOOD]: [
    'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'bacon', 'sausage',
    'ham', 'steak', 'ground beef', 'ground turkey', 'fish', 'salmon',
    'tuna', 'shrimp', 'crab', 'lobster', 'scallop', 'mussel', 'oyster',
    'tilapia', 'cod', 'halibut', 'sardine', 'anchovy', 'meat', 'seafood',
    'fillet', 'breast', 'thigh', 'wing', 'rib',
  ],
  [GroceryCategory.DAIRY]: [
    'milk', 'cheese', 'cheddar', 'mozzarella', 'parmesan', 'yogurt',
    'butter', 'cream', 'sour cream', 'whipped cream', 'half and half',
    'cottage cheese', 'ricotta', 'feta', 'brie', 'goat cheese', 'egg',
    'heavy cream', 'light cream', 'buttermilk',
  ],
  [GroceryCategory.BAKERY]: [
    'bread', 'baguette', 'roll', 'bun', 'bagel', 'croissant', 'muffin',
    'donut', 'danish', 'scone', 'tortilla', 'pita', 'naan', 'ciabatta',
    'sourdough', 'rye', 'wheat bread', 'white bread',
  ],
  [GroceryCategory.PANTRY]: [
    'flour', 'sugar', 'salt', 'pepper', 'rice', 'pasta', 'spaghetti',
    'penne', 'macaroni', 'oil', 'olive oil', 'vegetable oil', 'coconut oil',
    'vinegar', 'soy sauce', 'sauce', 'broth', 'stock', 'bouillon',
    'canned', 'can', 'jar', 'tomato paste', 'tomato sauce', 'honey',
    'syrup', 'maple syrup', 'jam', 'jelly', 'peanut butter', 'almond butter',
    'oat', 'cereal', 'granola', 'nut', 'almond', 'walnut', 'pecan',
    'cashew', 'dried', 'raisin', 'date', 'fig', 'spice', 'cumin', 'paprika',
    'cinnamon', 'nutmeg', 'ginger', 'turmeric', 'curry', 'chili powder',
    'baking powder', 'baking soda', 'yeast', 'cornstarch', 'vanilla',
    'extract', 'chocolate chip', 'cocoa', 'bean', 'lentil', 'chickpea',
    'kidney bean', 'black bean', 'quinoa', 'couscous', 'barley',
  ],
  [GroceryCategory.FROZEN]: [
    'frozen', 'ice cream', 'sorbet', 'frozen yogurt', 'popsicle',
    'frozen vegetable', 'frozen fruit', 'frozen pizza', 'frozen dinner',
    'frozen meal', 'frozen french fries', 'frozen chicken',
  ],
  [GroceryCategory.OTHER]: [],
};

/**
 * Categorizes an ingredient based on keyword matching
 * @param ingredient The ingredient text to categorize
 * @returns The appropriate GroceryCategory
 */
export function categorizeIngredient(ingredient: string): GroceryCategory {
  const lowerIngredient = ingredient.toLowerCase();

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerIngredient.includes(keyword))) {
      return category as GroceryCategory;
    }
  }

  // Default to OTHER if no match found
  return GroceryCategory.OTHER;
}
