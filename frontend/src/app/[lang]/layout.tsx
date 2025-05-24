// src/app/[lang]/layout.tsx
import type { Metadata } from 'next';
// Fonts (Geist) and global CSS are now handled by src/app/layout.tsx
import Footer from '../components/Footer';
import { ThemeProvider } from '../components/ThemeProvider';
import HeaderButtons from '../components/HeaderButtons';
import { AuthProvider } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
// Adjust path to your i18n.ts file (e.g., from project root)
import { locales as appLocales } from '../../../i18n';

// Optional: Dynamic metadata for each locale. This can override metadata from the root layout.
export async function generateMetadata({ params: { lang } }: { params: { lang: string } }): Promise<Metadata> {
  const _lang = props.params.lang;

  console.log(`[generateMetadata] _lang: ${_lang}`); // For debugging
  if (!appLocales.includes(_lang)) {
      notFound();
  }

  // const messages = await getMessages({ locale: _lang });
  // const pageTitle = messages.YourApp?.title || 'Rain Under The Cloud';
  return {
     title: `Rain Under The Cloud for ${_lang}`,
    // description: "Your localized description here...",
  };
}

export default async function LocaleLayout({
  children,
  params: { lang },
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  const _lang = params.lang;

  console.log(`[LocaleLayout] _lang: ${_lang}`);
  if (!appLocales.includes(_lang)) {
    notFound();
  }

  let messages;
  try {
    console.log(`[LocaleLayout] Attempting to get messages for locale: ${_lang}`); // Debug
    messages = await getMessages({ locale: _lang });
    console.log(`[LocaleLayout] Successfully got messages for locale: ${_lang}`); // Debug
  } catch (error) {
    console.error(`[LocaleLayout] Error fetching messages for locale ${_lang}:`, error);
    // This is where the "Couldn't find next-intl config file" might be caught
    // If this error occurs, it indicates a deeper issue with next-intl's setup or discovery of i18n.ts
    notFound(); // Or re-throw the error to see its full stack
  }

  // This component does NOT render <html> or <body> tags.
  // It renders the content that will be placed inside the <body> of src/app/layout.tsx.
  return (
    <NextIntlClientProvider locale={_lang} messages={messages}>
      <ThemeProvider>
        <AuthProvider>
          <header className="flex flex-col md:flex-row md:justify-between md:items-center p-4 bg-white dark:bg-gray-800 shadow-md">
            <Link href={`/${_lang}`} className="flex items-center space-x-2 mb-4 md:mb-0">
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
    </NextIntlClientProvider>
    // Note: <SpeedInsights /> is now in src/app/layout.tsx
  );
}

export async function generateStaticParams() {
  return appLocales.map((lang) => ({ lang }));
}