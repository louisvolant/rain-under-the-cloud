// src/app/layout.tsx
import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css'; // Your global styles
import { Geist, Geist_Mono } from 'next/font/google'; // Your fonts

import { defaultLocale } from '../../i18n';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Rain Under The Cloud',
  description: "Let's have fun watching weather graphs",
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={defaultLocale}> {}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        {children} {}
        <SpeedInsights />
      </body>
    </html>
  );
}