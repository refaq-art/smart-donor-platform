import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES, COURSE_LEVELS, COURSE_TYPES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

/**
 * تهيئة قاعدة بيانات SQLite في /tmp عند التشغيل على Vercel بلا Turso (وضع العرض
 * السريع). نظام الملفات في دوال Vercel للقراءة فقط باستثناء /tmp، وهو معزول
 * وفارغ في بداية كل نسخة تشغيل (Cold Start)، لذا يجب إنشاء الجداول وتعبئتها
 * ببيانات تجريبية برمجيًا هنا بدل الاعتماد على ملف قاعدة بيانات جاهز. تُستخدم
 * جمل CREATE TABLE/INDEX IF NOT EXISTS عبر $executeRawUnsafe لأن محرك الترحيل
 * (Migrate Engine) غير متاح وقت التشغيل — محرك الاستعلامات (Query Engine) وحده
 * كافٍ لتنفيذ SQL خام مطابق لما يُنتجه Prisma من prisma/schema.prisma.
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
      "دورة شاملة للمبتدئين تغطي أساسيات لغة JavaScript: المتغيرات، الشروط، الحلقات، الدوال، والتعامل مع عناصر الصفحة (DOM). ستبني خلال الدورة عدة مشاريع صغيرة تطبيقية، وتنتهي بمشروع تخرّج بسيط يُضاف إلى معرض أعمالك. لا يُشترط أي خبرة برمجية سابقة.",
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
    title: "بايثون للمبتدئين: من الصفر إلى الاحتراف",
    shortDescription: "ابدأ رحلتك في البرمجة مع لغة بايثون السهلة والقوية عبر تدريب عملي مكثّف.",
    description:
      "تغطي هذه الدورة أساسيات لغة Python بدءًا من المتغيرات وأنواع البيانات وصولًا إلى البرمجة الكائنية والتعامل مع الملفات. مناسبة تمامًا لمن يريد دخول عالم البرمجة أو تحليل البيانات لاحقًا. تتضمن الدورة تمارين أسبوعية ومراجعة جماعية للحلول.",
    instructorName: "أ. خالد المطيري",
    providerName: "منصة تعلّم البرمجة",
    categorySlug: "programming",
    level: COURSE_LEVELS.BEGINNER,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/python-basics",
    startOffsetDays: -5,
    endOffsetDays: 25,
    scheduleTime: "الاثنين والأربعاء، 6:00 - 8:00 مساءً",
    durationText: "4 أسابيع",
    totalSeats: 60,
    fillerEnrollCount: 3,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: false,
    coverColor: "blue",
  },
  {
    title: "بناء واجهات المستخدم باستخدام React",
    shortDescription: "دورة متوسطة المستوى لتعلم بناء واجهات ويب حديثة وتفاعلية بمكتبة React.",
    description:
      "دورة عملية لمن يمتلك أساسيات JavaScript ويريد الانتقال لبناء تطبيقات ويب حديثة باستخدام مكتبة React. نغطي المكوّنات (Components)، الحالة (State)، الخصائص (Props)، والتعامل مع واجهات برمجة التطبيقات (APIs)، وننهي الدورة ببناء تطبيق كامل.",
    instructorName: "م. نورة العتيبي",
    providerName: "أكاديمية رواد التقنية",
    categorySlug: "programming",
    level: COURSE_LEVELS.INTERMEDIATE,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/react-course",
    startOffsetDays: 20,
    endOffsetDays: 55,
    scheduleTime: "السبت، 4:00 - 7:00 مساءً",
    durationText: "5 أسابيع",
    totalSeats: 35,
    fillerEnrollCount: 2,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: false,
    coverColor: "purple",
  },
  {
    title: "مبادئ تجربة المستخدم UX Design",
    shortDescription: "تعرّف على أسس تصميم تجربة مستخدم مريحة وفعّالة للمواقع والتطبيقات.",
    description:
      "دورة تأسيسية في تجربة المستخدم (UX) تغطي أبحاث المستخدمين، رسم الرحلة (User Journey)، النماذج الأولية (Wireframes/Prototypes)، واختبار قابلية الاستخدام. مناسبة للمصممين والمطورين ومديري المنتجات على حدٍّ سواء.",
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
      "ورشة عملية مكثّفة لتعلم أدوات وتقنيات برنامج Adobe Illustrator، من رسم الأشكال الأساسية إلى تصميم شعارات وهويات بصرية احترافية. يُشترط إحضار جهاز حاسب محمول مثبَّت عليه البرنامج (نسخة تجريبية مقبولة).",
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
    title: "تصميم الهوية البصرية للعلامات التجارية",
    shortDescription: "دورة متقدمة في بناء هويات بصرية متكاملة من الفكرة إلى دليل الاستخدام.",
    description:
      "دورة متقدمة تستهدف المصممين الذين يمتلكون خبرة سابقة، تغطي استراتيجية العلامة التجارية، تصميم الشعارات، اختيار الألوان والخطوط، وإعداد دليل الهوية البصرية الكامل (Brand Guidelines).",
    instructorName: "أ. لمى الشمري",
    providerName: "استوديو الإبداع الرقمي",
    categorySlug: "design",
    level: COURSE_LEVELS.ADVANCED,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/branding-advanced",
    startOffsetDays: 18,
    endOffsetDays: 46,
    scheduleTime: "الاثنين، 7:00 - 9:00 مساءً",
    durationText: "4 أسابيع",
    totalSeats: 25,
    fillerEnrollCount: 1,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: false,
    coverColor: "purple",
  },
  {
    title: "أساسيات التسويق الرقمي",
    shortDescription: "دليلك الشامل لفهم أدوات وقنوات التسويق الرقمي الحديثة والبدء فيها.",
    description:
      "تغطي هذه الدورة أساسيات التسويق الرقمي: محركات البحث (SEO)، الإعلانات المدفوعة، التسويق عبر البريد الإلكتروني، والتسويق بالمحتوى. مناسبة لأصحاب المشاريع الصغيرة والمهتمين ببدء مسار مهني في التسويق.",
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
    title: "التسويق عبر منصات التواصل الاجتماعي",
    shortDescription: "احتراف إدارة الحسابات وبناء حملات تسويقية ناجحة على منصات التواصل.",
    description:
      "دورة عملية تركّز على استراتيجيات التسويق عبر إنستغرام وتيك توك وسناب شات، تخطيط المحتوى، وقياس أداء الحملات. تتضمن الدورة أمثلة حقيقية وتحليل حالات دراسية.",
    instructorName: "أ. منيرة العنزي",
    providerName: "معهد التسويق العربي",
    categorySlug: "marketing",
    level: COURSE_LEVELS.INTERMEDIATE,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/social-marketing",
    startOffsetDays: 15,
    endOffsetDays: 36,
    scheduleTime: "الثلاثاء، 7:00 - 9:00 مساءً",
    durationText: "3 أسابيع",
    totalSeats: 50,
    fillerEnrollCount: 2,
    hasCertificate: false,
    isPublished: true,
    registrationOpen: true,
    isFeatured: false,
    coverColor: "amber",
  },
  {
    title: "كتابة المحتوى التسويقي الاحترافي",
    shortDescription: "تعلّم صياغة محتوى تسويقي مقنع للمواقع والإعلانات ووسائل التواصل.",
    description:
      "ورشة تدريبية حضورية تركّز على أساليب الكتابة الإقناعية، صياغة العناوين الجذابة، وكتابة محتوى مناسب لكل منصة. تتضمن تمارين كتابة مباشرة وتغذية راجعة فورية من المدرب.",
    instructorName: "أ. هند الغامدي",
    providerName: "معهد التسويق العربي",
    categorySlug: "marketing",
    level: COURSE_LEVELS.BEGINNER,
    type: COURSE_TYPES.IN_PERSON,
    location: "جدة - مركز رواد الأعمال، حي الروضة",
    startOffsetDays: 25,
    endOffsetDays: 32,
    scheduleTime: "السبت، 10:00 صباحًا - 1:00 ظهرًا",
    durationText: "أسبوع واحد",
    totalSeats: 20,
    fillerEnrollCount: 3,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: false,
    isFeatured: false,
    coverColor: "amber",
  },
  {
    title: "مقدمة في إدارة المشاريع الاحترافية",
    shortDescription: "تعرّف على أسس إدارة المشاريع وفق أفضل الممارسات العالمية (PMBOK).",
    description:
      "دورة تأسيسية شاملة في إدارة المشاريع تغطي دورة حياة المشروع، تخطيط النطاق والجدول الزمني والميزانية، وإدارة المخاطر. مناسبة للراغبين في دخول مجال إدارة المشاريع أو تحسين مهاراتهم الحالية.",
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
    title: "إدارة المشاريع باستخدام Agile وScrum",
    shortDescription: "احترف منهجيات العمل الرشيقة وقُد فرق العمل بكفاءة عالية.",
    description:
      "دورة متقدمة تغطي مبادئ Agile وإطار عمل Scrum بالتفصيل: الأدوار، الاجتماعات، وإدارة قائمة المهام (Backlog). موجّهة لمن لديه خبرة أساسية في إدارة المشاريع ويريد التخصص في المنهجيات الرشيقة.",
    instructorName: "أ. عمر باعشن",
    providerName: "معهد القيادة والإدارة",
    categorySlug: "project-management",
    level: COURSE_LEVELS.ADVANCED,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/agile-scrum",
    startOffsetDays: -3,
    endOffsetDays: 18,
    scheduleTime: "الخميس، 6:00 - 8:30 مساءً",
    durationText: "3 أسابيع",
    totalSeats: 30,
    fillerEnrollCount: 4,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: false,
    coverColor: "teal",
  },
  {
    title: "أساسيات استخدام برنامج Microsoft Project",
    shortDescription: "ورشة عملية لتعلم جدولة المشاريع ومتابعتها باستخدام أداة Microsoft Project.",
    description:
      "ورشة حضورية مكثّفة تغطي إنشاء خطة مشروع كاملة على برنامج Microsoft Project: تعريف المهام، الترابطات، الموارد، ومتابعة التقدّم. يُفضَّل إحضار حاسب محمول.",
    instructorName: "م. بدر القرني",
    providerName: "معهد القيادة والإدارة",
    categorySlug: "project-management",
    level: COURSE_LEVELS.BEGINNER,
    type: COURSE_TYPES.IN_PERSON,
    location: "الدمام - مركز التدريب المهني، حي الشاطئ",
    startOffsetDays: 28,
    endOffsetDays: 30,
    scheduleTime: "الأحد والاثنين، 9:00 صباحًا - 2:00 ظهرًا",
    durationText: "يومان",
    totalSeats: 20,
    fillerEnrollCount: 2,
    hasCertificate: false,
    isPublished: true,
    registrationOpen: true,
    isFeatured: false,
    coverColor: "teal",
  },
  {
    title: "اللغة الإنجليزية للمحادثة اليومية",
    shortDescription: "طوّر مهاراتك في التحدث بالإنجليزية بثقة في المواقف اليومية والعملية.",
    description:
      "دورة تفاعلية تركّز على المحادثة والاستماع أكثر من القواعد النظرية، عبر تمارين حوارية أسبوعية ومواقف عملية (مقابلة عمل، سفر، اجتماعات). مناسبة لجميع المستويات المبتدئة.",
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
    title: "أساسيات اللغة التركية للمبتدئين",
    shortDescription: "ابدأ تعلّم اللغة التركية من الحروف والنطق حتى الجمل الأساسية.",
    description:
      "دورة تأسيسية شاملة لتعلم اللغة التركية: الأبجدية، القواعد الأساسية، والمفردات الشائعة، مع تدريب مستمر على النطق والاستماع.",
    instructorName: "أ. آيشه دمير",
    providerName: "مركز اللغات الدولي",
    categorySlug: "languages",
    level: COURSE_LEVELS.BEGINNER,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/turkish-basics",
    startOffsetDays: 22,
    endOffsetDays: 64,
    scheduleTime: "السبت والاثنين، 6:00 - 7:30 مساءً",
    durationText: "6 أسابيع",
    totalSeats: 45,
    fillerEnrollCount: 3,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: false,
    coverColor: "purple",
  },
  {
    title: "مهارات الكتابة الأكاديمية بالإنجليزية",
    shortDescription: "دورة متقدمة لصقل مهارات الكتابة البحثية والأكاديمية باللغة الإنجليزية.",
    description:
      "موجّهة للباحثين وطلاب الدراسات العليا، تغطي بنية المقال الأكاديمي، الاستشهاد المرجعي، وأساليب التوثيق. يُشترط مستوى جيد في اللغة الإنجليزية.",
    instructorName: "د. مايكل هاريس",
    providerName: "مركز اللغات الدولي",
    categorySlug: "languages",
    level: COURSE_LEVELS.ADVANCED,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/academic-writing",
    startOffsetDays: 30,
    endOffsetDays: 58,
    scheduleTime: "الثلاثاء، 8:00 - 10:00 مساءً",
    durationText: "4 أسابيع",
    totalSeats: 25,
    fillerEnrollCount: 1,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: false,
    coverColor: "blue",
  },
  {
    title: "مهارات التواصل الفعّال",
    shortDescription: "طوّر قدرتك على التواصل بوضوح وثقة في بيئة العمل والحياة اليومية.",
    description:
      "دورة تطبيقية في مهارات التواصل: الاستماع الفعّال، لغة الجسد، إدارة الحوارات الصعبة، وتقديم الأفكار بوضوح. تتضمن تمارين عملية وتمثيل أدوار (Role Play).",
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
    title: "إدارة الوقت وزيادة الإنتاجية",
    shortDescription: "أدوات وتقنيات عملية لتنظيم وقتك وإنجاز مهامك بكفاءة أعلى.",
    description:
      "ورشة عملية مكثّفة تغطي تقنيات إدارة الوقت المعروفة (Pomodoro، مصفوفة أيزنهاور)، وتحديد الأولويات، والتخلص من المماطلة.",
    instructorName: "أ. جواهر الشهري",
    providerName: "أكاديمية التطوير الذاتي",
    categorySlug: "soft-skills",
    level: COURSE_LEVELS.BEGINNER,
    type: COURSE_TYPES.IN_PERSON,
    location: "الرياض - مركز التدريب، حي الملقا",
    startOffsetDays: -25,
    endOffsetDays: -24,
    scheduleTime: "السبت، 9:00 صباحًا - 3:00 عصرًا",
    durationText: "يوم واحد",
    totalSeats: 30,
    fillerEnrollCount: 4,
    hasCertificate: false,
    isPublished: true,
    registrationOpen: true,
    isFeatured: false,
    coverColor: "rose",
  },
  {
    title: "مهارات القيادة وبناء الفرق",
    shortDescription: "طوّر مهاراتك القيادية وتعلّم كيفية بناء وإدارة فرق عمل ناجحة.",
    description:
      "دورة متوسطة المستوى تغطي أنماط القيادة، تحفيز فرق العمل، وإدارة الاجتماعات الفعّالة. مناسبة للقياديين الحاليين والراغبين في تولّي مناصب قيادية مستقبلًا.",
    instructorName: "د. ماجد آل الشيخ",
    providerName: "أكاديمية التطوير الذاتي",
    categorySlug: "soft-skills",
    level: COURSE_LEVELS.INTERMEDIATE,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/leadership-skills",
    startOffsetDays: 17,
    endOffsetDays: 38,
    scheduleTime: "الأربعاء، 6:00 - 8:00 مساءً",
    durationText: "3 أسابيع",
    totalSeats: 35,
    fillerEnrollCount: 3,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: false,
    coverColor: "rose",
  },
  {
    title: "بناء نموذج العمل التجاري",
    shortDescription: "صمّم نموذج عملك التجاري بخطوات عملية باستخدام Business Model Canvas.",
    description:
      "دورة عملية لأصحاب الأفكار الريادية، تغطي بناء نموذج عمل متكامل باستخدام أداة Business Model Canvas: شرائح العملاء، القيمة المقترحة، قنوات التوزيع، ومصادر الإيرادات.",
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
    title: "أساسيات تأسيس الشركات الناشئة",
    shortDescription: "دليل عملي لتأسيس شركتك الناشئة من الفكرة حتى أول جولة تمويل.",
    description:
      "تغطي هذه الدورة الخطوات العملية لتأسيس شركة ناشئة: التحقق من الفكرة، الجوانب النظامية والقانونية الأساسية، وطرق التمويل المبكر ولقاء المستثمرين.",
    instructorName: "أ. ياسر النعيمي",
    providerName: "حاضنة الأعمال الريادية",
    categorySlug: "entrepreneurship",
    level: COURSE_LEVELS.INTERMEDIATE,
    type: COURSE_TYPES.ONLINE,
    meetingUrl: "https://meet.example.com/startup-basics",
    startOffsetDays: -12,
    endOffsetDays: 16,
    scheduleTime: "الثلاثاء، 7:00 - 9:00 مساءً",
    durationText: "4 أسابيع",
    totalSeats: 40,
    fillerEnrollCount: 3,
    hasCertificate: false,
    isPublished: true,
    registrationOpen: true,
    isFeatured: false,
    coverColor: "amber",
  },
  {
    title: "تحليل البيانات باستخدام Excel المتقدم",
    shortDescription: "احترف الدوال المتقدمة والجداول المحورية لتحليل البيانات في Excel.",
    description:
      "دورة عملية تغطي الدوال المتقدمة (VLOOKUP، INDEX/MATCH)، الجداول المحورية (Pivot Tables)، وتصور البيانات باستخدام الرسوم البيانية. مناسبة للموظفين الإداريين والماليين.",
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
  {
    title: "لوحات المعلومات التفاعلية باستخدام Power BI",
    shortDescription: "ورشة عملية لبناء لوحات معلومات احترافية وربطها بمصادر بيانات متعددة.",
    description:
      "ورشة حضورية مكثّفة لتعلم أداة Power BI: استيراد البيانات، بناء العلاقات، إنشاء المقاييس (Measures)، وتصميم لوحات معلومات تفاعلية جاهزة للعرض على الإدارة.",
    instructorName: "م. فيصل الرشيد",
    providerName: "معهد تحليل الأعمال",
    categorySlug: "data-analysis",
    level: COURSE_LEVELS.ADVANCED,
    type: COURSE_TYPES.IN_PERSON,
    location: "الرياض - مركز التدريب، حي العليا",
    startOffsetDays: 35,
    endOffsetDays: 37,
    scheduleTime: "الجمعة والسبت، 9:00 صباحًا - 3:00 عصرًا",
    durationText: "يومان",
    totalSeats: 20,
    fillerEnrollCount: 2,
    hasCertificate: true,
    isPublished: true,
    registrationOpen: true,
    isFeatured: false,
    coverColor: "teal",
  },
];

const DEMO_USER_ENROLL_TITLES = {
  upcoming: "أساسيات تطوير الويب بلغة JavaScript",
  current: "بايثون للمبتدئين: من الصفر إلى الاحتراف",
  past: "إدارة الوقت وزيادة الإنتاجية",
};
const DEMO_USER_CANCELLED_TITLE = "كتابة المحتوى التسويقي الاحترافي";

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

    const demoBucket = Object.entries(DEMO_USER_ENROLL_TITLES).find(
      ([, title]) => title === c.title
    );
    const demoEnrolled = !!demoBucket;
    const demoCancelled = c.title === DEMO_USER_CANCELLED_TITLE;

    const remainingSeats = Math.max(
      0,
      c.totalSeats - c.fillerEnrollCount - (demoEnrolled ? 1 : 0)
    );

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

    if (demoCancelled) {
      await prisma.enrollment.create({
        data: {
          userId: demoUser.id,
          courseId: course.id,
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledBy: "USER",
        },
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
