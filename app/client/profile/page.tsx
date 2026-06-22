"use client"

import { ClientLayout } from "@/components/client-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, FileText, Calendar, MessageSquare, Settings, Edit2, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { useUser } from "@/hooks/use-user"
import { getUserDataAction } from "@/app/actions/user"
export default function ClientProfilePage() {
  const { user: localUser, loading: userLoading } = useUser()
  const [activeTab, setActiveTab] = useState<"info" | "cases" | "appointments" | "messages" | "settings">("info")
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: ""
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUserData() {
      if (localUser?.id) {
        try {
          const data = await getUserDataAction(localUser.id)
          if (data) {
            setUserData({
              name: data.name || "غير متوفر",
              email: data.email || "غير متوفر",
              phone: data.phone || "غير متوفر"
            })
          }
        } catch (error) {
          console.error("Failed to load user data:", error)
        } finally {
          setIsLoading(false)
        }
      } else if (!userLoading) {
        setIsLoading(false)
      }
    }

    if (!userLoading) {
      loadUserData()
    }
  }, [localUser, userLoading])

  if (userLoading || isLoading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </ClientLayout>
    )
  }

  const tabs = [
    { id: "info" as const, label: "البيانات الشخصية", icon: User },
    { id: "cases" as const, label: "القضايا الخاصة بي", icon: FileText },
    { id: "appointments" as const, label: "المواعيد", icon: Calendar },
    { id: "messages" as const, label: "الرسائل", icon: MessageSquare },
    { id: "settings" as const, label: "الإعدادات", icon: Settings },
  ]

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center">
                <User className="h-10 w-10 text-accent" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{userData.name}</h1>
                <p className="text-muted-foreground mt-1">عميل منذ يناير 2026</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "info" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات الاتصال</CardTitle>
                <CardDescription>البيانات الشخصية وطرق التواصل</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1 border-b border-border pb-4">
                  <p className="text-sm font-medium text-muted-foreground">الاسم الكامل</p>
                  <p className="text-lg font-semibold text-foreground">{userData.name}</p>
                </div>
                <div className="space-y-1 border-b border-border pb-4">
                  <p className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</p>
                  <p className="text-lg font-semibold text-foreground">{userData.email}</p>
                </div>
                <div className="space-y-1 border-b border-border pb-4">
                  <p className="text-sm font-medium text-muted-foreground">رقم الهاتف</p>
                  <p className="text-lg font-semibold text-foreground text-right" dir="ltr">{userData.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">المدينة</p>
                  <p className="text-lg font-semibold text-foreground">القاهرة</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات الحساب</CardTitle>
                <CardDescription>نشاطك على المنصة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-accent" />
                    <span className="font-medium">القضايا النشطة</span>
                  </div>
                  <span className="text-2xl font-bold">3</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-purple" />
                    <span className="font-medium">الاستشارات</span>
                  </div>
                  <span className="text-2xl font-bold">12</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-magenta/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-magenta" />
                    <span className="font-medium">المواعيد القادمة</span>
                  </div>
                  <span className="text-2xl font-bold">2</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "cases" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>القضايا النشطة</CardTitle>
                <CardDescription>قضاياك الجارية مع المحامين</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    title: "نزاع عقد عمل",
                    lawyer: "سارة أحمد",
                    status: "قيد المراجعة",
                    progress: 60,
                    color: "purple",
                  },
                  {
                    title: "عقد إيجار عقاري",
                    lawyer: "محمد علي",
                    status: "في التنفيذ",
                    progress: 85,
                    color: "accent",
                  },
                  {
                    title: "اتفاقية شراكة تجارية",
                    lawyer: "فاطمة خالد",
                    status: "بانتظار المستندات",
                    progress: 30,
                    color: "magenta",
                  },
                ].map((caseItem, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{caseItem.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">المحامي: {caseItem.lawyer}</p>
                      </div>
                      <Badge className={`bg-${caseItem.color}/10 text-${caseItem.color} border-${caseItem.color}/20`}>
                        {caseItem.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">التقدم</span>
                        <span className="font-medium">{caseItem.progress}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full bg-${caseItem.color}`} style={{ width: `${caseItem.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "appointments" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>المواعيد القادمة</CardTitle>
                <CardDescription>لقاءاتك المجدولة مع المحامين</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    title: "استشارة حول نزاع عقد العمل",
                    lawyer: "سارة أحمد",
                    date: "الأحد، 25 ديسمبر 2024",
                    time: "10:00 صباحاً",
                    type: "عبر الإنترنت",
                  },
                  {
                    title: "مراجعة عقد الإيجار",
                    lawyer: "محمد علي",
                    date: "الثلاثاء، 27 ديسمبر 2024",
                    time: "2:00 مساءً",
                    type: "في المكتب",
                  },
                ].map((appointment, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-6 w-6 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{appointment.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">مع: {appointment.lawyer}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {appointment.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {appointment.time}
                          </div>
                        </div>
                        <Badge className="mt-2 bg-secondary text-secondary-foreground">{appointment.type}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "messages" && (
          <Card>
            <CardHeader>
              <CardTitle>الرسائل</CardTitle>
              <CardDescription>محادثاتك مع المحامين</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  lawyer: "سارة أحمد",
                  lastMessage: "تم استلام المستندات، سأراجعها قريباً",
                  time: "منذ ساعتين",
                  unread: 2,
                },
                {
                  lawyer: "محمد علي",
                  lastMessage: "هل يمكننا تحديد موعد الأسبوع القادم؟",
                  time: "منذ 5 ساعات",
                  unread: 0,
                },
                { lawyer: "فاطمة خالد", lastMessage: "شكراً على المعلومات الإضافية", time: "أمس", unread: 0 },
              ].map((message, idx) => (
                <div
                  key={idx}
                  className="border border-border rounded-lg p-4 hover:border-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-purple/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-purple" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{message.lawyer}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{message.lastMessage}</p>
                        <p className="text-xs text-muted-foreground mt-1">{message.time}</p>
                      </div>
                    </div>
                    {message.unread > 0 && <Badge className="bg-accent text-white">{message.unread}</Badge>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeTab === "settings" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>الإشعارات</CardTitle>
                <CardDescription>إدارة تفضيلات الإشعارات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "إشعارات البريد الإلكتروني", checked: true },
                  { label: "إشعارات الرسائل الجديدة", checked: true },
                  { label: "تحديثات القضايا", checked: true },
                  { label: "تذكير المواعيد", checked: true },
                ].map((setting, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">{setting.label}</span>
                    <input type="checkbox" defaultChecked={setting.checked} className="h-4 w-4" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الأمان</CardTitle>
                <CardDescription>إعدادات الحساب والأمان</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  تغيير كلمة المرور
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  المصادقة الثنائية
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive bg-transparent"
                >
                  حذف الحساب
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
