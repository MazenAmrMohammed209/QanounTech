import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

/**
 * Resolve a profile by path segments:
 * - `/api/profiles/lawyer/<user_id>` or `/api/profiles/office/<user_id>`
 * - `/api/profiles/<user_id>` (any type)
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await context.params
    if (!slug?.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const supabase = createServerClient()

    let type: "lawyer" | "office" | undefined
    let userId: string

    if (slug.length >= 2) {
      const t = slug[0]?.toLowerCase()
      if (t === "lawyer" || t === "office") {
        type = t
        userId = slug[1]!
      } else {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
    } else {
      userId = slug[0]!
    }

    let query = supabase.from("profiles").select("*").eq("user_id", userId)
    if (type) {
      query = query.eq("type", type)
    }

    const { data: profile, error } = await query.maybeSingle()

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, profile })
  } catch (e) {
    console.error("GET /api/profiles/[...slug] error:", e)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
