"use client"

import { useState, useEffect } from "react"

export interface LocalUser {
  id: string
  name?: string
  email?: string
  role?: string
  image?: string
}

/**
 * Replaces useSession() from next-auth.
 * Reads user data from localStorage (set during login via /api/login).
 */
export function useUser() {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user")
      if (raw) {
        setUser(JSON.parse(raw))
      }
    } catch {
      // invalid JSON — ignore
    }
    setLoading(false)
  }, [])

  return { user, loading }
}
