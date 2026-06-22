import { notFound } from "next/navigation"
import { getConsultationById } from "@/lib/supabase/queries/consultations"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  Eye,
  Clock,
  Scale,
  CheckCircle2,
  Share2,
  Bookmark,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AnswerForm } from "./answer-form"
import { ConsultationLikeButton, AnswerLikeButton } from "./like-buttons"

export const dynamic = "force-dynamic"

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

export default async function ConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const consultation = await getConsultationById(id)

  if (!consultation) {
    notFound()
  }

  const answers = consultation.answers || []

  return (
    <DashboardLayout role="client">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/consultations" className="hover:text-foreground">
              الاستشارات القانونية
            </Link>
            <span>/</span>
            <span className="text-foreground">{consultation.category}</span>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Question Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                        {consultation.title}
                      </h1>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Share2 className="h-5 w-5" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Bookmark className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {consultation.tags && consultation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {consultation.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="bg-secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Scale className="h-4 w-4" />
                      <span>{consultation.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{timeAgo(consultation.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{consultation.views ?? 0} مشاهدة</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{answers.length} إجابة</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Question Content */}
                  <div className="prose prose-slate max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-line">
                      {consultation.description}
                    </p>
                  </div>

                  {/* Question Author */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                          <span className="font-semibold text-accent">
                            {(consultation.author_name || "م").slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {consultation.author_name || "مستخدم"}
                          </p>
                        </div>
                      </div>
                      <ConsultationLikeButton
                        consultationId={consultation.id}
                        initialLikes={consultation.likes ?? 0}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Answers Section */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {answers.length} إجابة
                </h2>

                {answers.length === 0 ? (
                  <div className="text-center py-10 bg-secondary/10 rounded-lg">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                    <p className="text-muted-foreground font-medium">
                      لا توجد إجابات بعد
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      كن أول من يجيب على هذا السؤال
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {answers.map((answer: any) => (
                      <Card
                        key={answer.id}
                        className={answer.is_accepted ? "border-accent border-2" : ""}
                      >
                        {answer.is_accepted && (
                          <div className="bg-accent/10 px-6 py-2 border-b border-accent/20">
                            <div className="flex items-center gap-2 text-sm text-accent font-semibold">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>إجابة مقبولة من طارح السؤال</span>
                            </div>
                          </div>
                        )}

                        <CardContent className="pt-6 space-y-4">
                          {/* Answer Author */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 rounded-full bg-purple/10 flex items-center justify-center shrink-0">
                                <span className="font-semibold text-purple">
                                  {(answer.author_name || "م").slice(0, 2)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold">
                                  {answer.author_name || "مستخدم"}
                                </h3>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {timeAgo(answer.created_at)}
                            </div>
                          </div>

                          {/* Answer Content */}
                          <div className="prose prose-slate max-w-none">
                            <p className="text-foreground leading-relaxed whitespace-pre-line">
                              {answer.content}
                            </p>
                          </div>

                          {/* Answer Actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <AnswerLikeButton
                              answerId={answer.id}
                              initialLikes={answer.likes ?? 0}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Answer Form */}
              <AnswerForm consultationId={id} />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Lawyer CTA */}
              <Card className="bg-gradient-to-br from-purple/10 to-accent/10 border-purple/20">
                <CardContent className="pt-6 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-purple/20 flex items-center justify-center mx-auto">
                    <Award className="h-6 w-6 text-purple" />
                  </div>
                  <div>
                    <h3 className="font-bold">محامي؟</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      ساعد الناس وابني سمعتك المهنية
                    </p>
                  </div>
                  <Link href="/consultations">
                    <Button className="w-full bg-transparent" variant="outline">
                      ابدأ الإجابة
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">إحصائيات السؤال</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">مرات المشاهدة</span>
                    <span className="font-semibold">{consultation.views ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">الإعجابات</span>
                    <span className="font-semibold">{consultation.likes ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">الإجابات</span>
                    <span className="font-semibold">{answers.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">تاريخ النشر</span>
                    <span className="font-semibold">{timeAgo(consultation.created_at)}</span>
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
