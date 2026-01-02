import { readFile } from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import { RecipeImportError } from './recipeImport.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

interface ExtractedRecipe {
  title: string;
  ingredients: string;
  instructions: string;
  imageUrl?: string;
  tags: string[];
}

/**
 * Extract all recipes from a PDF file
 */
export async function extractRecipesFromPdf(pdfPath: string): Promise<ExtractedRecipe[]> {
  // 1. Read PDF file
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await readFile(pdfPath);
  } catch (error) {
    throw new RecipeImportError(
      'Failed to read PDF file',
      'PDF_PARSE_ERROR'
    );
  }

  // 2. Extract text from PDF
  let pdfText: string;
  try {
    const pdfData = await pdfParse(pdfBuffer);
    pdfText = pdfData.text;
  } catch (error) {
    throw new RecipeImportError(
      'PDF file is corrupted or cannot be parsed. It may be an image-based (scanned) PDF.',
      'PDF_PARSE_ERROR'
    );
  }

  // 3. Validate extracted text
  if (!pdfText || pdfText.trim().length < 50) {
    throw new RecipeImportError(
      'PDF appears to be empty or contains very little text. If this is a scanned PDF (images only), text extraction is not supported.',
      'NO_RECIPE_FOUND'
    );
  }

  // 4. Use Claude to extract multiple recipes
  const recipes = await extractRecipesWithClaude(pdfText);

  return recipes;
}

/**
 * Use Claude AI to extract multiple recipes from PDF text
 */
async function extractRecipesWithClaude(pdfText: string): Promise<ExtractedRecipe[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new RecipeImportError(
      'Claude API is not configured. PDF import requires AI extraction.',
      'CLAUDE_API_ERROR'
    );
  }

  const anthropic = new Anthropic({ apiKey });

  // Truncate if necessary (Claude has ~200k token context, but let's be conservative)
  const maxChars = 150000; // ~37k tokens for Sonnet 4
  const truncatedText = pdfText.length > maxChars
    ? pdfText.slice(0, maxChars) + '\n\n[PDF content truncated...]'
    : pdfText;

  const prompt = `Extract ALL recipes from the following PDF text. Return ONLY valid JSON (no markdown, no additional text) with this exact structure:

{
  "recipes": [
    {
      "title": "Recipe Name",
      "ingredients": "ingredient 1\\ningredient 2\\ningredient 3",
      "instructions": "Step-by-step cooking instructions as a single text block",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Requirements:
- Extract ALL recipes found in the document (could be 1 to 20+ recipes)
- ingredients must be a single string with each ingredient on a new line (use \\n)
- instructions must be a single string with all steps
- tags should include cuisine type, meal type, or categories if mentioned
- If a recipe is incomplete (missing ingredients or instructions), skip it
- If NO recipes are found, return {"recipes": []}

PDF Text:
${truncatedText}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192, // Larger response for multiple recipes
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude API');
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = content.text.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonText);

    // Validate response structure
    if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
      throw new RecipeImportError(
        'Claude API returned invalid response format',
        'CLAUDE_API_ERROR'
      );
    }

    // Filter and validate recipes
    const validRecipes = parsed.recipes.filter((recipe: any) => {
      return recipe.title &&
             recipe.ingredients &&
             recipe.instructions &&
             recipe.title.trim().length > 0;
    });

    return validRecipes.map((recipe: any) => ({
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      imageUrl: undefined, // PDFs don't have URLs
      tags: recipe.tags || [],
    }));

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
        'Failed to extract valid recipe data from the PDF',
        'NO_RECIPE_FOUND'
      );
    }

    throw new RecipeImportError(
      `Claude API error: ${error.message}`,
      'CLAUDE_API_ERROR'
    );
  }
}
