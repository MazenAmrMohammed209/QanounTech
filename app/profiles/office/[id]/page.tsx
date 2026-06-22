import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  MapPin,
  Star,
  Award,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Share2,
  Clock,
  Users,
} from "lucide-react"
import Link from "next/link"

const MOCK_OFFICES_DATA = [
  {
    id: 1,
    name: "مكتب النور للمحاماة والاستشارات القانونية",
    title: "مكتب محاماة رائد في قانون الشركات والقانون التجاري",
    bio: "مكتب يضم نخبة من أفضل المحامين والمستشارين القانونيين، متخصص في تقديم الخدمات القانونية الشاملة للشركات والمؤسسات التجارية محلياً ودولياً.",
    specializations: ["قانون الشركات", "قانون العمل", "القانون التجاري"],
    city: "القاهرة",
    rating: 4.9,
    reviewsCount: 312,
    lawyersCount: 12,
    casesCompleted: 890,
    establishedYear: 2008,
    verified: true,
    languages: ["العربية", "الإنجليزية", "الفرنسية"],
    certifications: ["معتمد من وزارة العدل", "عضوية دولية في نقابات المحامين"],
    achievements: [
      {
        title: "أفضل مكتب محاماة للشركات",
        year: "2023",
        description: "تصنيف متقدم من مجلة القانون التجاري",
      },
      {
        title: "إنجاز 800+ قضية ناجحة",
        year: "2022",
        description: "نسبة نجاح تزيد عن 95% في قضايا الشركات",
      }
    ],
    reviews: [
      {
        author: "شركة الأفق الحديث",
        rating: 5,
        date: "منذ أسبوع",
        comment: "مكتب محترف جداً، فريق عمل متكامل وخدمة استشارية لا مثيل لها.",
      },
      {
        author: "محمد عبد الله",
        rating: 5,
        date: "منذ شهر",
        comment: "تعامل راقي وشفافية في كل خطوة، شكراً لكم.",
      }
    ],
  },
  {
    id: 2,
    name: "مكتب الخليج القانوني",
    title: "متخصصون في العقارات والتطوير العقاري",
    bio: "نقدم كافة الخدمات القانونية المتعلقة بالشأن العقاري والبناء والأراضي.",
    specializations: ["قانون العقارات", "قانون البناء", "قانون الأراضي"],
    city: "الجيزة",
    rating: 4.8,
    reviewsCount: 278,
    lawyersCount: 8,
    casesCompleted: 654,
    establishedYear: 2012,
    verified: true,
    languages: ["العربية"],
    certifications: ["معتمدون من الشهر العقاري"],
    achievements: [],
    reviews: [],
  },
  {
    id: 3,
    name: "مكتب العدالة للمحاماة",
    title: "الخيار الأول للقضايا الجنائية والمدنية",
    bio: "مكتب محاماة متخصص في القضايا الجنائية والمدنية وقضايا الأسرة، نقدم دعماً كاملاً لعملائنا.",
    specializations: ["قانون جنائي", "قانون مدني", "قضايا الأسرة"],
    city: "المنصورة",
    rating: 4.6,
    reviewsCount: 198,
    lawyersCount: 6,
    casesCompleted: 445,
    establishedYear: 2015,
    verified: true,
    languages: ["العربية", "الإنجليزية"],
    certifications: ["أعضاء في جمعية المحامين"],
    achievements: [],
    reviews: [],
  }
]

export default async function OfficeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = parseInt(id) || 1;
  const MOCK_OFFICE_PROFILE = MOCK_OFFICES_DATA.find((p) => p.id === profileId) || {
    ...MOCK_OFFICES_DATA[0],
    id: profileId,
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className="h-32 w-32 rounded-xl bg-magenta/10 flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-magenta" />
                  </div>
                  {MOCK_OFFICE_PROFILE.verified && (
                    <Badge className="gap-1 bg-accent/10 text-accent border-accent/20">
                      <CheckCircle2 className="h-4 w-4" />
                      مكتب موثّق
                    </Badge>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-foreground">{MOCK_OFFICE_PROFILE.name}</h1>
                        <p className="text-lg text-muted-foreground mt-1">{MOCK_OFFICE_PROFILE.title}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="bg-transparent">
                          <Share2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-accent text-accent" />
                      <div>
                        <div className="font-bold text-lg">{MOCK_OFFICE_PROFILE.rating}</div>
                        <div className="text-xs text-muted-foreground">{MOCK_OFFICE_PROFILE.reviewsCount} تقييم</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-magenta" />
                      <div>
                        <div className="font-bold text-lg">{MOCK_OFFICE_PROFILE.lawyersCount}</div>
                        <div className="text-xs text-muted-foreground">محامي في الفريق</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-magenta" />
                      <div>
                        <div className="font-bold text-lg">{MOCK_OFFICE_PROFILE.casesCompleted}</div>
                        <div className="text-xs text-muted-foreground">قضية منجزة</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-purple" />
                      <div>
                        <div className="font-bold text-lg">{MOCK_OFFICE_PROFILE.establishedYear}</div>
                        <div className="text-xs text-muted-foreground">سنة التأسيس</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-purple" />
                      <div>
                        <div className="font-bold text-lg truncate">{MOCK_OFFICE_PROFILE.city}</div>
                        <div className="text-xs text-muted-foreground">الموقع</div>
                      </div>
                    </div>
                  </div>

                  {/* Specializations */}
                  <div className="flex flex-wrap gap-2">
                    {MOCK_OFFICE_PROFILE.specializations.map((spec) => (
                      <Badge key={spec} variant="outline" className="bg-secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/booking/office/${MOCK_OFFICE_PROFILE.id}`}>
                      <Button size="lg" className="gap-2 bg-magenta hover:bg-magenta/90 text-white">
                        <Calendar className="h-5 w-5" />
                        احجز استشارة للمكتب
                      </Button>
                    </Link>
                    <Button size="lg" variant="outline" className="gap-2 bg-transparent text-magenta border-magenta/50 hover:bg-magenta/10">
                      <MessageSquare className="h-5 w-5" />
                      تواصل مع الفريق
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle>نبذة عن المكتب</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">{MOCK_OFFICE_PROFILE.bio}</p>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-magenta" />
                    الإنجازات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {MOCK_OFFICE_PROFILE.achievements.length > 0 ? MOCK_OFFICE_PROFILE.achievements.map((achievement, index) => (
                    <div key={index} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                      <div className="h-12 w-12 rounded-lg bg-magenta/10 flex items-center justify-center shrink-0">
                        <Award className="h-6 w-6 text-magenta" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{achievement.title}</h4>
                          <Badge variant="outline" className="bg-secondary text-xs">
                            {achievement.year}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                      </div>
                    </div>
                  )) : <p className="text-muted-foreground">لا توجد إنجازات مسجلة بعد.</p>}
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-accent text-accent" />
                    التقييمات ({MOCK_OFFICE_PROFILE.reviewsCount})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {MOCK_OFFICE_PROFILE.reviews.length > 0 ? MOCK_OFFICE_PROFILE.reviews.map((review, index) => (
                    <div key={index} className="pb-4 border-b border-border last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{review.author}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-0.5">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    </div>
                  )) : <p className="text-muted-foreground">لا توجد تقييمات حالياً.</p>}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">معلومات الاتصال</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{MOCK_OFFICE_PROFILE.city}, جمهورية مصر العربية</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>ساعات العمل: 9 ص - 5 م</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>فريق من {MOCK_OFFICE_PROFILE.lawyersCount} محامين</span>
                  </div>
                </CardContent>
              </Card>

              {/* Languages */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">اللغات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_OFFICE_PROFILE.languages.map((lang) => (
                      <Badge key={lang} variant="outline" className="bg-secondary">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">الشهادات والاعتمادات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {MOCK_OFFICE_PROFILE.certifications.map((cert, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-magenta shrink-0 mt-0.5" />
                      <span className="text-sm">{cert}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
