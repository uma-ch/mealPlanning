import { Router } from 'express';
import pool from '../db/connection.js';
import { authenticateApiKey } from '../middleware/apiKeyAuth.js';
import {
  extractSchemaOrgRecipe,
  extractWithClaude,
  RecipeImportError,
} from '../services/recipeImport.js';
import type { ExtensionRecipeRequest } from '@recipe-planner/shared';

const router = Router();

/**
 * POST /api/extension/recipes
 * Save recipe from browser extension
 * Requires API key authentication
 */
router.post('/recipes', authenticateApiKey, async (req, res) => {
  try {
    const {
      url,
      title,
      ingredients,
      instructions,
      imageUrl,
      rawHtml,
      source,
    } = req.body as ExtensionRecipeRequest;

    const householdId = req.householdId!;
    const userId = req.userId!;

    // Check for duplicate by URL
    if (url) {
      const existing = await pool.query(
        'SELECT id, title FROM recipes WHERE source_url = $1 AND household_id = $2',
        [url, householdId]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          error: 'Recipe already exists',
          recipeId: existing.rows[0].id,
          recipeTitle: existing.rows[0].title,
        });
      }
    }

    let finalRecipeData = {
      title: title || '',
      ingredients: ingredients || '',
      instructions: instructions || '',
      imageUrl: imageUrl || undefined,
      tags: [] as string[],
    };

    // If extraction failed (fallback source) and we have rawHtml,
    // try server-side extraction with Schema.org and Claude AI
    if (source === 'fallback' && rawHtml) {
      try {
        // Try Schema.org extraction
        const schemaRecipe = extractSchemaOrgRecipe(rawHtml, url || '');

        if (schemaRecipe) {
          finalRecipeData = {
            title: schemaRecipe.title,
            ingredients: schemaRecipe.ingredients,
            instructions: schemaRecipe.instructions,
            imageUrl: schemaRecipe.imageUrl,
            tags: schemaRecipe.tags,
          };
        } else {
          // Fall back to Claude AI
          const claudeRecipe = await extractWithClaude(rawHtml, url || '');
          finalRecipeData = {
            title: claudeRecipe.title,
            ingredients: claudeRecipe.ingredients,
            instructions: claudeRecipe.instructions,
            imageUrl: claudeRecipe.imageUrl,
            tags: claudeRecipe.tags,
          };
        }
      } catch (error) {
        console.error('Server-side extraction failed:', error);
        // Continue with user-provided data (which may be empty or incomplete)
      }
    }

    // Validate required fields
    if (!finalRecipeData.title || !finalRecipeData.ingredients || !finalRecipeData.instructions) {
      return res.status(400).json({
        error: 'Missing required fields',
        partialData: finalRecipeData,
        message: 'Please provide title, ingredients, and instructions',
      });
    }

    // Insert recipe
    const result = await pool.query(
      `INSERT INTO recipes (
        household_id, title, ingredients, instructions,
        source_url, image_url, raw_html_backup, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at`,
      [
        householdId,
        finalRecipeData.title,
        finalRecipeData.ingredients,
        finalRecipeData.instructions,
        url || null,
        finalRecipeData.imageUrl || null,
        rawHtml || null,
        userId,
      ]
    );

    const recipeId = result.rows[0].id;

    // Insert tags if any
    if (finalRecipeData.tags && finalRecipeData.tags.length > 0) {
      const tagValues = finalRecipeData.tags
        .map((_, idx) => `($1, $${idx + 2})`)
        .join(', ');
      const tagParams = [recipeId, ...finalRecipeData.tags];

      await pool.query(
        `INSERT INTO recipe_tags (recipe_id, tag) VALUES ${tagValues}`,
        tagParams
      );
    }

    res.status(201).json({
      message: 'Recipe saved successfully',
      recipeId,
      recipe: {
        id: recipeId,
        title: finalRecipeData.title,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    console.error('Error saving recipe from extension:', error);

    if (error instanceof RecipeImportError) {
      return res.status(422).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to save recipe' });
  }
});

export default router;
