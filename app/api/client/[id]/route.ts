import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth-api"
import { createServerClient } from "@/lib/supabase/server"

const CASE_STATUS = new Set([
  "pending",
  "in_progress",
  "review",
  "completed",
  "on_hold",
])

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiUserId(request)
  if (!authResult.ok) {
    return authResult.response
  }
  const userId = authResult.userId
  const { id: caseId } = await context.params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 })
  }

  const caseNotes = body.caseNotes
  if (typeof caseNotes !== "string" || caseNotes.trim() === "") {
    return NextResponse.json({ error: "caseNotes is required" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: row, error: fetchError } = await supabase
    .from("cases")
    .select("id, client_id, lawyer_id, office_id, status, description")
    .eq("id", caseId)
    .maybeSingle()

  if (fetchError || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const allowed =
    row.client_id === userId ||
    row.lawyer_id === userId ||
    row.office_id === userId

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updates: Record<string, string> = {
    description: caseNotes.trim(),
    updated_at: new Date().toISOString(),
  }

  if (typeof body.caseStatus === "string" && CASE_STATUS.has(body.caseStatus)) {
    updates.status = body.caseStatus
  }

  const { data: updated, error: updateError } = await supabase
    .from("cases")
    .update(updates)
    .eq("id", caseId)
    .select()
    .single()

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message || "Update failed" },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      id: updated.id,
      caseNotes: updated.description,
      caseStatus: updated.status,
      case: updated,
    },
    { status: 200 }
  )
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiUserId(request)
  if (!authResult.ok) {
    return authResult.response
  }
  const userId = authResult.userId
  const { id: caseId } = await context.params

  const supabase = createServerClient()
  const { data: row, error: fetchError } = await supabase
    .from("cases")
    .select("id, client_id, lawyer_id, office_id")
    .eq("id", caseId)
    .maybeSingle()

  if (fetchError || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const allowed =
    row.client_id === userId ||
    row.lawyer_id === userId ||
    row.office_id === userId

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error: delError } = await supabase.from("cases").delete().eq("id", caseId)

  if (delError) {
    return NextResponse.json(
      { error: delError.message || "Delete failed" },
      { status: 500 }
    )
  }

  return new NextResponse(null, { status: 204 })
}
