"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ClipboardList, Briefcase, TrendingUp, Save, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function LawyerProfilePage() {
  const params = useParams()
  const id = params.id as string

  const supabase = createClient()

  const [lawyer, setLawyer] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const [addingTask, setAddingTask] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!id) return

      setLoading(true)

      // lawyer
      const { data: lawyerData } = await supabase
        .from("office_lawyers")
        .select("*")
        .eq("id", id)
        .single()

      setLawyer(lawyerData)
      setNewName(lawyerData?.full_name || "")
      setNewEmail(lawyerData?.email || "")
      setNewPhone(lawyerData?.phone || "")

      // tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", id)

      setTasks(tasksData || [])

      // cases
      const { data: casesData } = await supabase
        .from("cases")
        .select("*")
        .or(`assigned_lawyer.eq.${id},assigned_to.eq.${id}`)

      setCases(casesData || [])

      setLoading(false)
    }

    loadData()
  }, [id])

  const updateLawyer = async () => {
    if (!id) return
    setSaving(true)

    const { data, error } = await supabase
      .from("office_lawyers")
      .update({
        full_name: newName,
        email: newEmail,
        phone: newPhone,
      })
      .eq("id", id)
      .select()
      .single()

    console.log("UPDATED:", data)
    console.log("ERROR:", error)

    if (error) {
      console.error("Update error details:", JSON.stringify(error))
      alert("حدث خطأ أثناء الحفظ: " + error.message)
      setSaving(false)
      return
    }

    if (data) {
      setLawyer(data)
      setNewName(data.full_name || "")
      setNewEmail(data.email || "")
      setNewPhone(data.phone || "")
    }

    setSaving(false)
    alert("تم حفظ التعديلات بنجاح")
  }

  const createTask = async () => {
    if (!newTaskTitle.trim()) return
    setAddingTask(true)

    await supabase.from("tasks").insert({
      title: newTaskTitle,
      assigned_to: id,
      status: "pending",
      office_id: "fe42396a-892e-40a5-8bf0-5aa8884cf91c" // Ensure office context if needed
    })

    setNewTaskTitle("")

    // reload tasks
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("assigned_to", id)

    setTasks(data || [])
    setAddingTask(false)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground text-lg">جاري التحميل...</div>
      </div>
    )
  }

  const completedTasks = tasks.filter((t) => t.status === "completed").length
  const completionRate = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0

  const statusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/15 text-green-400 border-green-500/30"
      case "in_progress":
      case "in-progress":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30"
      case "pending":
        return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-secondary/30 text-muted-foreground border-muted/50"
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "مكتمل"
      case "in_progress":
      case "in-progress":
        return "قيد التنفيذ"
      case "pending":
        return "معلّق"
      default:
        return status || "—"
    }
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Back link + Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/office/team"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للفريق
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-foreground">
        {lawyer?.full_name || lawyer?.name || "محامي"}
      </h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple/15 flex items-center justify-center shrink-0">
              <ClipboardList className="w-6 h-6 text-purple" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">عدد المهام</p>
              <p className="text-2xl font-bold">{tasks.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-magenta/15 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 text-magenta" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">عدد القضايا</p>
              <p className="text-2xl font-bold">{cases.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نسبة الإنجاز</p>
              <p className="text-2xl font-bold" dir="ltr">{completionRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile + Assign Task Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lawyer Info / Edit */}
        <Card>
          <CardHeader>
            <CardTitle>✏️ معلومات المحامي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">الاسم</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="اسم المحامي"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">البريد الإلكتروني</label>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                dir="ltr"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">الهاتف</label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="01012345678"
                dir="ltr"
                type="tel"
              />
            </div>
            {lawyer?.specialization && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">التخصص</label>
                <div className="text-sm bg-secondary/20 rounded-lg px-3 py-2.5 border border-border">
                  {lawyer.specialization}
                </div>
              </div>
            )}
            <Button
              onClick={updateLawyer}
              disabled={saving}
              className="w-full gap-2 bg-magenta hover:bg-magenta/90 text-white"
            >
              <Save className="w-4 h-4" />
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </CardContent>
        </Card>

        {/* Assign Task */}
        <Card>
          <CardHeader>
            <CardTitle>➕ تعيين مهمة جديدة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">عنوان المهمة</label>
              <Input
                placeholder="عنوان المهمة"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>
            <Button
              onClick={createTask}
              disabled={addingTask || !newTaskTitle.trim()}
              className="w-full gap-2 bg-purple hover:bg-purple/90 text-white"
            >
              <Plus className="w-4 h-4" />
              {addingTask ? "جاري الإضافة..." : "إضافة مهمة"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>📋 المهام ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              لا توجد مهام حالياً
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border hover:bg-secondary/20 transition-colors"
                >
                  <span className="font-medium text-sm">{t.title}</span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border ${statusColor(
                      t.status
                    )}`}
                  >
                    {statusLabel(t.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cases List */}
      <Card>
        <CardHeader>
          <CardTitle>⚖️ القضايا ({cases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              لا توجد قضايا حالياً
            </p>
          ) : (
            <div className="space-y-2">
              {cases.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border hover:bg-secondary/20 transition-colors"
                >
                  <span className="font-medium text-sm">{c.title || c.case_number || "قضية"}</span>
                  {c.status && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border ${statusColor(
                        c.status
                      )}`}
                    >
                      {statusLabel(c.status)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
