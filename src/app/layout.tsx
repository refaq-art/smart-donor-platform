import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة إدارة مشاريع ومنح الجمعيات الخيرية",
  description:
    "منصة متكاملة لموظفي الجمعيات الخيرية لإدارة المشاريع وفرص التمويل والجهات المانحة وطلبات المنح ومتابعتها.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
