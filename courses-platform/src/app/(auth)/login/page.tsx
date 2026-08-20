import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { FormMessage } from "@/components/ui";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; reset?: string };
}) {
  const session = await getSession();
  if (session) redirect("/account/my-courses");

  return (
    <div>
      <h1 className="page-title text-center">تسجيل الدخول</h1>
      <p className="page-subtitle mb-6 text-center">أهلًا بعودتك، سجّل دخولك لمتابعة دوراتك</p>

      {searchParams.reset === "1" && (
        <FormMessage type="success" message="تم تغيير كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن." />
      )}

      <LoginForm next={searchParams.next} />
    </div>
  );
}
