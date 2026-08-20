import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Search,
  UserPlus,
  CheckCircle2,
  GraduationCap,
  Users,
  Layers,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { courseCardInclude, getEnrolledCourseIds, getPlatformStats, getCategoriesWithCounts } from "@/lib/queries";
import { CourseCard } from "@/components/course-card";
import { CategoryIcon } from "@/components/icons";
import { SectionHeading } from "@/components/ui";
import { formatNumberAr } from "@/lib/utils";

export default async function HomePage() {
  const session = await getSession();

  const [featuredCourses, latestCourses, stats, categories, enrolledIds] = await Promise.all([
    prisma.course.findMany({
      where: { isPublished: true, isFeatured: true },
      include: courseCardInclude,
      orderBy: { startDate: "asc" },
      take: 3,
    }),
    prisma.course.findMany({
      where: { isPublished: true },
      include: courseCardInclude,
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    getPlatformStats(),
    getCategoriesWithCounts(),
    getEnrolledCourseIds(session?.userId),
  ]);

  const steps = [
    {
      icon: UserPlus,
      title: "أنشئ حسابك",
      description: "سجّل بياناتك الأساسية في دقيقة واحدة، مجانًا بالكامل.",
    },
    {
      icon: Search,
      title: "تصفّح الدورات",
      description: "ابحث وصفِّ الدورات حسب المجال والمستوى وموعدك المناسب.",
    },
    {
      icon: CheckCircle2,
      title: "سجّل في الدورة",
      description: "اضغط زر «سجّل الآن» واحجز مقعدك فورًا.",
    },
    {
      icon: GraduationCap,
      title: "ابدأ التعلّم",
      description: "تابع دوراتك من صفحة «دوراتي» واحصل على شهادتك عند الإتمام.",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="container-app grid grid-cols-1 items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-in text-center lg:text-right">
            <span className="badge mb-4 border-brand-200 bg-brand-50 text-brand-700 ring-brand-200">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              دورات مجانية بشهادات حضور
            </span>
            <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl lg:text-5xl">
              طوّر مهاراتك مع دورات مجانية{" "}
              <span className="text-brand-600">تناسب طموحك</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500 lg:mx-0">
              منصة عربية تجمع دورات مجانية ومتنوعة في البرمجة والتصميم والتسويق وريادة الأعمال
              وغيرها الكثير — سجّل الآن وابدأ التعلّم بخطوات بسيطة.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/courses" className="btn-primary px-6 py-3 text-base">
                استعرض الدورات
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
              {!session && (
                <Link href="/register" className="btn-secondary px-6 py-3 text-base">
                  إنشاء حساب مجاني
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card flex flex-col items-center justify-center gap-1 p-6 text-center">
              <BookOpen className="h-7 w-7 text-brand-600" aria-hidden="true" />
              <span className="text-2xl font-black text-ink">{formatNumberAr(stats.totalCourses)}</span>
              <span className="text-sm text-slate-500">دورة متاحة</span>
            </div>
            <div className="card flex flex-col items-center justify-center gap-1 p-6 text-center">
              <Users className="h-7 w-7 text-brand-600" aria-hidden="true" />
              <span className="text-2xl font-black text-ink">{formatNumberAr(stats.totalLearners)}</span>
              <span className="text-sm text-slate-500">متعلّم مسجَّل</span>
            </div>
            <div className="card flex flex-col items-center justify-center gap-1 p-6 text-center">
              <Layers className="h-7 w-7 text-brand-600" aria-hidden="true" />
              <span className="text-2xl font-black text-ink">{formatNumberAr(stats.totalCategories)}</span>
              <span className="text-sm text-slate-500">تصنيف متنوّع</span>
            </div>
            <div className="card flex flex-col items-center justify-center gap-1 p-6 text-center">
              <Award className="h-7 w-7 text-brand-600" aria-hidden="true" />
              <span className="text-2xl font-black text-ink">{formatNumberAr(stats.certificateCourses)}</span>
              <span className="text-sm text-slate-500">دورة بشهادة</span>
            </div>
          </div>
        </div>
      </section>

      {/* التصنيفات */}
      <section className="container-app py-16">
        <SectionHeading eyebrow="استكشف" title="تصنيفات الدورات" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/courses?category=${cat.slug}`}
              className="card flex flex-col items-center gap-2 p-5 text-center transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <CategoryIcon icon={cat.icon} className="h-6 w-6" />
              </span>
              <span className="text-sm font-bold text-ink">{cat.name}</span>
              <span className="text-xs text-slate-400">{formatNumberAr(cat._count.courses)} دورة</span>
            </Link>
          ))}
        </div>
      </section>

      {/* دورات مميزة */}
      {featuredCourses.length > 0 && (
        <section className="container-app py-8">
          <SectionHeading
            eyebrow="لا تفوّتها"
            title="دورات مميزة"
            action={
              <Link href="/courses" className="btn-secondary">
                عرض الكل
              </Link>
            }
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} isEnrolled={enrolledIds.has(course.id)} />
            ))}
          </div>
        </section>
      )}

      {/* أحدث الدورات */}
      <section className="container-app py-16">
        <SectionHeading
          eyebrow="جديدنا"
          title="أحدث الدورات"
          action={
            <Link href="/courses" className="btn-secondary">
              عرض الكل
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {latestCourses.map((course) => (
            <CourseCard key={course.id} course={course} isEnrolled={enrolledIds.has(course.id)} />
          ))}
        </div>
      </section>

      {/* خطوات التسجيل */}
      <section className="bg-white py-16">
        <div className="container-app">
          <SectionHeading eyebrow="سهل وبسيط" title="كيف تبدأ رحلتك التعليمية؟" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, idx) => (
              <div key={step.title} className="relative rounded-xl2 border border-slate-200 bg-surface p-6">
                <span className="absolute -top-3 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-black text-white">
                  {idx + 1}
                </span>
                <step.icon className="mb-4 h-8 w-8 text-brand-600" aria-hidden="true" />
                <h3 className="mb-1.5 font-bold text-ink">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!session && (
        <section className="container-app py-16">
          <div className="card flex flex-col items-center gap-4 bg-gradient-to-l from-brand-600 to-brand-700 p-10 text-center text-white sm:p-14">
            <h2 className="text-2xl font-black sm:text-3xl">ابدأ رحلتك التعليمية اليوم مجانًا</h2>
            <p className="max-w-xl text-brand-50">
              انضم إلى آلاف المتعلمين الذين طوّروا مهاراتهم عبر منصّة الدورات، واحصل على شهادة
              حضور معتمدة عند إتمام الدورة.
            </p>
            <Link href="/register" className="btn bg-white px-6 py-3 text-base text-brand-700 hover:bg-brand-50">
              إنشاء حساب مجاني الآن
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
