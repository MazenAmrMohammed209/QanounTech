-- Create office_lawyers table
CREATE TABLE IF NOT EXISTS public.office_lawyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE,
  lawyer_id UUID REFERENCES public.lawyers(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'lawyer',
  joined_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.office_lawyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert" 
ON public.office_lawyers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow select" 
ON public.office_lawyers 
FOR SELECT 
USING (true);

-- Alter lawyers table to allow standalone insertions
ALTER TABLE public.lawyers DROP CONSTRAINT IF EXISTS lawyers_id_fkey;
ALTER TABLE public.lawyers ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Add required columns if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyers' AND column_name = 'name') THEN
    ALTER TABLE public.lawyers ADD COLUMN name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyers' AND column_name = 'email') THEN
    ALTER TABLE public.lawyers ADD COLUMN email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyers' AND column_name = 'phone') THEN
    ALTER TABLE public.lawyers ADD COLUMN phone TEXT;
  END IF;
END $$;
