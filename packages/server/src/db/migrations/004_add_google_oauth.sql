-- Add Google OAuth support to users table
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
CREATE INDEX idx_users_google_id ON users(google_id);

-- Update users table to make email nullable (OAuth users might not share email initially)
-- But we'll still require email for our app
