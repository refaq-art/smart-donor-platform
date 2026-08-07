import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const font = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans-arabic",
});

export const metadata: Metadata = {
  title: "مُطوّر — من القياس إلى الأثر",
  description: "منصة قياس وتطوير الجمعيات الأهلية عبر برنامج تطوير 100 يوم",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={font.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
