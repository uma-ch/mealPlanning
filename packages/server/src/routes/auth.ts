import { Router } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';
import { z } from 'zod';
import type { MagicLinkRequest, MagicLinkVerify, User } from '@recipe-planner/shared';
import { sendMagicLinkEmail } from '../utils/email.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes

// Validation schemas
const magicLinkRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const magicLinkVerifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// POST /api/auth/magic-link - Send magic link to email
router.post('/magic-link', async (req, res) => {
  try {
    const validation = magicLinkRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { email }: MagicLinkRequest = validation.data;

    // Generate random token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY);

    // Store token in database
    await pool.query(
      `INSERT INTO magic_link_tokens (email, token, expires_at, used)
       VALUES ($1, $2, $3, false)`,
      [email.toLowerCase(), token, expiresAt]
    );

    // Send magic link email
    await sendMagicLinkEmail(email, token);

    res.json({ message: 'Magic link sent to your email' });
  } catch (error) {
    console.error('Error sending magic link:', error);
    res.status(500).json({ error: 'Failed to send magic link' });
  }
});

// POST /api/auth/verify - Verify magic link token
router.post('/verify', async (req, res) => {
  try {
    const validation = magicLinkVerifySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { token }: MagicLinkVerify = validation.data;

    // Check if token exists and is valid
    const tokenResult = await pool.query(
      `SELECT email, expires_at, used
       FROM magic_link_tokens
       WHERE token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const tokenData = tokenResult.rows[0];

    // Check if token is expired
    if (new Date() > new Date(tokenData.expires_at)) {
      return res.status(401).json({ error: 'Token has expired' });
    }

    // Check if token was already used
    if (tokenData.used) {
      return res.status(401).json({ error: 'Token has already been used' });
    }

    const email = tokenData.email;

    // Mark token as used
    await pool.query(
      'UPDATE magic_link_tokens SET used = true WHERE token = $1',
      [token]
    );

    // Check if user exists
    let user = await pool.query(
      'SELECT id, email, household_id, created_at FROM users WHERE email = $1',
      [email]
    );

    let userId: string;
    let householdId: string;

    if (user.rows.length === 0) {
      // New user - create household and user
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Create household with random invite code
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const householdResult = await client.query(
          `INSERT INTO households (name, invite_code)
           VALUES ($1, $2)
           RETURNING id`,
          [`${email}'s Household`, inviteCode]
        );

        householdId = householdResult.rows[0].id;

        // Create user
        const userResult = await client.query(
          `INSERT INTO users (email, household_id)
           VALUES ($1, $2)
           RETURNING id, email, household_id, created_at`,
          [email, householdId]
        );

        userId = userResult.rows[0].id;
        user = userResult;

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      userId = user.rows[0].id;
      householdId = user.rows[0].household_id;
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId, householdId, email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userData: User = {
      id: user.rows[0].id,
      email: user.rows[0].email,
      householdId: user.rows[0].household_id,
      createdAt: user.rows[0].created_at,
    };

    res.json({
      token: jwtToken,
      user: userData,
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (_req, res) => {
  // For JWT-based auth, logout is handled client-side by removing the token
  res.json({ message: 'Logged out successfully' });
});

export default router;
