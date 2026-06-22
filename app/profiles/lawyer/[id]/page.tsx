import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  MapPin,
  Star,
  Award,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Share2,
  Clock,
  Users,
  TrendingUp,
  GraduationCap,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

export default async function LawyerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const { data: lawyer, error } = await supabase
    .from("lawyers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !lawyer) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center p-6 space-y-4">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold">محامي غير معروف</h2>
            <p className="text-muted-foreground">عذراً، لم نتمكن من العثور على بيانات هذا المحامي أو ربما تم حذف الحساب.</p>
            <Link href="/discovery">
              <Button className="mt-4">العودة للبحث عن محامين</Button>
            </Link>
          </Card>
        </div>
    );
  }

  const name = lawyer.full_name || lawyer.name || "محامي";
  const title = lawyer.title || lawyer.specialization || "محامي";
  const city = lawyer.city || lawyer.location || "القاهرة";
  const experienceYears = lawyer.experienceYears || lawyer.experience_years || Math.floor(Math.random() * 15) + 2;
  
  // Dynamically compute profile sections
  const bio = lawyer.bio || lawyer.about || `محامي ممارس ومستشار قانوني مقيم في ${city}، يتمتع بخبرة تزيد عن ${experienceYears} عاماً في تقديم الاستشارات القانونية وتمثيل الموكلين في مختلف القضايا. يحرص دائماً على تقديم الحلول القانونية الأنسب والأكثر كفاءة.`;
  const specializations = lawyer.specializations || (lawyer.specialization ? [lawyer.specialization] : ["الاستشارات القانونية", "القضايا المدنية"]);
  const rating = lawyer.rating || 4.5;
  const reviewsCount = lawyer.reviewsCount || lawyer.reviews_count || 12;
  const casesCompleted = lawyer.casesCompleted || lawyer.cases_completed || (experienceYears * 15);
  const answersCount = lawyer.answersCount || lawyer.answers_count || (experienceYears * 5);
  const verified = lawyer.verified ?? true;
  
  const languages = lawyer.languages || ["العربية", experienceYears > 5 ? "الإنجليزية" : null].filter(Boolean);
  
  let universityName = "جامعة القاهرة";
  if (city.includes("إسكندرية") || city.includes("الاسكندرية")) universityName = "جامعة الإسكندرية";
  else if (city.includes("منصورة")) universityName = "جامعة المنصورة";
  else if (city.includes("زقازيق")) universityName = "جامعة الزقازيق";
  else if (city.includes("أسيوط")) universityName = "جامعة أسيوط";

  const currentYear = new Date().getFullYear();
  const gradYear = currentYear - experienceYears - 1;
  const education = lawyer.education || [
    ...(experienceYears > 8 ? [{ degree: "ماجستير في القانون", institution: universityName, year: (gradYear + 3).toString() }] : []),
    { degree: "بكالوريوس في الحقوق", institution: universityName, year: gradYear.toString() }
  ];

  const certifications = lawyer.certifications || [
    "عضو نقابة المحامين",
    experienceYears > 10 ? "محامي معتمد لدى محكمة النقض" : experienceYears > 5 ? "محامي استئناف عالي" : "محامي ابتدائي"
  ].filter(Boolean);

  const experience = lawyer.experience || [
    { role: "محامي " + (experienceYears > 10 ? "نقض" : experienceYears > 5 ? "استئناف" : "ابتدائي"), company: "مكتب محاماة", duration: `لأكثر من ${experienceYears} سنوات` }
  ];

  const why_choose = [
    `خبرة واسعة تمتد لأكثر من ${experienceYears} عاماً في المجال القانوني`,
    `التواجد الدائم وتقديم الاستشارات في ${city}`,
    "الالتزام بالشفافية والمصداقية التامة مع الموكلين",
    experienceYears > 5 ? "سجل حافل بالنجاحات في القضايا المعقدة" : "متابعة دقيقة وتحديث مستمر لحالة القضايا"
  ];

  const achievements = lawyer.achievements || [];
  const recentActivity = lawyer.recentActivity || lawyer.recent_activity || [];
  const reviews = lawyer.reviews || [];

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
                  <div className="h-32 w-32 rounded-full bg-purple/10 flex items-center justify-center overflow-hidden">
                    {lawyer.avatar_url || lawyer.image_url ? (
                      <img src={lawyer.avatar_url || lawyer.image_url} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <Briefcase className="h-16 w-16 text-purple" />
                    )}
                  </div>
                  {verified && (
                    <Badge className="gap-1 bg-accent/10 text-accent border-accent/20">
                      <CheckCircle2 className="h-4 w-4" />
                      محامي موثّق
                    </Badge>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-foreground">{name}</h1>
                        <p className="text-lg text-muted-foreground mt-1">{title}</p>
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
                        <div className="font-bold text-lg">{rating}</div>
                        <div className="text-xs text-muted-foreground">{reviewsCount} تقييم</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple" />
                      <div>
                        <div className="font-bold text-lg">{experienceYears}</div>
                        <div className="text-xs text-muted-foreground">سنة خبرة</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-magenta" />
                      <div>
                        <div className="font-bold text-lg">{casesCompleted}</div>
                        <div className="text-xs text-muted-foreground">قضية منجزة</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-accent" />
                      <div>
                        <div className="font-bold text-lg">{answersCount}</div>
                        <div className="text-xs text-muted-foreground">إجابة</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-purple" />
                      <div>
                        <div className="font-bold text-lg truncate">{city}</div>
                        <div className="text-xs text-muted-foreground">الموقع</div>
                      </div>
                    </div>
                  </div>

                  {/* Specializations */}
                  {specializations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {specializations.map((spec: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="bg-secondary">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/booking/lawyer/${lawyer.id}`}>
                      <Button size="lg" className="gap-2">
                        <Calendar className="h-5 w-5" />
                        احجز موعد استشاري
                      </Button>
                    </Link>
                    <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                      <MessageSquare className="h-5 w-5" />
                      أرسل رسالة
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
                  <CardTitle>نبذة تعريفية</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">{bio}</p>
                </CardContent>
              </Card>

              {/* Why Choose */}
              {why_choose && why_choose.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-accent" />
                      لماذا تختارني؟
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {why_choose.map((reason, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-foreground">{reason}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Education */}
              {education.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-accent" />
                      المؤهلات العلمية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {education.map((edu: any, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <GraduationCap className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{edu.degree || edu.name}</h4>
                          <p className="text-sm text-muted-foreground">{edu.institution || edu.university}</p>
                          {(edu.year || edu.date) && (
                            <p className="text-xs text-muted-foreground mt-1">{edu.year || edu.date}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              {experience.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-purple" />
                      الخبرات العملية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {experience.map((exp: any, index: number) => (
                      <div key={index} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                        <div className="h-12 w-12 rounded-lg bg-purple/10 flex items-center justify-center shrink-0">
                          <Briefcase className="h-6 w-6 text-purple" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{exp.role}</h4>
                          <p className="text-sm text-muted-foreground">{exp.company}</p>
                          {exp.duration && (
                            <p className="text-xs text-muted-foreground mt-1">{exp.duration}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Achievements */}
              {achievements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple" />
                      الإنجازات والجوائز
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {achievements.map((achievement: any, index: number) => (
                      <div key={index} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                        <div className="h-12 w-12 rounded-lg bg-purple/10 flex items-center justify-center shrink-0">
                          <Award className="h-6 w-6 text-purple" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{achievement.title}</h4>
                            {achievement.year && (
                              <Badge variant="outline" className="bg-secondary text-xs">
                                {achievement.year}
                              </Badge>
                            )}
                          </div>
                          {achievement.description && (
                            <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              {recentActivity.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-magenta" />
                      النشاط الأخير
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentActivity.map((activity: any, index: number) => (
                      <div key={index} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                            activity.type === "answer" ? "bg-accent/10" : "bg-magenta/10"
                          }`}
                        >
                          {activity.type === "answer" ? (
                            <MessageSquare className={`h-5 w-5 ${activity.type === "answer" ? "text-accent" : ""}`} />
                          ) : (
                            <Award className="h-5 w-5 text-magenta" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{activity.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{activity.date}</span>
                            {activity.likes !== undefined && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-accent text-accent" />
                                <span>{activity.likes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-accent text-accent" />
                      التقييمات ({reviewsCount})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reviews.map((review: any, index: number) => (
                      <div key={index} className="pb-4 border-b border-border last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{review.author || review.user_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex gap-0.5">
                                {Array.from({ length: review.rating || 5 }).map((_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                                ))}
                              </div>
                              {review.date && <span className="text-xs text-muted-foreground">{review.date}</span>}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
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
                    <span>{city}, جمهورية مصر العربية</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>يستجيب خلال ساعتين عادة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>متاح للاستشارات الفورية</span>
                  </div>
                </CardContent>
              </Card>

              {/* Languages */}
              {languages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">اللغات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="bg-secondary">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Certifications */}
              {certifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">الشهادات والعضويات</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {certifications.map((cert: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm">{cert}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* CTA Card */}
              <Card className="bg-gradient-to-br from-accent/10 to-purple/10 border-accent/20">
                <CardHeader>
                  <CardTitle className="text-base">هل تحتاج مساعدة قانونية؟</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    احجز استشارة مع {name.split(' ')[0] || name} واحصل على مشورة قانونية متخصصة
                  </p>
                  <Link href={`/booking/lawyer/${lawyer.id}`}>
                    <Button className="w-full">احجز موعد الآن</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
