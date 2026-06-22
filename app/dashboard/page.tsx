"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"

export default function DashboardRedirectPage() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace("/login")
      return
    }

    // Redirect based on role
    const role = user.role
    if (role === "lawyer") {
      router.replace("/dashboard/lawyer")
    } else if (role === "office") {
      router.replace("/dashboard/office")
    } else if (role === "client") {
      router.replace("/dashboard/client")
    } else {
      // fallback — no role assigned yet
      router.replace("/dashboard/office")
    }
  }, [user, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  )
}
