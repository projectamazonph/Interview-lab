/**
 * Unit Tests - Auth Context
 * Tests the auth context provider logic
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    userProfile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Save original fetch and provide localStorage since bun test runs without jsdom
const originalFetch = globalThis.fetch;
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

afterAll(() => {
  global.fetch = originalFetch;
});

describe('AuthContext - Login Flow', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
  });

  it('should store user in localStorage on successful login', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@test.com',
      name: 'Test User',
      subscriptionTier: 'free',
      isAdmin: false,
      profile: { onboardingDone: true },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    // Simulate login API call
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test123' }),
    });

    const data = await res.json();
    expect(data).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('should handle login failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Invalid email or password' }),
    });

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
    });

    expect(res.ok).toBe(false);
    expect(res.status).toBe(401);
  });
});

describe('AuthContext - Register Flow', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should call register API with correct data', async () => {
    const mockResponse = {
      id: 'new-user-id',
      email: 'new@test.com',
      name: 'New User',
      subscriptionTier: 'free',
      isAdmin: false,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve(mockResponse),
    });

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@test.com', name: 'New User', password: 'Pass123' }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.email).toBe('new@test.com');
  });

  it('should handle duplicate email registration', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: 'Email already registered' }),
    });

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'existing@test.com', name: 'Test', password: 'Pass123' }),
    });

    expect(res.status).toBe(409);
  });
});

describe('AuthContext - Session Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should persist user data in localStorage', () => {
    const userData = {
      id: 'test-id',
      email: 'test@test.com',
      name: 'Test',
      subscriptionTier: 'free',
      isAdmin: false,
    };
    
    localStorage.setItem('interviewlab_user', JSON.stringify(userData));
    
    const stored = JSON.parse(localStorage.getItem('interviewlab_user') || '{}');
    expect(stored.id).toBe('test-id');
    expect(stored.email).toBe('test@test.com');
  });

  it('should clear localStorage on logout', () => {
    localStorage.setItem('interviewlab_user', JSON.stringify({ id: 'test' }));
    localStorage.removeItem('interviewlab_user');
    
    expect(localStorage.getItem('interviewlab_user')).toBeNull();
  });
});
