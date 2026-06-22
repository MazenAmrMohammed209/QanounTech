import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth-api"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getUserProfile } from "@/lib/supabase/queries/profiles"

export async function GET(request: Request) {
  try {
    const authResult = await requireApiUserId(request)
    if (!authResult.ok) {
      return authResult.response
    }
    const userId = authResult.userId

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, role, image")
      .eq("id", userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const profile = await getUserProfile(userId)

    return NextResponse.json({
      ...user,
      profile: profile || null,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireApiUserId(request)
    if (!authResult.ok) {
      return authResult.response
    }
    const userId = authResult.userId

    const body = await request.json()

    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json(
        { error: "Name is required and cannot be empty" },
        { status: 400 }
      )
    }

    const updateData: Record<string, string> = {
      name: body.name.trim(),
    }

    if (body.role) {
      updateData.role = body.role
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", userId)

    if (error) {
      console.error("Update profile error:", error)
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, ...updateData })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
