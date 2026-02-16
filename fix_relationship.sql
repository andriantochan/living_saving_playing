-- Fix relationship between expenses and profiles for proper joining
-- We need expenses.user_id to reference profiles.id (public schema) instead of auth.users.id (auth schema)
-- PostgREST embeds resources based on foreign keys in the public schema.

DO $$
BEGIN
  -- 1. Drop existing FK if it references auth.users
  -- valid for standard naming convention, might need adjustment if generic name used
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'expenses' 
    AND constraint_name = 'expenses_user_id_fkey'
  ) THEN
    ALTER TABLE expenses DROP CONSTRAINT expenses_user_id_fkey;
  END IF;

  -- 2. Add new FK referencing profiles
  ALTER TABLE expenses
  ADD CONSTRAINT expenses_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL; -- or CASCADE, depending on preference. Keeping safer for now.

END $$;
