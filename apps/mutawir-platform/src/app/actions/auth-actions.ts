"use server";

import { redirect } from "next/navigation";
import { loginUser, logoutUser, roleHome } from "@/lib/auth";

export async function loginAction(_prevState: { error?: string } | undefined, formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!identifier || !password) return { error: "يرجى إدخال البريد الإلكتروني أو اسم المستخدم وكلمة المرور" };

  const result = await loginUser(identifier, password);
  if (!result.ok) return { error: result.error };
  redirect(roleHome(result.role));
}

export async function logoutAction() {
  await logoutUser();
  redirect("/login");
}
