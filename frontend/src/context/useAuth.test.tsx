import { renderHook, act } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from '../api/api';

// Mock api
vi.mock('../api/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should provide default auth state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('should login and store token', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    const userData = { id: 1, username: 'testuser', email: 'test@test.com', token: 'token123', role: 'STUDENT' };

    act(() => {
      result.current.login(userData);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(userData);
    expect(localStorage.getItem('token')).toBe('token123');
  });

  it('should logout and clear storage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    // Pre-fill localStorage
    localStorage.setItem('token', 'token123');
    localStorage.setItem('user', JSON.stringify({ username: 'test' }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBe(null);
  });
});
