// src/app/HeaderButtons.tsx
'use client';

import Link from 'next/link';
import LoginModal from './LoginModal';
import { usePathname } from 'next/navigation';

export default function HeaderButtons() {
  const pathname = usePathname();

  return (
    <div className="flex items-center space-x-4">
      {/* Back to Home Button (shown only on /register) */}
      {pathname === '/register' && (
        <Link href="/">
          <button
            className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1 rounded-md transition-all duration-300"
          >
            Back to Home
          </button>
        </Link>
      )}
      <Link href="/register">
        <button
          className="border border-primary text-primary bg-transparent hover:bg-primary hover:text-white px-4 py-2 rounded-md transition-all duration-300"
        >
          Register
        </button>
      </Link>
      <LoginModal />
    </div>
  );
}