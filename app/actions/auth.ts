"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { createServerClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

export async function registerAction(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const phone = formData.get("phone") as string
  const role = (formData.get("role") as string) || null
  const termsAccepted = formData.get("terms") === "on"

  // 1. Validate inputs
  if (!name || !email || !phone || !password || !confirmPassword || !termsAccepted) {
    return { error: "يرجى ملء جميع الحقول المطلوبة" }
  }

  const phoneRegex = /^[+]?[\d\s-]{8,15}$/
  if (!phoneRegex.test(phone)) {
    return { error: "رقم الهاتف غير صالح" }
  }

  if (password.length < 8) {
    return { error: "يجب أن تكون كلمة المرور 8 أحرف على الأقل" }
  }

  if (role !== null && !["client", "lawyer", "office"].includes(role)) {
    return { error: "دور غير صالح" }
  }

  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single()

  if (existingUser) {
    return { error: "هذا البريد الإلكتروني مسجل بالفعل" }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // 2. Insert user into next_auth.users and retrieve the generated ID
  const { data: newUser, error: insertError } = await supabaseAdmin
    .from("users")
    .insert({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
    })
    .select("id")
    .single()

  if (insertError || !newUser) {
    console.error("Signup insert error:", insertError)
    return { error: "حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى." }
  }

  // 3. Based on role, insert into lawyers or offices using the SAME id
  const publicClient = createServerClient()

  if (role === "lawyer") {
    const { error: lawyerError } = await publicClient
      .from("lawyers")
      .insert({ id: newUser.id, phone })

    if (lawyerError) {
      await supabaseAdmin.from("users").delete().eq("id", newUser.id)
      return { error: "حدث خطأ أثناء إنشاء الملف الشخصي للمحامي." }
    }
  } else if (role === "office") {
    const { error: officeError } = await publicClient
      .from("offices")
      .insert({ id: newUser.id, phone })

    if (officeError) {
      await supabaseAdmin.from("users").delete().eq("id", newUser.id)
      return { error: "حدث خطأ أثناء إنشاء الملف الشخصي للمكتب." }
    }
  }

  // Success, return object so client can redirect or login manually
  return { success: true, redirect: "/login" }
}

export async function loginAction(formData: FormData) {
  // Login is handled manually via /api/login now. This is a stub if needed.
  return { error: "Login handled via API" }
}

export async function updateRoleAction(role: string) {
  return { success: true }
}

export async function updateRoleWithEmailAction(email: string, role: string) {
  if (!email || !role) {
    return { error: "بيانات غير صالحة" }
  }

  if (!["client", "lawyer", "office"].includes(role)) {
    return { error: "دور غير صالح" }
  }

  const { data: user, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single()

  if (fetchError || !user) {
    return { error: "لم يتم العثور على المستخدم" }
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ role })
    .eq("id", user.id)

  if (error) {
    return { error: "حدث خطأ أثناء تحديث الدور" }
  }

  const publicClient = createServerClient()

  if (role === "lawyer") {
    await publicClient.from("lawyers").upsert({ id: user.id }, { onConflict: "id" })
  } else if (role === "office") {
    await publicClient.from("offices").upsert({ id: user.id }, { onConflict: "id" })
  }

  return { success: true }
}

export async function signOutAction() {
  redirect("/login")
}
