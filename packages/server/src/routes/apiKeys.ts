import { Router } from 'express';
import pool from '../db/connection.js';
import { generateApiKey, hashApiKey, getKeyPrefix } from '../utils/apiKeys.js';
import type { CreateApiKeyRequest, ApiKey } from '@recipe-planner/shared';

const router = Router();

/**
 * GET /api/api-keys
 * List all API keys for the current user
 */
router.get('/', async (req, res) => {
  try {
    // TODO: Replace with actual user ID from session/auth
    // Using the same pattern as other routes in the codebase
    const userId = '00000000-0000-0000-0000-000000000002';

    const result = await pool.query(
      `SELECT id, user_id, key_prefix, name, last_used_at, created_at, is_active
       FROM api_keys
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const apiKeys: ApiKey[] = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      keyPrefix: row.key_prefix,
      name: row.name,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
      isActive: row.is_active,
    }));

    res.json({ apiKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

/**
 * POST /api/api-keys
 * Create a new API key
 */
router.post('/', async (req, res) => {
  try {
    const { name } = req.body as CreateApiKeyRequest;

    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'API key name is required' });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'API key name must be 100 characters or less' });
    }

    // TODO: Replace with actual user ID from session/auth
    const userId = '00000000-0000-0000-0000-000000000002';

    // Generate API key
    const apiKey = generateApiKey('live');
    const keyHash = hashApiKey(apiKey);
    const keyPrefix = getKeyPrefix(apiKey);

    // Store in database
    const result = await pool.query(
      `INSERT INTO api_keys (user_id, key_hash, key_prefix, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, key_prefix, name, last_used_at, created_at, is_active`,
      [userId, keyHash, keyPrefix, name.trim()]
    );

    const row = result.rows[0];
    const apiKeyRecord: ApiKey = {
      id: row.id,
      userId: row.user_id,
      keyPrefix: row.key_prefix,
      name: row.name,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
      isActive: row.is_active,
    };

    // Return both the API key record AND the full key (only time it's shown!)
    res.status(201).json({
      apiKey: apiKeyRecord,
      key: apiKey,
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

/**
 * DELETE /api/api-keys/:id
 * Revoke (soft delete) an API key
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Replace with actual user ID from session/auth
    const userId = '00000000-0000-0000-0000-000000000002';

    // Soft delete - just mark as inactive
    const result = await pool.query(
      `UPDATE api_keys
       SET is_active = false
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

export default router;
