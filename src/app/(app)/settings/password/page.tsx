import { PageHeader } from "@/components/ui-bits";
import PasswordForm from "@/components/password-form";
import { changePasswordAction } from "@/app/actions/auth";
import { requireSession } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { ShieldAlert } from "lucide-react";

export default async function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ first?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { mustChangePassword: true },
  });

  const forced = sp.first === "1" || user?.mustChangePassword;

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="تغيير كلمة المرور" subtitle="حدّث كلمة مرور حسابك" />

      {forced && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <p>
            هذه كلمة مرور مبدئية أنشأها مدير النظام. لحماية حسابك، الرجاء تعيين كلمة مرور جديدة
            خاصة بك قبل متابعة استخدام المنصة.
          </p>
        </div>
      )}

      <PasswordForm action={changePasswordAction} />
    </div>
  );
}
