// src/app/LoginModal.tsx
'use client';

import { useState } from 'react';
import { login } from '@/lib/login_api';
import { useRouter } from 'next/navigation';

export default function LoginModal() {
  const [isOpen, setIsOpen] = useState(false);
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
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <>
      <button
        className="btn btn-outline btn-secondary hover:bg-secondary hover:text-white transition-all duration-300"
        onClick={() => setIsOpen(true)}
      >
        Login
      </button>

      {isOpen && (
        <div className="modal modal-open backdrop-blur-sm">
          <div className="modal-box bg-white dark:bg-gray-800 shadow-xl">
            <h3 className="font-bold text-2xl text-gray-900 dark:text-white mb-4">Login</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-700 dark:text-gray-200">Username or Email</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input input-bordered w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-secondary"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-700 dark:text-gray-200">Password</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-bordered w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-secondary"
                  required
                />
              </div>
              {error && <p className="text-error text-sm">{error}</p>}
              <div className="modal-action flex justify-end gap-2">
                <button
                  type="submit"
                  className="btn btn-secondary hover:bg-secondary-focus text-white"
                >
                  Login
                </button>
                <button
                  type="button"
                  className="btn btn-ghost text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}