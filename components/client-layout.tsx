"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Menu, X, UserCircle, ChevronDown } from "lucide-react"

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }



  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Logo className="h-8" />
            </Link>

            {/* Desktop Navigation Tabs Removed as requested */}

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Profile Avatar */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-accent" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                    <div className="absolute left-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50 py-2">
                      <Link
                        href="/client/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-accent/10 transition-colors"
                      >
                        الملف الشخصي
                      </Link>
                      <div className="border-t border-border my-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-right px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

            {/* Mobile Navigation Menu Removed as requested */}
        </div>
      </header>

      {/* Page Content */}
      <main>{children}</main>
    </div>
  )
}
