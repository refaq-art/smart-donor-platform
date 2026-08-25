import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFullReportByToken } from "@/lib/data/report";
import { ReportExperience } from "@/components/report/ReportExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function ReportPage({
  params,
}: {
  params: { token: string };
}) {
  const data = await getFullReportByToken(params.token);
  if (!data) notFound();

  return <ReportExperience data={data} />;
}
