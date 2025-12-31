import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';

// Custom error class for recipe import errors
export class RecipeImportError extends Error {
  constructor(
    message: string,
    public code: 'FETCH_FAILED' | 'NO_RECIPE_FOUND' | 'CLAUDE_API_ERROR' | 'INVALID_URL'
  ) {
    super(message);
    this.name = 'RecipeImportError';
  }
}

export interface RecipeData {
  title: string;
  ingredients: string;
  instructions: string;
  imageUrl?: string;
  tags: string[];
  rawHtml?: string;
}

export interface ImportResult {
  recipe: RecipeData;
  source: 'schema.org' | 'claude-ai';
}

/**
 * Main orchestrator - fetches URL and extracts recipe data
 */
export async function fetchRecipeFromUrl(url: string): Promise<ImportResult> {
  // Validate URL format
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new RecipeImportError('Invalid URL protocol. Only http and https are supported', 'INVALID_URL');
    }
  } catch (e) {
    throw new RecipeImportError('Invalid URL format', 'INVALID_URL');
  }

  // Fetch HTML from URL
  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipePlanner/1.0; +https://github.com)',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 404) {
        throw new RecipeImportError('URL not found (404)', 'FETCH_FAILED');
      }
      throw new RecipeImportError(`HTTP error: ${response.status}`, 'FETCH_FAILED');
    }

    html = await response.text();
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new RecipeImportError('Request timeout - URL took too long to respond', 'FETCH_FAILED');
    }
    if (e instanceof RecipeImportError) {
      throw e;
    }
    throw new RecipeImportError(`Failed to fetch URL: ${e.message}`, 'FETCH_FAILED');
  }

  // Try schema.org extraction first
  const schemaRecipe = extractSchemaOrgRecipe(html, url);
  if (schemaRecipe) {
    return {
      recipe: { ...schemaRecipe, rawHtml: html },
      source: 'schema.org',
    };
  }

  // Fall back to Claude API
  const claudeRecipe = await extractWithClaude(html, url);
  return {
    recipe: { ...claudeRecipe, rawHtml: html },
    source: 'claude-ai',
  };
}

/**
 * Extract recipe from schema.org JSON-LD markup
 */
export function extractSchemaOrgRecipe(html: string, baseUrl: string): RecipeData | null {
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    try {
      const scriptContent = $(scripts[i]).html();
      if (!scriptContent) continue;

      const data = JSON.parse(scriptContent);
      const recipe = findRecipeInData(data);

      if (recipe) {
        return mapSchemaOrgToRecipe(recipe, baseUrl);
      }
    } catch (e) {
      // Invalid JSON, continue to next script
      continue;
    }
  }

  return null;
}

/**
 * Find Recipe object in various schema.org data structures
 */
function findRecipeInData(data: any): any | null {
  // Handle array
  if (Array.isArray(data)) {
    for (const item of data) {
      const recipe = findRecipeInData(item);
      if (recipe) return recipe;
    }
    return null;
  }

  // Handle object
  if (typeof data === 'object' && data !== null) {
    // Check if this is a Recipe
    const type = data['@type'];
    if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) {
      return data;
    }

    // Check @graph array
    if (data['@graph']) {
      return findRecipeInData(data['@graph']);
    }

    // Check if it's a HowTo with recipe-like structure
    if (type === 'HowTo' && data.recipeIngredient) {
      return data;
    }
  }

  return null;
}

/**
 * Map schema.org Recipe fields to our RecipeData structure
 */
function mapSchemaOrgToRecipe(schema: any, baseUrl: string): RecipeData {
  // Extract title
  const title = schema.name || schema.headline || '';

  // Extract ingredients
  let ingredients = '';
  if (schema.recipeIngredient) {
    if (Array.isArray(schema.recipeIngredient)) {
      ingredients = schema.recipeIngredient.join('\n');
    } else if (typeof schema.recipeIngredient === 'string') {
      ingredients = schema.recipeIngredient;
    }
  }

  // Extract instructions
  let instructions = extractInstructions(schema.recipeInstructions);

  // Extract image URL
  let imageUrl = extractImageUrl(schema.image, baseUrl);

  // Extract tags
  const tags = extractTags(schema);

  if (!title || !ingredients || !instructions) {
    throw new RecipeImportError('Incomplete recipe data in schema.org markup', 'NO_RECIPE_FOUND');
  }

  return {
    title,
    ingredients,
    instructions,
    imageUrl,
    tags,
  };
}

/**
 * Extract instructions from various schema.org formats
 */
function extractInstructions(instructionsData: any): string {
  if (!instructionsData) return '';

  // String
  if (typeof instructionsData === 'string') {
    return instructionsData;
  }

  // Array of strings
  if (Array.isArray(instructionsData)) {
    const steps: string[] = [];

    instructionsData.forEach((item, index) => {
      if (typeof item === 'string') {
        steps.push(item);
      } else if (item['@type'] === 'HowToStep' || item.type === 'HowToStep') {
        // HowToStep object
        const text = item.text || item.itemListElement?.text || '';
        if (text) {
          steps.push(`${index + 1}. ${text}`);
        }
      } else if (item['@type'] === 'HowToSection' || item.type === 'HowToSection') {
        // HowToSection with nested steps
        if (item.name) {
          steps.push(`\n${item.name}:`);
        }
        if (item.itemListElement) {
          const sectionSteps = extractInstructions(item.itemListElement);
          if (sectionSteps) {
            steps.push(sectionSteps);
          }
        }
      }
    });

    return steps.join('\n\n');
  }

  // Single HowToStep
  if (instructionsData['@type'] === 'HowToStep' || instructionsData.type === 'HowToStep') {
    return instructionsData.text || instructionsData.itemListElement?.text || '';
  }

  return '';
}

/**
 * Extract image URL from schema.org image field
 */
function extractImageUrl(imageData: any, baseUrl: string): string | undefined {
  if (!imageData) return undefined;

  let url: string | undefined;

  // String URL
  if (typeof imageData === 'string') {
    url = imageData;
  }
  // ImageObject
  else if (imageData.url) {
    url = imageData.url;
  }
  // Array of images (take first)
  else if (Array.isArray(imageData) && imageData.length > 0) {
    if (typeof imageData[0] === 'string') {
      url = imageData[0];
    } else if (imageData[0].url) {
      url = imageData[0].url;
    }
  }

  // Convert relative URLs to absolute
  if (url && !url.startsWith('http')) {
    try {
      url = new URL(url, baseUrl).toString();
    } catch (e) {
      // Invalid URL, return undefined
      return undefined;
    }
  }

  return url;
}

/**
 * Extract tags from schema.org recipe
 */
function extractTags(schema: any): string[] {
  const tags: Set<string> = new Set();

  // Recipe category
  if (schema.recipeCategory) {
    if (Array.isArray(schema.recipeCategory)) {
      schema.recipeCategory.forEach((cat: string) => tags.add(cat));
    } else if (typeof schema.recipeCategory === 'string') {
      tags.add(schema.recipeCategory);
    }
  }

  // Recipe cuisine
  if (schema.recipeCuisine) {
    if (Array.isArray(schema.recipeCuisine)) {
      schema.recipeCuisine.forEach((cuisine: string) => tags.add(cuisine));
    } else if (typeof schema.recipeCuisine === 'string') {
      tags.add(schema.recipeCuisine);
    }
  }

  // Keywords
  if (schema.keywords) {
    if (typeof schema.keywords === 'string') {
      // Split comma-separated keywords
      schema.keywords.split(',').forEach((keyword: string) => {
        const trimmed = keyword.trim();
        if (trimmed) tags.add(trimmed);
      });
    } else if (Array.isArray(schema.keywords)) {
      schema.keywords.forEach((keyword: string) => {
        const trimmed = keyword.trim();
        if (trimmed) tags.add(trimmed);
      });
    }
  }

  return Array.from(tags);
}

/**
 * Extract recipe using Claude AI as fallback
 */
async function extractWithClaude(html: string, _url: string): Promise<RecipeData> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new RecipeImportError(
      'Claude API is not configured. Only schema.org recipe extraction is available.',
      'CLAUDE_API_ERROR'
    );
  }

  const anthropic = new Anthropic({ apiKey });

  // Truncate HTML if too large
  const truncatedHtml = html.length > 100000
    ? html.slice(0, 100000) + '\n\n[HTML content truncated for processing...]'
    : html;

  const prompt = `Extract the recipe information from the following HTML content. Return ONLY valid JSON with this exact structure (no additional text or markdown):

{
  "title": "Recipe name",
  "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
  "instructions": "Step-by-step cooking instructions",
  "imageUrl": "URL to recipe image if found, otherwise null",
  "tags": ["tag1", "tag2"]
}

Requirements:
- ingredients must be an array of strings
- instructions should be a single string with all steps
- tags should include cuisine type, meal type, or recipe categories if mentioned
- imageUrl should be a complete URL or null

HTML content:
${truncatedHtml}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude API');
    }

    // Try to extract JSON from response (might be in markdown code block)
    let jsonText = content.text.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (!parsed.title || !parsed.ingredients || !parsed.instructions) {
      throw new RecipeImportError(
        'Claude API returned incomplete recipe data',
        'NO_RECIPE_FOUND'
      );
    }

    // Format ingredients as string
    const ingredients = Array.isArray(parsed.ingredients)
      ? parsed.ingredients.join('\n')
      : parsed.ingredients;

    return {
      title: parsed.title,
      ingredients,
      instructions: parsed.instructions,
      imageUrl: parsed.imageUrl || undefined,
      tags: parsed.tags || [],
    };
  } catch (error: any) {
    if (error instanceof RecipeImportError) {
      throw error;
    }

    // Handle Anthropic API errors
    if (error.status === 429) {
      throw new RecipeImportError(
        'Too many requests to Claude API. Please try again in a few minutes.',
        'CLAUDE_API_ERROR'
      );
    }

    if (error.status === 401) {
      throw new RecipeImportError(
        'Claude API authentication failed. Please check API key configuration.',
        'CLAUDE_API_ERROR'
      );
    }

    if (error instanceof SyntaxError) {
      throw new RecipeImportError(
        'Failed to extract valid recipe data from the page',
        'NO_RECIPE_FOUND'
      );
    }

    throw new RecipeImportError(
      `Claude API error: ${error.message}`,
      'CLAUDE_API_ERROR'
    );
  }
}
