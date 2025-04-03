// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkAuth, logout } from '@/lib/login_api';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  handleLogout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authStatus = await checkAuth();
        setIsAuthenticated(authStatus.isAuthenticated);
        if (authStatus.isAuthenticated) {
          router.push('/account'); // Redirect to /account if authenticated
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false); // Reset state on error
      }
    };
    verifyAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}