"use server"

import { supabasePublic } from "@/lib/supabase-public"

const OFFICE_ID = "fe42396a-892e-40a5-8bf0-5aa8884cf91c"

// Add a new lawyer to the office team
export async function addLawyerAction(data: {
  full_name: string
  role: string
  specialization: string
  email?: string
  phone?: string
}) {
  const { data: memberData, error: memberError } = await supabasePublic
    .from("office_lawyers")
    .insert({
      office_id: OFFICE_ID,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      specialization: data.specialization,
      role: data.role,
    })
    .select()
    .single()
  
  if (memberError) {
    console.error("[addLawyerAction] Error:", memberError)
    return { error: "فشل إضافة العضو" }
  }

  return { success: true, data: memberData }
}

// Fetch all team members for the current office
export async function fetchTeamAction() {
  const { data, error } = await supabasePublic
    .from("office_lawyers")
    .select("*")
    .eq("office_id", OFFICE_ID)

  if (error) {
    console.error("[fetchTeamAction] Error:", error)
    return { error: error.message, data: [] }
  }

  return { data: data || [], error: null }
}

// Delete a team member
export async function deleteLawyerAction(lawyerId: string) {
  const { error } = await supabasePublic
    .from("office_lawyers")
    .delete()
    .eq("id", lawyerId)
    .eq("office_id", OFFICE_ID)

  if (error) {
    console.error("[deleteLawyerAction] Error:", error)
    return { error: error.message }
  }

  return { success: true }
}
