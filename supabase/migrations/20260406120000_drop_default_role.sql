-- Ensure new users do not get an implicit role.
ALTER TABLE IF EXISTS next_auth.users
  ALTER COLUMN role DROP DEFAULT;
