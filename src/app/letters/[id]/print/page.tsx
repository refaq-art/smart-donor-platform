import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/authz";
import { formatDate } from "@/lib/utils";
import PrintButton from "@/components/print-button";
import { CORRESPONDENCE_TYPES } from "@/lib/constants";
import type { CorrespondenceType } from "@/lib/correspondence-templates";
import { ArrowRight } from "lucide-react";

export default async function LetterPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const letter = await prisma.donorCorrespondence.findFirst({
    where: { id, organizationId: session.organizationId },
    include: { organization: true, donor: true, application: true },
  });
  if (!letter) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        {letter.applicationId ? (
          <Link href={`/applications/${letter.applicationId}`} className="btn-secondary">
            <ArrowRight size={15} /> رجوع
          </Link>
        ) : (
          <Link href={`/donors/${letter.donorId}`} className="btn-secondary">
            <ArrowRight size={15} /> رجوع
          </Link>
        )}
        <PrintButton />
      </div>

      <div className="border-b-2 border-brand-600 pb-4">
        <h1 className="text-xl font-black text-ink">{letter.organization.name}</h1>
        <p className="mt-1 text-xs text-slate-400">
          {[letter.organization.address, letter.organization.city].filter(Boolean).join(" — ")}
          {letter.organization.phone && ` — ${letter.organization.phone}`}
          {letter.organization.email && ` — ${letter.organization.email}`}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
        <span>{CORRESPONDENCE_TYPES[letter.type as CorrespondenceType] || letter.type}</span>
        <span>{formatDate(letter.createdAt)}</span>
      </div>

      <h2 className="mt-3 text-lg font-black text-brand-700">{letter.subject}</h2>

      <div className="mt-6 whitespace-pre-wrap text-sm leading-loose text-ink">{letter.body}</div>
    </div>
  );
}
