import { NextResponse } from "next/server"
import {
  getLawyerProfiles,
  getOfficeProfiles,
  getPlatformStats,
} from "@/lib/supabase/queries/profiles"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get("city") || undefined
  const specialization = searchParams.get("specialization") || undefined
  const search = searchParams.get("search") || undefined
  const verified = searchParams.get("verified") === "true" ? true : undefined
  const minRating = searchParams.get("minRating")
    ? parseFloat(searchParams.get("minRating")!)
    : undefined

  try {
    const filters = { city, specialization, search, verified, minRating }

    const [lawyers, offices, stats] = await Promise.all([
      getLawyerProfiles(filters),
      getOfficeProfiles(filters),
      getPlatformStats(),
    ])

    return NextResponse.json({
      lawyers,
      offices,
      stats,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch discovery data" },
      { status: 500 }
    )
  }
}
