import { requireLmSessionPage } from "@/lib/lm/authz";
import { PageHeader } from "@/components/lm/ui";
import { UserPlus, Receipt, Banknote } from "lucide-react";
import Link from "next/link";

const OPTIONS = [
  {
    href: "/installments/customers/new",
    icon: UserPlus,
    title: "عميل جديد",
    description: "أضف عميلًا جديدًا باسمه فقط",
  },
  {
    href: "/installments/transactions/new",
    icon: Receipt,
    title: "عملية جديدة",
    description: "مهلة أو أقساط لعميل موجود",
  },
  {
    href: "/installments/payments/new",
    icon: Banknote,
    title: "تسجيل دفعة",
    description: "اختر العملية وسجّل مبلغ الدفعة",
  },
];

export default async function AddLauncherPage() {
  await requireLmSessionPage();

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="إضافة" subtitle="ماذا تريد أن تضيف؟" />
      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <Link
            key={opt.href}
            href={opt.href}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <opt.icon size={26} />
            </div>
            <div>
              <p className="text-base font-black text-slate-900">{opt.title}</p>
              <p className="text-sm text-slate-500">{opt.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
