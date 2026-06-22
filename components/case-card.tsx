"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Scale, UserCircle, FileText, CheckCircle2, AlertCircle, LucideIcon } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type CaseStatus = "pending" | "in_progress" | "review" | "completed" | "on_hold"

export interface UserCase {
  id: string
  title: string
  category: string
  status: CaseStatus
  progress: number
  lawyer_name?: string
  updated_at: string
  started_at: string
  type: "case" | "consultation"
}

// ─── Status Map ───────────────────────────────────────────────────────────────

export const STATUS_MAP: Record<CaseStatus, { label: string; color: string; icon: LucideIcon }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  in_progress: { label: "قيد التنفيذ", color: "bg-purple/10   text-purple   border-purple/20", icon: AlertCircle },
  review: { label: "مراجعة", color: "bg-accent/10   text-accent   border-accent/20", icon: FileText },
  completed: { label: "مكتمل", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
  on_hold: { label: "معلّق", color: "bg-muted       text-muted-foreground border-muted", icon: Clock },
}


// ─── Progress Bar ─────────────────────────────────────────────────────────────

function CaseProgressBar({ progress }: { progress: number }) {
  const pct = Math.max(0, Math.min(100, progress))

  // Pick a colour that tracks completion level
  const barColor =
    pct >= 100 ? "bg-green-500" :
    pct >= 60  ? "bg-accent"    :
    pct >= 30  ? "bg-purple"    :
                 "bg-yellow-500"

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>التقدم</span>
        <span className="font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const info = STATUS_MAP[status]
  const Icon = info.icon
  return (
    <Badge className={`${info.color} flex items-center gap-1 border font-medium`}>
      <Icon className="h-3 w-3" />
      {info.label}
    </Badge>
  )
}

// ─── Time Helper ─────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days === 1) return "منذ يوم"
  if (days < 30) return `منذ ${days} أيام`
  const months = Math.floor(days / 30)
  return `منذ ${months} شهر`
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function CaseCard({ caseItem }: { caseItem: UserCase }) {
  return (
    <Card className="hover:border-accent/50 transition-colors group">
      <CardContent className="pt-5 space-y-4">

        {/* Top Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={caseItem.type === "case" ? "text-accent border-accent" : "text-magenta border-magenta"}>
                {caseItem.type === "case" ? "قضية" : "استشارة مجتمعية"}
              </Badge>
            </div>
            <h3 className="font-semibold text-foreground text-base leading-snug group-hover:text-accent transition-colors">
              {caseItem.title}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <Scale className="h-3.5 w-3.5 shrink-0" />
              <span>{caseItem.category}</span>
            </div>
          </div>
          <CaseStatusBadge status={caseItem.status} />
        </div>

        {/* Progress */}
        <CaseProgressBar progress={caseItem.progress} />

        {/* Bottom Row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
          {caseItem.lawyer_name && (
            <div className="flex items-center gap-1">
              <UserCircle className="h-3.5 w-3.5 shrink-0" />
              <span>المحامي: <span className="text-foreground font-medium">{caseItem.lawyer_name}</span></span>
            </div>
          )}
          <div className="flex items-center gap-1 mr-auto">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>آخر تحديث: {timeAgo(caseItem.updated_at)}</span>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
