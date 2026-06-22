"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export function AnswerForm({ consultationId }: { consultationId: string }) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setError("")

    if (!content.trim() || content.trim().length < 20) {
      setError("يجب أن تكون الإجابة 20 حرفاً على الأقل")
      return
    }

    setIsLoading(true)

    try {
      const userStr = localStorage.getItem("user")
      const userObj = userStr ? JSON.parse(userStr) : null
      const token = userObj?.id ? `session_${userObj.id}` : ""

      const res = await fetch(`/api/consultations/${consultationId}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء نشر الإجابة")
        return
      }

      setContent("")
      router.refresh()
    } catch {
      setError("حدث خطأ في الاتصال، يرجى المحاولة مجدداً")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>أضف إجابتك</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="شارك معرفتك القانونية واكتب إجابة مفصلة..."
          className="min-h-[150px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
        />

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "جارٍ النشر..." : "نشر الإجابة"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
