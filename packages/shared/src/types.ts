// User & Authentication
export interface User {
  id: string;
  email: string;
  householdId: string;
  createdAt: Date;
}

export interface MagicLinkRequest {
  email: string;
}

export interface MagicLinkVerify {
  token: string;
}

// Household
export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: Date;
}

export interface CreateHouseholdRequest {
  name: string;
}

export interface JoinHouseholdRequest {
  inviteCode: string;
}

// Recipe
export interface Recipe {
  id: string;
  title: string;
  ingredients: string; // Text-based initially
  instructions: string;
  sourceUrl?: string;
  imageUrl?: string;
  createdBy: string; // User ID
  createdAt: Date;
  modifiedAt: Date;
  wasModified: boolean;
  rawHtmlBackup?: string;
  householdId: string;
  tags: string[];
}

export interface CreateRecipeRequest {
  title: string;
  ingredients: string;
  instructions: string;
  sourceUrl?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface UpdateRecipeRequest {
  title?: string;
  ingredients?: string;
  instructions?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface ImportRecipeRequest {
  url: string;
}

export interface ImportRecipeResponse {
  recipe: Recipe;
  source: 'schema.org' | 'claude-ai';
}

// Recipe from Extension
export interface ExtensionRecipeRequest {
  url: string;
  title: string;
  ingredients?: string;
  instructions?: string;
  imageUrl?: string;
  rawHtml?: string;
  source: 'schema.org' | 'fallback';
}

// Calendar
export interface CalendarEntry {
  id: string;
  householdId: string;
  recipeId: string;
  date: string; // ISO date string
  createdAt: Date;
  recipe?: Recipe; // Populated in responses
}

export interface CreateCalendarEntryRequest {
  recipeId: string;
  date: string;
}

// Grocery List
export interface GroceryList {
  id: string;
  householdId: string;
  createdAt: string;
  isActive: boolean;
  items: GroceryListItem[];
}

export interface GroceryListItem {
  id: string;
  groceryListId: string;
  recipeId?: string; // Null if manually added
  ingredientText: string;
  category: GroceryCategory;
  isChecked: boolean;
  checkedAt?: string | null;
}

export enum GroceryCategory {
  PRODUCE = 'Produce',
  MEAT_SEAFOOD = 'Meat & Seafood',
  DAIRY = 'Dairy & Eggs',
  BAKERY = 'Bakery',
  PANTRY = 'Pantry/Dry Goods',
  FROZEN = 'Frozen',
  OTHER = 'Other',
}

export interface GenerateGroceryListRequest {
  recipeIds: string[];
}

export interface AddManualItemRequest {
  ingredientText: string;
  category: GroceryCategory;
}

export interface UpdateGroceryItemRequest {
  isChecked: boolean;
}

// WebSocket Events
export interface SocketEvents {
  // Client -> Server
  'join-household': (householdId: string) => void;
  'calendar:update': (data: { householdId: string; entry: CalendarEntry }) => void;
  'grocery:item-checked': (data: { householdId: string; itemId: string; isChecked: boolean }) => void;
  'recipe:added': (data: { householdId: string; recipe: Recipe }) => void;
  'user:viewing': (data: { householdId: string; resourceType: string; resourceId: string }) => void;

  // Server -> Client
  'calendar:updated': (entry: CalendarEntry) => void;
  'grocery:item-updated': (item: { itemId: string; isChecked: boolean }) => void;
  'recipe:new': (recipe: Recipe) => void;
  'user:presence': (data: { userId: string; resourceType: string; resourceId: string; viewing: boolean }) => void;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
