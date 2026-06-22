import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth-api"
import {
  getConsultations,
  createConsultation,
} from "@/lib/supabase/queries/consultations"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category") || undefined
  const search = searchParams.get("search") || undefined
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : undefined

  try {
    const consultations = await getConsultations({ category, search, limit })
    return NextResponse.json(consultations)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch consultations" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const authResult = await requireApiUserId(request)
  if (!authResult.ok) {
    return authResult.response
  }

  const body = await request.json()

  if (!body.title || body.title.trim() === "") {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 }
    )
  }
  if (!body.description || body.description.trim() === "") {
    return NextResponse.json(
      { error: "description is required" },
      { status: 400 }
    )
  }
  if (!body.category || body.category.trim() === "") {
    return NextResponse.json(
      { error: "category is required" },
      { status: 400 }
    )
  }

  try {
    const result = await createConsultation({
      user_id: authResult.userId,
      title: body.title.trim(),
      description: body.description.trim(),
      category: body.category.trim(),
      tags: body.tags || [],
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create consultation" },
      { status: 500 }
    )
  }
}
