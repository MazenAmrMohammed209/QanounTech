"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type UserRole = "client" | "lawyer" | "law-office" | null

interface AuthContextType {
  user: { email: string; role: UserRole } | null
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string; role: UserRole } | null>(null)

  const login = async (email: string, password: string, role?: UserRole) => {
    // Fake authentication
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Get role from stored data or use provided role
    const storedRole = (localStorage.getItem(`role_${email}`) as UserRole) || role || "client"

    setUser({ email, role: storedRole })
    localStorage.setItem("user", JSON.stringify({ email, role: storedRole }))
    return true
  }

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    // Fake signup
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Store role for this user
    localStorage.setItem(`role_${email}`, role)
    localStorage.setItem(`name_${email}`, name)

    setUser({ email, role })
    localStorage.setItem("user", JSON.stringify({ email, role }))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
