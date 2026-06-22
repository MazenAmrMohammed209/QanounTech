import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireApiUserId } from "@/lib/auth-api"

const getGlobalRoleSelections = (): Map<string, { role: string; confirmed: boolean }> => {
  const g = globalThis as unknown as {
    __roleSelections?: Map<string, { role: string; confirmed: boolean }>
  }
  if (!g.__roleSelections) {
    g.__roleSelections = new Map()
  }
  return g.__roleSelections
}

const VALID_ROLES = ["Client", "Lawyer", "Office"] as const

/** List valid roles for onboarding UIs and API clients. */
export async function GET() {
  return NextResponse.json({
    availableRoles: [...VALID_ROLES],
    roles: [...VALID_ROLES],
  })
}

export async function POST(request: Request) {
  try {
    const authResult = await requireApiUserId(request)
    if (!authResult.ok) {
      return authResult.response
    }
    const userId = authResult.userId

    const body = await request.json()
    const { role, confirmed } = body

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 })
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: Client, Lawyer, Office" },
        { status: 400 }
      )
    }

    const roleSelections = getGlobalRoleSelections()
    roleSelections.set(userId, { role, confirmed: !!confirmed })

    if (confirmed) {
      const dbRole = role.toLowerCase()
      await supabaseAdmin.from("users").update({ role: dbRole }).eq("id", userId)
    }

    return NextResponse.json({
      success: true,
      role,
      confirmedRole: confirmed ? role : null,
      confirmed: !!confirmed,
      message: confirmed
        ? `Role ${role} selected and confirmed`
        : `Role ${role} selected but not confirmed`,
    })
  } catch (error) {
    console.error("Select role error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
