import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../db/connection.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;

        if (!email) {
          return done(new Error('No email from Google'), undefined);
        }

        // Check if user exists by Google ID
        let user = await pool.query(
          'SELECT id, email, household_id FROM users WHERE google_id = $1',
          [googleId]
        );

        if (user.rows.length === 0) {
          // Check if user exists by email (from magic link login)
          user = await pool.query(
            'SELECT id, email, household_id FROM users WHERE email = $1',
            [email]
          );

          if (user.rows.length > 0) {
            // Link Google ID to existing user
            await pool.query(
              'UPDATE users SET google_id = $1 WHERE id = $2',
              [googleId, user.rows[0].id]
            );
          } else {
            // Create new user with household
            const client = await pool.connect();
            try {
              await client.query('BEGIN');

              // Create household
              const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
              const householdResult = await client.query(
                `INSERT INTO households (name, invite_code)
                 VALUES ($1, $2)
                 RETURNING id`,
                [`${email}'s Household`, inviteCode]
              );
              const householdId = householdResult.rows[0].id;

              // Create user
              const userResult = await client.query(
                `INSERT INTO users (email, google_id, household_id)
                 VALUES ($1, $2, $3)
                 RETURNING id, email, household_id`,
                [email, googleId, householdId]
              );

              await client.query('COMMIT');
              user = userResult;
            } catch (error) {
              await client.query('ROLLBACK');
              throw error;
            } finally {
              client.release();
            }
          }
        }

        return done(null, user.rows[0]);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
