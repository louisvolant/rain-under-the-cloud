// src/components/HeaderButtons.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LoginModal from './LoginModal';

export default function HeaderButtons() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, handleLogout } = useAuth();

  return (
    <>
      {isAuthenticated ? (
        <button
          className="border border-red-500 text-red-500 bg-transparent hover:bg-red-500 hover:text-white px-4 py-2 rounded-md transition-all duration-300"
          onClick={handleLogout}
        >
          Logout
        </button>
      ) : (
        <div className="flex items-center space-x-4">
          <Link href="/register">
            <button className="border border-primary text-primary bg-transparent hover:bg-primary hover:text-white px-4 py-2 rounded-md transition-all duration-300">
              Register
            </button>
          </Link>
          <button
            className="border border-secondary text-secondary bg-transparent hover:bg-secondary hover:text-white px-4 py-2 rounded-md transition-all duration-300"
            onClick={() => setIsOpen(true)}
          >
            Login
          </button>
        </div>
      )}
      <LoginModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  );
}