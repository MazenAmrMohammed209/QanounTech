"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export async function updateLawyerProfileAction(userId: string, data: any) {
  // Update users table (name, phone)
  const { error: userError } = await supabaseAdmin
    .from("users")
    .update({
      name: data.name,
      phone: data.phone,
    })
    .eq("id", userId)

  if (userError) {
    console.error("Error updating user data:", userError)
    return { error: "حدث خطأ أثناء تحديث بيانات المستخدم" }
  }

  // Update lawyers table
  const { error: lawyerError } = await supabaseAdmin
    .from("lawyers")
    .update({
      specialization: data.specialization,
      bio: data.bio,
      city: data.city,
    })
    .eq("id", userId)

  if (lawyerError) {
    console.error("Error updating lawyer data:", lawyerError)
    return { error: "حدث خطأ أثناء تحديث بيانات المحامي" }
  }

  return { success: true }
}
