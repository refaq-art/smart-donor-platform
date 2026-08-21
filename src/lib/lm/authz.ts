import { getLmSession, type LmSessionPayload } from "./auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * نقطة الإنفاذ المركزية لعزل بيانات مستخدمي وحدة المهل والأقساط عن بعضهم.
 * القاعدة: أي استعلام على عميل/عملية/دفعة يخص "مستخدمًا عاديًا" يجب أن يمر
 * عبر requireOwnedCustomer/requireOwnedTransaction (يقيّدان دائمًا بـ userId
 * صاحب الجلسة) — لا استثناء حتى لو خمّن المستخدم معرّف سجل مستخدم آخر.
 * صلاحية الـ Admin لتصفح بيانات أي مستخدم مُنفَّذة بدوال منفصلة صراحةً في
 * lib/lm/admin-queries.ts بعد requireLmAdmin()، ولا تُخلَط بمسار المستخدم
 * العادي إطلاقًا.
 */

export class LmAuthzError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LmAuthzError";
  }
}

export async function requireLmSessionPage(): Promise<LmSessionPayload> {
  const session = await getLmSession();
  if (!session) redirect("/installments/login");
  if (!(await isLmSessionUserValid(session))) redirect("/installments/login");
  return session;
}

export async function requireLmSession(): Promise<LmSessionPayload> {
  const session = await getLmSession();
  if (!session) throw new LmAuthzError("الرجاء تسجيل الدخول");
  if (!(await isLmSessionUserValid(session))) {
    throw new LmAuthzError("انتهت صلاحية الجلسة، الرجاء تسجيل الدخول من جديد");
  }
  return session;
}

/** يتحقق أن الحساب لا يزال نشطًا وأن الجلسة لم تُبطَل (بعد تغيير كلمة المرور
 * أو تعطيل الحساب من قِبل المدير) — صحة توقيع الـ JWT وحدها لا تكفي. */
export async function isLmSessionUserValid(session: LmSessionPayload): Promise<boolean> {
  const user = await prisma.lmUser.findUnique({
    where: { id: session.userId },
    select: { isActive: true, sessionsValidFrom: true },
  });
  if (!user || !user.isActive) return false;
  // إبطال أي جلسة صدرت قبل sessionsValidFrom (تغيير كلمة المرور/تعطيل الحساب).
  // نقارن بدقة الثانية (مثل دقة iat في الـ JWT) لا الميلي ثانية — وإلا فإن أول
  // جلسة تُصدَر عند إنشاء الحساب نفسه قد تُرفض خطأً بسبب فارق تقريب دون ثانية
  // واحدة بين وقت التوقيع ووقت تسجيل sessionsValidFrom في قاعدة البيانات.
  return session.issuedAt >= Math.floor(user.sessionsValidFrom.getTime() / 1000);
}

export async function requireLmAdminPage(): Promise<LmSessionPayload> {
  const session = await requireLmSessionPage();
  if (session.role !== "ADMIN") redirect("/installments/dashboard");
  return session;
}

export async function requireLmAdmin(): Promise<LmSessionPayload> {
  const session = await requireLmSession();
  if (session.role !== "ADMIN") throw new LmAuthzError("ليست لديك صلاحية المدير العام");
  return session;
}

export async function requireOwnedCustomer(id: string, session: LmSessionPayload) {
  const customer = await prisma.lmCustomer.findFirst({ where: { id, userId: session.userId } });
  if (!customer) throw new LmAuthzError("العميل غير موجود");
  return customer;
}

export async function requireOwnedTransaction(id: string, session: LmSessionPayload) {
  const transaction = await prisma.lmTransaction.findFirst({
    where: { id, userId: session.userId },
    include: { installments: { orderBy: { number: "asc" } }, customer: true },
  });
  if (!transaction) throw new LmAuthzError("العملية غير موجودة");
  return transaction;
}
