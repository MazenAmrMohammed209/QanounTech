-- ============================================================
-- Qanoun Tech — Application Tables (public schema)
-- Depends on: next_auth.users
-- ============================================================

-- 1. PROFILES — extended user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES next_auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('client', 'lawyer', 'office')),
  specialization text,
  specializations text[] DEFAULT '{}',
  city text,
  bio text,
  phone text,
  rating numeric(3,2) DEFAULT 0,
  reviews_count int DEFAULT 0,
  experience_years int DEFAULT 0,
  cases_completed int DEFAULT 0,
  response_time text,
  verified boolean DEFAULT false,
  price_range text,
  languages text[] DEFAULT '{}',
  lawyers_count int DEFAULT 0,          -- for office profiles
  established_year int,                  -- for office profiles
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());
-- Service role bypasses RLS automatically

-- 2. CONSULTATIONS — legal Q&A questions
CREATE TABLE IF NOT EXISTS public.consultations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  views int DEFAULT 0,
  likes int DEFAULT 0,
  has_accepted_answer boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consultations are viewable by everyone" ON public.consultations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create consultations" ON public.consultations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authors can update own consultations" ON public.consultations FOR UPDATE USING (user_id = auth.uid());

-- 3. CONSULTATION ANSWERS
CREATE TABLE IF NOT EXISTS public.consultation_answers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id uuid NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_accepted boolean DEFAULT false,
  likes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.consultation_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Answers are viewable by everyone" ON public.consultation_answers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create answers" ON public.consultation_answers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authors can update own answers" ON public.consultation_answers FOR UPDATE USING (user_id = auth.uid());

-- 4. CASES — legal cases linking client + lawyer/office
CREATE TABLE IF NOT EXISTS public.cases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'on_hold')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  progress int DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  client_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  lawyer_id uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,
  office_id uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own cases" ON public.cases FOR SELECT
  USING (client_id = auth.uid() OR lawyer_id = auth.uid() OR office_id = auth.uid());
CREATE POLICY "Service role full access on cases" ON public.cases FOR ALL USING (true);

-- 5. TASKS — linked to cases / lawyers
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  assigned_to uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  completed boolean DEFAULT false,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own tasks" ON public.tasks FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (assigned_to = auth.uid());
CREATE POLICY "Service role full access on tasks" ON public.tasks FOR ALL USING (true);

-- 6. BOOKINGS — appointments between clients and lawyers/offices
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  lawyer_id uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,
  office_id uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,
  datetime timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own bookings" ON public.bookings FOR SELECT
  USING (client_id = auth.uid() OR lawyer_id = auth.uid() OR office_id = auth.uid());
CREATE POLICY "Authenticated users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Service role full access on bookings" ON public.bookings FOR ALL USING (true);

-- 7. NOTIFICATIONS — activity feed per user
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,          -- 'case_update', 'message', 'deadline', 'document', 'payment'
  title text NOT NULL,
  description text,
  reference_id uuid,           -- optional link to a case/consultation/booking
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role full access on notifications" ON public.notifications FOR ALL USING (true);

-- 8. FINANCIALS — monthly revenue/expenses for office dashboard
CREATE TABLE IF NOT EXISTS public.financials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  month date NOT NULL,                -- first day of month, e.g. '2026-04-01'
  billed_hours numeric(10,2) DEFAULT 0,
  revenue numeric(12,2) DEFAULT 0,
  expenses numeric(12,2) DEFAULT 0,
  other_income numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.financials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Office can see own financials" ON public.financials FOR SELECT USING (office_id = auth.uid());
CREATE POLICY "Service role full access on financials" ON public.financials FOR ALL USING (true);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_type ON public.profiles(type);
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_category ON public.consultations(category);
CREATE INDEX IF NOT EXISTS idx_consultation_answers_consultation_id ON public.consultation_answers(consultation_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON public.cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer_id ON public.cases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_office_id ON public.cases(office_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON public.tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lawyer_id ON public.bookings(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_financials_office_id ON public.financials(office_id);

-- Grant access to relevant Supabase roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
