"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  MapPin,
  Star,
  Briefcase,
  Building2,
  Users,
  CheckCircle2,
  Award,
  Clock,
  MessageSquare,
  Heart,
  Bookmark,
  Share2
} from "lucide-react"
import Link from "next/link"
import { toggleLike, toggleSave } from "@/app/actions/interactions"
import type { Profile } from "@/lib/supabase/queries/profiles"

interface DiscoveryClientProps {
  initialLawyers: any[]
  initialOffices: any[]
  platformStats: {
    lawyersCount: number
    officesCount: number
    completedCases: number
  }
}

export function DiscoveryClient({
  initialLawyers,
  initialOffices,
  platformStats,
}: DiscoveryClientProps) {
  const [searchType, setSearchType] = useState<"lawyers" | "offices">("lawyers")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialization, setSelectedSpecialization] = useState("الكل")
  const [selectedCity, setSelectedCity] = useState("الكل")
  const [sortBy, setSortBy] = useState("rating")

  const [filters, setFilters] = useState({
    rating: false,
    verified: false,
    fastResponse: false,
  })

  const [liked, setLiked] = useState<string[]>([])
  const [saved, setSaved] = useState<string[]>([])

  const handleLike = async (id: string | number, type: "lawyer" | "office") => {
    const stringId = String(id)
    setLiked(prev => {
      if (prev.includes(stringId)) {
        return prev.filter(i => i !== stringId)
      } else {
        return [...prev, stringId]
      }
    })
    try {
      await toggleLike(stringId, type, "demo-user-id")
    } catch (e) {
      console.error("Failed to toggle like:", e)
    }
  }

  const handleSave = async (id: string | number, type: "lawyer" | "office") => {
    const stringId = String(id)
    setSaved(prev => {
      if (prev.includes(stringId)) {
        return prev.filter(i => i !== stringId)
      } else {
        return [...prev, stringId]
      }
    })
    try {
      await toggleSave(stringId, type, "demo-user-id")
    } catch (e) {
      console.error("Failed to toggle save:", e)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Qanoun",
        url: window.location.href,
      }).catch(console.error)
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert("تم نسخ الرابط")
    }
  }

  // Extract unique specializations and cities from real data
  const specializations = useMemo(() => {
    const specs = new Set<string>()
    initialLawyers.forEach((l) => {
      if (l.specialization) specs.add(l.specialization)
    })
    initialOffices.forEach((o) => {
      o.specializations?.forEach((s: string) => specs.add(s))
    })
    return ["الكل", ...Array.from(specs)]
  }, [initialLawyers, initialOffices])

  const cities = useMemo(() => {
    const c = new Set<string>()
      ;[...initialLawyers, ...initialOffices].forEach((p) => {
        if (p.city) c.add(p.city)
      })
    return ["الكل", ...Array.from(c)]
  }, [initialLawyers, initialOffices])

  const filteredData = useMemo(() => {
    const data = searchType === "lawyers" ? initialLawyers : initialOffices
    if (!data) return []

    return data.filter((item) => {
      const searchTarget = searchType === "offices"
        ? [item.office_name, item.description, ...(item.specializations || [])]
        : [item.full_name, item.specialization, item.bio]

      const matchesSearch = !searchQuery || searchTarget
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())

      const matchesCity = !selectedCity || selectedCity === "الكل" || item.city === selectedCity

      const matchesSpec = !selectedSpecialization || selectedSpecialization === "الكل" ||
        (searchType === "offices"
          ? (item.specializations || []).includes(selectedSpecialization)
          : (item.specialization === selectedSpecialization))

      const matchesFast = !filters.fastResponse || item.response_time === "fast"
      const matchesVerified = !filters.verified || item.verified === true
      const matchesRating = !filters.rating || (item.rating || 0) >= 4.5

      return matchesCity && matchesSearch && matchesSpec && matchesFast && matchesVerified && matchesRating
    })
  }, [initialLawyers, initialOffices, searchType, searchQuery, selectedCity, selectedSpecialization, filters])

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0)
      if (sortBy === "experience") return (b.experience_years || 0) - (a.experience_years || 0)
      if (sortBy === "response") return (a.response_time || "").localeCompare(b.response_time || "")
      return 0
    })
  }, [filteredData, sortBy])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">اكتشف المحامين ومكاتب المحاماة</h1>
        <p className="text-muted-foreground mt-1">ابحث عن المحترفين القانونيين المناسبين لقضيتك</p>
      </div>

      {/* Search Type Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={searchType === "lawyers" ? "default" : "outline"}
          onClick={() => setSearchType("lawyers")}
          className={searchType === "lawyers" ? "" : "bg-transparent"}
        >
          <Briefcase className="h-4 w-4 ml-2" />
          محامين أفراد
        </Button>
        <Button
          variant={searchType === "offices" ? "default" : "outline"}
          onClick={() => setSearchType("offices")}
          className={searchType === "offices" ? "" : "bg-transparent"}
        >
          <Building2 className="h-4 w-4 ml-2" />
          مكاتب محاماة
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={searchType === "lawyers" ? "ابحث عن محامي..." : "ابحث عن مكتب محاماة..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pr-10"
              />
            </div>

            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="h-12 px-3 rounded-lg border border-input bg-background text-foreground"
            >
              {specializations.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-12 px-3 rounded-lg border border-input bg-background text-foreground"
            >
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button 
              variant={filters.rating ? "default" : "outline"} 
              size="sm" 
              className={`gap-2 transition-all duration-200 hover:scale-105 active:scale-95 ${filters.rating ? "bg-blue-600 text-white hover:bg-blue-700" : "text-gray-600 hover:bg-gray-100"}`}
              onClick={() => setFilters(prev => ({ ...prev, rating: !prev.rating }))}
            >
              <Star className="h-4 w-4" />
              تقييم 4.5+
            </Button>
            <Button 
              variant={filters.verified ? "default" : "outline"} 
              size="sm" 
              className={`gap-2 transition-all duration-200 hover:scale-105 active:scale-95 ${filters.verified ? "bg-blue-600 text-white hover:bg-blue-700" : "text-gray-600 hover:bg-gray-100"}`}
              onClick={() => setFilters(prev => ({ ...prev, verified: !prev.verified }))}
            >
              <CheckCircle2 className="h-4 w-4" />
              موثّق
            </Button>
            <Button 
              variant={filters.fastResponse ? "default" : "outline"} 
              size="sm" 
              className={`gap-2 transition-all duration-200 hover:scale-105 active:scale-95 ${filters.fastResponse ? "bg-blue-600 text-white hover:bg-blue-700" : "text-gray-600 hover:bg-gray-100"}`}
              onClick={() => setFilters(prev => ({ ...prev, fastResponse: !prev.fastResponse }))}
            >
              <Clock className="h-4 w-4" />
              استجابة سريعة
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              تم العثور على <span className="font-semibold text-foreground">{sortedData.length}</span> نتيجة
            </p>
            <select
              className="text-sm px-3 py-1.5 rounded-lg border border-input bg-background"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="rating">الأعلى تقييماً</option>
              <option value="experience">الأكثر خبرة</option>
              <option value="response">الأسرع استجابة</option>
            </select>
            {(() => {
              // Mandatory debug logs
              console.log("FILTERS:", filters)
              console.log("FILTERED:", filteredData.length)
              console.log("SORTED:", sortedData.length)
              console.log("LIKED STATE:", liked)
              return null
            })()}
          </div>

          {!sortedData || sortedData.length === 0 ? (
            <div className="text-center py-10 bg-secondary/10 rounded-lg">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">لم يتم العثور على نتائج</p>
              <p className="text-sm text-muted-foreground mt-1">جرّب تعديل معايير البحث</p>
            </div>
          ) : searchType === "lawyers" ? (
            sortedData.map((lawyer) => (
              <Card key={lawyer.id} className="hover:border-accent/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="h-24 w-24 rounded-full bg-purple/10 flex items-center justify-center">
                        <Briefcase className="h-10 w-10 text-purple" />
                      </div>
                      {lawyer.verified && (
                        <Badge variant="outline" className="gap-1 bg-accent/10 text-accent border-accent/20">
                          <CheckCircle2 className="h-3 w-3" />
                          موثّق
                        </Badge>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <Link href={`/profiles/lawyer/${lawyer.id}`}>
                          <h3 className="text-xl font-bold hover:text-accent transition-colors cursor-pointer">
                            {lawyer.full_name || "محامي"}
                          </h3>
                        </Link>
                        <p className="text-muted-foreground mt-1">{lawyer.specialization || lawyer.bio}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            <span className="font-semibold text-foreground">{lawyer.rating}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{lawyer.reviews_count} تقييم</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Award className="h-4 w-4" />
                            <span className="font-semibold text-foreground">{lawyer.experience_years} سنة</span>
                          </div>
                          <p className="text-xs text-muted-foreground">خبرة</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-semibold text-foreground">{lawyer.cases_completed}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">قضية منجزة</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <MapPin className="h-4 w-4" />
                            <span className="font-semibold text-foreground">{lawyer.city || "غير محدد"}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">الموقع</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {lawyer.response_time && (
                          <Badge variant="outline" className="bg-secondary">{lawyer.response_time}</Badge>
                        )}
                        {lawyer.price_range && (
                          <Badge variant="outline" className="bg-secondary">{lawyer.price_range}</Badge>
                        )}
                        {lawyer.languages?.map((lang: string) => (
                          <Badge key={lang} variant="outline" className="bg-secondary">{lang}</Badge>
                        ))}
                      </div>

                      <div className="flex gap-3 pt-2 mt-auto">
                        <Link href={`/profiles/lawyer/${lawyer.id}`} className="flex-1">
                          <Button variant="outline" className="w-full bg-transparent">الملف الشخصي</Button>
                        </Link>
                        <Link href={`/booking/lawyer/${lawyer.id}?name=${encodeURIComponent(lawyer.full_name || "محامي")}`} className="flex-1">
                          <Button className="w-full gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            احجز الآن
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 bg-transparent transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-md"
                          onClick={() => handleLike(lawyer.id, "lawyer")}
                        >
                          <Heart className={`h-5 w-5 transition-colors ${liked.includes(String(lawyer.id)) ? "text-red-500 fill-red-500" : ""}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 bg-transparent transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-md"
                          onClick={() => handleSave(lawyer.id, "lawyer")}
                        >
                          <Bookmark className={`h-5 w-5 transition-colors ${saved.includes(String(lawyer.id)) ? "text-yellow-400 fill-yellow-400" : ""}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 bg-transparent"
                          onClick={handleShare}
                        >
                          <Share2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            sortedData.map((office) => (
              <Card key={office.id} className="hover:border-accent/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="h-24 w-24 rounded-lg bg-magenta/10 flex items-center justify-center">
                        <Building2 className="h-10 w-10 text-magenta" />
                      </div>
                      {office.verified && (
                        <Badge variant="outline" className="gap-1 bg-accent/10 text-accent border-accent/20">
                          <CheckCircle2 className="h-3 w-3" />
                          موثّق
                        </Badge>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <Link href={`/profiles/office/${office.id}`}>
                          <h3 className="text-xl font-bold hover:text-accent transition-colors cursor-pointer">
                            {office.office_name || "مكتب محاماة"}
                          </h3>
                        </Link>
                        <p className="text-muted-foreground mt-1">{office.description || office.address}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {office.specializations?.map((spec: string) => (
                            <Badge key={spec} variant="outline" className="bg-secondary text-xs">{spec}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            <span className="font-semibold text-foreground">{office.rating}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{office.reviews_count} تقييم</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Users className="h-4 w-4" />
                            <span className="font-semibold text-foreground">{office.lawyers_count} محامي</span>
                          </div>
                          <p className="text-xs text-muted-foreground">الفريق</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-semibold text-foreground">{office.cases_completed}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">قضية منجزة</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <MapPin className="h-4 w-4" />
                            <span className="font-semibold text-foreground">{office.city || "غير محدد"}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">الموقع</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {office.established_year && (
                          <Badge variant="outline" className="bg-secondary">تأسس {office.established_year}</Badge>
                        )}
                        {office.price_range && (
                          <Badge variant="outline" className="bg-secondary">{office.price_range}</Badge>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2 mt-auto">
                        <Link href={`/profiles/office/${office.id}`} className="flex-1">
                          <Button variant="outline" className="w-full bg-transparent">الملف المؤسسي</Button>
                        </Link>
                        <Link href={`/booking/office/${office.id}?name=${encodeURIComponent(office.office_name || "مكتب محاماة")}`} className="flex-1">
                          <Button className="w-full gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            احجز الآن
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 bg-transparent transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-md"
                          onClick={() => handleLike(office.id, "office")}
                        >
                          <Heart className={`h-5 w-5 transition-colors ${liked.includes(String(office.id)) ? "text-red-500 fill-red-500" : ""}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 bg-transparent transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-md"
                          onClick={() => handleSave(office.id, "office")}
                        >
                          <Bookmark className={`h-5 w-5 transition-colors ${saved.includes(String(office.id)) ? "text-yellow-400 fill-yellow-400" : ""}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 bg-transparent"
                          onClick={handleShare}
                        >
                          <Share2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">التخصصات الشائعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {specializations.slice(1, 8).map((spec) => (
                  <Badge
                    key={spec}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setSelectedSpecialization(spec)}
                  >
                    {spec}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-purple/10 border-accent/20">
            <CardHeader>
              <CardTitle className="text-base">كيف تختار المحامي المناسب؟</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>اقرأ التقييمات والمراجعات</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>تحقق من التخصص والخبرة</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>راجع القضايا المنجزة</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>احجز استشارة أولية</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">إحصائيات المنصة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">محامين مسجلين</span>
                <span className="font-semibold">{platformStats.lawyersCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">مكاتب محاماة</span>
                <span className="font-semibold">{platformStats.officesCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">قضية منجزة</span>
                <span className="font-semibold">{platformStats.completedCases || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
