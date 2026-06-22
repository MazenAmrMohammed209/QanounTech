-- Ensure next_auth.users has phone column just in case
ALTER TABLE next_auth.users ADD COLUMN IF NOT EXISTS phone text;

-- Add phone column to lawyers
ALTER TABLE public.lawyers ADD COLUMN IF NOT EXISTS phone text;

-- Add phone column to offices
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS phone text;
