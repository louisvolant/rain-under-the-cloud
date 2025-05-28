import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from './components/Footer';
import { ThemeProvider } from './components/ThemeProvider';
import HeaderButtons from './components/HeaderButtons';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext'; // Import LanguageProvider
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

// Metadata can be dynamic in a client component, but for static metadata
// we'll keep it simple for now. You might consider a separate
// metadata provider for full i18n support in metadata.
export const metadata: Metadata = {
  title: "Rain Under The Cloud", // Will be updated in a client component for dynamic title
  description: "Let's have fun watching weather graphs", // Will be updated in a client component for dynamic description
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
    <html lang="en"> {/* Initial lang for SSR, will be updated by LanguageProvider */}
      <head>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider> {/* Wrap with LanguageProvider */}
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
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}