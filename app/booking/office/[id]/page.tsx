"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { CheckCircle2, Building2, MapPin, Star, ChevronLeft, ChevronRight, AlertCircle, Users } from "lucide-react"

const MOCK_OFFICE = {
  id: 1,
  name: "مكتب النور للمحاماة والاستشارات القانونية",
  specialization: "قانون الشركات والقانون التجاري",
  rating: 4.9,
  reviewsCount: 312,
  city: "القاهرة",
}

const AVAILABLE_DATES = [
  { date: "2025-01-15", dayName: "الأربعاء", slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"] },
  { date: "2025-01-16", dayName: "الخميس", slots: ["09:00", "10:00", "13:00", "14:00", "15:00"] },
  { date: "2025-01-17", dayName: "الجمعة", slots: [] },
  { date: "2025-01-18", dayName: "السبت", slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"] },
  { date: "2025-01-19", dayName: "الأحد", slots: ["09:00", "11:00", "13:00", "15:00", "16:00"] },
  { date: "2025-01-20", dayName: "الاثنين", slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"] },
  { date: "2025-01-21", dayName: "الثلاثاء", slots: ["10:00", "11:00", "14:00", "15:00", "16:00"] },
]

const CONSULTATION_TYPES = [
  { id: "initial", name: "استشارة أولية", duration: "30 دقيقة", price: "500 جنيه" },
  { id: "detailed", name: "استشارة مفصلة للشركات", duration: "60 دقيقة", price: "1200 جنيه" },
  { id: "followup", name: "استشارة متابعة", duration: "30 دقيقة", price: "400 جنيه" },
]

export default function OfficeBookingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OfficeBookingForm />
    </Suspense>
  )
}

function OfficeBookingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryOfficeName = searchParams.get("name")
  
  const officeName = queryOfficeName || MOCK_OFFICE.name

  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [consultationType, setConsultationType] = useState("office")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [caseDetails, setCaseDetails] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setError("")
    setIsLoading(true)

    if (!fullName || !email || !phone || !caseDetails) {
      setError("يرجى ملء جميع الحقول المطلوبة")
      setIsLoading(false)
      return
    }

    try {
      const userStr = localStorage.getItem("user")
      const userObj = userStr ? JSON.parse(userStr) : null
      const token = userObj?.id ? `session_${userObj.id}` : ""

      const response = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: "استشارة قانونية",
          client_name: fullName,
          case_type: CONSULTATION_TYPES.find((t) => t.id === selectedType)?.name || "استشارة",
          description: caseDetails,
          lawyer_name: "غير محدد بعد", // Mock lawyer name since it's an office booking
          office_name: officeName,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Failed to book consultation")
      }

      // Success - show confirmation and redirect
      setStep(4)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedDateObj = AVAILABLE_DATES.find((d) => d.date === selectedDate)

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">حجز موعد استشاري</h1>
            <p className="text-muted-foreground mt-1">احجز موعداً مع {officeName}</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {[
                { num: 1, label: "نوع الاستشارة" },
                { num: 2, label: "التاريخ والوقت" },
                { num: 3, label: "معلوماتك" },
                { num: 4, label: "تأكيد" },
              ].map((s, idx) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                        step >= s.num
                          ? "bg-magenta text-white"
                          : "bg-secondary text-muted-foreground border-2 border-border"
                      }`}
                    >
                      {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
                    </div>
                    <span className="text-xs mt-1 text-center hidden sm:block">{s.label}</span>
                  </div>
                  {idx < 3 && <div className={`h-1 flex-1 mx-2 ${step > s.num ? "bg-magenta" : "bg-secondary"}`} />}
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>اختر نوع الاستشارة</CardTitle>
                    <CardDescription>حدد الاستشارة المناسبة لاحتياجاتك</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {CONSULTATION_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-right ${
                          selectedType === type.id
                            ? "border-magenta bg-magenta/5"
                            : "border-border hover:border-magenta/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{type.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">المدة: {type.duration}</p>
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-lg text-magenta">{type.price}</div>
                            {selectedType === type.id && <CheckCircle2 className="h-5 w-5 text-magenta mt-1" />}
                          </div>
                        </div>
                      </button>
                    ))}

                    <div className="pt-4 space-y-3">
                      <Label>طريقة الاستشارة</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setConsultationType("office")}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            consultationType === "office"
                              ? "border-magenta bg-magenta/5"
                              : "border-border hover:border-magenta/50"
                          }`}
                        >
                          <div className="font-semibold flex items-center gap-2 justify-center">
                            <Building2 className="h-5 w-5 text-magenta" />
                            في مقر المكتب
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">زيارة شخصية</div>
                        </button>
                        <button
                          onClick={() => setConsultationType("online")}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            consultationType === "online"
                              ? "border-magenta bg-magenta/5"
                              : "border-border hover:border-magenta/50"
                          }`}
                        >
                          <div className="font-semibold">استشارة عن بُعد</div>
                          <div className="text-sm text-muted-foreground mt-1">عبر مكالمة فيديو</div>
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={() => setStep(2)} disabled={!selectedType} size="lg" className="bg-magenta hover:bg-magenta/90 text-white">
                        التالي
                        <ChevronLeft className="h-5 w-5 mr-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>اختر التاريخ والوقت</CardTitle>
                    <CardDescription>حدد الموعد المناسب لزيارة المكتب</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Date Selection */}
                    <div>
                      <Label className="mb-3 block text-lg font-medium">اختر التاريخ</Label>
                      <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
                        {AVAILABLE_DATES.map((dateObj) => {
                          const hasSlots = dateObj.slots.length > 0
                          return (
                            <button
                              key={dateObj.date}
                              onClick={() => hasSlots && setSelectedDate(dateObj.date)}
                              disabled={!hasSlots}
                              className={`flex-shrink-0 w-28 p-4 rounded-xl border-2 transition-all text-center snap-start ${
                                selectedDate === dateObj.date
                                  ? "border-magenta bg-magenta text-white shadow-lg shadow-magenta/20"
                                  : hasSlots
                                    ? "border-border hover:border-magenta hover:bg-magenta/5 bg-background"
                                    : "border-border bg-secondary/30 opacity-40 cursor-not-allowed"
                              }`}
                            >
                              <div className="text-sm opacity-80 mb-1">{dateObj.dayName}</div>
                              <div className="text-2xl font-bold">
                                {new Date(dateObj.date).getDate()}
                              </div>
                              <div className="text-sm font-medium mt-1">
                                {new Date(dateObj.date).toLocaleDateString("ar-SA", {
                                  month: "short",
                                })}
                              </div>
                              {!hasSlots && <div className="text-[10px] text-destructive font-bold mt-2 bg-destructive/10 py-1 rounded">محجوز</div>}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Time Selection */}
                    {selectedDate && selectedDateObj && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <Label className="mb-3 block text-lg font-medium">اختر الوقت</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {selectedDateObj.slots.map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`py-3 px-2 rounded-xl text-lg border-2 transition-all duration-200 ${
                                selectedTime === time
                                  ? "border-magenta bg-magenta text-white shadow-sm shadow-magenta/20 scale-105"
                                  : "border-border hover:border-magenta/70 hover:bg-magenta/5"
                              }`}
                            >
                              <div className="font-semibold flex items-center justify-center gap-1 text-center" dir="ltr">{time}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button onClick={() => setStep(1)} variant="outline" size="lg" className="bg-transparent text-magenta border-magenta/50 hover:bg-magenta/10">
                        <ChevronRight className="h-5 w-5 ml-2" />
                        السابق
                      </Button>
                      <Button onClick={() => setStep(3)} disabled={!selectedDate || !selectedTime} size="lg" className="bg-magenta hover:bg-magenta/90 text-white">
                        التالي
                        <ChevronLeft className="h-5 w-5 mr-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>معلوماتك والشركة</CardTitle>
                    <CardDescription>أدخل بياناتك للتواصل وتفاصيل شركتك (إن وجدت)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">
                          الاسم أو اسم الشركة <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="fullName"
                          placeholder="أدخل اسمك أو اسم الشركة"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="h-11"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">
                          البريد الإلكتروني <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          رقم الجوال <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="05XXXXXXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-11"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="caseDetails">
                          تفاصيل الاستشارة المطلوبة <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="caseDetails"
                          placeholder="اشرح غرض الاستشارة (مثال: صياغة عقود، تأسيس شركة...)"
                          value={caseDetails}
                          onChange={(e) => setCaseDetails(e.target.value)}
                          className="min-h-[120px]"
                          disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">سيتم التعامل مع معلوماتك بسرية تامة من قبل محامي المكتب.</p>
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      <div className="flex justify-between pt-4">
                        <Button
                          type="button"
                          onClick={() => setStep(2)}
                          variant="outline"
                          size="lg"
                          disabled={isLoading}
                          className="bg-transparent text-magenta border-magenta/50 hover:bg-magenta/10"
                        >
                          <ChevronRight className="h-5 w-5 ml-2" />
                          السابق
                        </Button>
                        <Button type="button" onClick={handleSubmit} disabled={isLoading} size="lg" className="bg-magenta hover:bg-magenta/90 text-white">
                          {isLoading ? "جارٍ الحجز..." : "تأكيد الحجز"}
                          <ChevronLeft className="h-5 w-5 mr-2" />
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {step === 4 && (
                <Card className="border-magenta">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-6">
                      <div className="h-20 w-20 rounded-full bg-magenta/10 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-10 w-10 text-magenta" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">تم تأكيد الحجز بنجاح!</h2>
                        <p className="text-muted-foreground mt-2">سيتم التواصل معك قريباً لتأكيد الموعد من قبل إدارة المكتب</p>
                      </div>

                      <div className="bg-secondary/50 rounded-lg p-6 text-right space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">المكتب</span>
                          <span className="font-semibold">{MOCK_OFFICE.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">التاريخ</span>
                          <span className="font-semibold">
                            {selectedDateObj?.dayName}{" "}
                            {new Date(selectedDate).toLocaleDateString("ar-SA", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">الوقت</span>
                          <span className="font-semibold">{selectedTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">نوع الاستشارة</span>
                          <span className="font-semibold">
                            {CONSULTATION_TYPES.find((t) => t.id === selectedType)?.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={() => router.push("/dashboard/client")} className="flex-1 bg-magenta hover:bg-magenta/90 text-white" size="lg">
                          العودة إلى لوحة التحكم
                        </Button>
                        <Button
                          onClick={() => router.push("/consultations")}
                          variant="outline"
                          className="flex-1 bg-transparent text-magenta border-magenta/50 hover:bg-magenta/10"
                          size="lg"
                        >
                          تصفح الاستشارات
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Office Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">معلومات المكتب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-magenta/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-magenta" />
                    </div>
                    <div>
                      <h3 className="font-semibold leading-tight">{MOCK_OFFICE.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{MOCK_OFFICE.specialization}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span>
                        {MOCK_OFFICE.rating} ({MOCK_OFFICE.reviewsCount} تقييم)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{MOCK_OFFICE.city}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Summary */}
              {step > 1 && step < 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ملخص الحجز</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {selectedType && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">نوع الاستشارة</span>
                        <span className="font-semibold">
                          {CONSULTATION_TYPES.find((t) => t.id === selectedType)?.name}
                        </span>
                      </div>
                    )}
                    {selectedDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">التاريخ</span>
                        <span className="font-semibold">{selectedDateObj?.dayName}</span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الوقت</span>
                        <span className="font-semibold">{selectedTime}</span>
                      </div>
                    )}
                    {consultationType && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الطريقة</span>
                        <span className="font-semibold">{consultationType === "online" ? "عن بُعد" : "في مقر المكتب"}</span>
                      </div>
                    )}
                    {selectedType && (
                      <>
                        <div className="border-t border-border pt-3 mt-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">التكلفة</span>
                            <span className="font-bold text-lg text-magenta">
                              {CONSULTATION_TYPES.find((t) => t.id === selectedType)?.price}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Help Card */}
              <Card className="bg-gradient-to-br from-magenta/5 to-purple/5 border-magenta/20">
                <CardHeader>
                  <CardTitle className="text-base">هل تحتاج مساعدة؟</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">إذا واجهت أي مشكلة في الحجز، يمكنك التواصل معنا</p>
                  <Button variant="outline" className="w-full bg-transparent text-magenta border-magenta/50 hover:bg-magenta/10" size="sm">
                    اتصل بالدعم
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
