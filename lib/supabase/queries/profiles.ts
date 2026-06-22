import { createServerClient, createAuthServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export interface Profile {
  id: string
  user_id: string // maps to id for compatibility
  type: "client" | "lawyer" | "office"
  specialization: string | null
  specializations: string[]
  city: string | null
  bio: string | null
  phone: string | null
  rating: number
  reviews_count: number
  experience_years: number
  cases_completed: number
  response_time: string | null
  verified: boolean
  price_range: string | null
  languages: string[]
  lawyers_count: number
  established_year: number | null
  created_at: string
  updated_at: string
  // Joined fields
  user_name?: string
  full_name?: string
  office_name?: string
  user_email?: string
  user_image?: string | null
  address?: string
  description?: string
}

export interface ProfileFilters {
  type?: "lawyer" | "office"
  city?: string
  specialization?: string
  search?: string
  verified?: boolean
  minRating?: number
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = createServerClient()
  
  // First get the user's role
  const { data: user } = await supabase.from("users").select("role, name, email, phone, image").eq("id", userId).single()
  
  if (!user || !user.role) return null

  if (user.role === "lawyer") {
    const { data } = await supabase.from("lawyers").select("*").eq("id", userId).single()
    if (!data) return null
    return { ...data, user_id: data.id, type: "lawyer", user_name: user.name, user_email: user.email, phone: user.phone, user_image: user.image } as Profile
  } else if (user.role === "office") {
    const { data } = await supabase.from("offices").select("*").eq("id", userId).single()
    if (!data) return null
    return { ...data, user_id: data.id, type: "office", user_name: user.name, user_email: user.email, phone: user.phone, user_image: user.image } as Profile
  }
  
  return null
}

export async function upsertProfile(userId: string, profileData: Partial<Profile>) {
  const supabase = createServerClient()
  
  const { data: user } = await supabase.from("users").select("role").eq("id", userId).single()
  if (!user || !user.role) throw new Error("User role not found")

  const table = user.role === "lawyer" ? "lawyers" : "offices"
  
  const { data, error } = await supabase
    .from(table)
    .upsert(
      { ...profileData, id: userId, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getLawyerProfiles(filters?: ProfileFilters): Promise<Profile[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const { data: lawyersData, error } = await supabase
    .from("lawyers")
    .select("id, full_name, specialization, city, rating, bio")

  if (error) {
    console.error("Error fetching lawyers:", error)
  }

  console.log("LAWYERS:", lawyersData)

  if (!lawyersData || lawyersData.length === 0) return []

  return lawyersData.map(lawyer => ({
    ...lawyer,
    user_id: lawyer.id,
    type: "lawyer",
    user_name: lawyer.full_name || "محامي", // map full_name to user_name for UI compatibility
  })) as Profile[]
}

export async function getOfficeProfiles(filters?: ProfileFilters): Promise<Profile[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const { data: officesData, error } = await supabase
    .from("offices")
    .select("id, office_name, city, rating, address, description")

  if (error) {
    console.error("Error fetching offices:", error)
  }

  console.log("OFFICES:", officesData)

  if (!officesData || officesData.length === 0) return []

  return officesData.map(office => ({
    ...office,
    user_id: office.id,
    type: "office",
    user_name: office.office_name || "مكتب محاماة", // map office_name to user_name for UI compatibility
    bio: office.description || "",
  })) as Profile[]
}

export async function getTeamMembers(officeUserId: string): Promise<Profile[]> {
  const supabase = createServerClient()
  const { data: caseData } = await supabase
    .from("cases")
    .select("lawyer_id")
    .eq("office_id", officeUserId)
    .not("lawyer_id", "is", null)

  if (!caseData || caseData.length === 0) return []

  const lawyerIds = [...new Set(caseData.map((c) => c.lawyer_id).filter(Boolean))]

  const { data, error } = await supabase
    .from("lawyers")
    .select("*, users!inner(name, email, phone, image)")
    .in("id", lawyerIds)

  if (error || !data) return []
  
  return data.map(lawyer => ({
    ...lawyer,
    user_id: lawyer.id,
    type: "lawyer",
    user_name: lawyer.users?.name,
    user_email: lawyer.users?.email,
    phone: lawyer.users?.phone,
    user_image: lawyer.users?.image
  })) as Profile[]
}

export async function getPlatformStats() {
  const supabase = createServerClient()

  const [lawyers, offices, cases] = await Promise.all([
    supabase.from("lawyers").select("id", { count: "exact", head: true }),
    supabase.from("offices").select("id", { count: "exact", head: true }),
    supabase.from("cases").select("id", { count: "exact", head: true }).eq("status", "completed"),
  ])

  return {
    lawyersCount: lawyers.count ?? 0,
    officesCount: offices.count ?? 0,
    completedCases: cases.count ?? 0,
  }
}
