import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import RegisterForm from "./register-form";

export const metadata: Metadata = { title: "إنشاء حساب" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const session = await getSession();
  if (session) redirect("/account/my-courses");

  return (
    <div>
      <h1 className="page-title text-center">إنشاء حساب جديد</h1>
      <p className="page-subtitle mb-6 text-center">
        سجّل مجانًا لتتمكن من التسجيل في الدورات ومتابعتها
      </p>
      <RegisterForm next={searchParams.next} />
    </div>
  );
}
