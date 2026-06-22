import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, MessageSquare, Clock, CheckCircle2, AlertCircle, TrendingUp, Scale } from "lucide-react"
import Link from "next/link"
import { getClientCases } from "@/lib/supabase/queries/cases"
import { getDashboardStats } from "@/lib/supabase/queries/cases"
import { getNotifications } from "@/lib/supabase/queries/notifications"
import { timeAgo } from "@/utils/time-utils"

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "bg-magenta/10 text-magenta border-magenta/20" },
  in_progress: { label: "قيد التنفيذ", color: "bg-purple/10 text-purple border-purple/20" },
  review: { label: "مراجعة", color: "bg-accent/10 text-accent border-accent/20" },
  completed: { label: "مكتمل", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  on_hold: { label: "معلّق", color: "bg-muted text-muted-foreground border-muted" },
}

const NOTIFICATION_ICONS: Record<string, { icon: typeof CheckCircle2; colorClass: string }> = {
  case_update: { icon: CheckCircle2, colorClass: "bg-accent/10 text-accent" },
  message: { icon: MessageSquare, colorClass: "bg-purple/10 text-purple" },
  deadline: { icon: AlertCircle, colorClass: "bg-magenta/10 text-magenta" },
  document: { icon: FileText, colorClass: "bg-accent/10 text-accent" },
  payment: { icon: TrendingUp, colorClass: "bg-green-500/10 text-green-600" },
}


import { ClientWelcome } from "./client-welcome"

const mockCases = [
  { id: "1", title: "صياغة عقود تجارية", category: "عقود", progress: 65, status: "in_progress", lawyer_name: "أحمد عبدالله", started_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
  { id: "2", title: "استشارة قانونية - تأسيس شركة", category: "شركات", progress: 90, status: "review", lawyer_name: "سارة محمد", started_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
  { id: "3", title: "نزاع ملكية", category: "عقارات", progress: 20, status: "pending", lawyer_name: "خالد سعيد", started_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
];

const mockStats = {
  activeCases: 3,
  inProgressCases: 1,
  unreadMessages: 2,
  upcomingDeadlines: 1,
};

const mockNotifications = [
  { id: "1", type: "message", title: "رسالة جديدة", description: "المحامي أحمد رد على استفسارك", created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() }, // 30 mins ago
  { id: "2", type: "document", title: "مستند مطلوب", description: "الرجاء رفع الهوية الوطنية للقضية رقم 1", created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() }, // 5 hours ago
  { id: "3", type: "case_update", title: "تحديث القضية", description: "تم تقديم أوراق تأسيس الشركة للجهات المختصة", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }, // 1 day ago
];

export default async function ClientDashboardPage() {
  const role = "client"

  const cases = mockCases;
  const stats = mockStats;
  const notifications = mockNotifications;

  const activeCases = cases.filter((c) => c.status !== "completed")
  const overallProgress = activeCases.length > 0
    ? Math.round(activeCases.reduce((sum, c) => sum + c.progress, 0) / activeCases.length)
    : 0

  return (
    <DashboardLayout role={role}>
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <ClientWelcome />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">القضايا النشطة</CardTitle>
              <FileText className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCases}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.inProgressCases} قيد التنفيذ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">رسائل غير مقروءة</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">إشعارات جديدة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">مواعيد قادمة</CardTitle>
              <Clock className="h-4 w-4 text-magenta" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingDeadlines}</div>
              <p className="text-xs text-muted-foreground mt-1">خلال 7 أيام</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">نسبة التقدم</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallProgress}%</div>
              <p className="text-xs text-muted-foreground mt-1">معدل الإنجاز الكلي</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Cases */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>القضايا النشطة</CardTitle>
                  <CardDescription>تتبع شؤونك القانونية الجارية</CardDescription>
                </div>
                <Link href="/dashboard/client/cases">
                  <Button variant="outline" size="sm">عرض الكل</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeCases.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد قضايا نشطة بعد</p>
                  <p className="text-sm mt-1">ابدأ بالبحث عن محامي وتقديم قضيتك الأولى</p>
                </div>
              ) : (
                activeCases.slice(0, 3).map((caseItem) => {
                  const statusInfo = STATUS_MAP[caseItem.status] || STATUS_MAP.pending
                  return (
                    <div key={caseItem.id} className="border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{caseItem.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            المحامي: {caseItem.lawyer_name || "لم يتم التعيين"}
                          </p>
                        </div>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{timeAgo(caseItem.started_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Scale className="h-4 w-4" />
                          <span>{caseItem.category}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">التقدم</span>
                          <span className="font-medium">{caseItem.progress}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-accent transition-all" style={{ width: `${caseItem.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Recent Notifications */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
                <CardDescription>الأدوات والميزات الشائعة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/discovery">
                  <Button variant="outline" className="w-full justify-start gap-3 h-11 bg-transparent">
                    <Search className="h-5 w-5 text-accent" />
                    <span>ابحث عن محامي</span>
                  </Button>
                </Link>
                <Link href="/consultations">
                  <Button variant="outline" className="w-full justify-start gap-3 h-11 bg-transparent">
                    <MessageSquare className="h-5 w-5 text-purple" />
                    <span>الاستشارات القانونية</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>آخر التحديثات</CardTitle>
                <CardDescription>أحدث النشاطات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد إشعارات جديدة</p>
                ) : (
                  notifications.slice(0, 3).map((notif) => {
                    const iconInfo = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.case_update
                    const Icon = iconInfo.icon
                    return (
                      <div key={notif.id} className="flex gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${iconInfo.colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{notif.title}</p>
                          {notif.description && (
                            <p className="text-xs text-muted-foreground">{notif.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.created_at)}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
