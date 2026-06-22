import { createServerClient } from "@/lib/supabase/server"

export interface Task {
  id: string
  case_id: string | null
  assigned_to: string
  title: string
  description: string | null
  priority: "low" | "normal" | "high" | "critical"
  completed: boolean
  due_at: string | null
  completed_at: string | null
  created_at: string
  // Joined
  case_number?: string
  case_title?: string
}

export async function getLawyerTasks(userId: string, completedFilter?: boolean): Promise<Task[]> {
  const supabase = createServerClient()

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("assigned_to", userId)
    .order("due_at", { ascending: true, nullsFirst: false })

  if (completedFilter !== undefined) {
    query = query.eq("completed", completedFilter)
  }

  const { data, error } = await query
  if (error || !data) return []

  // Get case info
  const caseIds = [...new Set(data.map((t) => t.case_id).filter(Boolean))]
  if (caseIds.length > 0) {
    const { data: cases } = await supabase
      .from("cases")
      .select("id, case_number, title")
      .in("id", caseIds)

    const caseMap: Record<string, { case_number: string; title: string }> = {}
    cases?.forEach((c) => { caseMap[c.id] = { case_number: c.case_number, title: c.title } })

    return data.map((t) => ({
      ...t,
      case_number: t.case_id ? caseMap[t.case_id]?.case_number : undefined,
      case_title: t.case_id ? caseMap[t.case_id]?.title : undefined,
    })) as Task[]
  }

  return data as Task[]
}

export async function updateTaskStatus(taskId: string, completed: boolean) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("tasks")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", taskId)

  if (error) throw new Error(error.message)
  return { success: true }
}
