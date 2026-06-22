"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Plus, X } from "lucide-react"

const CATEGORIES = [
  "قانون العمل",
  "قانون العقارات",
  "قانون الشركات",
  "قانون الملكية الفكرية",
  "قانون الأحوال الشخصية",
  "قانون تجاري",
  "قانون جنائي",
  "قانون مدني",
]

export default function AskQuestionPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5 && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title || !description || !category) {
      setError("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    if (title.length < 15) {
      setError("يجب أن يكون العنوان 15 حرفاً على الأقل")
      return
    }

    if (description.length < 50) {
      setError("يجب أن يكون الوصف 50 حرفاً على الأقل")
      return
    }

    setIsLoading(true)

    try {
      const userStr = localStorage.getItem("user")
      const userObj = userStr ? JSON.parse(userStr) : null
      const token = userObj?.id ? `session_${userObj.id}` : ""

      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title, description, category, tags }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء نشر السؤال")
        return
      }

      // Success — go to the new consultation or the list
      router.push("/consultations")
      router.refresh()
    } catch {
      setError("حدث خطأ في الاتصال، يرجى المحاولة مجدداً")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout role="client">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">اطرح سؤالاً قانونياً</h1>
            <p className="text-muted-foreground mt-1">احصل على إجابات من محامين محترفين</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل السؤال</CardTitle>
                  <CardDescription>كن واضحاً ومحدداً للحصول على أفضل الإجابات</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        عنوان السؤال <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder="مثال: ما هي حقوقي القانونية في حالة فصل تعسفي من العمل؟"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-12"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        اكتب عنواناً واضحاً يصف مشكلتك بدقة (15 حرفاً على الأقل)
                      </p>
                    </div>

                    {/* Category */}
                                    <div className="space-y-2">
                                        <Label htmlFor="category">
                                            التصنيف القانوني <span className="text-destructive">*</span>
                                        </Label>
                                        <input
                                            list="categories"
                                            id="category"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            placeholder="اختر أو اكتب التصنيف"
                                            className="w-full h-12 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-magenta/50"
                                            disabled={isLoading}
                                            dir="rtl"
                                        />
                                        <datalist id="categories">
                                            {CATEGORIES.map((cat) => (
                                                <option key={cat} value={cat} />
                                            ))}
                                        </datalist>
                                        <p className="text-xs text-muted-foreground">اختر التصنيف الأقرب لمشكلتك القانونية</p>
                                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">
                        وصف المشكلة <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="اشرح مشكلتك القانونية بالتفصيل... تأكد من ذكر جميع المعلومات المهمة التي قد تساعد المحامين على فهم حالتك بشكل أفضل."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[200px]"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        اكتب وصفاً تفصيلياً يشمل جميع الجوانب المهمة (50 حرفاً على الأقل)
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label htmlFor="tags">الكلمات المفتاحية (اختياري)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="tags"
                          placeholder="أضف كلمة مفتاحية"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddTag()
                            }
                          }}
                          className="h-11"
                          disabled={isLoading || tags.length >= 5}
                        />
                        <Button
                          type="button"
                          onClick={handleAddTag}
                          disabled={!tagInput.trim() || tags.length >= 5 || isLoading}
                          size="icon"
                          className="h-11 w-11 shrink-0"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="gap-1 pr-1 bg-secondary">
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        أضف حتى 5 كلمات مفتاحية لمساعدة المحامين في العثور على سؤالك
                      </p>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={isLoading} className="flex-1">
                        {isLoading ? "جارٍ النشر..." : "نشر السؤال"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isLoading}
                        className="bg-transparent"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Tips Card */}
              <Card className="bg-gradient-to-br from-accent/10 to-purple/10 border-accent/20">
                <CardHeader>
                  <CardTitle className="text-lg">نصائح لسؤال جيد</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>اكتب عنواناً واضحاً ومباشراً يصف مشكلتك</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>اشرح جميع التفاصيل المهمة والظروف المحيطة</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>اختر التصنيف القانوني المناسب</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>أضف كلمات مفتاحية ذات صلة</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>كن محترماً ومهنياً في صياغة سؤالك</span>
                  </div>
                </CardContent>
              </Card>

              {/* Privacy Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">الخصوصية والأمان</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• سيكون سؤالك مرئياً لجميع المستخدمين والمحامين</p>
                  <p>• لا تشارك معلومات شخصية حساسة</p>
                  <p>• يمكنك التواصل مع المحامي بشكل خاص بعد الإجابة</p>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">إحصائيات المنصة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">متوسط وقت الإجابة</span>
                    <span className="font-semibold">3 ساعات</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">معدل الإجابة</span>
                    <span className="font-semibold">89%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">محامين نشطين</span>
                    <span className="font-semibold">156</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
