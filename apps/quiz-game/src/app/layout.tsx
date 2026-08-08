import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Tajawal, Baloo_Bhaijaan_2 } from 'next/font/google';
import { PlayerProvider } from '@/components/providers/player-provider';
import { SoundProvider } from '@/components/providers/sound-provider';
import { ServiceWorkerRegister } from '@/components/providers/sw-register';
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
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'حلبة الأسئلة',
  },
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
        <ServiceWorkerRegister />
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
