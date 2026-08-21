import { prisma } from "@/lib/prisma";
import { LmAuthzError } from "./authz";

export async function createCustomer(userId: string, name: string) {
  return prisma.lmCustomer.create({ data: { userId, name } });
}

export async function updateCustomer(id: string, userId: string, name: string) {
  const customer = await prisma.lmCustomer.findFirst({ where: { id, userId } });
  if (!customer) throw new LmAuthzError("العميل غير موجود");
  return prisma.lmCustomer.update({ where: { id }, data: { name } });
}

export async function deleteCustomer(id: string, userId: string) {
  const customer = await prisma.lmCustomer.findFirst({ where: { id, userId } });
  if (!customer) throw new LmAuthzError("العميل غير موجود");
  // حذف العميل يحذف معه (Cascade) كل عملياته وأقساطه ودفعاته — التحذير الواضح
  // قبل التنفيذ مسؤولية الواجهة (نافذة تأكيد إلزامية قبل استدعاء هذا الإجراء).
  await prisma.lmCustomer.delete({ where: { id } });
}
