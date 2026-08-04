import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Passw0rd!";

async function main() {
  console.log("🌱 جارٍ حذف البيانات التجريبية السابقة (إن وجدت)...");
  await prisma.activityLog.deleteMany({});
  await prisma.applicationStatusHistory.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.grantApplication.deleteMany({});
  await prisma.fundingOpportunity.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.donor.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("🏢 إنشاء بيانات الجمعية...");
  await prisma.organization.create({
    data: {
      name: "جمعية رفاق الخيرية",
      about:
        "جمعية خيرية تعمل على رعاية وتمكين المستفيدين عبر مشاريع نوعية قابلة للقياس في المجالات التعليمية والصحية والتنموية، وتسعى لبناء شراكات مستدامة مع الجهات المانحة.",
      city: "حائل",
      phone: "0555000000",
      email: "info@refaq.org",
      website: "https://example.org",
      regNumber: "1234-REG",
      accentColor: "#0f766e",
      isDemo: true,
    },
  });

  console.log("👥 إنشاء المستخدمين التجريبيين...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: { name: "سارة العتيبي", email: "admin@refaq.org", passwordHash, role: "ADMIN", isDemo: true },
  });
  const manager = await prisma.user.create({
    data: { name: "خالد المطيري", email: "manager@refaq.org", passwordHash, role: "ORG_MANAGER", isDemo: true },
  });
  const officer = await prisma.user.create({
    data: { name: "نورة القحطاني", email: "officer@refaq.org", passwordHash, role: "GRANTS_OFFICER", isDemo: true },
  });
  const reviewer = await prisma.user.create({
    data: { name: "فهد الدوسري", email: "reviewer@refaq.org", passwordHash, role: "REVIEWER", isDemo: true },
  });

  console.log("💛 إنشاء الجهات المانحة...");
  const donor1 = await prisma.donor.create({
    data: {
      name: "مؤسسة الأفق للتنمية",
      type: "مؤسسة مانحة",
      supportFields: "تعليمي، تمكين اقتصادي",
      fundingConditions: "تقديم تقرير أثر ربع سنوي، وألا يتجاوز الدعم 40% من ميزانية المشروع.",
      contactName: "أ. ريم الشمري — مدير المنح",
      phone: "0501234567",
      email: "grants@alofoq-example.org",
      city: "الرياض",
      relationshipStatus: "نشط",
      notes: "علاقة قائمة منذ عامين، تفضل المشاريع ذات الأثر القابل للقياس.",
      isDemo: true,
    },
  });
  const donor2 = await prisma.donor.create({
    data: {
      name: "شركة الواحة الغذائية",
      type: "شركة",
      supportFields: "غذائي، مسؤولية اجتماعية",
      fundingConditions: "الأولوية للمبادرات الموسمية (رمضان، الشتاء) ودعم عيني أو نقدي محدود.",
      contactName: "أ. عبدالله الحربي — مسؤول المسؤولية الاجتماعية",
      phone: "0559876543",
      email: "csr@alwaha-example.com",
      city: "حائل",
      relationshipStatus: "نشط",
      notes: "مناسبة لمشاريع السلال الغذائية والحملات الموسمية.",
      isDemo: true,
    },
  });
  const donor3 = await prisma.donor.create({
    data: {
      name: "الهيئة الوطنية لدعم القطاع غير الربحي",
      type: "جهة حكومية",
      supportFields: "تنموي، مؤسسي",
      fundingConditions: "تتطلب ترخيصًا ساري المفعول وتقارير حوكمة سنوية.",
      contactName: "قسم المنح والشراكات",
      phone: "8001234567",
      email: "grants@ncnp-example.gov.sa",
      city: "الرياض",
      relationshipStatus: "محتمل",
      notes: "لم يبدأ التواصل الرسمي بعد — بانتظار فتح باب التقديم القادم.",
      isDemo: true,
    },
  });
  const donor4 = await prisma.donor.create({
    data: {
      name: "مؤسسة نماء التقنية",
      type: "شركة",
      supportFields: "تقني، تمكين رقمي",
      fundingConditions: "تفضل دعم برامج التدريب التقني والأجهزة.",
      contactName: "م. سلطان العنزي",
      phone: "0567891234",
      email: "partnerships@nama-example.tech",
      city: "الرياض",
      relationshipStatus: "متوقف",
      notes: "تم التقديم سابقًا ولم يُقبل الطلب؛ يُنصح بإعادة التواصل بعد نصف عام.",
      isDemo: true,
    },
  });

  console.log("📁 إنشاء المشاريع...");
  const project1 = await prisma.project.create({
    data: {
      title: "كفالة تعليم الأيتام",
      category: "تعليمي",
      problemStatement:
        "يعاني عدد من الأيتام في المنطقة من تعثر تعليمي بسبب ضعف القدرة المالية للأسر الحاضنة على تغطية الرسوم الدراسية والمستلزمات، مما يزيد من معدلات التسرب.",
      generalObjective: "تحسين المسار التعليمي للأيتام وتقليل معدلات التعثر الدراسي.",
      specificObjectives: JSON.stringify([
        "دعم 120 طالبًا وطالبة من الأيتام برسوم دراسية ومستلزمات تعليمية خلال عام دراسي كامل",
        "خفض معدل التعثر الدراسي لدى المستفيدين بنسبة 20%",
        "تفعيل برنامج متابعة أكاديمية شهري لأولياء الأمور",
      ]),
      beneficiaryCategory: "الأيتام وأسرهم الحاضنة",
      beneficiaryCount: 120,
      geographicScope: "مدينة حائل وضواحيها",
      activities: JSON.stringify([
        "حصر واعتماد قائمة المستفيدين بالتنسيق مع الجهات ذات العلاقة",
        "صرف الرسوم الدراسية والمستلزمات في بداية كل فصل دراسي",
        "تنظيم لقاءات متابعة دورية مع أولياء الأمور والمعلمين",
        "تقييم الأثر التعليمي في نهاية العام الدراسي",
      ]),
      outputs: JSON.stringify(["120 طالبًا تم دعمهم بالرسوم والمستلزمات", "12 لقاء متابعة أكاديمية"]),
      outcomes: JSON.stringify(["تحسّن معدل الانتظام الدراسي", "ارتفاع المعدل التراكمي لدى 70% من المستفيدين"]),
      kpis: JSON.stringify([
        { indicator: "عدد الطلاب المستفيدين", target: "120 طالبًا" },
        { indicator: "نسبة خفض التعثر الدراسي", target: "20%" },
      ]),
      timelineStart: new Date("2026-09-01"),
      timelineEnd: new Date("2027-06-30"),
      budgetTotal: 180000,
      budgetBreakdown: JSON.stringify([
        { item: "رسوم دراسية", amount: 120000 },
        { item: "مستلزمات ومقررات", amount: 40000 },
        { item: "متابعة وتقييم", amount: 20000 },
      ]),
      status: "نشط",
      isDemo: true,
      createdById: officer.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: "السلال الغذائية للأسر المحتاجة",
      category: "إغاثي",
      problemStatement:
        "ترتفع معدلات الاحتياج الغذائي لدى الأسر منخفضة الدخل خلال المواسم، مع محدودية قدرة الجمعية على التغطية الشاملة دون دعم إضافي.",
      generalObjective: "توفير احتياج غذائي أساسي وكريم للأسر المستفيدة خلال ثلاثة أشهر.",
      specificObjectives: JSON.stringify([
        "توزيع 250 سلة غذائية شهريًا على الأسر المستفيدة",
        "ضمان تنوع محتوى السلة الغذائية وفق المعايير الغذائية الأساسية",
      ]),
      beneficiaryCategory: "الأسر منخفضة الدخل",
      beneficiaryCount: 250,
      geographicScope: "مدينة حائل",
      activities: JSON.stringify([
        "حصر الأسر المستحقة والتحقق من بياناتها",
        "تجهيز وتغليف السلال الغذائية شهريًا",
        "التوزيع الميداني على الأسر المستفيدة",
      ]),
      outputs: JSON.stringify(["750 سلة غذائية موزعة خلال 3 أشهر"]),
      outcomes: JSON.stringify(["تحسّن الأمن الغذائي المؤقت لدى الأسر المستفيدة"]),
      kpis: JSON.stringify([{ indicator: "عدد السلال الموزعة شهريًا", target: "250 سلة" }]),
      timelineStart: new Date("2026-09-01"),
      timelineEnd: new Date("2026-11-30"),
      budgetTotal: 95000,
      budgetBreakdown: JSON.stringify([
        { item: "محتوى السلال الغذائية", amount: 80000 },
        { item: "نقل وتوزيع", amount: 15000 },
      ]),
      status: "نشط",
      isDemo: true,
      createdById: officer.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      title: "نادي رفاق القيمي للناشئة",
      category: "تنموي",
      problemStatement:
        "قلة البرامج النوعية لبناء الشخصية والمهارات القيادية لدى الناشئة في الأحياء ذات الكثافة السكانية العالية.",
      generalObjective: "بناء شخصية متوازنة لدى الناشئة عبر برنامج قيمي ومهاري متكامل.",
      specificObjectives: JSON.stringify(["تنفيذ برنامج أسبوعي لـ80 مستفيدًا لمدة 6 أشهر"]),
      beneficiaryCategory: "الناشئة (12-17 سنة)",
      beneficiaryCount: 80,
      geographicScope: "أحياء مدينة حائل الشرقية",
      activities: JSON.stringify(["جلسات أسبوعية تدريبية", "معسكر ختامي"]),
      outputs: JSON.stringify(["24 جلسة أسبوعية", "معسكر ختامي لـ80 مستفيدًا"]),
      outcomes: JSON.stringify(["تحسّن مهارات القيادة والانضباط لدى المستفيدين"]),
      kpis: JSON.stringify([{ indicator: "نسبة رضا أولياء الأمور", target: "85%" }]),
      timelineStart: new Date("2026-10-01"),
      timelineEnd: new Date("2027-03-31"),
      budgetTotal: 150000,
      budgetBreakdown: JSON.stringify([{ item: "تدريب وتأهيل", amount: 60000 }, { item: "فعاليات ومعسكر", amount: 90000 }]),
      status: "مسودة",
      isDemo: true,
      createdById: manager.id,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      title: "برنامج التمكين الرقمي للشباب",
      category: "تقني",
      problemStatement: "ضعف المهارات الرقمية لدى فئة الشباب الباحثين عن عمل يقلل من فرصهم الوظيفية.",
      generalObjective: "تأهيل الشباب رقميًا لتحسين فرصهم في سوق العمل.",
      specificObjectives: JSON.stringify(["تدريب 60 شابًا وشابة على مهارات رقمية أساسية ومتقدمة"]),
      beneficiaryCategory: "الشباب الباحثون عن عمل (18-30 سنة)",
      beneficiaryCount: 60,
      geographicScope: "مدينة حائل",
      activities: JSON.stringify(["دورات تدريبية", "ورش عملية", "متابعة توظيف"]),
      outputs: JSON.stringify([]),
      outcomes: JSON.stringify([]),
      kpis: JSON.stringify([]),
      timelineStart: null,
      timelineEnd: null,
      budgetTotal: 110000,
      budgetBreakdown: JSON.stringify([]),
      status: "مسودة",
      isDemo: true,
      createdById: officer.id,
    },
  });

  console.log("🎯 إنشاء فرص التمويل...");
  const now = new Date();
  const inDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const opp1 = await prisma.fundingOpportunity.create({
    data: {
      title: "منحة دعم المشاريع التعليمية 2026",
      donorId: donor1.id,
      field: "تعليمي",
      expectedAmount: 150000,
      requirements: "خطة مشروع تفصيلية، تقرير مالي سنوي، مؤشرات أداء واضحة وقابلة للقياس.",
      startDate: inDays(-10),
      deadline: inDays(9),
      applicationUrl: "https://example.org/grants/education-2026",
      status: "مفتوحة",
      projectId: project1.id,
      isDemo: true,
    },
  });
  const opp2 = await prisma.fundingOpportunity.create({
    data: {
      title: "مبادرة المسؤولية الاجتماعية الموسمية",
      donorId: donor2.id,
      field: "غذائي",
      expectedAmount: 60000,
      requirements: "مقترح مشروع مختصر، وشهادة تسجيل الجمعية سارية المفعول.",
      startDate: inDays(-5),
      deadline: inDays(4),
      applicationUrl: "https://example.org/grants/csr-seasonal",
      status: "مفتوحة",
      projectId: project2.id,
      isDemo: true,
    },
  });
  const opp3 = await prisma.fundingOpportunity.create({
    data: {
      title: "برنامج دعم المنظمات غير الربحية",
      donorId: donor3.id,
      field: "تنموي",
      expectedAmount: 200000,
      requirements: "ترخيص ساري، تقرير حوكمة سنوي، ونظام مالي معتمد.",
      startDate: inDays(20),
      deadline: inDays(60),
      applicationUrl: "https://example.org/grants/ncnp",
      status: "تحت المتابعة",
      projectId: project3.id,
      isDemo: true,
    },
  });
  const opp4 = await prisma.fundingOpportunity.create({
    data: {
      title: "منحة التمكين الرقمي للشباب",
      donorId: donor4.id,
      field: "تقني",
      expectedAmount: 90000,
      requirements: "شراكة تدريبية مع جهة معتمدة، وخطة توظيف واضحة للمستفيدين.",
      startDate: inDays(-40),
      deadline: inDays(-5),
      applicationUrl: "https://example.org/grants/digital",
      status: "مغلقة",
      projectId: project4.id,
      isDemo: true,
    },
  });
  await prisma.fundingOpportunity.create({
    data: {
      title: "فرصة دعم عام (بدون جهة محددة بعد)",
      donorNameFreeText: "جهة مرشحة غير مؤكدة",
      field: "اجتماعي",
      expectedAmount: 40000,
      requirements: "معلومات أولية فقط، بانتظار التأكيد الرسمي.",
      deadline: inDays(30),
      status: "تحت المتابعة",
      isDemo: true,
    },
  });

  console.log("📄 إنشاء طلبات المنح وسجل المتابعة...");

  async function createApplication(opts: {
    title: string;
    projectId: string;
    opportunityId?: string;
    status: string;
    assignedToId?: string;
    fields?: Record<string, string>;
    history: { fromStatus?: string; toStatus: string; note?: string; nextStep?: string; changedById: string }[];
  }) {
    const app = await prisma.grantApplication.create({
      data: {
        title: opts.title,
        projectId: opts.projectId,
        opportunityId: opts.opportunityId,
        status: opts.status,
        assignedToId: opts.assignedToId,
        createdById: officer.id,
        isDemo: true,
        ...(opts.fields || {}),
      },
    });
    for (const h of opts.history) {
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: app.id,
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          note: h.note,
          nextStep: h.nextStep,
          changedById: h.changedById,
        },
      });
    }
    return app;
  }

  await createApplication({
    title: "طلب دعم كفالة تعليم الأيتام — مؤسسة الأفق للتنمية",
    projectId: project1.id,
    opportunityId: opp1.id,
    status: "تم الإرسال",
    assignedToId: officer.id,
    fields: {
      executiveSummary:
        "يهدف مشروع كفالة تعليم الأيتام إلى دعم 120 طالبًا وطالبة من الأيتام برسوم دراسية ومستلزمات تعليمية خلال عام دراسي كامل، استجابةً لتعثر تعليمي متزايد لدى هذه الفئة، بميزانية إجمالية قدرها 180,000 ريال.",
      orgIntroduction: "جمعية رفاق الخيرية جمعية مرخصة تعمل منذ أكثر من 10 سنوات في المجال التعليمي والتنموي بمنطقة حائل.",
      problemStatement: project1.problemStatement || "",
      justification: "يمثل التعليم أحد أهم عوامل كسر حلقة الفقر لدى الأيتام، وتشير بيانات الجمعية إلى تزايد طلبات الدعم التعليمي بنسبة 30% خلال العامين الماضيين.",
      objectives: (JSON.parse(project1.specificObjectives || "[]") as string[]).join("\n"),
      beneficiaries: "120 طالبًا وطالبة من الأيتام وأسرهم الحاضنة في مدينة حائل وضواحيها.",
      implementationPlan: "يُنفذ المشروع على مدار عام دراسي كامل عبر مراحل: الحصر، الصرف، المتابعة، والتقييم الختامي.",
      activities: (JSON.parse(project1.activities || "[]") as string[]).join("\n"),
      outputs: (JSON.parse(project1.outputs || "[]") as string[]).join("\n"),
      outcomes: (JSON.parse(project1.outcomes || "[]") as string[]).join("\n"),
      kpis: "عدد الطلاب المستفيدين: 120 طالبًا\nنسبة خفض التعثر الدراسي: 20%",
      riskManagement: "خطر تأخر الصرف: يُعالج عبر جدولة مسبقة مع المدارس. خطر تسرب بعض المستفيدين: متابعة شهرية مباشرة.",
      sustainability: "بناء قاعدة بيانات دائمة للمستفيدين لتسهيل التجديد السنوي وربط المشروع بحملات تبرع دورية.",
      timeline: "سبتمبر 2026 – يونيو 2027، على 3 فصول دراسية.",
      budget: "إجمالي الميزانية 180,000 ريال موزعة على الرسوم الدراسية والمستلزمات والمتابعة.",
      donorRequirements: "تقرير أثر ربع سنوي وفق شروط مؤسسة الأفق للتنمية.",
    },
    history: [
      { toStatus: "مسودة", note: "تم إنشاء الطلب", changedById: officer.id },
      { fromStatus: "مسودة", toStatus: "تحت المراجعة الداخلية", note: "أُرسل للمراجعة الداخلية", changedById: officer.id },
      { fromStatus: "تحت المراجعة الداخلية", toStatus: "جاهز للإرسال", note: "تمت المراجعة والموافقة", changedById: reviewer.id },
      { fromStatus: "جاهز للإرسال", toStatus: "تم الإرسال", note: "تم الإرسال عبر بوابة الجهة المانحة", nextStep: "بانتظار رد الجهة المانحة", changedById: officer.id },
    ],
  });

  await createApplication({
    title: "طلب دعم السلال الغذائية — شركة الواحة الغذائية",
    projectId: project2.id,
    opportunityId: opp2.id,
    status: "مقبول",
    assignedToId: officer.id,
    fields: {
      executiveSummary: "طلب دعم لتوزيع 750 سلة غذائية على الأسر المحتاجة خلال 3 أشهر بميزانية 95,000 ريال.",
      problemStatement: project2.problemStatement || "",
      objectives: (JSON.parse(project2.specificObjectives || "[]") as string[]).join("\n"),
      beneficiaries: "250 أسرة منخفضة الدخل شهريًا.",
      activities: (JSON.parse(project2.activities || "[]") as string[]).join("\n"),
      outputs: (JSON.parse(project2.outputs || "[]") as string[]).join("\n"),
      outcomes: (JSON.parse(project2.outcomes || "[]") as string[]).join("\n"),
      timeline: "سبتمبر – نوفمبر 2026",
      budget: "95,000 ريال (محتوى السلال 80,000 + نقل وتوزيع 15,000)",
    },
    history: [
      { toStatus: "مسودة", changedById: officer.id },
      { fromStatus: "مسودة", toStatus: "تم الإرسال", note: "أُرسل مباشرة بسبب ضيق الوقت", changedById: officer.id },
      { fromStatus: "تم الإرسال", toStatus: "مقبول", note: "تمت الموافقة على كامل المبلغ المطلوب", changedById: manager.id },
    ],
  });

  await createApplication({
    title: "طلب دعم نادي رفاق القيمي — الهيئة الوطنية",
    projectId: project3.id,
    opportunityId: opp3.id,
    status: "تحت المراجعة الداخلية",
    assignedToId: reviewer.id,
    fields: {
      executiveSummary: "طلب دعم لبرنامج قيمي ومهاري للناشئة يستهدف 80 مستفيدًا لمدة 6 أشهر.",
      problemStatement: project3.problemStatement || "",
      objectives: (JSON.parse(project3.specificObjectives || "[]") as string[]).join("\n"),
    },
    history: [
      { toStatus: "مسودة", changedById: manager.id },
      { fromStatus: "مسودة", toStatus: "تحت المراجعة الداخلية", note: "بانتظار مراجعة المراجع", changedById: manager.id },
    ],
  });

  await createApplication({
    title: "طلب دعم التمكين الرقمي — مؤسسة نماء التقنية",
    projectId: project4.id,
    opportunityId: opp4.id,
    status: "مرفوض",
    fields: {
      executiveSummary: "طلب دعم لتدريب 60 شابًا على المهارات الرقمية.",
    },
    history: [
      { toStatus: "مسودة", changedById: officer.id },
      { fromStatus: "مسودة", toStatus: "تم الإرسال", changedById: officer.id },
      { fromStatus: "تم الإرسال", toStatus: "مرفوض", note: "الميزانية المتاحة لدى الجهة استُنفدت لهذا العام", changedById: manager.id },
    ],
  });

  await createApplication({
    title: "طلب دعم إضافي لمشروع السلال الغذائية",
    projectId: project2.id,
    status: "مطلوب استكمال",
    assignedToId: officer.id,
    fields: {
      executiveSummary: "طلب تكميلي لتوسيع نطاق مشروع السلال الغذائية.",
    },
    history: [
      { toStatus: "مسودة", changedById: officer.id },
      { fromStatus: "مسودة", toStatus: "تم الإرسال", changedById: officer.id },
      { fromStatus: "تم الإرسال", toStatus: "مطلوب استكمال", note: "الجهة المانحة تطلب تقرير الأثر للدعم السابق", nextStep: "إرفاق تقرير الأثر وإعادة الإرسال", changedById: manager.id },
    ],
  });

  await createApplication({
    title: "مسودة طلب دعم نادي رفاق (نسخة أولية)",
    projectId: project3.id,
    status: "مسودة",
    assignedToId: officer.id,
    history: [{ toStatus: "مسودة", note: "تم إنشاء الطلب", changedById: officer.id }],
  });

  console.log("✅ اكتملت تعبئة البيانات التجريبية بنجاح.");
  console.log("");
  console.log("بيانات الدخول التجريبية (كلمة المرور للجميع: Passw0rd!):");
  console.log(`- مدير النظام:      ${admin.email}`);
  console.log("- مدير الجمعية:      manager@refaq.org");
  console.log("- مسؤول المنح:       officer@refaq.org");
  console.log("- مراجع:            reviewer@refaq.org");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
