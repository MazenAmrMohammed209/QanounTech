import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { requireApiUserId } from "@/lib/auth-api"

export async function POST(request: Request) {
  const authResult = await requireApiUserId(request)
  if (!authResult.ok) {
    return authResult.response
  }

  const userId = authResult.userId
  const body = await request.json()

  const {
    title,
    client_name,
    case_type,
    description,
    lawyer_name,
    office_name,
  } = body

  const supabase = createServerClient()

  // Insert into cases table exactly as requested
  const { data, error } = await supabase
    .from("cases")
    .insert({
      title: title || "استشارة قانونية",
      client_name: client_name,
      case_type: case_type,
      description: description,
      lawyer_name: lawyer_name,
      office_name: office_name,
      user_id: userId,
      status: "active",
      progress: 10,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create case" },
      { status: 500 }
    )
  }

  return NextResponse.json(data, { status: 201 })
}
