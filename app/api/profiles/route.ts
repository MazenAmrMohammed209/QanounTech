import { NextResponse } from "next/server"
import { getLawyerProfiles, getOfficeProfiles } from "@/lib/supabase/queries/profiles"

/**
 * Public directory of lawyer and office profiles (same data as /api/discovery, list shape).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city") || undefined
    const specialization = searchParams.get("specialization") || undefined
    const search = searchParams.get("search") || undefined
    const verified = searchParams.get("verified") === "true" ? true : undefined
    const minRating = searchParams.get("minRating")
      ? parseFloat(searchParams.get("minRating")!)
      : undefined

    const filters = { city, specialization, search, verified, minRating }

    const [lawyers, offices] = await Promise.all([
      getLawyerProfiles(filters),
      getOfficeProfiles(filters),
    ])

    return NextResponse.json({
      lawyers,
      offices,
    })
  } catch (e) {
    console.error("GET /api/profiles error:", e)
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    )
  }
}
