"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  MessageSquare,
  ThumbsUp,
  Eye,
  CheckCircle2,
  TrendingUp,
  Clock,
  Scale,
  Plus,
  Filter,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import type { Consultation } from "@/lib/supabase/queries/consultations"

interface ConsultationsClientProps {
  initialConsultations: Consultation[]
  stats: {
    totalQuestions: number
    totalAnswers: number
    activeLawyers: number
    answeredRate: number
  }
  topLawyers: Array<{
    user_id: string
    name: string
    answers_count: number
    rating: number
  }>
  popularTags: string[]
  categories: string[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days === 1) return "منذ يوم"
  return `منذ ${days} أيام`
}

export function ConsultationsClient({
  initialConsultations,
  stats,
  topLawyers,
  popularTags,
  categories,
}: ConsultationsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("الكل")
  const [searchQuery, setSearchQuery] = useState("")
  const [localLikes, setLocalLikes] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    initialConsultations.forEach((q) => {
      initial[q.id] = q.likes ?? 0
    })
    return initial
  })
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  const handleLike = async (e: React.MouseEvent, questionId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (likedIds.has(questionId)) return

    const prevCount = localLikes[questionId] ?? 0
    const newCount = prevCount + 1
    setLocalLikes((prev) => ({ ...prev, [questionId]: newCount }))
    setLikedIds((prev) => new Set(prev).add(questionId))

    const supabase = createClient()
    const { data, error } = await supabase
      .from("consultations")
      .update({ likes: newCount })
      .eq("id", questionId)
      .select("likes")
      .single()

    console.log("LIKE UPDATE:", data, "ERROR:", error)

    if (error) {
      // rollback
      setLocalLikes((prev) => ({ ...prev, [questionId]: prevCount }))
      setLikedIds((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
      return
    }

    if (data) {
      setLocalLikes((prev) => ({ ...prev, [questionId]: data.likes }))
    }
  }

  const filteredQuestions = initialConsultations.filter((q) => {
    const matchesCategory = selectedCategory === "الكل" || q.category === selectedCategory
    const matchesSearch = q.title.includes(searchQuery) || q.description.includes(searchQuery)
    return matchesCategory && matchesSearch
  })

  const LAWYER_COLORS = [
    { bg: "bg-purple/10", text: "text-purple" },
    { bg: "bg-accent/10", text: "text-accent" },
    { bg: "bg-magenta/10", text: "text-magenta" },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الاستشارات القانونية</h1>
          <p className="text-muted-foreground mt-1">اطرح أسئلتك القانونية واحصل على إجابات من محامين محترفين</p>
        </div>
        <Link href="/consultations/ask">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            اطرح سؤالاً
          </Button>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalQuestions.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">سؤال</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-purple/10 text-purple flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalAnswers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">إجابة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-magenta/10 text-magenta flex items-center justify-center">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.activeLawyers}</div>
                <div className="text-sm text-muted-foreground">محامي نشط</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.answeredRate}%</div>
                <div className="text-sm text-muted-foreground">تم الإجابة عليها</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="ابحث عن سؤال قانوني..."
              className="h-12 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="lg" className="gap-2 bg-transparent">
            <Filter className="h-5 w-5" />
            فلترة
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === selectedCategory ? "default" : "outline"}
              size="sm"
              className={category === selectedCategory ? "" : "bg-transparent"}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Questions List */}
        <div className="lg:col-span-3 space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-10 bg-secondary/10 rounded-lg">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">لم يتم العثور على أسئلة</p>
              <p className="text-sm text-muted-foreground mt-1">كن أول من يطرح سؤالاً في هذا المجال</p>
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <Link key={question.id} href={`/consultations/${question.id}`} className="block">
                <Card className="hover:border-accent/50 transition-colors h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl hover:text-accent transition-colors cursor-pointer">
                          {question.title}
                        </CardTitle>
                        <CardDescription className="mt-2 leading-relaxed">
                          {question.description}
                        </CardDescription>
                      </div>
                      {question.has_accepted_answer && (
                        <div className="shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {question.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Scale className="h-4 w-4" />
                        <span>{question.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{question.answers_count ?? 0} إجابة</span>
                      </div>
                      <button
                        onClick={(e) => handleLike(e, question.id)}
                        className={`flex items-center gap-1 transition-colors ${likedIds.has(question.id)
                            ? "text-accent"
                            : "hover:text-accent"
                          }`}
                      >
                        <ThumbsUp className={`h-4 w-4 ${likedIds.has(question.id) ? "fill-current" : ""}`} />
                        <span>{localLikes[question.id] ?? question.likes}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{question.views} مشاهدة</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{timeAgo(question.created_at)}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">طرحه: </span>
                          <span className="font-medium text-foreground">{question.author_name}</span>
                        </div>
                        <div className="text-sm font-medium text-accent hover:underline">
                          عرض التفاصيل
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Lawyers */}
          <Card>
            <CardHeader>
              <CardTitle>أكثر المحامين نشاطاً</CardTitle>
              <CardDescription>الأكثر إجابة على الأسئلة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topLawyers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">لا توجد بيانات بعد</p>
              ) : (
                topLawyers.map((lawyer, i) => (
                  <div key={lawyer.user_id} className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${LAWYER_COLORS[i % 3].bg}`}>
                      <span className={`font-semibold ${LAWYER_COLORS[i % 3].text}`}>
                        {lawyer.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{lawyer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {lawyer.answers_count} إجابة • تقييم {lawyer.rating}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Popular Tags */}
          <Card>
            <CardHeader>
              <CardTitle>المواضيع الشائعة</CardTitle>
              <CardDescription>الأكثر بحثاً</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {popularTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد مواضيع بعد</p>
                ) : (
                  popularTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    >
                      {tag}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Search Lawyers CTA */}
          <Card className="bg-gradient-to-br from-purple/10 to-magenta/10 border-purple/20">
            <CardHeader>
              <CardTitle className="text-lg">ابحث عن محامٍ</CardTitle>
              <CardDescription>تواصل مباشرة مع محامٍ متخصص لقضيتك</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/discovery">
                <Button className="w-full gap-2" variant="outline">
                  <Search className="h-4 w-4" />
                  استعرض المحامين
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="bg-gradient-to-br from-accent/10 to-purple/10 border-accent/20">
            <CardHeader>
              <CardTitle className="text-lg">كيف تطرح سؤالاً جيداً؟</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>اكتب عنواناً واضحاً ومحدداً</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>اشرح المشكلة بالتفصيل</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>أضف الوثائق ذات الصلة</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>اختر التصنيف المناسب</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
