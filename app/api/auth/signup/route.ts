import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 422 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists", message: "This email is already registered" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Insert user
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        name: name || email.split("@")[0],
        email,
        password: hashedPassword,
        role: null,
      })
      .select("id, name, email, role")
      .single()

    if (insertError) {
      console.error("Signup insert error:", insertError)
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      )
    }

    const access_token = `session_${newUser.id}`
    return NextResponse.json(
      {
        success: true,
        user: newUser,
        access_token,
        token: access_token,
        message: "Account created successfully",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
