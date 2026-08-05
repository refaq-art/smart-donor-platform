import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/authz";
import { FIELD_KEYS, FIELD_LABELS } from "@/lib/application-fields";
import { formatDate } from "@/lib/utils";
import PrintButton from "@/components/print-button";
import { ArrowRight } from "lucide-react";

export default async function ApplicationPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const application = await prisma.grantApplication.findFirst({
    where: { id, organizationId: session.organizationId },
    include: { project: true, opportunity: { include: { donor: true } }, organization: true },
  });
  if (!application) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/applications/${id}`} className="btn-secondary">
          <ArrowRight size={15} /> رجوع
        </Link>
        <PrintButton />
      </div>

      <div className="border-b-2 border-brand-600 pb-4">
        <h1 className="text-2xl font-black text-ink">{application.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {application.organization.name} — المشروع: {application.project.title}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          الجهة المانحة: {application.opportunity?.donor?.name || application.opportunity?.donorNameFreeText || "غير محدد"} — تاريخ
          الطباعة: {formatDate(new Date())}
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {FIELD_KEYS.map((key) => {
          const value = application[key];
          if (!value) return null;
          return (
            <div key={key} className="break-inside-avoid">
              <h2 className="mb-1.5 text-base font-black text-brand-700">{FIELD_LABELS[key]}</h2>
              <p className="whitespace-pre-wrap leading-relaxed text-ink">{value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
