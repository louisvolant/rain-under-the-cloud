// src/app/layout.tsx
import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from './components/Footer';
import { ThemeProvider } from './components/ThemeProvider';
import HeaderButtons from './components/HeaderButtons';
import "./globals.css";
import Link from 'next/link';
import Image from 'next/image';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rain Under The Cloud",
  description: "Let's have fun watching weather graphs",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/icon.png" alt="Rain Under The Cloud" width={40} height={40} />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Rain Under The Cloud</h1>
            </Link>
            <HeaderButtons />
          </header>
          <main className="min-h-[calc(100vh-8rem)]">{children}</main>
          <Footer />
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}