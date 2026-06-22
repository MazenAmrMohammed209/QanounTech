CREATE TABLE IF NOT EXISTS public.lawyers (
  id UUID PRIMARY KEY REFERENCES next_auth.users(id) ON DELETE CASCADE,
  specialization TEXT,
  city TEXT,
  bio TEXT,
  experience_years INT DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  reviews_count INT DEFAULT 0,
  cases_completed INT DEFAULT 0,
  response_time TEXT,
  price_range TEXT,
  languages TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.offices (
  id UUID PRIMARY KEY REFERENCES next_auth.users(id) ON DELETE CASCADE,
  city TEXT,
  bio TEXT,
  established_year INT,
  lawyers_count INT DEFAULT 1,
  rating NUMERIC DEFAULT 0,
  reviews_count INT DEFAULT 0,
  cases_completed INT DEFAULT 0,
  specializations TEXT[] DEFAULT '{}',
  price_range TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
