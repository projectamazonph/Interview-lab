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
  // Always initialize with null/true so server and client first render match exactly.
  // localStorage is read inside useEffect (client-only) to avoid hydration mismatch.
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Read localStorage on mount (client-only) then mark loading done
  useEffect(() => {
    try {
      const stored = localStorage.getItem('interviewlab_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
    setLoading(false);
  }, []);

  // Fetch profile whenever user changes (after initial mount)
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
        localStorage.setItem('interviewlab_user', JSON.stringify(data));
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
          // Honeypot fields for bot protection (must be empty)
          honeypot: '',
          _formStart: Date.now() - 10000, // Fake old timestamp (real form fills in current time)
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Don't store bot trap responses
        if (data.id === 'bot-trap') return false;
        setUser(data);
        localStorage.setItem('interviewlab_user', JSON.stringify(data));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    // Call logout API to clear HttpOnly JWT cookie
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setProfile(null);
    localStorage.removeItem('interviewlab_user');
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
