"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogoFull } from "@/components/logo"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { UserCircle, Briefcase, Building2, CheckCircle2 } from "lucide-react"
import { updateRoleWithEmailAction } from "@/app/actions/auth"

type Role = "client" | "lawyer" | "office" | null

export default function SelectRolePage() {
  const router = useRouter()
  const { user: localUser, loading } = useUser()
  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Guard: only allow authenticated users that still don't have a role.
  useEffect(() => {
    if (loading) return

    if (!localUser) {
      router.replace("/login")
      return
    }

    const existingRole = localUser.role
    
    if (!existingRole) {
      return
    }

    if (existingRole === "client") {
      router.replace("/consultations")
    } else {
      router.replace(`/dashboard/${existingRole}`)
    }
  }, [localUser, loading, router])

  const handleContinue = async () => {
    if (!selectedRole || !localUser?.email) return

    setIsLoading(true)

    // Update role in the database
    const result = await updateRoleWithEmailAction(localUser.email, selectedRole)

    if (result.error) {
      console.error(result.error)
      setIsLoading(false)
      return
    }

    // Update localStorage with new role
    const updatedUser = { ...localUser, role: selectedRole }
    localStorage.setItem("user", JSON.stringify(updatedUser))

    // Redirect to appropriate dashboard
    if (selectedRole === "client") {
      router.push("/consultations")
    } else if (selectedRole === "lawyer") {
      router.push("/dashboard/lawyer")
    } else if (selectedRole === "office") {
      router.push("/dashboard/office")
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <LogoFull className="h-16" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">اختر دورك</CardTitle>
            <CardDescription className="text-base">حدد كيف ستستخدم قانون تك</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Client Role */}
            <button
              onClick={() => setSelectedRole("client")}
              className={`relative p-6 rounded-lg border-2 transition-all text-left hover:border-accent/50 ${selectedRole === "client" ? "border-accent bg-accent/5" : "border-border bg-card"
                }`}
            >
              {selectedRole === "client" && (
                <div className="absolute top-3 left-3">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                </div>
              )}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                  <UserCircle className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">عميل</h3>
                  <p className="text-sm text-muted-foreground mt-1">ابحث واعمل مع محترفين قانونيين</p>
                </div>
              </div>
            </button>

            {/* Lawyer Role */}
            <button
              onClick={() => setSelectedRole("lawyer")}
              className={`relative p-6 rounded-lg border-2 transition-all text-left hover:border-purple/50 ${selectedRole === "lawyer" ? "border-purple bg-purple/5" : "border-border bg-card"
                }`}
            >
              {selectedRole === "lawyer" && (
                <div className="absolute top-3 left-3">
                  <CheckCircle2 className="h-5 w-5 text-purple" />
                </div>
              )}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-purple/10 text-purple flex items-center justify-center">
                  <Briefcase className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">محامي</h3>
                  <p className="text-sm text-muted-foreground mt-1">أدر ممارستك وعملائك</p>
                </div>
              </div>
            </button>

            {/* Law Office Role */}
            <button
              onClick={() => setSelectedRole("office")}
              className={`relative p-6 rounded-lg border-2 transition-all text-left hover:border-magenta/50 ${selectedRole === "office" ? "border-magenta bg-magenta/5" : "border-border bg-card"
                }`}
            >
              {selectedRole === "office" && (
                <div className="absolute top-3 left-3">
                  <CheckCircle2 className="h-5 w-5 text-magenta" />
                </div>
              )}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-magenta/10 text-magenta flex items-center justify-center">
                  <Building2 className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">مكتب محاماة</h3>
                  <p className="text-sm text-muted-foreground mt-1">أدر شركتك وفريقك</p>
                </div>
              </div>
            </button>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleContinue}
              disabled={!selectedRole || isLoading}
              className="w-full h-12 font-semibold text-base"
            >
              {isLoading ? "جارٍ التحميل..." : "متابعة إلى لوحة التحكم"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
