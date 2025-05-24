// i18n.ts
// i18n.ts (should be at your project root, or in `src/` and adjust paths accordingly)
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'fr', 'es'];
export const defaultLocale = 'en'; // Make sure this is one of the `locales`

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is a supported locale
  if (!locales.includes(locale)) {
    notFound(); // Redirect to 404 if the locale is not supported
  }

  try {
    return {
      messages: (await import(`./src/locales/${locale}.json`)).default,
    };
  } catch (error) {
    // This catch block is for cases where a supported locale's file might be missing.
    // For a production app, all supported locale files should exist.
    // Falling back to defaultLocale might hide issues. `notFound()` could also be an option here.
    console.error(`Messages for locale "${locale}" not found. Falling back to "${defaultLocale}". Error:`, error);
    return {
      messages: (await import(`./src/locales/${defaultLocale}.json`)).default,
    };
  }
});