"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Star, MapPin } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { useState, useEffect } from "react"

export default function LawyerProfilePage() {
    const { user: localUser } = useUser()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const [form, setForm] = useState({
        full_name: "",
        phone: "",
        specialization: "",
        city: "",
        bio: ""
    })

    useEffect(() => {
        const savedData = localStorage.getItem("lawyer_profile")
        if (savedData) {
            try {
                setForm(JSON.parse(savedData))
            } catch (e) {
                console.error("Error parsing profile data", e)
            }
        }
        setIsLoading(false)
    }, [])

    const handleSave = () => {
        setIsSaving(true)
        localStorage.setItem("lawyer_profile", JSON.stringify(form))
        
        setTimeout(() => {
            setIsSaving(false)
        }, 500)
    }

    if (isLoading) {
        return (
            <DashboardLayout role="lawyer">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple"></div>
                </div>
            </DashboardLayout>
        )
    }

    const experience = 7;
    const rating = 4.8;

    return (
        <DashboardLayout role="lawyer">
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Profile Sidebar */}
                    <Card className="w-full md:w-80 shrink-0">
                        <CardContent className="p-6 text-center">
                            <div className="w-32 h-32 rounded-full bg-purple/10 mx-auto mb-4 flex items-center justify-center border-4 border-background shadow-md">
                                <User className="h-16 w-16 text-purple" />
                            </div>
                            <h2 className="text-2xl font-bold mb-1">{form.full_name || "محامي"}</h2>
                            <p className="text-muted-foreground mb-4">{form.specialization || "لم يتم تحديد التخصص"}</p>

                            <div className="flex items-center justify-center gap-2 mb-6">
                                <Badge variant="outline" className="bg-secondary text-secondary-foreground gap-1 border-border">
                                    <Star className="h-3 w-3 fill-current" />
                                    {rating}
                                </Badge>
                                <Badge variant="secondary">{experience} سنوات خبرة</Badge>
                            </div>

                            <div className="space-y-3 text-sm flex flex-col items-start w-full">
                                <div className="flex items-center gap-3 text-muted-foreground justify-start">
                                    <Mail className="h-4 w-4 text-purple shrink-0" />
                                    <span className="truncate">{localUser?.email || "غير متوفر"}</span>
                                </div>
                                <div className="flex items-center justify-start gap-3 w-full text-muted-foreground">
                                    <Phone className="h-4 w-4 text-purple shrink-0" />
                                    <span dir="ltr">{form.phone || "غير متوفر"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground text-right w-full">
                                    <MapPin className="h-4 w-4 text-purple shrink-0" />
                                    <span>{form.city || "غير متوفر"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Profile Content */}
                    <div className="flex-1 space-y-6 w-full">
                        <Card>
                            <CardHeader>
                                <CardTitle>البيانات الشخصية والمهنية</CardTitle>
                                <CardDescription>تحديث بياناتك التي تظهر للعملاء والمكتب</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name">الاسم الكامل</Label>
                                        <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="specialization">التخصص (المسمى الوظيفي)</Label>
                                        <Input id="specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">البريد الإلكتروني</Label>
                                        <Input id="email" type="email" value={localUser?.email || ""} disabled className="bg-secondary/50 opacity-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">رقم الهاتف</Label>
                                        <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" className="text-right" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">المدينة</Label>
                                        <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bio">نبذة تعريفية</Label>
                                    <textarea
                                        id="bio"
                                        className="w-full min-h-[100px] flex rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={form.bio}
                                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                        placeholder="اكتب نبذة عنك وعن خبراتك..."
                                    />
                                </div>
                                <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto bg-purple hover:bg-purple/90 text-white">
                                    {isSaving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
