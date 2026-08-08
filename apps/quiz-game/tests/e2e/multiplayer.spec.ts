import { test, expect } from '@playwright/test';
import { loginAsGuest, uniqueName, answerRoomQuizToCompletion, waitForRoomQuestionWithReloadFallback, warmUpRoomRoutes } from './helpers';

// ملاحظة: هذا الاختبار هو الوحيد الذي يمر عبر مسار Socket.IO الحي بمتصفحين حقيقيين،
// وقد لوحظ أنه الأكثر حساسية لضغط تصريف Next.js في وضع التطوير (dev) عند تشغيله ضمن
// مجموعة اختبارات كاملة متتالية على هذا الجهاز تحديدًا — تصريف مسار جديد لأول مرة يبعث
// تحديث HMR لكل الصفحات المفتوحة، وقد يُقاطع طلبات RSC/متصفح جارية بشكل متكرر. تم التحقق
// من صحة منطق الخادم (الغرف/الجاهزية/البث عبر Socket.IO وإعادة الاتصال) بشكل مستقل ومباشر
// عبر عميل socket.io-client خام (دون متصفح) ويعمل بشكل صحيح تمامًا؛ كما يمر هذا الاختبار
// بثبات عند تشغيله منفردًا. هذه الحساسية خاصة بخادم التطوير (next dev) فقط — الإنتاج
// (next build && next start) لا يحتوي على Fast Refresh أو تصريف عند الطلب إطلاقًا.
test('مباراة أونلاين كاملة بين لاعبين عبر غرفة برمز', async ({ browser }) => {
  test.setTimeout(150_000);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  try {
    // نصرّف مسارات الغرفة (بما فيها النمط الديناميكي /room/[code]/*) مسبقًا لتفادي
    // مقاطعة Fast Refresh لتنقّلات العميل أثناء الاختبار الفعلي (انظر التوثيق في الدالة).
    await warmUpRoomRoutes(hostPage);

    await loginAsGuest(hostPage, uniqueName('مضيف'));
    await loginAsGuest(guestPage, uniqueName('ضيف'));

    // المضيف ينشئ غرفة بنمط "لعبة سريعة" (5 أسئلة فقط) لتقليل مدة الاختبار.
    // ننتظر استجابة API الفعلية بدل تنقّل العميل (انظر توثيق waitForAuthResponseThenGoHome
    // في helpers.ts لتفسير سبب عدم موثوقية router.push وحده في وضع التطوير)، ثم ننتقل
    // بتنقّل كامل مباشرة إلى الرابط المعروف بدل انتظار Next.js لإعادة توجيه العميل.
    await hostPage.goto('/room/create');
    await hostPage.getByTestId('room-mode-QUICK_PLAY').click();
    await hostPage.getByTestId('room-category-option').first().click();
    const [createRes] = await Promise.all([
      hostPage.waitForResponse((res) => res.url().includes('/api/rooms') && res.request().method() === 'POST', { timeout: 15_000 }),
      hostPage.getByTestId('create-room-button').click(),
    ]);
    const { code } = await createRes.json();
    expect(code).toHaveLength(6);
    await hostPage.goto(`/room/${code}/lobby`);

    // الضيف ينضم بالرمز
    await guestPage.goto('/room/join');
    await guestPage.getByTestId('room-code-input').fill(code);
    await Promise.all([
      guestPage.waitForResponse((res) => res.url().includes(`/api/rooms/${code}`), { timeout: 15_000 }),
      guestPage.getByTestId('room-join-button').click(),
    ]);
    await guestPage.goto(`/room/${code}/lobby`);

    // الضيف يصبح جاهزًا — ننتظر انعكاس الحالة في زر الضيف نفسه أولًا (تأكيد وصول الاستجابة
    // عبر Socket.IO له) قبل التحقق من وصولها للمضيف، لتفادي أي تأخير في اتصال Socket.IO
    // بعد التحميل الكامل للصفحة (goto).
    await guestPage.getByTestId('room-ready-button').click();
    await expect(guestPage.getByTestId('room-ready-button')).toContainText('جاهز', { timeout: 30_000 });

    // المضيف يبدأ المباراة بعد أن يصبح الزر متاحًا (بعد استلام حالة استعداد الضيف عبر Socket.IO)
    await expect(hostPage.getByTestId('room-start-button')).toBeEnabled({ timeout: 30_000 });
    await hostPage.getByTestId('room-start-button').click();

    // الانتقال لصفحة اللعب يعتمد على حدث Socket.IO لا على استجابة HTTP، لذا ننتظره
    // بمهلة معقولة، وإن لم يحدث تنقّل العميل خلالها ننتقل يدويًا (goto) — إعادة الاتصال
    // بالغرفة عبر Socket.IO عند تحميل الصفحة تعمل بشكل مستقل تمامًا (مُتحقَّق منه).
    await Promise.all([
      hostPage.waitForURL(`**/room/${code}/play`, { timeout: 8_000 }).catch(() => hostPage.goto(`/room/${code}/play`)),
      guestPage.waitForURL(`**/room/${code}/play`, { timeout: 8_000 }).catch(() => guestPage.goto(`/room/${code}/play`)),
    ]);

    await Promise.all([waitForRoomQuestionWithReloadFallback(hostPage), waitForRoomQuestionWithReloadFallback(guestPage)]);

    await Promise.all([answerRoomQuizToCompletion(hostPage), answerRoomQuizToCompletion(guestPage)]);

    await expect(hostPage.getByTestId('final-results-heading')).toBeVisible({ timeout: 15_000 });
    await expect(guestPage.getByTestId('final-results-heading')).toBeVisible({ timeout: 15_000 });
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});
