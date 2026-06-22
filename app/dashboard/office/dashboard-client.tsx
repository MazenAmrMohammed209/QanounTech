import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { ExportButton } from "./export-button"
import { fetchCasesAction } from "@/app/actions/cases"
import { fetchTeamAction } from "@/app/actions/team"
import { timeAgo } from "@/utils/time-utils"


const mockStats = {
  totalCases: 42,
  activeCases: 15,
  completionRate: 78,
}

const mockFinancials = {
  revenue: 125000,
  expenses: 35000,
  other_income: 5000,
  billed_hours: 450,
}

const mockNotifications = [
  { id: "1", type: "deadline", title: "موعد نهائي قريب", description: "تقديم مذكرة الدفاع في قضية رقم 2024-004", created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() }, // 2 hours ago
  { id: "2", type: "payment", title: "دفعة جديدة", description: "تم استلام دفعة من العميل أ. محمد", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }, // 1 day ago
  { id: "3", type: "case_update", title: "تحديث قضية", description: "تم تعيين محامي جديد لقضية العقارات", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() }, // 3 days ago
]

export default async function DashboardClient({ role }: { role: "client" | "lawyer" | "office" }) {
  const [teamRes, casesRes] = await Promise.all([
    fetchTeamAction(),
    fetchCasesAction()
  ])

  const teamMembers: any[] = teamRes.data || []
  const casesData: any[] = casesRes.data || []

  const cases = casesData.map((c: any) => ({
    id: c.id,
    title: c.title,
    category: c.case_type || "عام",
    progress: c.progress || 0,
    status: c.status || "review",
    priority: "normal",
    case_number: c.id?.substring(0, 8),
    due_at: c.session_date,
  }))

  const notifications = mockNotifications
  const financials = mockFinancials

  const stats = {
    ...mockStats,
    activeLawyers: teamMembers.length,
    totalCases: cases.length > 0 ? cases.length : mockStats.totalCases,
    activeCases: cases.filter(c => c.status !== "done").length,
  }

  const netRevenue = (financials.revenue || 0) + (financials.other_income || 0) - (financials.expenses || 0)

  // Case distribution by category
  const categoryCount: Record<string, number> = {}
  cases.forEach((c) => { categoryCount[c.category] = (categoryCount[c.category] || 0) + 1 })
  const totalCases = cases.length
  const caseDistribution = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalCases > 0 ? Math.round((count / totalCases) * 100) : 0,
    }))

  const DISTRIBUTION_COLORS = [
    "bg-magenta",
    "bg-purple",
    "bg-accent",
    "bg-magenta/70",
    "bg-purple/70",
  ]

  return (
    <DashboardLayout role={role}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">نظرة عامة على المكتب</h1>
            <p className="text-muted-foreground mt-1">مراقبة أداء مكتب المحاماة الخاص بك ونشاط الفريق</p>
          </div>
          <ExportButton teamMembers={teamMembers} cases={cases} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي القضايا</CardTitle>
              <FileText className="h-4 w-4 text-magenta" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCases}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <span>{stats.activeCases} نشطة</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">أعضاء الفريق</CardTitle>
              <Users className="h-4 w-4 text-purple" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">في الفريق</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">الإيرادات الشهرية</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" dir="ltr">
                ${Math.round(financials.revenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">هذا الشهر</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">معدل الإنجاز</CardTitle>
              <TrendingUp className="h-4 w-4 text-magenta" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate ?? 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">من إجمالي القضايا</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Team Performance */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>أعضاء الفريق</CardTitle>
                  <CardDescription>أعضاء فريق المكتب المسجلين</CardDescription>
                </div>
                <Link href="/dashboard/office/team">
                  <Button variant="outline" size="sm">عرض الفريق بالكامل</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamMembers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا يوجد أعضاء فريق</p>
                </div>
              ) : (
                teamMembers.map((member: any) => {
                  const initials = (member.full_name || "M")
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                  
                  const teamColors = ["bg-purple/10 text-purple", "bg-accent/10 text-accent", "bg-magenta/10 text-magenta"]
                  const colorIdx = teamMembers.indexOf(member) % teamColors.length

                  return (
                    <div key={member.id} className="border border-border rounded-lg p-4 hover:border-magenta/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${teamColors[colorIdx]}`}>
                            <span className="font-semibold">{initials}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{member.full_name}</h4>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-secondary/30 border-muted/50">
                          {member.specialization || "عام"}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Critical Tasks / Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>تنبيهات هامة</CardTitle>
                <CardDescription>عناصر تتطلب الاهتمام</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد تنبيهات</p>
                ) : (
                  notifications.map((notif) => {
                    const iconMap: Record<string, { icon: typeof AlertCircle; colorClass: string }> = {
                      deadline: { icon: AlertCircle, colorClass: "bg-destructive/10 text-destructive" },
                      payment: { icon: Clock, colorClass: "bg-magenta/10 text-magenta" },
                      case_update: { icon: Users, colorClass: "bg-purple/10 text-purple" },
                    }
                    const info = iconMap[notif.type] || { icon: AlertCircle, colorClass: "bg-destructive/10 text-destructive" }
                    const Icon = info.icon
                    return (
                      <div key={notif.id} className="flex gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${info.colorClass}`}>
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

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>الملخص المالي</CardTitle>
                <CardDescription>نظرة عامة على هذا الشهر</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">الإيرادات</span>
                    <span className="font-semibold" dir="ltr">
                      ${Math.round(financials.revenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">المصروفات</span>
                    <span className="font-semibold text-destructive" dir="ltr">
                      -${Math.round(financials.expenses || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">إيرادات أخرى</span>
                    <span className="font-semibold" dir="ltr">
                      ${Math.round(financials.other_income || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">صافي الإيرادات</span>
                      <span className="font-bold text-lg text-accent" dir="ltr">
                        ${Math.round(netRevenue).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Case Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>توزيع القضايا</CardTitle>
                <CardDescription>القضايا حسب مجال الممارسة</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {caseDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
            ) : (
              <div className="space-y-3">
                {caseDistribution.map((item, idx) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium">{item.category}</span>
                      <span className="text-muted-foreground">
                        {item.count} قضية ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${DISTRIBUTION_COLORS[idx % DISTRIBUTION_COLORS.length]}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
