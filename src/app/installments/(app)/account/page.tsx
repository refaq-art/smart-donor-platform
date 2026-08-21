import { requireLmSessionPage } from "@/lib/lm/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/lm/ui";
import { UpdateNameForm, ChangePasswordForm } from "@/components/lm/account-forms";
import { formatSaudiPhone } from "@/lib/lm/validation";
import { logoutAction } from "@/app/actions/lm/auth";
import { LogOut } from "lucide-react";

export default async function AccountPage() {
  const session = await requireLmSessionPage();
  const user = await prisma.lmUser.findUniqueOrThrow({ where: { id: session.userId } });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader title="الحساب" subtitle={formatSaudiPhone(user.phone)} />
      <UpdateNameForm defaultName={user.name} />
      <ChangePasswordForm />
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-100 md:hidden"
        >
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </form>
    </div>
  );
}
