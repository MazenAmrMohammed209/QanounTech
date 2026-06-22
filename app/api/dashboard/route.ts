import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth-api"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { createServerClient } from "@/lib/supabase/server"

const getGlobalRoleSelections = (): Map<string, { role: string; confirmed: boolean }> => {
  const g = globalThis as unknown as { __roleSelections?: Map<string, { role: string; confirmed: boolean }> }
  if (!g.__roleSelections) {
    g.__roleSelections = new Map()
  }
  return g.__roleSelections
}

function dbRoleToDashboardKey(
  role: string | null
): "Client" | "Lawyer" | "Office" | null {
  if (!role) return null
  const r = role.toLowerCase()
  if (r === "client") return "Client"
  if (r === "lawyer") return "Lawyer"
  if (r === "office") return "Office"
  return null
}

const roleDashboards: Record<string, { sidebar: Record<string, unknown>; workspace: Record<string, unknown> }> = {
  Client: {
    sidebar: {
      title: "Client Dashboard",
      roles: ["client"],
      items: ["My Consultations", "Book Consultation", "My Profile"],
    },
    workspace: {
      title: "Client Workspace",
      features: ["consultations", "booking", "profile"],
    },
  },
  Lawyer: {
    sidebar: {
      title: "Lawyer Dashboard",
      roles: ["lawyer"],
      items: ["Case Management", "Client List", "Schedule", "My Profile"],
    },
    workspace: {
      title: "Lawyer Workspace",
      features: ["case_management", "clients", "schedule", "profile"],
    },
  },
  Office: {
    sidebar: {
      title: "Office Dashboard",
      roles: ["office"],
      items: ["Client Management", "Lawyer Management", "Reports", "Settings"],
    },
    workspace: {
      title: "Office Workspace",
      features: ["client_management", "lawyer_management", "reports", "settings"],
    },
  },
}

const defaultQuickLinks = [
  { href: "/consultations", label: "Consultations" },
  { href: "/discovery", label: "Discovery" },
  { href: "/client/profile", label: "My profile" },
]

export async function GET(request: Request) {
  const authResult = await requireApiUserId(request)
  if (!authResult.ok) {
    return authResult.response
  }

  const userId = authResult.userId

  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .single()

  const roleSelections = getGlobalRoleSelections()
  const selection = roleSelections.get(userId)

  // Block only if API left a pending selection and the user still has no role in DB
  if (selection && !selection.confirmed && !dbUser?.role) {
    return NextResponse.json(
      {
        error:
          "Role selection unconfirmed. Please confirm your role before accessing the dashboard.",
        validation: "confirm role required",
      },
      { status: 403 }
    )
  }

  const fromMap = selection?.confirmed ? selection.role : null
  const fromDb = dbRoleToDashboardKey(dbUser?.role ?? null)
  const effectiveKey = fromMap ?? fromDb

  const supabase = createServerClient()
  const { data: consultations } = await supabase
    .from("consultations")
    .select("id, title, category, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)

  const pastConsultations = consultations ?? []
  const summaryStats = {
    total: pastConsultations.length,
  }

  if (effectiveKey && roleDashboards[effectiveKey]) {
    const dashboard = roleDashboards[effectiveKey]
    return NextResponse.json({
      ...dashboard,
      pastConsultations,
      summaryStats,
      quickLinks: defaultQuickLinks,
    })
  }

  return NextResponse.json({
    pastConsultations,
    summaryStats,
    quickLinks: defaultQuickLinks,
  })
}
