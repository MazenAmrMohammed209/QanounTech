"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
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



const CATEGORIES = [
  "الكل",
  "قانون العمل",
  "قانون العقارات",
  "قانون الشركات",
  "قانون الملكية الفكرية",
  "قانون الأحوال الشخصية",
  "قانون تجاري",
]

export default function ConsultationsPage() {
  const [selectedCategory, setSelectedCategory] = useState("الكل")
  const [searchQuery, setSearchQuery] = useState("")

  const [questions, setQuestions] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setQuestions(data)
      }
    }

    fetchData()
  }, [])

  return (
    <DashboardLayout role="lawyer">
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
                  <div className="text-2xl font-bold">1,247</div>
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
                  <div className="text-2xl font-bold">3,892</div>
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
                  <div className="text-2xl font-bold">156</div>
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
                  <div className="text-2xl font-bold">89%</div>
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

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
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
            {questions.length === 0 ? (
              <div className="text-center py-10 bg-secondary/10 rounded-lg">
                <p className="text-muted-foreground">لم يتم العثور على أسئلة تطابق بحثك.</p>
              </div>
            ) : (
                questions.map((question) => (
                  <Link key={question.id} href={`/consultations/${question.id}`} className="block">
                    <Card className="hover:border-accent/50 transition-colors h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl hover:text-accent transition-colors cursor-pointer">
                            {question.title}
                          </CardTitle>
                          <CardDescription className="mt-2 leading-relaxed">{question.description}</CardDescription>
                        </div>
                        {question.hasAcceptedAnswer && (
                          <div className="shrink-0">
                            <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {question.tags?.map((tag: string) => (
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
                          <span>{question.answers} إجابة</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{question.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{question.views} مشاهدة</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{question.askedAt}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-muted-foreground">طرحه: </span>
                            <span className="font-medium text-foreground">{question.askedBy}</span>
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
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple/10 flex items-center justify-center shrink-0">
                    <span className="font-semibold text-purple">م.س</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">محمد السيد</p>
                    <p className="text-xs text-muted-foreground">189 إجابة • تقييم 4.9</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <span className="font-semibold text-accent">س.ح</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">سارة حسن</p>
                    <p className="text-xs text-muted-foreground">167 إجابة • تقييم 4.8</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-magenta/10 flex items-center justify-center shrink-0">
                    <span className="font-semibold text-magenta">أ.م</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">أحمد محمود</p>
                    <p className="text-xs text-muted-foreground">145 إجابة • تقييم 4.7</p>
                  </div>
                </div>
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
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    عقود العمل
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    تأسيس شركات
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    عقارات
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    ملكية فكرية
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    ميراث
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    تعويضات
                  </Badge>
                </div>
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
    </DashboardLayout>
  )
}
