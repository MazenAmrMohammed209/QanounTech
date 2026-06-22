"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function toggleLike(targetId: string, type: "lawyer" | "office", userId: string) {
  const supabase = createServerClient()

  const { data } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", userId)
    .eq("target_id", targetId)
    .eq("target_type", type)
    .single()

  if (data) {
    await supabase.from("likes").delete().eq("id", data.id)
    return { liked: false }
  }

  await supabase.from("likes").insert({
    user_id: userId,
    target_id: targetId,
    target_type: type,
  })

  return { liked: true }
}

export async function toggleSave(targetId: string, type: "lawyer" | "office", userId: string) {
  const supabase = createServerClient()

  const { data } = await supabase
    .from("saved_items")
    .select("id")
    .eq("user_id", userId)
    .eq("target_id", targetId)
    .eq("target_type", type)
    .single()

  if (data) {
    await supabase.from("saved_items").delete().eq("id", data.id)
    return { saved: false }
  }

  await supabase.from("saved_items").insert({
    user_id: userId,
    target_id: targetId,
    target_type: type,
  })

  return { saved: true }
}
