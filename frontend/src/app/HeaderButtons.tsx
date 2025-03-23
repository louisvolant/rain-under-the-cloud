// src/app/HeaderButtons.tsx
'use client';

import Link from 'next/link';
import LoginModal from './LoginModal';

export default function HeaderButtons() {
  return (
    <div className="space-x-4">
      <Link href="/register">
        <button className="btn btn-outline btn-primary hover:bg-primary hover:text-white transition-all duration-300">
          Register
        </button>
      </Link>
      <LoginModal />
    </div>
  );
}