// src/components/Footer.tsx
'use client';

import Link from 'next/link';
import { externalLinks } from './links';
import { useTheme } from './ThemeProvider';

export default function Footer() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <footer className="bg-gray-200 dark:bg-gray-800 py-4">
      <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
        {/* External links */}
        <div className="mb-4">
          {externalLinks.map((link, index) => (
            <span key={link.href}>
              <Link href={link.href} className="mx-2 hover:text-gray-800 dark:hover:text-gray-100">
                {link.label}
              </Link>
              {index < externalLinks.length - 1 && <span>|</span>}
            </span>
          ))}
        </div>

        {/* Copyright and Theme Toggle */}
        <div className="mt-4 flex justify-center items-center space-x-2">
          <span>
            © {new Date().getFullYear()} RainUnderThe.Cloud. All rights reserved.
          </span>
          <button
            onClick={toggleDarkMode}
            className="p-2 bg-gray-300 dark:bg-gray-700 rounded-full hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </footer>
  );
}