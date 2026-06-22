"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { ThumbsUp } from "lucide-react"

interface LikeButtonProps {
  consultationId: string
  initialLikes: number
}

export function ConsultationLikeButton({ consultationId, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState<number>(initialLikes)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (initialLikes !== undefined) {
      setLikes(initialLikes)
    }
  }, [initialLikes])

  const handleLike = async () => {
    if (liked) return

    const newLikes = likes + 1
    setLikes(newLikes)
    setLiked(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from("consultations")
      .update({ likes: newLikes })
      .eq("id", consultationId)
      .select()
      .single()

    console.log("LIKE ERROR:", error)

    if (error) {
      setLikes(likes)
      setLiked(false)
      return
    }

    if (data) {
      setLikes(data.likes)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={`gap-2 bg-transparent ${liked ? "text-accent border-accent/50" : ""}`}
      onClick={handleLike}
    >
      <ThumbsUp className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      {likes}
    </Button>
  )
}

interface AnswerLikeButtonProps {
  answerId: string
  initialLikes: number
}

export function AnswerLikeButton({ answerId, initialLikes }: AnswerLikeButtonProps) {
  const [likes, setLikes] = useState<number>(initialLikes)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (initialLikes !== undefined) {
      setLikes(initialLikes)
    }
  }, [initialLikes])

  const handleLike = async () => {
    if (liked) return

    const newLikes = likes + 1
    setLikes(newLikes)
    setLiked(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from("consultation_answers")
      .update({ likes: newLikes })
      .eq("id", answerId)
      .select()
      .single()

    console.log("ANSWER LIKE ERROR:", error)

    if (error) {
      setLikes(likes)
      setLiked(false)
      return
    }

    if (data) {
      setLikes(data.likes)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={`gap-2 bg-transparent ${liked ? "text-accent border-accent/50" : ""}`}
      onClick={handleLike}
    >
      <ThumbsUp className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      مفيد ({likes})
    </Button>
  )
}
