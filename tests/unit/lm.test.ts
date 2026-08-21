// اختبارات الحسابات المالية لوحدة العملاء والمهل والأقساط. تُشغَّل عبر
// Node.js Test Runner المدمج (بدون أي مكتبة اختبار إضافية) على قاعدة بيانات
// SQLite منفصلة للاختبار (راجع سكربت "test:unit" في package.json).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { round2, isEqual } from "../../src/lib/lm/money";
import { addMonthsClamped, generateInstallmentSchedule, graceDueDate } from "../../src/lib/lm/schedule";
import { deriveInstallmentStatus, deriveTransactionStatus } from "../../src/lib/lm/status";
import { normalizeSaudiPhone } from "../../src/lib/lm/validation";
import { prisma } from "../../src/lib/prisma";
import { createInstallmentTransaction, createGraceTransaction } from "../../src/lib/lm/transactions";
import { recordLmPayment, deleteLmPayment } from "../../src/lib/lm/payments";
import { hashPassword } from "../../src/lib/lm/auth";

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

async function makeTestUser() {
  const phone = "9665" + Math.floor(10000000 + Math.random() * 89999999);
  const user = await prisma.lmUser.create({
    data: { phone, name: "مستخدم اختبار", passwordHash: await hashPassword("Passw0rd!") },
  });
  const customer = await prisma.lmCustomer.create({ data: { userId: user.id, name: "عميل اختبار" } });
  return { user, customer };
}

describe("money", () => {
  test("round2 يقرّب بدون فقدان هللات", () => {
    assert.equal(round2(10000 / 3), 3333.33);
    assert.equal(round2(0.1 + 0.2), 0.3);
  });
});

describe("schedule", () => {
  test("addMonthsClamped: 31 يناير + شهر → 28 فبراير (سنة غير كبيسة)", () => {
    const jan31 = new Date(Date.UTC(2025, 0, 31));
    const result = addMonthsClamped(jan31, 1);
    assert.equal(result.getUTCFullYear(), 2025);
    assert.equal(result.getUTCMonth(), 1); // فبراير
    assert.equal(result.getUTCDate(), 28);
  });

  test("addMonthsClamped: 31 يناير + شهر → 29 فبراير (سنة كبيسة)", () => {
    const jan31 = new Date(Date.UTC(2024, 0, 31));
    const result = addMonthsClamped(jan31, 1);
    assert.equal(result.getUTCMonth(), 1);
    assert.equal(result.getUTCDate(), 29);
  });

  test("مثال المهلة: أصل 10000 + فائدة 2000 لمدة 6 أشهر", () => {
    const start = new Date(Date.UTC(2025, 0, 15));
    const due = graceDueDate(start, 6);
    assert.equal(due.getUTCFullYear(), 2025);
    assert.equal(due.getUTCMonth(), 6); // يوليو
    assert.equal(due.getUTCDate(), 15);
  });

  test("مثال الأقساط: إجمالي 12000 على 6 أقساط = 2000 لكل قسط", () => {
    const schedule = generateInstallmentSchedule(12000, 6, new Date(Date.UTC(2025, 0, 15)));
    assert.equal(schedule.length, 6);
    for (const s of schedule) assert.equal(s.amount, 2000);
    const sum = round2(schedule.reduce((acc, s) => acc + s.amount, 0));
    assert.equal(sum, 12000);
  });

  test("القسمة مع الكسور: 10000 على 3 أقساط لا تفقد أي هللة", () => {
    const schedule = generateInstallmentSchedule(10000, 3, new Date(Date.UTC(2025, 0, 1)));
    assert.equal(schedule[0].amount, 3333.33);
    assert.equal(schedule[1].amount, 3333.33);
    assert.equal(schedule[2].amount, 3333.34); // فرق التقريب في القسط الأخير
    const sum = round2(schedule.reduce((acc, s) => acc + s.amount, 0));
    assert.equal(sum, 10000);
  });

  test("تواريخ الأقساط الشهرية تتوالى بنفس اليوم قدر الإمكان", () => {
    const schedule = generateInstallmentSchedule(3000, 3, new Date(Date.UTC(2025, 0, 15)));
    assert.equal(schedule[0].dueDate.getUTCMonth(), 0);
    assert.equal(schedule[1].dueDate.getUTCMonth(), 1);
    assert.equal(schedule[2].dueDate.getUTCMonth(), 2);
    for (const s of schedule) assert.equal(s.dueDate.getUTCDate(), 15);
  });
});

describe("status", () => {
  test("تحديد حالة متأخر: قسط بلا دفع وتاريخ استحقاق ماضٍ", () => {
    const status = deriveInstallmentStatus({ amount: 1000, paidAmount: 0, dueDate: daysFromNow(-3) });
    assert.equal(status, "LATE");
  });

  test("تحديد حالة مستحق اليوم", () => {
    const status = deriveInstallmentStatus({ amount: 1000, paidAmount: 0, dueDate: daysFromNow(0) });
    assert.equal(status, "DUE_TODAY");
  });

  test("قسط متأخر رغم دفع جزئي يبقى متأخرًا (له أولوية على مسدد جزئيًا)", () => {
    const status = deriveInstallmentStatus({ amount: 1000, paidAmount: 400, dueDate: daysFromNow(-1) });
    assert.equal(status, "LATE");
  });

  test("مثال دفع جزئي: قسط 2000 دفع منه 1200 قبل الاستحقاق → مسدد جزئيًا", () => {
    const status = deriveInstallmentStatus({ amount: 2000, paidAmount: 1200, dueDate: daysFromNow(10) });
    assert.equal(status, "PARTIAL");
  });

  test("قسط مسدد بالكامل", () => {
    const status = deriveInstallmentStatus({ amount: 2000, paidAmount: 2000, dueDate: daysFromNow(10) });
    assert.equal(status, "PAID");
  });

  test("قسط قادم (لم يستحق بعد ولم يُدفع منه شيء)", () => {
    const status = deriveInstallmentStatus({ amount: 2000, paidAmount: 0, dueDate: daysFromNow(10) });
    assert.equal(status, "UPCOMING");
  });

  test("حالة العملية الكلية: متأخرة إذا تأخر أي قسط", () => {
    const status = deriveTransactionStatus([
      { amount: 1000, paidAmount: 1000, dueDate: daysFromNow(-30) },
      { amount: 1000, paidAmount: 0, dueDate: daysFromNow(-1) },
      { amount: 1000, paidAmount: 0, dueDate: daysFromNow(30) },
    ]);
    assert.equal(status, "LATE");
  });

  test("حالة العملية الكلية: مسددة إذا اكتملت كل الأقساط", () => {
    const status = deriveTransactionStatus([
      { amount: 1000, paidAmount: 1000, dueDate: daysFromNow(-30) },
      { amount: 1000, paidAmount: 1000, dueDate: daysFromNow(-1) },
    ]);
    assert.equal(status, "PAID");
  });
});

describe("رقم الجوال", () => {
  test("تطبيع صيغ مختلفة لنفس الرقم", () => {
    assert.equal(normalizeSaudiPhone("0512345678"), "966512345678");
    assert.equal(normalizeSaudiPhone("+966512345678"), "966512345678");
    assert.equal(normalizeSaudiPhone("512345678"), "966512345678");
  });
  test("رقم غير صحيح يُرفض", () => {
    assert.equal(normalizeSaudiPhone("12345"), null);
  });
});

describe("توزيع الدفعات (تكامل مع قاعدة البيانات)", () => {
  test("دفع جزئي لقسط واحد", async () => {
    const { user, customer } = await makeTestUser();
    const tx = await createInstallmentTransaction(user.id, {
      customerId: customer.id,
      principal: 8000,
      interest: 2000,
      installmentsCount: 5, // 2000 لكل قسط
      firstInstallmentDate: daysFromNow(10),
      notes: null,
    });

    await recordLmPayment(tx.id, user.id, 1200, new Date());

    const installments = await prisma.lmInstallment.findMany({
      where: { transactionId: tx.id },
      orderBy: { number: "asc" },
    });
    assert.equal(installments[0].paidAmount, 1200);
    assert.equal(round2(installments[0].amount - installments[0].paidAmount), 800);
    assert.equal(
      deriveInstallmentStatus(installments[0], new Date()),
      "PARTIAL",
    );

    await prisma.lmUser.delete({ where: { id: user.id } });
  });

  test("دفعة أكبر من قسط تُوزَّع تلقائيًا على القسط التالي", async () => {
    const { user, customer } = await makeTestUser();
    const tx = await createInstallmentTransaction(user.id, {
      customerId: customer.id,
      principal: 5000,
      interest: 1000,
      installmentsCount: 3, // 2000 لكل قسط
      firstInstallmentDate: daysFromNow(10),
      notes: null,
    });

    await recordLmPayment(tx.id, user.id, 3000, new Date());

    const installments = await prisma.lmInstallment.findMany({
      where: { transactionId: tx.id },
      orderBy: { number: "asc" },
    });
    assert.equal(installments[0].paidAmount, 2000);
    assert.equal(installments[1].paidAmount, 1000);
    assert.equal(installments[2].paidAmount, 0);
    assert.equal(round2(installments[1].amount - installments[1].paidAmount), 1000);

    await prisma.lmUser.delete({ where: { id: user.id } });
  });

  test("دفعة تغطي عدة أقساط دفعة واحدة", async () => {
    const { user, customer } = await makeTestUser();
    const tx = await createInstallmentTransaction(user.id, {
      customerId: customer.id,
      principal: 4000,
      interest: 800,
      installmentsCount: 4, // 1200 لكل قسط
      firstInstallmentDate: daysFromNow(10),
      notes: null,
    });

    await recordLmPayment(tx.id, user.id, 3000, new Date());

    const installments = await prisma.lmInstallment.findMany({
      where: { transactionId: tx.id },
      orderBy: { number: "asc" },
    });
    assert.equal(installments[0].paidAmount, 1200);
    assert.equal(installments[1].paidAmount, 1200);
    assert.equal(installments[2].paidAmount, 600);
    assert.equal(installments[3].paidAmount, 0);

    await prisma.lmUser.delete({ where: { id: user.id } });
  });

  test("سداد العملية بالكامل يجعل حالتها مسددة", async () => {
    const { user, customer } = await makeTestUser();
    const tx = await createGraceTransaction(user.id, {
      customerId: customer.id,
      principal: 10000,
      interest: 2000,
      months: 6,
      startDate: daysFromNow(-200),
      notes: null,
    });

    await recordLmPayment(tx.id, user.id, 12000, new Date());

    const updated = await prisma.lmTransaction.findUniqueOrThrow({
      where: { id: tx.id },
      include: { installments: true },
    });
    assert.equal(updated.paidAmount, 12000);
    assert.equal(deriveTransactionStatus(updated.installments), "PAID");

    await prisma.lmUser.delete({ where: { id: user.id } });
  });

  test("رفض دفعة أكبر من المتبقي على العملية", async () => {
    const { user, customer } = await makeTestUser();
    const tx = await createGraceTransaction(user.id, {
      customerId: customer.id,
      principal: 1000,
      interest: 0,
      months: 1,
      startDate: daysFromNow(-10),
      notes: null,
    });

    await assert.rejects(() => recordLmPayment(tx.id, user.id, 5000, new Date()));

    await prisma.lmUser.delete({ where: { id: user.id } });
  });

  test("حذف دفعة يعكس أثرها عن الأقساط والإجمالي", async () => {
    const { user, customer } = await makeTestUser();
    const tx = await createInstallmentTransaction(user.id, {
      customerId: customer.id,
      principal: 1800,
      interest: 200,
      installmentsCount: 2, // 1000 لكل قسط
      firstInstallmentDate: daysFromNow(10),
      notes: null,
    });

    const payment = await recordLmPayment(tx.id, user.id, 1500, new Date());
    await deleteLmPayment(payment.id, user.id);

    const updated = await prisma.lmTransaction.findUniqueOrThrow({
      where: { id: tx.id },
      include: { installments: { orderBy: { number: "asc" } } },
    });
    assert.equal(updated.paidAmount, 0);
    assert.equal(updated.installments[0].paidAmount, 0);
    assert.equal(updated.installments[1].paidAmount, 0);

    await prisma.lmUser.delete({ where: { id: user.id } });
  });

  test("عزل البيانات: لا يمكن الوصول لعملية مستخدم آخر", async () => {
    const { user: userA } = await makeTestUser();
    const { user: userB, customer: customerB } = await makeTestUser();

    const tx = await createGraceTransaction(userB.id, {
      customerId: customerB.id,
      principal: 1000,
      interest: 0,
      months: 1,
      startDate: daysFromNow(-10),
      notes: null,
    });

    await assert.rejects(() => recordLmPayment(tx.id, userA.id, 100, new Date()));

    await prisma.lmUser.delete({ where: { id: userA.id } });
    await prisma.lmUser.delete({ where: { id: userB.id } });
  });
});
