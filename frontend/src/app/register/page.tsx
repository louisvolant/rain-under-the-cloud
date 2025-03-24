// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { register } from '@/lib/login_api';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(username, email, password);
      router.push('/account');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed');
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Register</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
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
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full bg-primary text-white hover:bg-primary-focus dark:bg-primary dark:hover:bg-primary-focus px-4 py-2 rounded-md transition-all duration-300"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}