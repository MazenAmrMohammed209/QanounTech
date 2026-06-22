-- ============================================================
-- Fix RLS: Only office users can insert lawyers
-- Adds office_id column to lawyers and scoped INSERT policy
-- ============================================================

-- 1. Add office_id column to lawyers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lawyers' AND column_name = 'office_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.lawyers ADD COLUMN office_id UUID;
  END IF;
END $$;

-- 2. Drop ALL foreign key constraints on lawyers.id so standalone inserts work
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'lawyers'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  ) LOOP
    EXECUTE 'ALTER TABLE public.lawyers DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    RAISE NOTICE 'Dropped FK constraint: %', r.constraint_name;
  END LOOP;
END $$;

-- 3. Ensure lawyers.id auto-generates UUIDs
ALTER TABLE public.lawyers ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 4. Add full_name column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lawyers' AND column_name = 'full_name' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.lawyers ADD COLUMN full_name TEXT;
  END IF;
END $$;

-- 5. Drop old INSERT policies on lawyers
DROP POLICY IF EXISTS "Allow authenticated insert on lawyers" ON public.lawyers;
DROP POLICY IF EXISTS "Allow insert" ON public.lawyers;
DROP POLICY IF EXISTS "Allow public inserts on lawyers" ON public.lawyers;

-- 6. Create scoped INSERT policy: only the office owner can insert
CREATE POLICY "office_can_insert_lawyers"
  ON public.lawyers
  FOR INSERT
  WITH CHECK (auth.uid() = office_id);

-- 7. Keep SELECT open for everyone (already exists, safe re-create)
DROP POLICY IF EXISTS "Lawyers are viewable by everyone" ON public.lawyers;
CREATE POLICY "Lawyers are viewable by everyone"
  ON public.lawyers FOR SELECT USING (true);

-- 8. Scoped UPDATE and DELETE
DROP POLICY IF EXISTS "Allow authenticated update on lawyers" ON public.lawyers;
CREATE POLICY "office_can_update_lawyers"
  ON public.lawyers
  FOR UPDATE
  USING (auth.uid() = office_id);

DROP POLICY IF EXISTS "Allow authenticated delete on lawyers" ON public.lawyers;
CREATE POLICY "office_can_delete_lawyers"
  ON public.lawyers
  FOR DELETE
  USING (auth.uid() = office_id);

-- 9. Fix office_lawyers policies (scoped to office owner)
DROP POLICY IF EXISTS "Allow insert" ON public.office_lawyers;
DROP POLICY IF EXISTS "Allow authenticated insert on office_lawyers" ON public.office_lawyers;
CREATE POLICY "office_can_insert_office_lawyers"
  ON public.office_lawyers
  FOR INSERT
  WITH CHECK (auth.uid() = office_id);

DROP POLICY IF EXISTS "Allow select" ON public.office_lawyers;
DROP POLICY IF EXISTS "Allow authenticated select on office_lawyers" ON public.office_lawyers;
CREATE POLICY "office_can_select_office_lawyers"
  ON public.office_lawyers
  FOR SELECT
  USING (auth.uid() = office_id);

DROP POLICY IF EXISTS "Allow authenticated delete on office_lawyers" ON public.office_lawyers;
CREATE POLICY "office_can_delete_office_lawyers"
  ON public.office_lawyers
  FOR DELETE
  USING (auth.uid() = office_id);
