// src/app/layout.tsx
import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from './Footer';
import { ThemeProvider } from './ThemeProvider';
import "./globals.css";
import HeaderButtons from './HeaderButtons';

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
            <div className="flex items-center">
              {/* Optional: Add logo or title here if desired */}
            </div>
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