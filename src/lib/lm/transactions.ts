import { prisma } from "@/lib/prisma";
import { round2 } from "./money";
import { generateInstallmentSchedule, graceDueDate } from "./schedule";
import { LmAuthzError } from "./authz";
import type { GraceTransactionInput, InstallmentTransactionInput } from "./validation";

export async function createGraceTransaction(userId: string, input: GraceTransactionInput) {
  const customer = await prisma.lmCustomer.findFirst({ where: { id: input.customerId, userId } });
  if (!customer) throw new LmAuthzError("العميل غير موجود");

  const totalAmount = round2(input.principal + input.interest);
  const dueDate = graceDueDate(input.startDate, input.months);

  return prisma.lmTransaction.create({
    data: {
      userId,
      customerId: input.customerId,
      type: "GRACE",
      principal: round2(input.principal),
      interest: round2(input.interest),
      totalAmount,
      startDate: input.startDate,
      months: input.months,
      notes: input.notes || null,
      installments: {
        create: [{ number: 1, dueDate, amount: totalAmount }],
      },
    },
  });
}

export async function createInstallmentTransaction(userId: string, input: InstallmentTransactionInput) {
  const customer = await prisma.lmCustomer.findFirst({ where: { id: input.customerId, userId } });
  if (!customer) throw new LmAuthzError("العميل غير موجود");

  const totalAmount = round2(input.principal + input.interest);
  const schedule = generateInstallmentSchedule(totalAmount, input.installmentsCount, input.firstInstallmentDate);

  return prisma.lmTransaction.create({
    data: {
      userId,
      customerId: input.customerId,
      type: "INSTALLMENT",
      principal: round2(input.principal),
      interest: round2(input.interest),
      totalAmount,
      startDate: input.firstInstallmentDate,
      installmentsCount: input.installmentsCount,
      notes: input.notes || null,
      installments: {
        create: schedule.map((s) => ({ number: s.number, dueDate: s.dueDate, amount: s.amount })),
      },
    },
  });
}

export async function updateTransactionNotes(id: string, userId: string, notes: string) {
  const transaction = await prisma.lmTransaction.findFirst({ where: { id, userId } });
  if (!transaction) throw new LmAuthzError("العملية غير موجودة");
  return prisma.lmTransaction.update({ where: { id }, data: { notes: notes || null } });
}

export async function deleteTransaction(id: string, userId: string) {
  const transaction = await prisma.lmTransaction.findFirst({ where: { id, userId } });
  if (!transaction) throw new LmAuthzError("العملية غير موجودة");
  await prisma.lmTransaction.delete({ where: { id } });
}
