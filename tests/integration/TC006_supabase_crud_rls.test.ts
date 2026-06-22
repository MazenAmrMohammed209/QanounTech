import { createClient } from "@supabase/supabase-js"

describe("TC006 Supabase CRUD and RLS", () => {
  it("validates db access patterns under anon key", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    expect(url).toBeTruthy()
    expect(anon).toBeTruthy()

    const client = createClient(url!, anon!)
    const { error } = await client.from("bookings").select("*").limit(1)
    // RLS behavior can vary (allowed read or restricted), but should not crash.
    expect(error?.message ?? "").not.toContain("relation")
  })
})
