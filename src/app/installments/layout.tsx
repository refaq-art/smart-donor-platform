import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إدارة المهل والأقساط",
  description: "تسجيل العملاء والمهل والأقساط والدفعات ومتابعة المستحقات.",
};

export default function InstallmentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
