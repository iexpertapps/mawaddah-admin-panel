import React from 'react';
import { renderHook } from '@testing-library/react';
import useAuth from './useAuth';
import AuthProvider from './AuthProvider';

// Helper to silence expected error output in test
function suppressConsoleError(fn) {
  const originalError = console.error;
  console.error = () => {};
  try {
    fn();
  } finally {
    console.error = originalError;
  }
}

describe('useAuth', () => {
  it('throws if used outside AuthProvider', () => {
    suppressConsoleError(() => {
      const { result } = renderHook(() => useAuth());
      expect(result.error).toBeDefined();
      expect(result.error.message).toMatch(/useAuth must be used within an AuthProvider/);
    });
  });

  it('does not throw if used inside AuthProvider', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.error).toBeUndefined();
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('logout');
  });
}); 