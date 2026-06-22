"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogoFull } from "@/components/logo"
import Link from "next/link"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { registerAction } from "@/app/actions/auth"

export default function SignupPage() {
  console.log("Signup action loaded")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("كلمات المرور غير متطابقة")
      setIsLoading(false)
      return
    }

    if (!agreedToTerms) {
      setError("يرجى الموافقة على شروط الخدمة وسياسة الخصوصية")
      setIsLoading(false)
      return
    }

    try {
      const result = await registerAction(formData)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      }
      // On success, signupAction triggers a redirect via NextAuth
    } catch {
      // NEXT_REDIRECT throws — this is expected on success
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <LogoFull className="h-16" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">أنشئ حسابك</CardTitle>
            <CardDescription className="text-base">ابدأ مع قانون تك اليوم</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                name="name"
                type="text"
                placeholder="أحمد محمد"
                className="h-11"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="h-11"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="05x xxx xxxx"
                className="h-11 text-right"
                dir="ltr"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="أنشئ كلمة مرور قوية"
                  className="h-11 pr-10"
                  disabled={isLoading}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">يجب أن تكون 8 أحرف على الأقل</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="أعد إدخال كلمة المرور"
                  className="h-11 pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 rounded border-input"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                أوافق على{" "}
                <Link href="/terms" className="text-accent hover:text-accent/80 font-medium">
                  شروط الخدمة
                </Link>{" "}
                و{" "}
                <Link href="/privacy" className="text-accent hover:text-accent/80 font-medium">
                  سياسة الخصوصية
                </Link>
              </label>
            </div>

            <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading}>
              {isLoading ? "جارٍ إنشاء الحساب..." : "إنشاء حساب"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="text-accent hover:text-accent/80 font-semibold">
                سجّل الدخول
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
