import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth-api"
import { createServerClient } from "@/lib/supabase/server"
import { createAuthServerClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/queries/profiles"

export async function GET(request: Request) {
  const authResult = await requireApiUserId(request)
  if (!authResult.ok) {
    return authResult.response
  }

  const authSupabase = createAuthServerClient()
  const { data: user, error } = await authSupabase
    .from("users")
    .select("id, name, email, role, image")
    .eq("id", authResult.userId)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Also fetch extended profile if it exists
  const profile = await getUserProfile(authResult.userId)

  return NextResponse.json({
    ...user,
    profile: profile || null,
  })
}

export async function POST(request: Request) {
  const authResult = await requireApiUserId(request)
  if (!authResult.ok) {
    return authResult.response
  }

  const body = await request.json()
  const supabase = createServerClient()

  const authSupabase = createAuthServerClient()
  const { data: dbUser } = await authSupabase
    .from("users")
    .select("role")
    .eq("id", authResult.userId)
    .single()

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: authResult.userId,
        type: body.type || dbUser?.role || "client",
        specialization: body.specialization,
        city: body.city,
        bio: body.bio,
        phone: body.phone,
        languages: body.languages || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
