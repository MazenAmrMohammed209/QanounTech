import { createServerClient } from "@/lib/supabase/server"

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  description: string | null
  reference_id: string | null
  read: boolean
  created_at: string
}

export async function getNotifications(userId: string, limit = 10): Promise<Notification[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as Notification[]
}

export async function markNotificationRead(notificationId: string) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createServerClient()
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false)

  if (error) return 0
  return count ?? 0
}
