import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth-api"
import { createBooking, getBookings } from "@/lib/supabase/queries/bookings"

export async function GET(request: Request) {
  const authResult = await requireApiUserId(request)
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const bookings = await getBookings(authResult.userId)
    return NextResponse.json(bookings)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
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

  if (!body.datetime) {
    return NextResponse.json(
      { error: "datetime is required" },
      { status: 400 }
    )
  }

  const date = new Date(body.datetime)
  if (isNaN(date.getTime()) || date < new Date()) {
    return NextResponse.json(
      { error: "invalid datetime — must be in the future" },
      { status: 400 }
    )
  }

  if (!body.lawyerId && !body.officeId) {
    return NextResponse.json(
      { error: "lawyerId or officeId is required" },
      { status: 400 }
    )
  }

  try {
    const result = await createBooking({
      client_id: authResult.userId,
      lawyer_id: body.lawyerId || undefined,
      office_id: body.officeId || undefined,
      datetime: body.datetime,
      notes: body.notes,
      location: body.location,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create booking" },
      { status: 500 }
    )
  }
}
