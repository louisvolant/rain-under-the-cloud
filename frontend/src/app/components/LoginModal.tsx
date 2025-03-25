// src/components/LoginModal.tsx
'use client';

import { useState } from 'react';
import { login } from '@/lib/login_api';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export default function LoginModal({ isOpen, setIsOpen }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      setIsOpen(false);
      router.push('/account');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid credentials');
      }
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 m-0 p-0">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 w-full max-w-md">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Login</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2">
              Username or Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="submit"
              className="bg-secondary text-white hover:bg-secondary-focus dark:bg-secondary dark:hover:bg-secondary-focus px-4 py-2 rounded-md transition-all duration-300"
            >
              Login
            </button>
            <button
              type="button"
              className="bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-md transition-all duration-300"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
