import { prisma } from "@/lib/prisma";
import { formatSAR, isZeroOrLess, round2 } from "./money";
import { LmAuthzError } from "./authz";

/**
 * تسجيل دفعة وتوزيعها تلقائيًا على أقدم الأقساط غير المسددة فأحدثها، داخل
 * معاملة قاعدة بيانات واحدة (atomic) لمنع أي بيانات مالية غير متناسقة —
 * إما أن تُنفَّذ كل الخطوات (حفظ الدفعة، التوزيع، تحديث كل الأقساط، تحديث
 * إجمالي العملية) معًا بنجاح، أو لا شيء منها عند أي خطأ.
 */
export async function recordLmPayment(
  transactionId: string,
  userId: string,
  amount: number,
  paymentDate: Date,
) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.lmTransaction.findFirst({
      where: { id: transactionId, userId },
      include: { installments: { orderBy: { number: "asc" } } },
    });
    if (!transaction) throw new LmAuthzError("العملية غير موجودة");

    const remainingTotal = round2(transaction.totalAmount - transaction.paidAmount);
    const roundedAmount = round2(amount);

    if (roundedAmount > remainingTotal + 0.005) {
      throw new Error(
        `المبلغ المدخل (${formatSAR(roundedAmount)}) أكبر من المتبقي على العملية (${formatSAR(remainingTotal)}). عدّل المبلغ ليكون مساويًا للمتبقي أو أقل منه.`,
      );
    }

    const payment = await tx.lmPayment.create({
      data: { transactionId, amount: roundedAmount, paymentDate },
    });

    let remainingPayment = roundedAmount;
    for (const installment of transaction.installments) {
      if (isZeroOrLess(remainingPayment)) break;
      const installmentRemaining = round2(installment.amount - installment.paidAmount);
      if (isZeroOrLess(installmentRemaining)) continue;

      const allocation = round2(Math.min(remainingPayment, installmentRemaining));
      await tx.lmPaymentAllocation.create({
        data: { paymentId: payment.id, installmentId: installment.id, amount: allocation },
      });
      await tx.lmInstallment.update({
        where: { id: installment.id },
        data: { paidAmount: round2(installment.paidAmount + allocation) },
      });
      remainingPayment = round2(remainingPayment - allocation);
    }

    await tx.lmTransaction.update({
      where: { id: transactionId },
      data: { paidAmount: round2(transaction.paidAmount + roundedAmount) },
    });

    return payment;
  });
}

/** حذف دفعة: يعكس أثرها بالكامل عن الأقساط وإجمالي العملية قبل حذفها (سجلات
 * التوزيع تُحذف تلقائيًا معها بحكم onDelete: Cascade في المخطط). */
export async function deleteLmPayment(paymentId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.lmPayment.findFirst({
      where: { id: paymentId, transaction: { userId } },
      include: { allocations: true, transaction: true },
    });
    if (!payment) throw new LmAuthzError("الدفعة غير موجودة");

    for (const allocation of payment.allocations) {
      const installment = await tx.lmInstallment.findUnique({ where: { id: allocation.installmentId } });
      if (installment) {
        await tx.lmInstallment.update({
          where: { id: installment.id },
          data: { paidAmount: round2(Math.max(0, installment.paidAmount - allocation.amount)) },
        });
      }
    }

    await tx.lmTransaction.update({
      where: { id: payment.transactionId },
      data: { paidAmount: round2(Math.max(0, payment.transaction.paidAmount - payment.amount)) },
    });

    await tx.lmPayment.delete({ where: { id: paymentId } });
  });
}
