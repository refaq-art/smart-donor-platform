// Assessment framework extracted from the client's real measurement file
// (Google Sheet: "مشروع الحاضنة الافتراضية جمعيات حائل - مشروع تمكين 2026").
// This is seed data only — every field here is editable by Admin at runtime
// through AssessmentDomain / AssessmentCriterion / AssessmentIndicator / IndicatorLevel.

export type SeedLevel = { levelNumber: number; label: string; minScore: number; maxScore: number; description: string };
export type SeedIndicatorMaturity = {
  code: string;
  name: string;
  type: "MATURITY_LEVEL";
  levels: [SeedLevel, SeedLevel, SeedLevel];
};
export type SeedIndicatorCompletion = {
  code: string;
  name: string;
  type: "COMPLETION_STAGE";
  requiredEvidence: string;
};
export type SeedIndicator = SeedIndicatorMaturity | SeedIndicatorCompletion;
export type SeedCriterion = { code: string; name: string; indicators: SeedIndicator[] };
export type SeedDomain = { code: string; name: string; description: string; criteria: SeedCriterion[] };

const maturityLevels = (l1: string, l2: string, l3: string): [SeedLevel, SeedLevel, SeedLevel] => [
  { levelNumber: 1, label: "مستوى التأسيس", minScore: 1, maxScore: 1.99, description: l1 },
  { levelNumber: 2, label: "مستوى الممارسة", minScore: 2, maxScore: 3.49, description: l2 },
  { levelNumber: 3, label: "مستوى التميز", minScore: 3.5, maxScore: 5, description: l3 },
];

export const COMPLETION_STAGE_LEVELS: SeedLevel[] = [
  { levelNumber: 1, label: "لم يبدأ", minScore: 1, maxScore: 1, description: "لم يبدأ تنفيذ البند بعد" },
  { levelNumber: 2, label: "قيد البدء", minScore: 2, maxScore: 2, description: "بدأ التنفيذ في مراحله الأولى" },
  { levelNumber: 3, label: "قيد التنفيذ", minScore: 3, maxScore: 3, description: "التنفيذ جارٍ بشكل ملموس" },
  { levelNumber: 4, label: "شبه مكتمل", minScore: 4, maxScore: 4, description: "اكتمل تنفيذ معظم البند" },
  { levelNumber: 5, label: "مكتمل", minScore: 5, maxScore: 5, description: "اكتمل البند وتوفر الشاهد المعتمد" },
];

// ---- Track A: qualitative maturity rubric (المجال > المعيار > المؤشر) ----
export const MATURITY_DOMAINS: SeedDomain[] = [
  {
    code: "PARTNERSHIPS",
    name: "الشراكات والعلاقات",
    description: "قدرة الجمعية على بناء وإدارة شراكاتها وعلاقاتها المؤسسية والمجتمعية",
    criteria: [
      {
        code: "PARTNERSHIPS_STRENGTHEN",
        name: "تمتين الشراكات",
        indicators: [
          {
            code: "PARTNERSHIPS_PROCEDURES",
            name: "إجراءات الشراكات",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "الجمعية تعمل وفق إجراءات وسياسات غير معتمدة لإدارة وتفعيل شراكاتها",
              "الجمعية تعمل وفق إجراءات وسياسات معتمدة لإدارة وتفعيل شراكاتها",
              "الجمعية تعمل وفق دليل إجرائي وسياسات معتمدة لإدارة وتفعيل شراكاتها"
            ),
          },
          {
            code: "PARTNERSHIPS_PLAN_EFFECTIVENESS",
            name: "فعالية خطة الشراكات",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "تعمل الجمعية على إدارة شراكاتها بممارسات غير مخطط لها",
              "تعمل الجمعية على إدارة شراكاتها وفق خطة معتمدة",
              "تحقق الجمعية أكثر من 50% من خطة شراكاتها"
            ),
          },
          {
            code: "PARTNERSHIPS_DOCUMENTED",
            name: "الشراكات الموثقة",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "تمتلك الجمعية شراكات غير موقعة",
              "لدى الجمعية أقل من 5 شراكات موثقة خلال العام الحالي",
              "لدى الجمعية أكثر من 5 شراكات موثقة خلال العام الحالي"
            ),
          },
          {
            code: "PARTNERSHIPS_RETURNS",
            name: "عوائد الشراكات",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "تنتفع الجمعية بعوائد حقيقية من شراكة واحدة",
              "تنتفع الجمعية بعوائد حقيقية من (2-3) شراكات",
              "تنتفع الجمعية بعوائد حقيقية من أكثر من 3 شراكات"
            ),
          },
        ],
      },
      {
        code: "RELATIONS_STRENGTHEN",
        name: "تمتين العلاقات",
        indicators: [
          {
            code: "ANNUAL_EVENTS",
            name: "الفعاليات والمناسبات السنوية",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "شاركت/نظمت الجمعية أقل من 4 فعاليات سنوية",
              "شاركت/نظمت الجمعية ما بين 4-6 فعاليات سنوية",
              "شاركت/نظمت الجمعية أكثر من 6 فعاليات سنوية"
            ),
          },
          {
            code: "STAKEHOLDERS",
            name: "أصحاب المصلحة",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "الجمعية تعمل وفق إجراءات وسياسات غير معتمدة للتواصل مع أصحاب المصلحة",
              "الجمعية تعمل وفق إجراءات وسياسات معتمدة للتواصل الفعال مع أصحاب المصلحة",
              "الجمعية تعمل وفق دليل إجرائي وسياسات معتمدة للتواصل الفعال مع أصحاب المصلحة"
            ),
          },
          {
            code: "SOCIAL_ACCOUNTS_GROWTH",
            name: "الحسابات الالكترونية",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "حققت الجمعية نسبة نمو في متابعي حساباتها الالكترونية أقل من 5% العام الحالي",
              "حققت الجمعية نسبة نمو في متابعي حساباتها الالكترونية ما بين (5-15)% العام الحالي",
              "حققت الجمعية نسبة نمو في متابعي حساباتها الالكترونية أكثر من 15% العام الحالي"
            ),
          },
        ],
      },
    ],
  },
  {
    code: "GOVERNANCE",
    name: "الحوكمة",
    description: "التزام الجمعية بمعايير الحوكمة والامتثال والشفافية",
    criteria: [
      {
        code: "GOVERNANCE_COMPLIANCE",
        name: "الحوكمة والامتثال",
        indicators: [
          {
            code: "GOVERNANCE_GENERAL",
            name: "الحوكمة العامة",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "الجمعية حاصلة على درجة دون المتوسط (80%)",
              "الجمعية حاصلة على درجة وفق المتوسط (80%)",
              "الجمعية حاصلة على درجة أعلى من المتوسط (80%)"
            ),
          },
          {
            code: "COMPLIANCE_COMMITMENT",
            name: "الالتزام والامتثال",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "الجمعية حاصلة على درجة دون المتوسط (85%)",
              "الجمعية حاصلة على درجة وفق المتوسط (85%)",
              "الجمعية حاصلة على درجة أعلى من المتوسط (85%)"
            ),
          },
          {
            code: "TRANSPARENCY_DISCLOSURE",
            name: "الشفافية والإفصاح",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "الجمعية حاصلة على درجة دون المتوسط (68%)",
              "الجمعية حاصلة على درجة وفق المتوسط (68%)",
              "الجمعية حاصلة على درجة أعلى من المتوسط (68%)"
            ),
          },
        ],
      },
    ],
  },
  {
    code: "MARKETING_FUNDRAISING",
    name: "التسويق وتنمية الموارد المالية",
    description: "قدرة الجمعية على التسويق لبرامجها وتنمية مواردها المالية",
    criteria: [
      {
        code: "MARKETING_FUNDRAISING_C",
        name: "التسويق وتنمية الموارد المالية",
        indicators: [
          {
            code: "RESOURCE_DEV_PLAN",
            name: "خطة تنمية الموارد",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "لدى الجمعية أنشطة غير مخططة لتنمية الموارد المالية",
              "لدى الجمعية خطة معتمدة لتنمية الموارد المالية",
              "تحقق الجمعية أكثر من 50% من خطة تنمية مواردها"
            ),
          },
          {
            code: "MARKETING_PRODUCTS",
            name: "المنتجات التسويقية",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "لدى الجمعية منتج تسويقي واحد",
              "لدى الجمعية (2-3) منتجات تسويقية",
              "لدى الجمعية أكثر من 3 منتجات تسويقية"
            ),
          },
          {
            code: "DONATION_CHANNELS",
            name: "قنوات التبرعات",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "لدى الجمعية منفذ واحد فعال للتبرع (الحسابات البنكية)",
              "لدى الجمعية منفذين فعالين للتبرع (حسابات بنكية - متجر)",
              "لدى الجمعية أكثر من منفذين فعالين للتبرع (منصات التبرع)"
            ),
          },
        ],
      },
    ],
  },
  {
    code: "BENEFICIARY_SERVICE",
    name: "خدمة المستفيدين",
    description: "تنوع وعمق برامج وخدمات الجمعية الموجهة للمستفيدين",
    criteria: [
      {
        code: "PROGRAMS_SERVICES",
        name: "البرامج والخدمات",
        indicators: [
          {
            code: "SPONSORSHIP_PROGRAMS",
            name: "البرامج والخدمات الرعوية",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "لدى الجمعية برنامج رعوي واحد (الكفالات)",
              "لدى الجمعية (2-3) برامج رعوية",
              "لدى الجمعية أكثر من 3 برامج رعوية"
            ),
          },
          {
            code: "DEVELOPMENTAL_PROGRAMS",
            name: "البرامج والخدمات التنموية",
            type: "MATURITY_LEVEL",
            levels: maturityLevels(
              "لدى الجمعية برنامج تنموي واحد",
              "لدى الجمعية (2-3) برامج تنموية",
              "لدى الجمعية أكثر من 3 برامج تنموية"
            ),
          },
        ],
      },
    ],
  },
];

// ---- Track B: procedural / evidence-completion checklist (7 axes) ----
const completionIndicator = (code: string, name: string, requiredEvidence: string): SeedIndicatorCompletion => ({
  code,
  name,
  type: "COMPLETION_STAGE",
  requiredEvidence,
});

export const COMPLETION_DOMAINS: SeedDomain[] = [
  {
    code: "BRAND_IDENTITY",
    name: "الهوية البصرية وقنوات التواصل",
    description: "اكتمال الهوية البصرية والحضور الرقمي للجمعية",
    criteria: [
      {
        code: "BRAND_IDENTITY_C",
        name: "الهوية البصرية وقنوات التواصل",
        indicators: [
          completionIndicator("BRAND_KIT", "بناء هوية بصرية متكاملة للجمعية", "ملف الهوية البصرية (PDF) معتمد"),
          completionIndicator("WEBSITE", "إنشاء موقع إلكتروني للجمعية", "رابط الموقع الفعال ومحتواه"),
          completionIndicator("SOCIAL_ACCOUNTS", "إنشاء حسابات التواصل الاجتماعي", "روابط الحسابات النشطة (X، Instagram، LinkedIn)"),
          completionIndicator("PROFILE_FILE", "إعداد الملف التعريفي (البروفايل)", "ملف البروفايل المحدث (PDF)"),
        ],
      },
    ],
  },
  {
    code: "GOV_PROCEDURES",
    name: "إتمام الإجراءات الحكومية",
    description: "استكمال التسجيلات والإجراءات الرسمية الإلزامية",
    criteria: [
      {
        code: "GOV_PROCEDURES_C",
        name: "إتمام الإجراءات الحكومية",
        indicators: [
          completionIndicator("NATIONAL_ADDRESS", "استخراج العنوان الوطني", "شهادة العنوان الوطني سارية المفعول"),
          completionIndicator("UNIFIED_700", "استخراج رقم 700", "شهادة الرقم الموحد 700"),
          completionIndicator("SOCIAL_INSURANCE", "فتح حساب في التأمينات الاجتماعية", "شهادة التأمينات الاجتماعية"),
          completionIndicator("BANK_ACCOUNT", "فتح الحساب البنكي الأساسي", "خطاب فتح الحساب البنكي"),
          completionIndicator("QIWA_REGISTRATION", "التسجيل في منصة قوى", "لقطة شاشة من الحساب النشط في قوى"),
          completionIndicator("NCNP_REGISTRATION", "التسجيل في المركز الوطني للقطاع غير الربحي", "شهادة التسجيل أو المواءمة"),
        ],
      },
    ],
  },
  {
    code: "STRATEGIC_PLAN",
    name: "الخطة الاستراتيجية",
    description: "وجود واعتماد الخطط الاستراتيجية والتشغيلية",
    criteria: [
      {
        code: "STRATEGIC_PLAN_C",
        name: "الخطة الاستراتيجية",
        indicators: [
          completionIndicator("STRATEGIC_PLAN_BUILD", "بناء الخطة الاستراتيجية", "وثيقة الخطة الاستراتيجية المعتمدة"),
          completionIndicator("STRATEGIC_PLAN_APPROVE", "اعتماد الخطة الاستراتيجية من مجلس الإدارة", "محضر اجتماع مجلس الإدارة بالاعتماد"),
          completionIndicator("OPERATIONAL_PLAN_BUILD", "إعداد الخطة التشغيلية السنوية", "وثيقة الخطة التشغيلية"),
          completionIndicator("OPERATIONAL_PLAN_APPROVE", "اعتماد الخطة التشغيلية من مجلس الإدارة", "محضر اجتماع مجلس الإدارة بالاعتماد"),
        ],
      },
    ],
  },
  {
    code: "ADMIN_AFFAIRS",
    name: "الشؤون الإدارية",
    description: "اكتمال الهياكل واللوائح الإدارية المعتمدة",
    criteria: [
      {
        code: "ADMIN_AFFAIRS_C",
        name: "الشؤون الإدارية",
        indicators: [
          completionIndicator("ORG_STRUCTURE", "بناء الهيكل التنظيمي واعتماده", "مخطط الهيكل التنظيمي المعتمد"),
          completionIndicator("HR_POLICY", "إعداد لائحة الموارد البشرية واعتمادها", "نسخة اللائحة المعتمدة"),
          completionIndicator("PROCUREMENT_FINANCE_POLICY", "إعداد لائحة المشتريات والمالية واعتمادها", "نسخة اللائحة المعتمدة"),
          completionIndicator("STANDING_COMMITTEES", "تشكيل اللجان الدائمة (التنفيذية، المراجعة)", "قرارات تشكيل اللجان"),
        ],
      },
    ],
  },
  {
    code: "FINANCIAL_AFFAIRS",
    name: "الشؤون المالية",
    description: "اكتمال الترتيبات المحاسبية والمالية الأساسية",
    criteria: [
      {
        code: "FINANCIAL_AFFAIRS_C",
        name: "الشؤون المالية",
        indicators: [
          completionIndicator("ACCOUNTANT_CONTRACT", "التعاقد مع مكتب محاسب قانوني", "عقد المحاسب القانوني ساري المفعول"),
          completionIndicator("ACCOUNTING_SOFTWARE", "شراء برنامج محاسبي", "فاتورة أو عقد البرنامج المحاسبي"),
          completionIndicator("ANNUAL_BUDGET", "إعداد الموازنة التقديرية السنوية", "وثيقة الموازنة التقديرية المعتمدة"),
          completionIndicator("DONATION_STORE", "فتح متجر التبرعات الإلكتروني", "رابط المتجر الإلكتروني الفعال"),
        ],
      },
    ],
  },
  {
    code: "PARTNERSHIP_MGMT",
    name: "إدارة الشراكات والعلاقات",
    description: "الإجراءات التنفيذية لحصر وتفعيل الشراكات",
    criteria: [
      {
        code: "PARTNERSHIP_MGMT_C",
        name: "إدارة الشراكات والعلاقات",
        indicators: [
          completionIndicator("DONOR_DIRECTORY", "حصر الجهات المانحة والداعمة", "قائمة أو قاعدة بيانات الجهات"),
          completionIndicator("MOU_SIGNING", "توقيع مذكرات تفاهم مع شركاء استراتيجيين", "نسخ مذكرات التفاهم الموقعة"),
          completionIndicator("SPONSORSHIP_PACKAGES", "إعداد باقات الرعاية للتسويق", "ملف تسويق المشاريع وباقات الرعاية"),
        ],
      },
    ],
  },
  {
    code: "VOLUNTEERING",
    name: "التطوع",
    description: "تفعيل منظومة التطوع داخل الجمعية",
    criteria: [
      {
        code: "VOLUNTEERING_C",
        name: "التطوع",
        indicators: [
          completionIndicator("VOLUNTEER_UNIT", "تأسيس وحدة التطوع وتكليف مسؤول", "قرار تأسيس الوحدة والتكليف"),
          completionIndicator("VOLUNTEER_PLATFORM", "تفعيل حساب الجمعية في المنصة الوطنية للتطوع", "رابط حساب الجمعية في المنصة"),
          completionIndicator("VOLUNTEER_OPPORTUNITIES", "طرح فرص تطوعية للمجتمع", "قائمة الفرص التطوعية المطروحة"),
        ],
      },
    ],
  },
];

export const ALL_DOMAINS: SeedDomain[] = [...MATURITY_DOMAINS, ...COMPLETION_DOMAINS];

// ---- Organization profile question set (from sheet tab 1) ----
export const ORG_CONTEXT_FIELDS: { key: string; label: string; group: "basic" | "goals" }[] = [
  { key: "bylawGoals", label: "الأهداف وفق اللائحة", group: "goals" },
  { key: "beneficiarySegments", label: "شرائح المستفيدين", group: "goals" },
  { key: "problemNeed", label: "المشكلة / الاحتياج", group: "goals" },
  { key: "solutionValue", label: "الحل / القيمة المضافة", group: "goals" },
  { key: "executionMechanisms", label: "آليات التنفيذ للأهداف", group: "goals" },
  { key: "keySuccessIndicators", label: "مؤشرات النجاح الرئيسية", group: "goals" },
  { key: "keyGoals2026", label: "أهم أهداف ومشاريع الجمعية 2026", group: "goals" },
  { key: "strengthPoints", label: "أبرز نقاط القوة للجمعية", group: "goals" },
  { key: "challengePoints", label: "أبرز نقاط التحدي للجمعية", group: "goals" },
  { key: "quickGoal", label: "أهم هدف تريده الجمعية من هذا المشروع بشكل سريع", group: "goals" },
  { key: "consultantFocusAreas", label: "أهم نقاط التركيز التي يرى المستشار التركيز عليها خلال فترة المشروع", group: "goals" },
  { key: "notes", label: "مساحة للملاحظات", group: "goals" },
];
