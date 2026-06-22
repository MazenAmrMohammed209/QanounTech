"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { CaseCard, type UserCase, type CaseStatus, STATUS_MAP } from "../../../../components/case-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Clock, CheckCircle2, AlertCircle, Search } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string
  value: number
  icon: typeof FileText
  colorClass: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl bg-secondary/20">
      <div className="h-24 w-24 rounded-full bg-accent/10 flex items-center justify-center mb-6">
        <FileText className="h-12 w-12 text-accent opacity-60" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">لا توجد قضايا أو استشارات بعد</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        لم تقم ببدء أي قضية أو طرح استشارة حتى الآن. ابدأ بالتواصل مع محامٍ أو طرح سؤال مجتمعي.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/consultations/ask">
          <Button size="lg" className="gap-2">
            <FileText className="h-5 w-5" />
            طرح استشارة
          </Button>
        </Link>
        <Link href="/discovery">
          <Button size="lg" variant="outline" className="gap-2 bg-transparent">
            <Search className="h-5 w-5" />
            ابحث عن محامٍ
          </Button>
        </Link>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyCasesPage() {
  const [cases, setCases] = useState<UserCase[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadCases() {
      try {
        const userStr = localStorage.getItem("user")
        if (!userStr) {
          setIsLoading(false)
          return
        }

        const userObj = JSON.parse(userStr)
        const userId = userObj.id

        // Fetch using the public supabase client directly
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
        )

        const [casesRes, consultationsRes] = await Promise.all([
          supabase.from("cases").select("*").eq("user_id", userId),
          supabase.from("consultations").select("*").eq("user_id", userId),
        ])

        const casesData = casesRes.data || []
        const consultationsData = consultationsRes.data || []

        const mappedCases: UserCase[] = casesData.map((c: any) => ({
          id: c.id,
          title: c.title || "استشارة قانونية",
          category: c.case_type || "استشارة",
          status: c.status || "in_progress",
          progress: c.progress || 10,
          lawyer_name: c.lawyer_name || c.office_name || "غير محدد",
          updated_at: c.created_at || new Date().toISOString(),
          started_at: c.created_at || new Date().toISOString(),
          type: "case",
        }))

        const mappedConsultations: UserCase[] = consultationsData.map((c: any) => ({
          id: c.id,
          title: c.title || "استشارة مجتمعية",
          category: c.category || "استشارة عامة",
          status: "pending",
          progress: 0,
          lawyer_name: "مفتوحة للإجابات",
          updated_at: c.created_at || new Date().toISOString(),
          started_at: c.created_at || new Date().toISOString(),
          type: "consultation",
        }))

        const merged = [...mappedCases, ...mappedConsultations].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )

        setCases(merged)
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadCases()
  }, [])

  const totalCases = cases.length
  const activeCases = cases.filter((c) => c.status !== "completed" && c.status !== "on_hold").length
  const completedCases = cases.filter((c) => c.status === "completed").length
  const pendingCases = cases.filter((c) => c.status === "pending").length

  return (
    <DashboardLayout role="client">
      <div className="p-6 space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">قضاياي</h1>
            <p className="text-muted-foreground mt-1">تتبع جميع قضاياك القانونية في مكان واحد</p>
          </div>
          <Link href="/discovery">
            <Button className="gap-2" size="lg">
              <Search className="h-5 w-5" />
              ابحث عن محامٍ
            </Button>
          </Link>
        </div>

        {/* ── Summary Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="إجمالي القضايا"
            value={totalCases}
            icon={FileText}
            colorClass="bg-accent/10 text-accent"
          />
          <SummaryCard
            label="القضايا النشطة"
            value={activeCases}
            icon={AlertCircle}
            colorClass="bg-purple/10 text-purple"
          />
          <SummaryCard
            label="قيد الانتظار"
            value={pendingCases}
            icon={Clock}
            colorClass="bg-yellow-500/10 text-yellow-600"
          />
          <SummaryCard
            label="المكتملة"
            value={completedCases}
            icon={CheckCircle2}
            colorClass="bg-green-500/10 text-green-600"
          />
        </div>

        {/* ── Cases List ──────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="py-20 text-center animate-pulse">
            <h3 className="text-xl font-semibold text-foreground mb-2">جاري تحميل القضايا...</h3>
          </div>
        ) : cases.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              جميع القضايا ({cases.length})
            </h2>
            <div className="grid gap-4">
              {cases.map((c) => (
                <CaseCard key={c.id} caseItem={c} />
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
