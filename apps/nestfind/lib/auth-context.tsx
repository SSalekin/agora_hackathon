'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthUser, AuthState, LoginRequest, RegisterRequest, Role } from './auth-types';

type AuthContextType = AuthState & {
  login: (data: LoginRequest) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (data: LoginRequest) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        return { success: false, error: result.error || 'Login failed' };
      }

      const authUser: AuthUser = result.user;
      setUser(authUser);

      const redirects: Record<Role, string> = {
        tenant: '/',
        landlord: '/landlord/dashboard',
        moderator: '/moderator/dashboard',
      };

      return { success: true, redirectTo: redirects[authUser.role] };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        return { success: false, error: result.error || 'Registration failed' };
      }

      const authUser: AuthUser = result.user;
      setUser(authUser);

      const redirects: Record<Role, string> = {
        tenant: '/',
        landlord: '/landlord/dashboard',
        moderator: '/moderator/dashboard',
      };

      return { success: true, redirectTo: redirects[authUser.role] };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/me', { method: 'DELETE' });
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
