// نصوص SQL لتهيئة/تحديث قاعدة بيانات Turso لتطابق prisma/schema.prisma.
//
// لماذا لا نستخدم `prisma migrate`؟ لأن Prisma CLI لا يمكنه استهداف رابط
// libSQL عن بعد حتى مع محول التشغيل (driver adapter) — المحول يؤثر فقط على
// وقت تشغيل Prisma Client، وليس على أوامر الـ CLI نفسها. لذلك نطبّق المخطط
// يدويًا عبر نقطة /api/admin/bootstrap.
//
// التصميم على جزأين حتى يعمل بأمان سواء على قاعدة بيانات فارغة جديدة، أو على
// قاعدة بيانات سبق نشرها بمخطط أقدم (كما حدث فعليًا بعد إضافة نظام تعدد
// الجمعيات في مرحلة لاحقة من المشروع):
//
// 1) TURSO_CREATE_TABLES_SQL: إنشاء كل الجداول بأحدث مخطط كامل (IF NOT EXISTS)
//    — يكفي وحده لقاعدة بيانات جديدة تمامًا.
// 2) TURSO_MIGRATE_STATEMENTS: قائمة عبارات ALTER/UPDATE فردية لإضافة أي عمود
//    كان ناقصًا في نشر سابق، مع تعبئته تلقائيًا ببيانات الجمعية الوحيدة
//    الموجودة مسبقًا (قبل تعدد الجمعيات). تُنفَّذ كل عبارة على حدة ويُتجاهل
//    خطأ "duplicate column" حتى تكون آمنة التكرار (idempotent) في الحالتين.
//
// عند أي تعديل مستقبلي على المخطط: أضف العمود الجديد في القسم المناسب من
// TURSO_CREATE_TABLES_SQL (للتركيبات الجديدة) وأضف عبارة ALTER مقابلة في
// TURSO_MIGRATE_STATEMENTS (للتركيبات القائمة).

export const TURSO_CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "about" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT '#0f766e',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "regNumber" TEXT,
    "licenseDate" DATETIME,
    "licenseExpiry" DATETIME,
    "supervisingBody" TEXT,
    "foundedAt" DATETIME,
    "sector" TEXT,
    "geographicScope" TEXT,
    "city" TEXT,
    "strategicGoals" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "delegateName" TEXT,
    "delegateRole" TEXT,
    "delegatePhone" TEXT,
    "delegateEmail" TEXT,
    "bankName" TEXT,
    "iban" TEXT,
    "annualBudget" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'GRANTS_OFFICER',
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "sessionsValidFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "BoardMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "memberType" TEXT NOT NULL DEFAULT 'BOARD',
    "phone" TEXT,
    "email" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BoardMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "OrgDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "issueDate" DATETIME,
    "expiryDate" DATETIME,
    "notes" TEXT,
    "uploadedById" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrgDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrgDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "problemStatement" TEXT,
    "generalObjective" TEXT,
    "specificObjectives" TEXT,
    "beneficiaryCategory" TEXT,
    "beneficiaryCount" INTEGER,
    "geographicScope" TEXT,
    "activities" TEXT,
    "outputs" TEXT,
    "outcomes" TEXT,
    "kpis" TEXT,
    "timelineStart" DATETIME,
    "timelineEnd" DATETIME,
    "budgetTotal" REAL,
    "budgetBreakdown" TEXT,
    "status" TEXT NOT NULL DEFAULT 'مسودة',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "duplicatedFromId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Donor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "supportFields" TEXT,
    "fundingConditions" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "city" TEXT,
    "relationshipStatus" TEXT NOT NULL DEFAULT 'محتمل',
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Donor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "FundingOpportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "donorId" TEXT,
    "donorNameFreeText" TEXT,
    "field" TEXT,
    "expectedAmount" REAL,
    "requirements" TEXT,
    "startDate" DATETIME,
    "deadline" DATETIME,
    "applicationUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'مفتوحة',
    "projectId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FundingOpportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FundingOpportunity_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FundingOpportunity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "GrantApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "executiveSummary" TEXT,
    "orgIntroduction" TEXT,
    "problemStatement" TEXT,
    "justification" TEXT,
    "objectives" TEXT,
    "beneficiaries" TEXT,
    "implementationPlan" TEXT,
    "activities" TEXT,
    "outputs" TEXT,
    "outcomes" TEXT,
    "kpis" TEXT,
    "riskManagement" TEXT,
    "sustainability" TEXT,
    "timeline" TEXT,
    "budget" TEXT,
    "donorRequirements" TEXT,
    "status" TEXT NOT NULL DEFAULT 'مسودة',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GrantApplication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GrantApplication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GrantApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "FundingOpportunity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GrantApplication_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GrantApplication_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ApplicationStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "note" TEXT,
    "nextStep" TEXT,
    "changedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "GrantApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "projectId" TEXT,
    "applicationId" TEXT,
    "donorId" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "GrantApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "EligibilityCriterion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opportunityId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT,
    "documentCategory" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EligibilityCriterion_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "FundingOpportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ApplicationComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "fieldKey" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "kind" TEXT NOT NULL DEFAULT 'NOTE',
    "authorId" TEXT NOT NULL,
    "resolvedAt" DATETIME,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationComment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "GrantApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ApplicationVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "snapshot" TEXT NOT NULL,
    "createdById" TEXT,
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationVersion_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "GrantApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "BoardMember_organizationId_idx" ON "BoardMember"("organizationId");
CREATE INDEX IF NOT EXISTS "OrgDocument_organizationId_idx" ON "OrgDocument"("organizationId");
CREATE INDEX IF NOT EXISTS "OrgDocument_category_idx" ON "OrgDocument"("category");
CREATE INDEX IF NOT EXISTS "EligibilityCriterion_opportunityId_idx" ON "EligibilityCriterion"("opportunityId");
CREATE INDEX IF NOT EXISTS "ApplicationComment_applicationId_idx" ON "ApplicationComment"("applicationId");
CREATE INDEX IF NOT EXISTS "ApplicationVersion_applicationId_idx" ON "ApplicationVersion"("applicationId");
`;

// عبارات فردية (وليست ضمن نص واحد) لأنها تُنفَّذ كل واحدة على حدة مع تجاهل
// خطأ "duplicate column" — انظر شرح التصميم أعلى الملف.
export const TURSO_MIGRATE_STATEMENTS: string[] = [
  // Organization: الحقول المضافة عند بناء ملف الجمعية المركزي
  `ALTER TABLE "Organization" ADD COLUMN "licenseDate" DATETIME`,
  `ALTER TABLE "Organization" ADD COLUMN "licenseExpiry" DATETIME`,
  `ALTER TABLE "Organization" ADD COLUMN "supervisingBody" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN "foundedAt" DATETIME`,
  `ALTER TABLE "Organization" ADD COLUMN "sector" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN "geographicScope" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN "strategicGoals" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN "address" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN "delegateName" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN "delegateRole" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN "delegatePhone" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN "delegateEmail" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN "bankName" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN "iban" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN "annualBudget" REAL`,
  `ALTER TABLE "Organization" ADD COLUMN "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE "Organization" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`,

  // User: تعدد الجمعيات + حالة الحساب + إبطال الجلسات
  `ALTER TABLE "User" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN "lastLoginAt" DATETIME`,
  `ALTER TABLE "User" ADD COLUMN "sessionsValidFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`,

  // تعدد الجمعيات: ربط كل سجل قائم بالجمعية الوحيدة التي كانت موجودة قبل هذه الميزة
  `ALTER TABLE "Project" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Donor" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "FundingOpportunity" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "GrantApplication" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "ActivityLog" ADD COLUMN "organizationId" TEXT`,

  // تعبئة الجمعية لكل السجلات القديمة بمعرّف الجمعية الوحيدة التي كانت موجودة
  `UPDATE "User" SET "organizationId" = (SELECT "id" FROM "Organization" LIMIT 1) WHERE "organizationId" = ''`,
  `UPDATE "Project" SET "organizationId" = (SELECT "id" FROM "Organization" LIMIT 1) WHERE "organizationId" = ''`,
  `UPDATE "Donor" SET "organizationId" = (SELECT "id" FROM "Organization" LIMIT 1) WHERE "organizationId" = ''`,
  `UPDATE "FundingOpportunity" SET "organizationId" = (SELECT "id" FROM "Organization" LIMIT 1) WHERE "organizationId" = ''`,
  `UPDATE "GrantApplication" SET "organizationId" = (SELECT "id" FROM "Organization" LIMIT 1) WHERE "organizationId" = ''`,
  `UPDATE "ActivityLog" SET "organizationId" = (SELECT "id" FROM "Organization" LIMIT 1) WHERE "organizationId" IS NULL`,

  // فهرس User.organizationId يُنشأ هنا (بعد إضافة العمود أعلاه) وليس ضمن
  // TURSO_CREATE_TABLES_SQL، لأن "User" جدول قائم مسبقًا على أي نشر سابق —
  // إنشاء فهرس على عمود غير موجود بعد يفشل بخطأ "no such column".
  `CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId")`,
];
