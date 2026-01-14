// @ts-nocheck
import { Router } from 'express';
import pool from '../db/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import type { HouseholdDetails, JoinHouseholdRequest } from '@recipe-planner/shared';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/household - Get current user's household details with members
router.get('/', async (req, res) => {
  try {
    const householdId = req.user?.householdId;

    if (!householdId) {
      return res.status(404).json({ error: 'No household found' });
    }

    // Get household details
    const householdResult = await pool.query(
      'SELECT id, name, invite_code, created_at FROM households WHERE id = $1',
      [householdId]
    );

    if (householdResult.rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    // Get all members of the household
    const membersResult = await pool.query(
      'SELECT id, email, created_at FROM users WHERE household_id = $1 ORDER BY created_at ASC',
      [householdId]
    );

    const household = householdResult.rows[0];
    const householdDetails: HouseholdDetails = {
      id: household.id,
      name: household.name,
      inviteCode: household.invite_code,
      createdAt: new Date(household.created_at),
      members: membersResult.rows.map(member => ({
        id: member.id,
        email: member.email,
        createdAt: new Date(member.created_at),
      })),
    };

    res.json(householdDetails);
  } catch (error) {
    console.error('Error fetching household:', error);
    res.status(500).json({ error: 'Failed to fetch household details' });
  }
});

// POST /api/household/join - Join household with invite code
router.post('/join', async (req, res) => {
  try {
    const { inviteCode }: JoinHouseholdRequest = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const upperInviteCode = inviteCode.toUpperCase().trim();
    console.log('Looking for household with invite code:', upperInviteCode);

    // Find household by invite code
    const householdResult = await pool.query(
      'SELECT id, name, invite_code FROM households WHERE invite_code = $1',
      [upperInviteCode]
    );

    console.log('Found households:', householdResult.rows.length);

    if (householdResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const newHouseholdId = householdResult.rows[0].id;

    // Get user's current household
    const userResult = await pool.query(
      'SELECT household_id FROM users WHERE id = $1',
      [userId]
    );

    const currentHouseholdId = userResult.rows[0].household_id;

    // Check if user is already in this household
    if (currentHouseholdId === newHouseholdId) {
      return res.status(400).json({ error: 'You are already a member of this household' });
    }

    // Check if user is the only member of their current household
    const currentMembersResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE household_id = $1',
      [currentHouseholdId]
    );

    const isOnlyMember = parseInt(currentMembersResult.rows[0].count) === 1;

    // Update user's household
    await pool.query(
      'UPDATE users SET household_id = $1 WHERE id = $2',
      [newHouseholdId, userId]
    );

    // Delete old household if user was the only member
    if (isOnlyMember) {
      await pool.query(
        'DELETE FROM households WHERE id = $1',
        [currentHouseholdId]
      );
    }

    res.json({
      message: 'Successfully joined household',
      household: {
        id: householdResult.rows[0].id,
        name: householdResult.rows[0].name,
        inviteCode: householdResult.rows[0].invite_code,
      },
    });
  } catch (error) {
    console.error('Error joining household:', error);
    res.status(500).json({ error: 'Failed to join household' });
  }
});

// PATCH /api/household - Update household name
router.patch('/', async (req, res) => {
  try {
    const householdId = req.user?.householdId;
    const { name } = req.body;

    if (!householdId) {
      return res.status(404).json({ error: 'No household found' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Valid name is required' });
    }

    await pool.query(
      'UPDATE households SET name = $1 WHERE id = $2',
      [name.trim(), householdId]
    );

    res.json({ message: 'Household name updated successfully' });
  } catch (error) {
    console.error('Error updating household:', error);
    res.status(500).json({ error: 'Failed to update household name' });
  }
});

export default router;
