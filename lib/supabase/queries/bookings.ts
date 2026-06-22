import { createServerClient } from "@/lib/supabase/server"

export interface Booking {
  id: string
  client_id: string
  lawyer_id: string | null
  office_id: string | null
  datetime: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  notes: string | null
  location: string | null
  created_at: string
  updated_at: string
  // Joined
  client_name?: string
  lawyer_name?: string
}

export async function createBooking(data: {
  client_id: string
  lawyer_id?: string
  office_id?: string
  datetime: string
  notes?: string
  location?: string
}) {
  const supabase = createServerClient()
  const { data: result, error } = await supabase
    .from("bookings")
    .insert({
      client_id: data.client_id,
      lawyer_id: data.lawyer_id || null,
      office_id: data.office_id || null,
      datetime: data.datetime,
      notes: data.notes || null,
      location: data.location || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return result
}

export async function getBookings(userId: string): Promise<Booking[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .or(`client_id.eq.${userId},lawyer_id.eq.${userId},office_id.eq.${userId}`)
    .order("datetime", { ascending: true })

  if (error || !data) return []
  return data as Booking[]
}

export async function getUpcomingAppointments(lawyerId: string, limit = 5): Promise<Booking[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("lawyer_id", lawyerId)
    .gte("datetime", new Date().toISOString())
    .neq("status", "cancelled")
    .order("datetime", { ascending: true })
    .limit(limit)

  if (error || !data) return []
  return data as Booking[]
}
