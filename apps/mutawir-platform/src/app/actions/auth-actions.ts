"use server";

import { redirect } from "next/navigation";
import { loginUser, logoutUser, roleHome } from "@/lib/auth";

export async function loginAction(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "يرجى إدخال البريد الإلكتروني وكلمة المرور" };

  const result = await loginUser(email, password);
  if (!result.ok) return { error: result.error };
  redirect(roleHome(result.role));
}

export async function logoutAction() {
  await logoutUser();
  redirect("/login");
}
