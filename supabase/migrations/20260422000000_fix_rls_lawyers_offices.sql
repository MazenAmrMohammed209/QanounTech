-- Enable Row Level Security
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Lawyers are viewable by everyone" ON public.lawyers;
DROP POLICY IF EXISTS "Offices are viewable by everyone" ON public.offices;

-- Create policies to allow everyone to SELECT (read)
CREATE POLICY "Lawyers are viewable by everyone" 
ON public.lawyers FOR SELECT USING (true);

CREATE POLICY "Offices are viewable by everyone" 
ON public.offices FOR SELECT USING (true);
