-- ============================================================
-- Create "consultations" and "consultation_answers" tables
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------
-- 1. consultations
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.consultations (
  id            uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id       uuid NOT NULL,
  title         text NOT NULL,
  description   text NOT NULL,
  category      text NOT NULL,
  tags          text[] DEFAULT '{}',
  views         integer DEFAULT 0,
  likes         integer DEFAULT 0,
  has_accepted_answer boolean DEFAULT false,
  created_at    timestamp with time zone DEFAULT now(),
  updated_at    timestamp with time zone DEFAULT now(),

  CONSTRAINT consultations_pkey PRIMARY KEY (id)
);

-- -----------------------------------------------
-- 2. consultation_answers
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.consultation_answers (
  id                uuid NOT NULL DEFAULT uuid_generate_v4(),
  consultation_id   uuid NOT NULL,
  user_id           uuid NOT NULL,
  content           text NOT NULL,
  is_accepted       boolean DEFAULT false,
  likes             integer DEFAULT 0,
  created_at        timestamp with time zone DEFAULT now(),

  CONSTRAINT consultation_answers_pkey PRIMARY KEY (id),
  CONSTRAINT consultation_answers_consultation_fkey
    FOREIGN KEY (consultation_id)
    REFERENCES public.consultations (id)
    ON DELETE CASCADE
);

-- -----------------------------------------------
-- 3. Indexes for performance
-- -----------------------------------------------
CREATE INDEX IF NOT EXISTS idx_consultations_user_id    ON public.consultations (user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_category   ON public.consultations (category);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON public.consultations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_consultation_id  ON public.consultation_answers (consultation_id);

-- -----------------------------------------------
-- 4. Grant access to Supabase roles
-- -----------------------------------------------
GRANT ALL PRIVILEGES ON public.consultations         TO service_role, authenticated, anon;
GRANT ALL PRIVILEGES ON public.consultation_answers  TO service_role, authenticated, anon;
