// src/app/layout.tsx
import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from './components/Footer';
import { ThemeProvider } from './components/ThemeProvider';
import HeaderButtons from './components/HeaderButtons';
import { AuthProvider } from '@/context/AuthContext';
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
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/weather-icons/2.0.10/css/weather-icons.min.css"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <ThemeProvider>
          <AuthProvider>
            <header className="flex flex-col md:flex-row md:justify-between md:items-center p-4 bg-white dark:bg-gray-800 shadow-md">
              <Link href="/" className="flex items-center space-x-2 mb-4 md:mb-0">
                <Image src="/icon.png" alt="Rain Under The Cloud" width={40} height={40} />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">Rain Under The Cloud</h1>
              </Link>
              <div className="self-end md:self-auto">
                <HeaderButtons />
              </div>
            </header>
            <main className="flex-grow bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}