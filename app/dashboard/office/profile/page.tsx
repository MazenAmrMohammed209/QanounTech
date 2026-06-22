"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Building2, Mail, Phone, Users, Star, MapPin, CalendarDays } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { useState, useEffect } from "react"
import { getProfileDataAction } from "@/app/actions/user"
import { updateOfficeProfileAction } from "@/app/actions/office"

export default function OfficeProfilePage() {
    const { user: localUser } = useUser()
    const [profile, setProfile] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Form states
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [bio, setBio] = useState("")
    const [city, setCity] = useState("")
    const [establishedYear, setEstablishedYear] = useState("")
    const [lawyersCount, setLawyersCount] = useState("")

    useEffect(() => {
        async function loadProfile() {
            if (localUser?.id) {
                const data: any = await getProfileDataAction(localUser.id)
                if (data) {
                    setProfile(data)
                    setName(data.name || "")
                    setEmail(data.email || "")
                    setPhone(data.phone || "")
                    setBio(data.bio || "")
                    setCity(data.city || "")
                    setEstablishedYear(data.established_year?.toString() || "")
                    setLawyersCount(data.lawyers_count?.toString() || "1")
                }
                setIsLoading(false)
            }
        }
        loadProfile()
    }, [localUser])

    const handleSave = async () => {
        if (!localUser?.id) return
        setIsSaving(true)
        const result = await updateOfficeProfileAction(localUser.id, {
            name,
            phone,
            bio,
            city,
            established_year: establishedYear,
            lawyers_count: lawyersCount,
        })
        if (result.success) {
            // Updated successfully
            setProfile({ ...profile, name, phone, bio, city, established_year: parseInt(establishedYear), lawyers_count: parseInt(lawyersCount) })
        }
        setIsSaving(false)
    }

    if (isLoading) {
        return (
            <DashboardLayout role="office">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-magenta"></div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout role="office">
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Profile Sidebar */}
                    <Card className="w-full md:w-80 shrink-0">
                        <CardContent className="p-6 text-center">
                            <div className="w-32 h-32 rounded-lg bg-magenta/10 mx-auto mb-4 flex items-center justify-center border-4 border-background shadow-md">
                                <Building2 className="h-16 w-16 text-magenta" />
                            </div>
                            <h2 className="text-2xl font-bold mb-1">{profile?.name || "مكتب محاماة"}</h2>

                            <div className="flex items-center justify-center gap-2 mb-6 mt-4">
                                <Badge variant="outline" className="bg-secondary text-secondary-foreground gap-1 border-border">
                                    <Star className="h-3 w-3 fill-current" />
                                    {profile?.rating || "0.0"}
                                </Badge>
                                <Badge variant="secondary">{profile?.lawyers_count || 1} محامين</Badge>
                            </div>

                            <div className="space-y-3 text-sm flex flex-col items-start w-full">
                                <div className="flex items-center gap-3 text-muted-foreground justify-start">
                                    <Mail className="h-4 w-4 text-magenta shrink-0" />
                                    <span className="truncate">{profile?.email || "غير متوفر"}</span>
                                </div>
                                <div className="flex items-center justify-start gap-3 w-full text-muted-foreground">
                                    <Phone className="h-4 w-4 text-magenta shrink-0" />
                                    <span dir="ltr">{profile?.phone || "غير متوفر"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground text-right w-full">
                                    <MapPin className="h-4 w-4 text-magenta shrink-0" />
                                    <span>{profile?.city || "غير متوفر"}</span>
                                </div>
                                {profile?.established_year && (
                                    <div className="flex items-center gap-3 text-muted-foreground text-right w-full">
                                        <CalendarDays className="h-4 w-4 text-magenta shrink-0" />
                                        <span>تأسس عام {profile.established_year}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Profile Content */}
                    <div className="flex-1 space-y-6 w-full">
                        <Card>
                            <CardHeader>
                                <CardTitle>بيانات المكتب</CardTitle>
                                <CardDescription>تحديث بيانات المكتب التي تظهر للعملاء</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">اسم المكتب</Label>
                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">البريد الإلكتروني</Label>
                                        <Input id="email" type="email" value={email} disabled className="bg-secondary/50 opacity-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">رقم الهاتف</Label>
                                        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className="text-right" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">المدينة</Label>
                                        <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="establishedYear">سنة التأسيس</Label>
                                        <Input id="establishedYear" type="number" value={establishedYear} onChange={(e) => setEstablishedYear(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lawyersCount">عدد المحامين</Label>
                                        <Input id="lawyersCount" type="number" value={lawyersCount} onChange={(e) => setLawyersCount(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bio">نبذة تعريفية</Label>
                                    <textarea
                                        id="bio"
                                        className="w-full min-h-[100px] flex rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="اكتب نبذة عن المكتب ومجالات عمله..."
                                    />
                                </div>
                                <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto bg-magenta hover:bg-magenta/90 text-white">
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
