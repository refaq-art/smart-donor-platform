import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES, COURSE_LEVELS, COURSE_TYPES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

/**
 * تهيئة قاعدة بيانات SQLite في /tmp عند التشغيل على Vercel بلا Turso (وضع العرض
 * السريع). نظام الملفات في دوال Vercel للقراءة فقط باستثناء /tmp، وهو معزول
 * وفارغ في بداية كل نسخة تشغيل (Cold Start)، لذا يجب إنشاء الجداول وتعبئتها
 * ببيانات تجريبية برمجيًا هنا بدل الاعتماد على ملف قاعدة بيانات جاهز.
 */
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetToken" TEXT,
    "resetTokenExpiresAt" DATETIME
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_resetToken_key" ON "User"("resetToken")`,
  `CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role")`,
  `CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'book-open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug")`,
  `CREATE TABLE IF NOT EXISTS "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructorName" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "meetingUrl" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "scheduleTime" TEXT NOT NULL,
    "durationText" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "remainingSeats" INTEGER NOT NULL,
    "hasCertificate" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "coverImageUrl" TEXT,
    "coverColor" TEXT NOT NULL DEFAULT 'blue',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Course_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Course_slug_key" ON "Course"("slug")`,
  `CREATE INDEX IF NOT EXISTS "Course_categoryId_idx" ON "Course"("categoryId")`,
  `CREATE INDEX IF NOT EXISTS "Course_startDate_idx" ON "Course"("startDate")`,
  `CREATE INDEX IF NOT EXISTS "Course_isPublished_registrationOpen_idx" ON "Course"("isPublished", "registrationOpen")`,
  `CREATE TABLE IF NOT EXISTS "Enrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    "cancelledBy" TEXT,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId")`,
  `CREATE INDEX IF NOT EXISTS "Enrollment_courseId_idx" ON "Enrollment"("courseId")`,
  `CREATE INDEX IF NOT EXISTS "Enrollment_userId_idx" ON "Enrollment"("userId")`,
  `CREATE INDEX IF NOT EXISTS "Enrollment_status_idx" ON "Enrollment"("status")`,
];

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

type CourseSeed = {
  title: string;
  shortDescription: string;
  description: string;
  instructorName: string;
  providerName: string;
  categorySlug: string;
  level: string;
  type: string;
  location?: string;
  meetingUrl?: string;
  startOffsetDays: number;
  endOffsetDays: number;
  scheduleTime: string;
  durationText: string;
  totalSeats: number;
  fillerEnrollCount: number;
  hasCertificate: boolean;
  isPublished: boolean;
  registrationOpen: boolean;
  isFeatured: boolean;
  coverColor: string;
};

const COURSES: CourseSeed[] = [
  {
    title: "أساسيات تطوير الويب بلغة JavaScript",
    shortDescription: "تعلّم أساسيات البرمجة وبناء صفحات ويب تفاعلية من الصفر باستخدام JavaScript.",
    description:
      "دورة شاملة للمبتدئين تغطي أساسيات لغة JavaScript: المتغيرات، الشروط، الحلقات، الدوال، والتعامل مع عناصر الصفحة (DOM). ستبني خلال الدورة عدة مشاريع صغيرة تطبيقية.",
    instructorName: "م. سارة الحربي",
    providerName: "أكاديمية رواد التقنية",
    categorySlug: "programming",
    level: COURSE_LEVELS.BEGINNER,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/js-basics",
    startOffsetDays: 10,
    endOffsetDays: 45,
    scheduleTime: "الأحد والثلاثاء، 7:00 - 9:00 مساءً",
    durationText: "6 أسابيع",
    totalSeats: 40,
    fillerEnrollCount: 5,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: true,
    coverColor: "blue",
  },
  {
    title: "مبادئ تجربة المستخدم UX Design",
    shortDescription: "تعرّف على أسس تصميم تجربة مستخدم مريحة وفعّالة للمواقع والتطبيقات.",
    description:
      "دورة تأسيسية في تجربة المستخدم (UX) تغطي أبحاث المستخدمين، رسم الرحلة (User Journey)، النماذج الأولية (Wireframes/Prototypes)، واختبار قابلية الاستخدام.",
    instructorName: "أ. ريم القحطاني",
    providerName: "استوديو الإبداع الرقمي",
    categorySlug: "design",
    level: COURSE_LEVELS.BEGINNER,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/ux-basics",
    startOffsetDays: 12,
    endOffsetDays: 33,
    scheduleTime: "الثلاثاء والخميس، 8:00 - 9:30 مساءً",
    durationText: "3 أسابيع",
    totalSeats: 30,
    fillerEnrollCount: 4,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: true,
    coverColor: "rose",
  },
  {
    title: "التصميم الجرافيكي باستخدام Adobe Illustrator",
    shortDescription: "تعلّم أساسيات التصميم المتجهي واحتراف برنامج Illustrator عمليًا.",
    description:
      "ورشة عملية مكثّفة لتعلم أدوات وتقنيات برنامج Adobe Illustrator، من رسم الأشكال الأساسية إلى تصميم شعارات وهويات بصرية احترافية. يُشترط إحضار جهاز حاسب محمول.",
    instructorName: "أ. فهد الدوسري",
    providerName: "استوديو الإبداع الرقمي",
    categorySlug: "design",
    level: COURSE_LEVELS.INTERMEDIATE,
    type: COURSE_TYPES.IN_PERSON,
    location: "الرياض - مركز التدريب، حي العليا",
    startOffsetDays: -40,
    endOffsetDays: -20,
    scheduleTime: "الأحد، 5:00 - 8:00 مساءً",
    durationText: "3 أسابيع",
    totalSeats: 20,
    fillerEnrollCount: 8,
    hasCertificate: false,
    isPublished: true,
    registrationOpen: false,
    isFeatured: false,
    coverColor: "rose",
  },
  {
    title: "أساسيات التسويق الرقمي",
    shortDescription: "دليلك الشامل لفهم أدوات وقنوات التسويق الرقمي الحديثة والبدء فيها.",
    description:
      "تغطي هذه الدورة أساسيات التسويق الرقمي: محركات البحث (SEO)، الإعلانات المدفوعة، التسويق عبر البريد الإلكتروني، والتسويق بالمحتوى.",
    instructorName: "أ. عبدالله الزهراني",
    providerName: "معهد التسويق العربي",
    categorySlug: "marketing",
    level: COURSE_LEVELS.BEGINNER,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/digital-marketing",
    startOffsetDays: -8,
    endOffsetDays: 22,
    scheduleTime: "الأحد، 6:00 - 8:00 مساءً",
    durationText: "4 أسابيع",
    totalSeats: 100,
    fillerEnrollCount: 6,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: true,
    coverColor: "amber",
  },
  {
    title: "مقدمة في إدارة المشاريع الاحترافية",
    shortDescription: "تعرّف على أسس إدارة المشاريع وفق أفضل الممارسات العالمية (PMBOK).",
    description:
      "دورة تأسيسية شاملة في إدارة المشاريع تغطي دورة حياة المشروع، تخطيط النطاق والجدول الزمني والميزانية، وإدارة المخاطر.",
    instructorName: "م. تركي السبيعي",
    providerName: "معهد القيادة والإدارة",
    categorySlug: "project-management",
    level: COURSE_LEVELS.INTERMEDIATE,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/pm-intro",
    startOffsetDays: 14,
    endOffsetDays: 42,
    scheduleTime: "الأربعاء، 7:00 - 9:00 مساءً",
    durationText: "4 أسابيع",
    totalSeats: 40,
    fillerEnrollCount: 5,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: true,
    coverColor: "teal",
  },
  {
    title: "اللغة الإنجليزية للمحادثة اليومية",
    shortDescription: "طوّر مهاراتك في التحدث بالإنجليزية بثقة في المواقف اليومية والعملية.",
    description:
      "دورة تفاعلية تركّز على المحادثة والاستماع أكثر من القواعد النظرية، عبر تمارين حوارية أسبوعية ومواقف عملية (مقابلة عمل، سفر، اجتماعات).",
    instructorName: "أ. لينا يوسف",
    providerName: "مركز اللغات الدولي",
    categorySlug: "languages",
    level: COURSE_LEVELS.BEGINNER,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/english-conversation",
    startOffsetDays: -10,
    endOffsetDays: 32,
    scheduleTime: "الأحد والثلاثاء والخميس، 5:00 - 6:00 مساءً",
    durationText: "6 أسابيع",
    totalSeats: 80,
    fillerEnrollCount: 7,
    hasCertificate: false,
    isPublished: true,
    registrationOpen: true,
    isFeatured: false,
    coverColor: "blue",
  },
  {
    title: "مهارات التواصل الفعّال",
    shortDescription: "طوّر قدرتك على التواصل بوضوح وثقة في بيئة العمل والحياة اليومية.",
    description:
      "دورة تطبيقية في مهارات التواصل: الاستماع الفعّال، لغة الجسد، إدارة الحوارات الصعبة، وتقديم الأفكار بوضوح.",
    instructorName: "أ. سلطان الحارثي",
    providerName: "أكاديمية التطوير الذاتي",
    categorySlug: "soft-skills",
    level: COURSE_LEVELS.BEGINNER,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/communication-skills",
    startOffsetDays: -6,
    endOffsetDays: 15,
    scheduleTime: "الاثنين، 7:00 - 9:00 مساءً",
    durationText: "3 أسابيع",
    totalSeats: 60,
    fillerEnrollCount: 5,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: true,
    coverColor: "rose",
  },
  {
    title: "بناء نموذج العمل التجاري",
    shortDescription: "صمّم نموذج عملك التجاري بخطوات عملية باستخدام Business Model Canvas.",
    description:
      "دورة عملية لأصحاب الأفكار الريادية، تغطي بناء نموذج عمل متكامل: شرائح العملاء، القيمة المقترحة، قنوات التوزيع، ومصادر الإيرادات.",
    instructorName: "أ. عبدالعزيز الجهني",
    providerName: "حاضنة الأعمال الريادية",
    categorySlug: "entrepreneurship",
    level: COURSE_LEVELS.BEGINNER,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/business-model-canvas",
    startOffsetDays: 9,
    endOffsetDays: 23,
    scheduleTime: "الأحد، 8:00 - 10:00 مساءً",
    durationText: "أسبوعان",
    totalSeats: 50,
    fillerEnrollCount: 6,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: true,
    coverColor: "amber",
  },
  {
    title: "تحليل البيانات باستخدام Excel المتقدم",
    shortDescription: "احترف الدوال المتقدمة والجداول المحورية لتحليل البيانات في Excel.",
    description:
      "دورة عملية تغطي الدوال المتقدمة (VLOOKUP، INDEX/MATCH)، الجداول المحورية (Pivot Tables)، وتصور البيانات باستخدام الرسوم البيانية.",
    instructorName: "أ. أحمد العمري",
    providerName: "معهد تحليل الأعمال",
    categorySlug: "data-analysis",
    level: COURSE_LEVELS.BEGINNER,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/advanced-excel",
    startOffsetDays: 11,
    endOffsetDays: 32,
    scheduleTime: "الخميس، 6:00 - 8:00 مساءً",
    durationText: "3 أسابيع",
    totalSeats: 45,
    fillerEnrollCount: 4,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: false,
    coverColor: "teal",
  },
  {
    title: "مقدمة في تحليل البيانات باستخدام Python وPandas",
    shortDescription: "تعلّم تنظيف وتحليل البيانات برمجيًا باستخدام مكتبة Pandas في Python.",
    description:
      "دورة متوسطة المستوى تغطي أساسيات مكتبة Pandas: قراءة البيانات، التنظيف، التجميع، والتحليل الاستكشافي. يُشترط إلمام أساسي بلغة Python.",
    instructorName: "م. ديم الشريف",
    providerName: "معهد تحليل الأعمال",
    categorySlug: "data-analysis",
    level: COURSE_LEVELS.INTERMEDIATE,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/pandas-course",
    startOffsetDays: 13,
    endOffsetDays: 34,
    scheduleTime: "الأحد، 6:00 - 8:00 مساءً",
    durationText: "3 أسابيع",
    totalSeats: 8,
    fillerEnrollCount: 8,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: true,
    coverColor: "purple",
  },
];

const DEMO_USER_ENROLL_TITLES = {
  upcoming: "أساسيات تطوير الويب بلغة JavaScript",
  current: "أساسيات التسويق الرقمي",
  past: "التصميم الجرافيكي باستخدام Adobe Illustrator",
};

async function seedDemoData(prisma: PrismaClient) {
  const now = new Date();

  const admin = await prisma.user.create({
    data: {
      fullName: "مدير المنصة",
      email: "admin@example.com",
      passwordHash: await hash("Admin@12345"),
      role: "ADMIN",
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      fullName: "مستخدم تجريبي",
      email: "user@example.com",
      phone: "0500000000",
      passwordHash: await hash("User@12345"),
      role: "USER",
    },
  });

  const fillerNames = [
    "محمد العتيبي",
    "فاطمة الزهراني",
    "عبدالرحمن القحطاني",
    "مها الدوسري",
    "يوسف الشمري",
    "أمل الحربي",
    "سعود المطيري",
    "نوف السبيعي",
  ];
  const fillerUsers = [];
  for (let i = 0; i < fillerNames.length; i++) {
    const user = await prisma.user.create({
      data: {
        fullName: fillerNames[i],
        email: `learner${i + 1}@example.com`,
        passwordHash: await hash("Learner@12345"),
        role: "USER",
      },
    });
    fillerUsers.push(user);
  }

  const categoryBySlug = new Map<string, string>();
  for (const cat of DEFAULT_CATEGORIES) {
    const category = await prisma.category.create({
      data: { name: cat.name, slug: cat.slug, icon: cat.icon },
    });
    categoryBySlug.set(cat.slug, category.id);
  }

  for (const c of COURSES) {
    const categoryId = categoryBySlug.get(c.categorySlug);
    if (!categoryId) continue;

    const demoBucket = Object.entries(DEMO_USER_ENROLL_TITLES).find(([, title]) => title === c.title);
    const demoEnrolled = !!demoBucket;

    const remainingSeats = Math.max(0, c.totalSeats - c.fillerEnrollCount - (demoEnrolled ? 1 : 0));

    const course = await prisma.course.create({
      data: {
        title: c.title,
        slug: slugify(c.title),
        shortDescription: c.shortDescription,
        description: c.description,
        instructorName: c.instructorName,
        providerName: c.providerName,
        categoryId,
        level: c.level,
        type: c.type,
        location: c.location,
        meetingUrl: c.meetingUrl,
        startDate: addDays(now, c.startOffsetDays),
        endDate: addDays(now, c.endOffsetDays),
        scheduleTime: c.scheduleTime,
        durationText: c.durationText,
        totalSeats: c.totalSeats,
        remainingSeats,
        hasCertificate: c.hasCertificate,
        isPublished: c.isPublished,
        registrationOpen: c.registrationOpen,
        isFeatured: c.isFeatured,
        coverColor: c.coverColor,
        createdById: admin.id,
      },
    });

    const fillersToEnroll = fillerUsers.slice(0, c.fillerEnrollCount);
    for (const filler of fillersToEnroll) {
      await prisma.enrollment.create({
        data: { userId: filler.id, courseId: course.id, status: "ACTIVE" },
      });
    }

    if (demoEnrolled) {
      await prisma.enrollment.create({
        data: { userId: demoUser.id, courseId: course.id, status: "ACTIVE" },
      });
    }
  }
}

/** يُنشئ الجداول إن لم تكن موجودة، ويعبّئها بالبيانات التجريبية مرة واحدة فقط إن كانت فارغة. */
export async function ensureServerlessDemoDatabase(prisma: PrismaClient): Promise<void> {
  for (const statement of SCHEMA_STATEMENTS) {
    await prisma.$executeRawUnsafe(statement);
  }

  const existingCategories = await prisma.category.count();
  if (existingCategories > 0) return;

  await seedDemoData(prisma);
}
