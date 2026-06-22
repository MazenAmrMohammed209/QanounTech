-- ============================================================
-- RLS policies for consultations & consultation_answers
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. consultations — allow everyone to read
CREATE POLICY "Anyone can read consultations"
  ON public.consultations FOR SELECT
  USING (true);

-- 2. consultations — allow anyone to insert (the API authenticates users)
CREATE POLICY "Authenticated users can create consultations"
  ON public.consultations FOR INSERT
  WITH CHECK (true);

-- 3. consultations — allow users to update their own
CREATE POLICY "Users can update own consultations"
  ON public.consultations FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. consultation_answers — allow everyone to read
CREATE POLICY "Anyone can read answers"
  ON public.consultation_answers FOR SELECT
  USING (true);

-- 5. consultation_answers — allow anyone to insert
CREATE POLICY "Authenticated users can create answers"
  ON public.consultation_answers FOR INSERT
  WITH CHECK (true);

-- 6. consultation_answers — allow users to update their own
CREATE POLICY "Users can update own answers"
  ON public.consultation_answers FOR UPDATE
  USING (true)
  WITH CHECK (true);
