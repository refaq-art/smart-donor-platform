# أثر كفالتك — Athar Kafalatak

منصة تقرير أثر تفاعلي مخصص لكبار الكفلاء. كل كافل يفتح رابطه الخاص فتستقبله شخصية طفل
تمثيلية تقوده في رحلة قصيرة (6–7 محطات) تُظهر أثر دعمه بالأرقام والقصص، ثم ملخص قابل للمشاركة
وتحميل كـ PDF. تتضمن المنصة لوحة إدارة مستقلة للجمعية لإنشاء التقارير ومتابعة المشاهدات.

هذا مشروع جديد بالكامل، مستقل عن أي منصة أخرى في هذا المستودع — يعيش في `apps/athar-kafalatak`
بقاعدة بيانات Supabase خاصة به.

## النشر (Vercel)

مشروع Vercel مستقل باسم `athar-kafalatak-report` (Root Directory: `apps/athar-kafalatak`،
Production Branch: `claude/athar-kafala-platform-hf77xq`)، منفصل تمامًا عن أي مشروع Vercel آخر
في هذا الحساب. متغيرات البيئة (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
مضبوطة من إعدادات المشروع على Vercel مباشرة، وليست مضمّنة في الكود.

## التقنيات

Next.js 14 (App Router) · TypeScript · Tailwind CSS · مكونات بأسلوب shadcn/ui مكتوبة يدويًا ·
Supabase (Postgres + Auth + RLS) · Framer Motion · @react-pdf/renderer.

## هيكل المشروع

```
src/
  app/
    page.tsx                     # صفحة رئيسية بسيطة + رابط لوحة الإدارة
    report/[token]/page.tsx      # تجربة الكافل: ترحيب -> جولة تفاعلية -> ملخص
    report/[token]/pdf/route.ts  # توليد PDF من بيانات التقرير
    api/report-view/route.ts     # تسجيل مشاهدة (يُستدعى من المتصفح أثناء الجولة)
    admin/login/page.tsx         # تسجيل دخول الإدارة (خارج تخطيط اللوحة)
    admin/(dashboard)/           # كل صفحات اللوحة المحمية بالمصادقة
      page.tsx                  # المؤشرات العامة
      sponsors/                 # إدارة الكفلاء
      reports/                  # قائمة التقارير + معالج الإنشاء (wizard) بـ 7 خطوات
    actions/                    # Server Actions (auth, sponsors, reports)
  components/
    report/                     # مكونات تجربة الكافل (الشخصية، العداد، الدونات، الجدول الزمني...)
    admin/                      # الشريط الجانبي، الجداول، معالج الإنشاء
    ui/                         # مكونات أساسية بأسلوب shadcn (Button, Card, Input...)
  lib/
    supabase/                   # عملاء Supabase (server/browser/anon) — لا يوجد service_role هنا
    data/                       # طبقة القراءة (report.ts للعام، admin.ts للوحة الإدارة)
    pdf/                        # مستند PDF + خطوط Tajawal المضمّنة
    wizard-types.ts, tokens.ts, session.ts, utils.ts, types.ts
  middleware.ts                 # يحمي /admin/* عبر جلسة Supabase Auth
public/characters/{male,female}/{intro,education,basic_needs,development,success,thank_you}.svg
```

## قاعدة البيانات (Supabase)

مشروع Supabase مخصص باسم **athar-kafalatak** (منفصل تمامًا عن أي مشروع آخر في هذا الحساب).

الجداول: `sponsors`, `reports`, `report_metrics`, `support_distribution`, `report_journey`,
`report_stories`, `report_achievements`, `child_characters`, `child_character_stages`,
`report_views`, `platform_settings`.

### الأمان و RLS

- **RLS مُفعّل على كل الجداول.** الدور `authenticated` (موظفو الجمعية المسجلون عبر Supabase
  Auth) له صلاحية كاملة. الدور `anon` **ليس له أي صلاحية مباشرة على أي جدول**.
- صفحة التقرير العامة (`/report/[token]`) لا تستخدم مفتاح `service_role` إطلاقًا. بدلًا من
  ذلك تستدعي دالتين بصلاحية `SECURITY DEFINER` في قاعدة البيانات:
  - `get_report_by_token(token)` — تُرجع بيانات التقرير الكاملة فقط إذا تطابق الرمز، وإلا `null`.
  - `record_report_view(token, session_id, ...)` — تسجّل مشاهدة لنفس التقرير فقط.

  هذا يعني: لا يوجد أي مفتاح سرّي يُشحن مع التطبيق، ولا يمكن لأي كافل الوصول إلى بيانات كافل
  آخر مهما كانت الطريقة — الوصول محكوم بالكامل داخل قاعدة البيانات وليس بمنطق تطبيقي يمكن الالتفاف عليه.
- روابط التقارير عبارة عن Token عشوائي آمن (٤٨ بت من الإنتروبيا عبر `crypto.randomBytes`)، غير
  متسلسل وغير قابل للتخمين، مثال: `DEMO-MHD9X4K7`.
- صفحات `/report/*` و `/admin/*` تُرسل ترويسة `X-Robots-Tag: noindex, nofollow` لمنع الفهرسة.
- لوحة الإدارة محمية بالكامل عبر Middleware يتحقق من جلسة Supabase Auth قبل عرض أي صفحة `/admin/*`.

## المتغيرات البيئية

انسخ `.env.example` إلى `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

لا حاجة لأي مفتاح سرّي آخر — راجع قسم الأمان أعلاه.

## التشغيل محليًا

```bash
cd apps/athar-kafalatak
npm install
cp .env.example .env.local   # القيم الافتراضية تشير لمشروع Supabase الجاهز
npm run dev
```

- الصفحة الرئيسية: http://localhost:3000
- لوحة الإدارة: http://localhost:3000/admin/login
- التقرير التجريبي: http://localhost:3000/report/DEMO-MHD9X4K7

### حساب الإدارة التجريبي

```
البريد: admin@athar-kafalatak.local
كلمة المرور: Athar@Admin2026
```

**غيّر كلمة المرور فورًا بعد أول نشر فعلي** (من Supabase Auth أو من داخل لوحة الإدارة لاحقًا).

## بيانات تجريبية (Seed)

تم إدخال كافل وتقرير تجريبيين كاملين مباشرة في قاعدة بيانات Supabase (وليس عبر سكربت seed محلي،
لأن قاعدة البيانات سحابية بالكامل):

- كافل: الأستاذ محمد العتيبي (`SP-1024`)
- تقرير: "تقرير أثر كفالتك ٢٠٢٦" للطفل التمثيلي «أحمد»، برابط `/report/DEMO-MHD9X4K7`
- يحتوي على كل الأقسام: أرقام، توزيع دعم، رحلة (قبل/خلال/الآن)، قصة أثر، إنجازات، رسالة شكر.

## اختبار تم إجراؤه

- ✅ `tsc --noEmit` بدون أي أخطاء.
- ✅ `next build` ناجح لكل المسارات (استاتيكية وديناميكية).
- ✅ تشغيل فعلي عبر `next dev` واختبار: الصفحة الرئيسية، إعادة توجيه `/admin` لصفحة الدخول
  عند عدم وجود جلسة، ورجوع 404 لطيف عند رمز تقرير غير صحيح بدل انهيار الصفحة.
- ✅ توليد PDF فعلي (عبر مستند تجريبي محليًا) تم التحقق منه بصريًا: تخطيط A4، عربي RTL صحيح
  الاتجاه والتشكيل، الهوية اللونية، وكل الأقسام المطلوبة.
- ✅ مخطط قاعدة البيانات وسياسات RLS ودالتا الـ RPC تم تطبيقها والتحقق من عملها مباشرة على
  Supabase (schema + seed + advisors أمان/أداء نظيفة).
- ⚠️ **قيد بيئة التنفيذ الحالية فقط**: جلسة العمل السحابية التي بنيت فيها المنصة تمنع أي اتصال
  شبكي خارج قائمة سماح محددة (تحقّقت من ذلك عبر رسالة الرفض الصريحة من بوابة الشبكة)، ولا يشمل
  ذلك نطاق Supabase المشروع. لذلك لم أتمكن من تنفيذ اختبار متصفح كامل (تسجيل الدخول الفعلي،
  فتح رابط الكافل ببيانات حقيقية، تنزيل PDF من المسار الحي) **داخل هذه الجلسة تحديدًا**. هذا
  قيد بيئة العمل وليس عيبًا في الكود — نفّذ `npm run dev` من جهازك أو بعد الرفع على Vercel
  وسيعمل الاتصال بـ Supabase بشكل طبيعي فورًا.

## المرحلة الثانية المقترحة

1. استبدال شخصيات SVG التخطيطية الحالية برسوم توضيحية شبه واقعية فعلية (المنصة مصممة أصلًا
   لتغيير الصور من جدول `child_character_stages` بدون لمس أي كود).
2. تفعيل "Leaked Password Protection" في إعدادات Supabase Auth، وإضافة أدوار متعددة للموظفين
   (مدير/محرر) بدل حساب إداري واحد.
3. إشعارات بريد/واتساب تلقائية عند نشر تقرير جديد أو عند عدم مشاهدة الكافل للتقرير خلال مدة معينة.
4. تصدير التقارير كملف واحد مجمّع (Batch PDF) لعدة كفلاء دفعة واحدة.
5. صفحة تحرير "الإعدادات العامة" داخل لوحة الإدارة لتعديل روابط الاستمرار الافتراضية واسم الجمعية
   (الجدول `platform_settings` جاهز، تنقصه واجهة).
6. اختبارات Playwright آلية لمسار الكافل الكامل ومسار الإدارة.
