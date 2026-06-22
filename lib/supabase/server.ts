import { createClient } from "@supabase/supabase-js"

// Server-side Supabase client using service role key.
// Bypasses RLS — use only in server actions, API routes, and server components.
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { db: { schema: "public" } }
  )
}

// Server-side Supabase client for the next_auth schema (auth operations)
export function createAuthServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { db: { schema: "next_auth" } }
  )
}
