"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogoIcon } from "@/components/logo"
import {
  Home,
  Search,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle,
  Briefcase,
  Building2,
  Users,
  DollarSign,
  CheckSquare,
  HelpCircle,
} from "lucide-react"

type Role = "client" | "lawyer" | "office"

interface DashboardLayoutProps {
  children: React.ReactNode
  role: Role
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  // Define navigation items based on role
  const getNavItems = () => {
    switch (role) {
      case "client":
        return [
          { icon: Home, label: "لوحة التحكم", href: "/dashboard/client" },
          { icon: HelpCircle, label: "الاستشارات القانونية", href: "/consultations" },
          { icon: FileText, label: "قضاياي", href: "/dashboard/client/cases" },
        ]
      case "lawyer":
        return [
          { icon: Home, label: "لوحة التحكم", href: "/dashboard/lawyer" },
          { icon: HelpCircle, label: "الاستشارات القانونية", href: "/dashboard/lawyer/consultations" },
          { icon: FileText, label: "القضايا", href: "/dashboard/lawyer/cases" },
          { icon: CheckSquare, label: "المهام", href: "/dashboard/lawyer/tasks" },
          { icon: UserCircle, label: "الملف الشخصي", href: "/dashboard/lawyer/profile" },
        ]
      case "office":
        return [
          { icon: Home, label: "لوحة التحكم", href: "/dashboard/office" },
          { icon: FileText, label: "القضايا", href: "/dashboard/office/cases" },
          { icon: CheckSquare, label: "المهام", href: "/dashboard/office/tasks" },
          { icon: Users, label: "الفريق", href: "/dashboard/office/team" },
          { icon: DollarSign, label: "الماليات", href: "/dashboard/office/financials" },
        ]
    }
  }

  const navItems = getNavItems()

  const getRoleInfo = () => {
    switch (role) {
      case "client":
        return { icon: UserCircle, label: "حساب عميل", color: "text-accent" }
      case "lawyer":
        return { icon: Briefcase, label: "حساب محامي", color: "text-purple" }
      case "office":
        return { icon: Building2, label: "مكتب محاماة", color: "text-magenta" }
    }
  }

  const roleInfo = getRoleInfo()
  const RoleIcon = roleInfo.icon

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-sidebar text-sidebar-foreground border-l border-sidebar-border sticky top-0 h-screen shrink-0">
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-3">
            <LogoIcon className="h-10 w-10" />
            <span className="font-bold text-lg">قانون تك</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-11 ${isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-1">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 h-11 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">تسجيل الخروج</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6">
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <RoleIcon className={`h-5 w-5 ${roleInfo.color}`} />
            <span className="font-medium">{roleInfo.label}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                <RoleIcon className={`h-5 w-5 ${roleInfo.color}`} />
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 h-11 ${isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  </Link>
                )
              })}
              {role !== "lawyer" && (
                <Link href={`/dashboard/${role}/settings`} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">الإعدادات</span>
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-3 h-11 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">تسجيل الخروج</span>
              </Button>
            </nav>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
