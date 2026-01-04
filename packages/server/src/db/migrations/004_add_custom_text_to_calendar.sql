-- Migration: Add custom text support to calendar entries
-- Allows calendar entries to have custom text instead of requiring a recipe

-- Make recipe_id nullable
ALTER TABLE calendar_entries
  ALTER COLUMN recipe_id DROP NOT NULL;

-- Add custom_text column
ALTER TABLE calendar_entries
  ADD COLUMN custom_text TEXT;

-- Add constraint to ensure either recipe_id or custom_text is provided
ALTER TABLE calendar_entries
  ADD CONSTRAINT calendar_entry_content_check
  CHECK (
    (recipe_id IS NOT NULL AND custom_text IS NULL) OR
    (recipe_id IS NULL AND custom_text IS NOT NULL)
  );
