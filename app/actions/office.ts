"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export async function updateOfficeProfileAction(userId: string, data: any) {
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

  // Update offices table
  const { error: officeError } = await supabaseAdmin
    .from("offices")
    .update({
      bio: data.bio,
      city: data.city,
      established_year: data.established_year ? parseInt(data.established_year) : null,
      lawyers_count: data.lawyers_count ? parseInt(data.lawyers_count) : 1,
    })
    .eq("id", userId)

  if (officeError) {
    console.error("Error updating office data:", officeError)
    return { error: "حدث خطأ أثناء تحديث بيانات المكتب" }
  }

  return { success: true }
}
