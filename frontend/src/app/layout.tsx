// src/app/layout.tsx
import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Geist, Geist_Mono } from "next/font/google";
import Footer from './Footer';
import { ThemeProvider } from './ThemeProvider';
import "./globals.css";
import Link from 'next/link';
import LoginModal from './LoginModal';

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
 <header className="flex justify-end p-4">
 <div className="space-x-4">
 <Link href="/register">
 <button className="btn btn-primary">Register</button>
 </Link>
 <LoginModal />
 </div>
 </header>
 {children}
 <Footer />
 </ThemeProvider>
 <SpeedInsights/>
 </body>
 </html>
 );
}