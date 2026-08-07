import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession, setSessionCookie, clearSessionCookie } from "@/lib/session";
import type { RoleValue } from "@/lib/constants";

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !user.isActive) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await verifyCredentials(email, password);
  if (!user) return { ok: false as const, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  await setSessionCookie({
    userId: user.id,
    role: user.role as RoleValue,
    organizationId: user.organizationId,
  });
  return { ok: true as const, role: user.role as RoleValue };
}

export async function logoutUser() {
  await clearSessionCookie();
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { consultant: true, councilMember: true, organization: true },
  });
  if (!user || !user.isActive) return null;
  return user;
}

export function roleHome(role: RoleValue) {
  switch (role) {
    case "ORG":
      return "/org";
    case "CONSULTANT":
      return "/consultant";
    case "COUNCIL":
      return "/council";
    case "ADMIN":
      return "/admin";
  }
}

export async function requireUser(allowed?: RoleValue[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (allowed && !allowed.includes(user.role as RoleValue)) {
    redirect(roleHome(user.role as RoleValue));
  }
  return user;
}
