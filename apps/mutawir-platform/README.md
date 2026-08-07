# منصة مُطوّر — من القياس إلى الأثر

منصة رقمية متكاملة لإدارة رحلة تطوير الجمعيات الأهلية عبر برنامج تطوير مدته 100 يوم: استبيان قبلي → تقييم هجين (قواعد + ذكاء اصطناعي) → اعتماد المستشار → تحليل الفجوات → خطة تطوير ومهام → متابعة تقدم → قياس بعدي → تقرير أثر.

هذا التطبيق مستقل تمامًا (package.json و Prisma schema خاصين به) عن باقي محتوى هذا المستودع، ريثما يُنقل لاحقًا إلى مستودع GitHub منفصل.

## التقنية

Next.js 15 (App Router) · TypeScript · Prisma (SQLite للتطوير، قابل للتحويل لـ PostgreSQL بتغيير `datasource` فقط) · Tailwind CSS · مصادقة بجلسات موقّعة (HMAC) دون مكتبات خارجية · Anthropic Claude لمحرك التقييم الهجين.

## التشغيل محليًا

```bash
cp .env.example .env        # عدّل SESSION_SECRET وأضف ANTHROPIC_API_KEY اختياريًا
npm install
npm run db:push             # ينشئ قاعدة بيانات SQLite محلية
npm run db:seed             # يزرع إطار القياس الحقيقي (من ملف القياس) + بيانات تجريبية
npm run dev
```

بدون `ANTHROPIC_API_KEY`، يعمل محرك التقييم بمنطق قواعد اكتمال الأدلة فقط (Rules-only fallback) — تدفق العمل يبقى صحيحًا بالكامل، لكن التحليل النصي الذكي للإجابات لا يعمل حتى يُضاف المفتاح.

## حسابات تجريبية (بعد `db:seed`)

| الدور | البريد | كلمة المرور |
|---|---|---|
| مدير النظام | admin@mutawir.sa | Mutawir@2026 |
| مستشار | consultant@mutawir.sa | Mutawir@2026 |
| مجلس الجمعيات | council@mutawir.sa | Mutawir@2026 |
| جمعية | org@mutawir.sa | Mutawir@2026 |

## الاختبارات

```bash
npm run build && npm run start -- -p 3411   # في طرفية
BASE_URL=http://localhost:3411 npm run test:e2e
```

`tests/e2e/golden-path.spec.ts` يغطي الرحلة الكاملة: تعبئة الاستبيان القبلي → الإرسال → التحليل الآلي → اعتماد المستشار لكل مؤشر → الاعتماد الرسمي → تحليل الفجوات → اقتراح AI لمهمة → قبولها → تنفيذ الجمعية للمهمة ورفع شاهد → اعتماد المستشار للإنجاز.

## بنية المشروع

- `prisma/schema.prisma` — كل الكيانات (Organizations, Users, Consultants, AssessmentDomain/Criterion/Indicator/Level, AssessmentCycle/Response/Evidence, AIAssessment, ConsultantAssessment, DevelopmentGap/Plan, Task وملحقاتها, Notification, ActivityLog...).
- `src/lib/data/framework-seed-data.ts` — إطار القياس الحقيقي المُستخرج من ملف العميل (Google Sheet)، ومصدره الوحيد للبذر؛ Admin يعدّله لاحقًا من `/admin/framework` دون لمس الكود.
- `src/lib/ai/rules.ts` — طبقة القواعد الحتمية (Evidence Gate) التي تُقيّد أي تقييم AI أو استشاري.
- `src/lib/ai/assessment-engine.ts` — محرك التقييم الهجين (Hybrid Assessment Engine).
- `src/lib/ai/recommendations.ts` — مساعد AI لاقتراح مهام تطويرية من الفجوات المعتمدة.
- `src/app/{org,consultant,council,admin}` — أربع بوابات مستقلة حسب الدور، معزولة بـ `requireUser()` + تحقق ملكية البيانات (Multi-tenant isolation) في كل Server Action.

## معروف/مؤجل لمرحلة لاحقة (Phase 2 حسب خطة المشروع)

تصدير PDF للتقارير، تنبيهات دفع فعلية (Push/Email)، لوحة تحليلات متقدمة، مساعد AI أكثر تفصيلًا للمستشار، أتمتة تصنيف بناء الأسئلة الديناميكي لبيانات الجمعية من قاعدة بيانات بدل ثوابت TypeScript.

<!-- deploy trigger: 2026-08-07T21:54:52Z -->
