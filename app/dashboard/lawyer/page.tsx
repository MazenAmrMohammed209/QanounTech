"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/hooks/use-user"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  MessageSquare,
  Clock,
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { timeAgo } from "@/utils/time-utils"
import { createClient } from "@/utils/supabase/client"

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  critical: { label: "حرجة", color: "bg-destructive/10 text-destructive border-destructive/20" },
  high: { label: "عالية", color: "bg-destructive/10 text-destructive border-destructive/20" },
  normal: { label: "متوسطة", color: "bg-accent/10 text-accent border-accent/20" },
  low: { label: "عادية", color: "bg-purple/10 text-purple border-purple/20" },
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "bg-magenta/10 text-magenta border-magenta/20" },
  in_progress: { label: "قيد التنفيذ", color: "bg-purple/10 text-purple border-purple/20" },
  review: { label: "مراجعة", color: "bg-accent/10 text-accent border-accent/20" },
  completed: { label: "مكتمل", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  critical: { label: "حرجة", color: "bg-destructive/10 text-destructive border-destructive/20" },
}

function formatTime(dateStr: string): { time: string; period: string } {
  const d = new Date(dateStr)
  const hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, "0")
  const period = hours >= 12 ? "مساءً" : "صباحاً"
  const h12 = hours % 12 || 12
  return { time: `${h12}:${minutes}`, period }
}

const STATIC_MESSAGES = [
  { id: 1, name: "محمد علي", message: "متى موعد الجلسة القادمة؟", date: new Date().toISOString() },
  { id: 2, name: "شركة الأفق", message: "تم إرسال المستندات المطلوبة", date: new Date().toISOString() }
];

const STATIC_NOTIFICATIONS = [
  { id: 1, text: "تم تحديد موعد جلسة لقضية رقم 102", time: "قبل ساعتين" },
  { id: 2, text: "تم إرفاق مستند جديد في قضية العمال", time: "قبل 5 ساعات" }
];

export default function LawyerDashboardPage() {
  const { user: localUser, loading: userLoading } = useUser()
  const [tasks, setTasks] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("المحامي")
  
  const supabase = createClient()
const toggleTask = async (taskId: string, currentStatus: string) => {
  const newStatus = currentStatus === "completed" ? "in_progress" : "completed"

  // Optimistic UI
  setTasks(prev =>
    prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    )
  )

  const { error } = await supabase
    .from("tasks")
    .update({ status: newStatus })
    .eq("id", taskId)

  if (error) {
    console.error("Update failed:", error)

    // rollback لو حصل error
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, status: currentStatus } : t
      )
    )
  }
}
  useEffect(() => {
    async function loadDashboardData() {
      if (userLoading) {
        setLoading(true)
        return
      }

      if (!localUser?.id) {
        console.log("No authenticated user found.")
        setLoading(false)
        return
      }

      setLoading(true)

      const user = localUser
      setUserName(user.name || user.email || "المحامي")

      try {
        // 1. Fetch tasks assigned to this user
        const { data: userTasks, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("assigned_to", user.id)
          .order("created_at", { ascending: false })

        console.log("TASKS:", userTasks, tasksError)
        console.log("TASK COUNT:", userTasks?.length)

        if (tasksError) throw tasksError
        const tasksData = userTasks || []
        setTasks(tasksData)

        // 2. Extract unique case IDs using a Set to avoid duplicates
        const caseIds = [...new Set(tasksData.map(t => t.case_id).filter(Boolean))]

        // 3. Fetch related cases using the extracted IDs
        if (caseIds.length > 0) {
          const { data: relatedCases, error: casesError } = await supabase
            .from("cases")
            .select("*")
            .in("id", caseIds)
            .order("created_at", { ascending: false })

          if (casesError) throw casesError
          setCases(relatedCases || [])
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [localUser, userLoading])

  // Derived statistics
  const activeCases = cases.filter(c => c.status !== "completed")
  const pendingTasks = tasks.filter(t => t.status !== "completed" && t.status !== "done")
  const completedTasks = tasks.filter(t => t.status === "completed" || t.status === "done")

  const stats = {
    activeCasesCount: activeCases.length,
    pendingTasksCount: pendingTasks.length,
    completedTasksCount: completedTasks.length,
    totalCasesCount: cases.length
  }

  // Enriched tasks with case data
  const enrichedPendingTasks = pendingTasks.map(t => {
    const relatedCase = cases.find(c => c.id === t.case_id)
    return { ...t, case_title: relatedCase?.title, case_number: relatedCase?.case_number }
  })
  
  const enrichedCompletedTasks = completedTasks.map(t => {
    const relatedCase = cases.find(c => c.id === t.case_id)
    return { ...t, case_title: relatedCase?.title, case_number: relatedCase?.case_number }
  })

  // Calculate upcoming deadlines (within 7 days)
  const upcomingDeadlinesCount = tasks.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    const diff = d.getTime() - new Date().getTime();
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  // if (loading) {
  //   return (
  //     <DashboardLayout role="lawyer">
  //       <div className="p-6 flex justify-center items-center h-[60vh]">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magenta"></div>
  //       </div>
  //     </DashboardLayout>
  //   )
  // }

  return (
    <DashboardLayout role="lawyer">
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">مرحباً بك، {userName}</h1>
          <p className="text-muted-foreground mt-1">
            لديك {stats.pendingTasksCount} مهام قيد الانتظار مرتبطة بـ {stats.activeCasesCount} قضايا نشطة
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي القضايا</CardTitle>
              <FileText className="h-4 w-4 text-purple" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalCasesCount}</div>
              <p className="text-xs text-muted-foreground mt-1">{loading ? "..." : stats.activeCasesCount} قضايا نشطة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">المهام المعلقة</CardTitle>
              <CheckSquare className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.pendingTasksCount}</div>
              <p className="text-xs text-muted-foreground mt-1">{loading ? "..." : stats.completedTasksCount} مهام مكتملة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">رسائل العملاء</CardTitle>
              <MessageSquare className="h-4 w-4 text-magenta" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : STATIC_MESSAGES.length}</div>
              <p className="text-xs text-muted-foreground mt-1">إشعارات جديدة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">مواعيد نهائية</CardTitle>
              <Clock className="h-4 w-4 text-purple" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : upcomingDeadlinesCount}</div>
              <p className="text-xs text-muted-foreground mt-1">خلال 7 أيام</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Assigned Tasks */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>المهام المسندة إليك</CardTitle>
                  <CardDescription>مهامك مرتبة حسب الأولوية وحالة التنفيذ</CardDescription>
                </div>
                <Link href="/dashboard/lawyer/tasks">
                  <Button variant="outline" size="sm">عرض الكل</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-center py-10 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magenta mx-auto mb-3"></div>
                  <p className="font-medium">جاري تحميل المهام...</p>
                </div>
              ) : enrichedPendingTasks.length === 0 && enrichedCompletedTasks.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد مهام مسندة إليك</p>
                  <p className="text-sm mt-1">ستظهر المهام هنا عند إضافتها من قبل المكتب</p>
                </div>
              ) : (
                <>
                  {enrichedPendingTasks.slice(0, 3).map((task) => {
                    const prioInfo = PRIORITY_MAP[task.priority] || PRIORITY_MAP.normal
                    const statusInfo = STATUS_MAP[task.status] || STATUS_MAP.pending
                    
                    return (
                      <div key={task.id} className="border border-border rounded-lg p-4 hover:border-purple/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 rounded border-input"
                            checked={task.status === "completed"}
                            onChange={() => toggleTask(task.id, task.status)}
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-foreground">{task.title}</h4>
                                {task.case_title && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    قضية: {task.case_title}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="outline" className={statusInfo.color}>{statusInfo.label}</Badge>
                                <Badge className={prioInfo.color}>{prioInfo.label}</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {task.due_date && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{new Date(task.due_date).toLocaleDateString("ar-EG")}</span>
                                </div>
                              )}
                              {task.case_number && (
                                <div className="flex items-center gap-1">
                                  <FileText className="h-4 w-4" />
                                  <span>رقم #{task.case_number}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {enrichedCompletedTasks.slice(0, 1).map((task) => (
                    <div key={task.id} className="border border-border rounded-lg p-4 hover:border-purple/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-input"
                          checked={true}
                          onChange={() => toggleTask(task.id, task.status)}
                        />
                        <div className="flex-1 opacity-60">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-foreground line-through">{task.title}</h4>
                              {task.case_title && (
                                <p className="text-sm text-muted-foreground mt-1">قضية: {task.case_title}</p>
                              )}
                            </div>
                            <Badge className="bg-muted text-muted-foreground border-muted">مكتملة</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* Sidebar / Case Alerts */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تنبيهات القضايا</CardTitle>
                <CardDescription>آخر التحديثات في قضاياك ({STATIC_NOTIFICATIONS.length})</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">جاري تحميل التنبيهات...</div>
                ) : STATIC_NOTIFICATIONS.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد تنبيهات جديدة</p>
                ) : (
                  STATIC_NOTIFICATIONS.map(notif => (
                    <div key={notif.id} className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                      <AlertCircle className="h-5 w-5 text-purple shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{notif.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Cases */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>القضايا المرتبطة بمهامك</CardTitle>
                <CardDescription>قائمة القضايا التي تم تكليفك بمهام فيها</CardDescription>
              </div>
              <Link href="/dashboard/lawyer/cases">
                <Button variant="outline" size="sm">عرض كل القضايا</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
               <div className="text-center py-10 text-muted-foreground">جاري تحميل القضايا...</div>
            ) : cases.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">لا توجد قضايا مرتبطة</p>
                <p className="text-sm mt-1">لم يتم تعيين أي مهام مرتبطة بقضايا حتى الآن</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cases.map((caseItem) => {
                  const statusInfo = STATUS_MAP[caseItem.priority === "critical" ? "critical" : caseItem.status] || STATUS_MAP.pending
                  const caseTasks = tasks.filter(t => t.case_id === caseItem.id)
                  
                  return (
                    <div key={caseItem.id} className="border border-border rounded-lg p-4 hover:border-purple/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{caseItem.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{caseItem.category || "عام"}</p>
                        </div>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </div>
                      
                      {/* Case Progress */}
                      <div className="mt-4 mb-3 space-y-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span>نسبة الإنجاز</span>
                          <span className="font-medium">{caseItem.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div 
                            className="bg-magenta h-1.5 rounded-full" 
                            style={{ width: `${caseItem.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground pt-3 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1"><CheckSquare className="h-3 w-3" /> المهام الخاصة بك</span>
                          <span className="font-medium text-foreground">{caseTasks.length} مهام</span>
                        </div>
                        {caseItem.case_number && (
                          <div className="flex items-center justify-between">
                            <span>رقم القضية</span>
                            <span>#{caseItem.case_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
