create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  target_id uuid,
  target_type text check (target_type in ('lawyer', 'office')),
  created_at timestamp default now(),
  UNIQUE(user_id, target_id, target_type)
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  target_id uuid,
  target_type text check (target_type in ('lawyer', 'office')),
  created_at timestamp default now(),
  UNIQUE(user_id, target_id, target_type)
);

alter table public.likes enable row level security;
alter table public.saved_items enable row level security;

-- Drop existing policies if any
DROP POLICY IF EXISTS "likes open" ON public.likes;
DROP POLICY IF EXISTS "saved open" ON public.saved_items;

create policy "likes open"
on public.likes for all
using (true)
with check (true);

create policy "saved open"
on public.saved_items for all
using (true)
with check (true);
