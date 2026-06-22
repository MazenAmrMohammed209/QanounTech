-- Add phone column to next_auth.users if it doesn't exist
ALTER TABLE next_auth.users ADD COLUMN IF NOT EXISTS phone text;
