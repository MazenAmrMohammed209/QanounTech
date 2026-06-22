"use server"

import { supabasePublic } from "@/lib/supabase-public"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

const OFFICE_ID = "fe42396a-892e-40a5-8bf0-5aa8884cf91c"

export async function addTaskAction(data: {
  title: string
  due_date?: string
  assigned_to: string
  case_id?: string
}) {
  const { data: taskData, error } = await supabasePublic
    .from("tasks")
    .insert({
      title: data.title,
      due_date: data.due_date || null,
      assigned_to: data.assigned_to, // This should match the lawyer's auth user ID
      case_id: data.case_id || null,
      office_id: OFFICE_ID,
      status: "pending"
    })
    .select("id")
    .single()

  if (error) {
    console.error("[addTaskAction] Error inserting task:", error)
    return { error: `فشل في إضافة المهمة. التفاصيل: ${error.message}` }
  }

  // Ensure fresh data on lawyer dashboard
  const { revalidatePath } = await import("next/cache")
  revalidatePath("/dashboard/lawyer/tasks")

  return { success: true, taskId: taskData.id }
}

export async function fetchTasksAction() {
  const { data, error } = await supabasePublic
    .from("tasks")
    .select("*")
    .eq("office_id", OFFICE_ID)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[fetchTasksAction] Error:", error)
    return { error: error.message, data: [] }
  }

  return { data: data || [], error: null }
}

export async function updateTaskStatusAction(taskId: string, status: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)

  if (error) {
    return { error: error.message }
  }

  // Ensure fresh data on lawyer dashboard
  const { revalidatePath } = await import("next/cache")
  revalidatePath("/dashboard/lawyer/tasks")

  return { success: true }
}

export async function updateTaskAssigneeAction(taskId: string, assigned_to: string | null) {
  const { error } = await supabasePublic
    .from("tasks")
    .update({ assigned_to })
    .eq("id", taskId)
    .eq("office_id", OFFICE_ID)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function fetchUserTasksAction() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: "User not authenticated", data: [] }
    }

    console.log("USER ID:", user.id)

    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, case_id")
      .eq("assigned_to", user.id)
      .order("created_at", { ascending: false })

    console.log("FETCHED TASKS:", data)

    if (error) {
      console.error("[fetchUserTasksAction] Error fetching tasks:", error)
      return { error: error.message, data: [] }
    }

    return { data: data || [], error: null }
  } catch (err: any) {
    console.error("[fetchUserTasksAction] Unexpected error:", err)
    return { error: "An unexpected error occurred", data: [] }
  }
}
