import { createServerClient } from "@/lib/supabase/server"
import { createAuthServerClient } from "@/lib/supabase/server"

export interface Consultation {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  tags: string[]
  views: number
  likes: number
  has_accepted_answer: boolean
  created_at: string
  updated_at: string
  // Joined/computed fields
  author_name?: string
  answers_count?: number
}

export interface ConsultationAnswer {
  id: string
  consultation_id: string
  user_id: string
  content: string
  is_accepted: boolean
  likes: number
  created_at: string
  author_name?: string
}

export interface ConsultationFilters {
  category?: string
  search?: string
  limit?: number
}

export async function getConsultations(filters?: ConsultationFilters): Promise<Consultation[]> {
  const supabase = createServerClient()
  const authSupabase = createAuthServerClient()

  let query = supabase
    .from("consultations")
    .select("*")
    .order("created_at", { ascending: false })

  if (filters?.category && filters.category !== "الكل") {
    query = query.eq("category", filters.category)
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error || !data) return []

  // Get answer counts
  const consultationIds = data.map((c) => c.id)
  const { data: answers } = await supabase
    .from("consultation_answers")
    .select("consultation_id")
    .in("consultation_id", consultationIds)

  const answerCounts: Record<string, number> = {}
  answers?.forEach((a) => {
    answerCounts[a.consultation_id] = (answerCounts[a.consultation_id] || 0) + 1
  })

  // Get author names from next_auth.users
  const userIds = [...new Set(data.map((c) => c.user_id))]
  const { data: users } = await authSupabase.from("users").select("id, name").in("id", userIds)
  const userNames: Record<string, string> = {}
  users?.forEach((u) => {
    userNames[u.id] = u.name || "مستخدم"
  })

  return data.map((c) => ({
    ...c,
    answers_count: answerCounts[c.id] || 0,
    author_name: userNames[c.user_id] || "مستخدم",
  })) as Consultation[]
}

export async function getConsultationById(id: string) {
  const supabase = createServerClient()
  const authSupabase = createAuthServerClient()

  const { data: consultation, error } = await supabase
    .from("consultations")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !consultation) return null

  // Get answers
  const { data: answers } = await supabase
    .from("consultation_answers")
    .select("*")
    .eq("consultation_id", id)
    .order("created_at", { ascending: true })

  // Get author names
  const allUserIds = [consultation.user_id, ...(answers?.map((a) => a.user_id) || [])]
  const uniqueIds = [...new Set(allUserIds)]
  const { data: users } = await authSupabase.from("users").select("id, name").in("id", uniqueIds)
  const userNames: Record<string, string> = {}
  users?.forEach((u) => {
    userNames[u.id] = u.name || "مستخدم"
  })

  return {
    ...consultation,
    author_name: userNames[consultation.user_id] || "مستخدم",
    answers: (answers || []).map((a) => ({
      ...a,
      author_name: userNames[a.user_id] || "مستخدم",
    })),
  }
}

export async function createConsultation(data: {
  user_id: string
  title: string
  description: string
  category: string
  tags?: string[]
}) {
  const supabase = createServerClient()
  const { data: result, error } = await supabase
    .from("consultations")
    .insert({
      user_id: data.user_id,
      title: data.title,
      description: data.description,
      category: data.category,
      tags: data.tags || [],
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return result
}

export async function createAnswer(data: {
  consultation_id: string
  user_id: string
  content: string
}) {
  const supabase = createServerClient()
  const { data: result, error } = await supabase
    .from("consultation_answers")
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return result
}

export async function getConsultationStats() {
  const supabase = createServerClient()

  const [questions, answers, activeLawyers] = await Promise.all([
    supabase.from("consultations").select("id", { count: "exact", head: true }),
    supabase.from("consultation_answers").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("type", "lawyer"),
  ])

  const totalQuestions = questions.count ?? 0
  const totalAnswers = answers.count ?? 0
  const answeredRate = totalQuestions > 0
    ? Math.round((totalAnswers / totalQuestions) * 100)
    : 0

  return {
    totalQuestions,
    totalAnswers,
    activeLawyers: activeLawyers.count ?? 0,
    answeredRate: Math.min(answeredRate, 100),
  }
}

export async function getTopLawyers(limit = 3) {
  const supabase = createServerClient()
  const authSupabase = createAuthServerClient()

  // Count answers per user
  const { data: answers } = await supabase
    .from("consultation_answers")
    .select("user_id")

  if (!answers || answers.length === 0) return []

  const counts: Record<string, number> = {}
  answers.forEach((a) => {
    counts[a.user_id] = (counts[a.user_id] || 0) + 1
  })

  // Sort by count and take top N
  const sorted = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)

  const topIds = sorted.map(([id]) => id)

  // Get profiles + names
  const [{ data: profiles }, { data: users }] = await Promise.all([
    supabase.from("profiles").select("user_id, rating").in("user_id", topIds),
    authSupabase.from("users").select("id, name").in("id", topIds),
  ])

  const profileMap: Record<string, { rating: number }> = {}
  profiles?.forEach((p) => {
    profileMap[p.user_id] = { rating: p.rating }
  })

  const userMap: Record<string, string> = {}
  users?.forEach((u) => {
    userMap[u.id] = u.name || "محامي"
  })

  return sorted.map(([userId, count]) => ({
    user_id: userId,
    name: userMap[userId] || "محامي",
    answers_count: count,
    rating: profileMap[userId]?.rating ?? 0,
  }))
}

export async function getPopularTags(limit = 10): Promise<string[]> {
  const supabase = createServerClient()
  const { data } = await supabase.from("consultations").select("tags")

  if (!data) return []

  const tagCount: Record<string, number> = {}
  data.forEach((c) => {
    c.tags?.forEach((tag: string) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    })
  })

  return Object.entries(tagCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([tag]) => tag)
}

export async function getCategories(): Promise<string[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("consultations")
    .select("category")

  if (!data) return []

  return [...new Set(data.map((c) => c.category))]
}
