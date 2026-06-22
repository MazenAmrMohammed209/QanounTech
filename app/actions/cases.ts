"use server"

import { supabasePublic } from "@/lib/supabase-public"

const OFFICE_ID = "fe42396a-892e-40a5-8bf0-5aa8884cf91c"

export async function addCaseAction(data: {
  title: string
  client_name: string
  case_type: string
  assigned_lawyer?: string
  description?: string
  session_date?: string
}) {
  const { data: caseData, error } = await supabasePublic
    .from("cases")
    .insert({
      title: data.title,
      client_name: data.client_name,
      case_type: data.case_type,
      assigned_lawyer: data.assigned_lawyer || null,
      description: data.description || "",
      session_date: data.session_date || null,
      office_id: OFFICE_ID,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[addCaseAction] Error inserting case:", error)
    return { error: `فشل في إضافة القضية. التفاصيل: ${error.message}` }
  }

  return { success: true, caseId: caseData.id }
}

export async function fetchCasesAction() {
  const { data, error } = await supabasePublic
    .from("cases")
    .select("*")
    .eq("office_id", OFFICE_ID)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[fetchCasesAction] Error:", error)
    return { error: error.message, data: [] }
  }

  return { data: data || [], error: null }
}

export async function fetchRelatedCasesAction(tasks: any[]) {
  try {
    if (!tasks || tasks.length === 0) {
      return { data: [], error: null }
    }

    // Extract unique case IDs and filter out null/undefined/empty
    const caseIds = [...new Set(tasks.map(t => t.case_id).filter(Boolean))]

    if (caseIds.length === 0) {
      return { data: [], error: null }
    }

    const { data, error } = await supabasePublic
      .from("cases")
      .select("*")
      .in("id", caseIds)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[fetchRelatedCasesAction] Error:", error)
      return { error: error.message, data: [] }
    }

    return { data: data || [], error: null }
  } catch (err: any) {
    console.error("[fetchRelatedCasesAction] Unexpected error:", err)
    return { error: "An unexpected error occurred", data: [] }
  }
}
