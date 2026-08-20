import { Page } from "@playwright/test";

export const ADMIN_EMAIL = "admin@example.com";
export const ADMIN_PASSWORD = "Admin@12345";
export const USER_EMAIL = "user@example.com";
export const USER_PASSWORD = "User@12345";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type=submit]');
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

export async function loginAsAdmin(page: Page) {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.waitForURL("**/account/my-courses");
}

export async function loginAsUser(page: Page) {
  await loginAs(page, USER_EMAIL, USER_PASSWORD);
  await page.waitForURL("**/account/my-courses");
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
}
