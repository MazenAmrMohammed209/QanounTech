import { createClient } from "@supabase/supabase-js"

// Server-side Supabase client for the PUBLIC schema.
// Uses the service role key to bypass RLS (for server actions only).
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  { db: { schema: "public" } }
)
