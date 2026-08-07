import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Tajawal, Baloo_Bhaijaan_2 } from 'next/font/google';
import { PlayerProvider } from '@/components/providers/player-provider';
import { SoundProvider } from '@/components/providers/sound-provider';
import { Navbar } from '@/components/layout/navbar';
import './globals.css';

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
  display: 'swap',
});

const baloo = Baloo_Bhaijaan_2({
  subsets: ['arabic'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-baloo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'حلبة الأسئلة — لعبة مسابقات عربية',
  description: 'لعبة أسئلة ومسابقات عربية تفاعلية للعائلة والأصدقاء — فردي، محلي، وأونلاين مع الأصدقاء عبر غرف خاصة.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0b0a1f',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${baloo.variable}`}>
      <body>
        <PlayerProvider>
          <SoundProvider>
            <Navbar />
            <main className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-4 pb-16 pt-6">{children}</main>
          </SoundProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
