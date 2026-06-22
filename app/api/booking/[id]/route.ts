import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth-api"
import { createServerClient } from "@/lib/supabase/server"

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiUserId(request)
  if (!authResult.ok) {
    return authResult.response
  }
  const userId = authResult.userId
  const { id } = await context.params

  const supabase = createServerClient()
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, client_id, lawyer_id, office_id")
    .eq("id", id)
    .maybeSingle()

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const allowed =
    booking.client_id === userId ||
    booking.lawyer_id === userId ||
    booking.office_id === userId

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error: delError } = await supabase.from("bookings").delete().eq("id", id)

  if (delError) {
    return NextResponse.json(
      { error: delError.message || "Failed to delete booking" },
      { status: 500 }
    )
  }

  return new NextResponse(null, { status: 204 })
}
