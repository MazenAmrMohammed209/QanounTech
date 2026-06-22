"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { createServerClient } from "@/lib/supabase/server"

export async function getUserDataAction(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, phone, role")
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Error fetching user data:", error)
    return null
  }
  return data
}
export async function getProfileDataAction(userId: string) {
  // First get the user's role
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, name, email, phone, role")
    .eq("id", userId)
    .single()

  if (userError || !user) return null

  const publicClient = createServerClient()

  if (user.role === "lawyer") {
    // Single joined query
    const { data: lawyerData, error: lawyerError } = await publicClient
      .from("lawyers")
      .select(`
        phone,
        specialization, 
        bio, 
        city,
        experience_years,
        rating,
        reviews_count,
        cases_completed
      `)
      .eq("id", userId)
      .single()
      
    if (lawyerError || !lawyerData) return { ...user, profileType: "lawyer" }
    
    // Flatten the result
    return {
      ...user, // fallback base data
      ...lawyerData,
      profileType: "lawyer"
    }
  } else if (user.role === "office") {
    // Single joined query
    const { data: officeData, error: officeError } = await publicClient
      .from("offices")
      .select(`
        phone,
        bio, 
        city,
        established_year,
        lawyers_count,
        rating,
        reviews_count,
        cases_completed
      `)
      .eq("id", userId)
      .single()
      
    if (officeError || !officeData) return { ...user, profileType: "office" }

    // Flatten the result
    return {
      ...user, // fallback base data
      ...officeData,
      profileType: "office"
    }
  }

  return { ...user, profileType: "client" }
}
