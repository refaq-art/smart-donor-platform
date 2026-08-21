import { prisma } from "@/lib/prisma";
import { hashPassword } from "./auth";
import { normalizeSaudiPhone } from "./validation";
import { LmAuthzError } from "./authz";
import { getUserDashboard, listUserCustomers, listUserTransactions, getUserTransactionDetail } from "./queries";

/**
 * كل الدوال هنا تفترض أن الاستدعاء تم بعد requireLmAdmin() في الاستدعاء
 * (Server Action أو صفحة) — هذه هي القناة الوحيدة المسموح بها لتجاوز عزل
 * بيانات المستخدمين، ولا تُستخدم أبدًا في مسار المستخدم العادي.
 */

export async function adminGetOverview() {
  const [totalUsers, activeUsers, disabledUsers, totalCustomers, totalTransactions] = await Promise.all([
    prisma.lmUser.count(),
    prisma.lmUser.count({ where: { isActive: true } }),
    prisma.lmUser.count({ where: { isActive: false } }),
    prisma.lmCustomer.count(),
    prisma.lmTransaction.count(),
  ]);
  return { totalUsers, activeUsers, disabledUsers, totalCustomers, totalTransactions };
}

export async function adminListUsers(search?: string) {
  const users = await prisma.lmUser.findMany({
    where: search?.trim()
      ? { OR: [{ name: { contains: search.trim() } }, { phone: { contains: search.trim() } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { customers: true, transactions: true } } },
  });
  return users;
}

export async function adminGetUser(id: string) {
  return prisma.lmUser.findUnique({ where: { id } });
}

export async function adminGetUserData(id: string) {
  const [dashboard, customers, transactions] = await Promise.all([
    getUserDashboard(id),
    listUserCustomers(id),
    listUserTransactions(id),
  ]);
  return { dashboard, customers, transactions };
}

export async function adminGetUserTransactionDetail(userId: string, transactionId: string) {
  return getUserTransactionDetail(transactionId, userId);
}

export async function adminCreateUser(input: { name: string; phone: string; password: string; role: string }) {
  const normalizedPhone = normalizeSaudiPhone(input.phone);
  if (!normalizedPhone) throw new Error("رقم جوال سعودي غير صحيح");

  const existing = await prisma.lmUser.findUnique({ where: { phone: normalizedPhone } });
  if (existing) throw new Error("رقم الجوال مستخدم بالفعل");

  const passwordHash = await hashPassword(input.password);
  return prisma.lmUser.create({
    data: { name: input.name, phone: normalizedPhone, passwordHash, role: input.role },
  });
}

export async function adminUpdateUser(id: string, input: { name: string; role: string }) {
  const user = await prisma.lmUser.findUnique({ where: { id } });
  if (!user) throw new LmAuthzError("المستخدم غير موجود");
  return prisma.lmUser.update({ where: { id }, data: { name: input.name, role: input.role } });
}

export async function adminSetUserActive(id: string, isActive: boolean) {
  const user = await prisma.lmUser.findUnique({ where: { id } });
  if (!user) throw new LmAuthzError("المستخدم غير موجود");
  // تعطيل الحساب يُبطل كل جلساته الحالية فورًا (sessionsValidFrom) بالإضافة
  // إلى منع الدخول من الأساس (isActive).
  return prisma.lmUser.update({
    where: { id },
    data: { isActive, sessionsValidFrom: new Date() },
  });
}

export async function adminDeleteUser(id: string) {
  const user = await prisma.lmUser.findUnique({ where: { id } });
  if (!user) throw new LmAuthzError("المستخدم غير موجود");
  // يحذف معه (Cascade) كل عملائه وعملياته وأقساطه ودفعاته.
  await prisma.lmUser.delete({ where: { id } });
}
