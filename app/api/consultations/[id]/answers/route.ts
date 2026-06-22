import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth-api"
import { createAnswer } from "@/lib/supabase/queries/consultations"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiUserId(request)
  if (!authResult.ok) {
    return authResult.response
  }

  const { id: consultationId } = await params

  const body = await request.json()

  if (!body.content || body.content.trim() === "") {
    return NextResponse.json(
      { error: "content is required" },
      { status: 400 }
    )
  }

  try {
    const result = await createAnswer({
      consultation_id: consultationId,
      user_id: authResult.userId,
      content: body.content.trim(),
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create answer" },
      { status: 500 }
    )
  }
}
