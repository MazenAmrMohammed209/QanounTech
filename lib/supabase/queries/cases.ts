import { createServerClient } from "@/lib/supabase/server"
import { createAuthServerClient } from "@/lib/supabase/server"

export interface Case {
  id: string
  case_number: string
  title: string
  description: string | null
  category: string
  status: "pending" | "in_progress" | "review" | "completed" | "on_hold"
  priority: "low" | "normal" | "high" | "critical"
  progress: number
  client_id: string
  lawyer_id: string | null
  office_id: string | null
  started_at: string
  due_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // Joined
  lawyer_name?: string
  client_name?: string
}

export async function getClientCases(clientId: string): Promise<Case[]> {
  const supabase = createServerClient()
  const authSupabase = createAuthServerClient()

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })

  if (error || !data) return []

  // Get lawyer names
  const lawyerIds = [...new Set(data.map((c) => c.lawyer_id).filter(Boolean))]
  if (lawyerIds.length > 0) {
    const { data: lawyers } = await authSupabase.from("users").select("id, name").in("id", lawyerIds)
    const lawyerMap: Record<string, string> = {}
    lawyers?.forEach((l) => { lawyerMap[l.id] = l.name || "محامي" })
    return data.map((c) => ({ ...c, lawyer_name: c.lawyer_id ? lawyerMap[c.lawyer_id] : undefined }))
  }

  return data as Case[]
}

export async function getLawyerCases(lawyerId: string): Promise<Case[]> {
  const supabase = createServerClient()
  const authSupabase = createAuthServerClient()

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("lawyer_id", lawyerId)
    .order("updated_at", { ascending: false })

  if (error || !data) return []

  // Get client names
  const clientIds = [...new Set(data.map((c) => c.client_id))]
  const { data: clients } = await authSupabase.from("users").select("id, name").in("id", clientIds)
  const clientMap: Record<string, string> = {}
  clients?.forEach((c) => { clientMap[c.id] = c.name || "موكل" })

  return data.map((c) => ({ ...c, client_name: clientMap[c.client_id] })) as Case[]
}

export async function getOfficeCases(officeId: string): Promise<Case[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("office_id", officeId)
    .order("updated_at", { ascending: false })

  if (error || !data) return []
  return data as Case[]
}

export interface DashboardStats {
  activeCases: number
  inProgressCases: number
  completedCases: number
  totalCases: number
  unreadMessages: number
  upcomingDeadlines: number
  // Lawyer-specific
  todayTasks?: number
  completedTasks?: number
  billableHours?: number
  clientMessages?: number
  // Office-specific
  activeLawyers?: number
  monthlyRevenue?: number
  completionRate?: number
}

export async function getDashboardStats(userId: string, role: string): Promise<DashboardStats> {
  const supabase = createServerClient()

  const roleField = role === "client" ? "client_id" : role === "lawyer" ? "lawyer_id" : "office_id"

  const [allCases, activeCases, inProgressCases, completedCases, notifications, deadlines] = await Promise.all([
    supabase.from("cases").select("id", { count: "exact", head: true }).eq(roleField, userId),
    supabase.from("cases").select("id", { count: "exact", head: true }).eq(roleField, userId).neq("status", "completed"),
    supabase.from("cases").select("id", { count: "exact", head: true }).eq(roleField, userId).eq("status", "in_progress"),
    supabase.from("cases").select("id", { count: "exact", head: true }).eq(roleField, userId).eq("status", "completed"),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("read", false),
    supabase.from("cases").select("id", { count: "exact", head: true })
      .eq(roleField, userId)
      .not("due_at", "is", null)
      .gte("due_at", new Date().toISOString())
      .lte("due_at", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const stats: DashboardStats = {
    activeCases: activeCases.count ?? 0,
    inProgressCases: inProgressCases.count ?? 0,
    completedCases: completedCases.count ?? 0,
    totalCases: allCases.count ?? 0,
    unreadMessages: notifications.count ?? 0,
    upcomingDeadlines: deadlines.count ?? 0,
  }

  if (role === "lawyer") {
    const [todayTasks, completedTasks] = await Promise.all([
      supabase.from("tasks").select("id", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .eq("completed", false),
      supabase.from("tasks").select("id", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .eq("completed", true),
    ])
    stats.todayTasks = todayTasks.count ?? 0
    stats.completedTasks = completedTasks.count ?? 0
  }

  if (role === "office") {
    const [lawyers, financials] = await Promise.all([
      supabase.from("cases").select("lawyer_id").eq("office_id", userId).not("lawyer_id", "is", null),
      supabase.from("financials").select("revenue").eq("office_id", userId).order("month", { ascending: false }).limit(1),
    ])
    const uniqueLawyers = new Set(lawyers.data?.map((c) => c.lawyer_id))
    stats.activeLawyers = uniqueLawyers.size
    stats.monthlyRevenue = financials.data?.[0]?.revenue ?? 0
    const total = allCases.count ?? 0
    const completed = completedCases.count ?? 0
    stats.completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  }

  return stats
}
