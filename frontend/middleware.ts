// middleware.ts
import { createMiddleware } from 'next-intl/middleware';
import { NextRequest } from 'next/server';

export default createMiddleware({
  locales: ['en', 'fr', 'es'],
  defaultLocale: 'en',
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};