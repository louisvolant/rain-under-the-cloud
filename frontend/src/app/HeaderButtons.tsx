// src/app/HeaderButtons.tsx
'use client';

import Link from 'next/link';
import LoginModal from './LoginModal';

export default function HeaderButtons() {
  return (
    <div className="flex items-center space-x-4">
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