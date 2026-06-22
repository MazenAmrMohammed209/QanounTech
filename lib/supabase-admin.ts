import { createClient } from "@supabase/supabase-js"

// Server-side Supabase client configured to query the next_auth schema.
// This is used by server actions and the NextAuth authorize callback.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  { db: { schema: "next_auth" } }
)
