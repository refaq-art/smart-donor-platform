import { Page, expect } from "@playwright/test";

export const DEMO_PASSWORD = "Passw0rd!";

export const ROLE_LABELS = {
  admin: "مدير النظام",
  manager: "مدير الجمعية",
  officer: "مسؤول المنح",
  reviewer: "مراجع",
} as const;

export type DemoRole = keyof typeof ROLE_LABELS;

/** يسجّل الدخول عبر زر الحساب التجريبي المطابق للدور، وينتظر وصول لوحة التحكم. */
export async function loginAs(page: Page, role: DemoRole) {
  await page.goto("/login");
  await page.click(`button:has-text("${ROLE_LABELS[role]}")`);
  await page.fill("#password", DEMO_PASSWORD);
  await page.click('button[type=submit]:has-text("تسجيل الدخول")');
  await page.waitForURL("**/dashboard");
  await expect(page.locator("h1")).toContainText("مرحبًا");
}

export async function logout(page: Page) {
  await page.click('button:has-text("تسجيل الخروج")');
  await page.waitForURL("**/login");
}

/** يعيد معرّف السجل من عنوان صفحة تفاصيل مثل /projects/{id}، بعد الانتقال بعيدًا عن صفحة /new. */
export async function idFromDetailUrl(page: Page, listSegment: string) {
  await page.waitForFunction(() => !location.pathname.endsWith("/new"));
  const url = page.url();
  return url.split(`/${listSegment}/`)[1];
}

export function uniqueTitle(prefix: string) {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
