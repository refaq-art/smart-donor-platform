import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-app",
  display: "swap",
});

const SITE_NAME = "منصّة الدورات";
const SITE_DESCRIPTION =
  "منصة عربية للتسجيل في دورات مجانية ومتنوعة في البرمجة والتصميم والتسويق وإدارة المشاريع واللغات والمهارات الشخصية وريادة الأعمال وتحليل البيانات.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: `${SITE_NAME} — تعلّم مجانًا في أي مجال`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "ar_SA",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen bg-surface font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
