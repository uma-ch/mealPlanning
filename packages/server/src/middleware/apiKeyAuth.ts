import { Request, Response, NextFunction } from 'express';
import pool from '../db/connection.js';
import { hashApiKey, isValidApiKeyFormat } from '../utils/apiKeys.js';

/**
 * Middleware to authenticate requests using API key
 * Expects: Authorization: Bearer rp_live_xxxxx
 *
 * On success, attaches userId and householdId to req object
 */
export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid Authorization header. Expected: Bearer <api_key>',
      });
    }

    // Extract API key (remove "Bearer " prefix)
    const apiKey = authHeader.substring(7);

    // Validate format
    if (!isValidApiKeyFormat(apiKey)) {
      return res.status(401).json({
        error: 'Invalid API key format. Expected format: rp_live_XXXXX or rp_dev_XXXXX',
      });
    }

    // Hash and lookup in database
    const keyHash = hashApiKey(apiKey);

    const result = await pool.query(
      `SELECT ak.id, ak.user_id, ak.name, u.household_id
       FROM api_keys ak
       JOIN users u ON ak.user_id = u.id
       WHERE ak.key_hash = $1 AND ak.is_active = true`,
      [keyHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid or inactive API key',
      });
    }

    const apiKeyRecord = result.rows[0];

    // Update last_used_at timestamp (fire and forget)
    pool.query(
      'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [apiKeyRecord.id]
    ).catch((err) => {
      console.error('Failed to update API key last_used_at:', err);
    });

    // Attach user info to request
    req.userId = apiKeyRecord.user_id;
    req.householdId = apiKeyRecord.household_id;

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Extend Express Request type to include userId and householdId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      householdId?: string;
    }
  }
}
