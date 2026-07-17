'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserProfile } from './types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, name: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LS_KEY = 'interviewlab_user';

const fetchUserProfile = async (userId: string, setProfile: (p: UserProfile | null) => void) => {
  try {
    const res = await fetch('/api/profile');
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
    }
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate session against server on mount.
  // localStorage is a write-through cache only — not the source of truth.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.user && !cancelled) {
            setUser(data.user);
            localStorage.setItem(LS_KEY, JSON.stringify(data.user));
            await fetchUserProfile(data.user.id, setProfile);
          } else if (!cancelled) {
            // Server has no valid session — clear any stale localStorage
            setUser(null);
            localStorage.removeItem(LS_KEY);
          }
        }
      } catch {
        // Server unreachable — fall back to cached localStorage data as best effort
        if (!cancelled) {
          try {
            const stored = localStorage.getItem(LS_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              setUser(parsed);
            }
          } catch {
            // ignore corrupt storage
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  // Re-fetch profile whenever user changes
  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id, setProfile);
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem(LS_KEY, JSON.stringify(data));
        await fetchUserProfile(data.id, setProfile);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const register = async (email: string, name: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          password,
          honeypot: '',
          _formStart: Date.now() - 10000,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id === 'bot-trap') return false;
        setUser(data);
        localStorage.setItem(LS_KEY, JSON.stringify(data));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // best effort — cookie will expire naturally
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(LS_KEY);
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchUserProfile(user.id, setProfile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, updateProfile, refreshProfile }}>
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
