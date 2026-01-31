import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Agent } from '../types';

interface AuthContextType {
  user: Agent | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: Agent) => void;
  logout: () => void;
  updateUser: (updates: Partial<Agent>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('clawdate_token');
    const storedUser = localStorage.getItem('clawdate_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('clawdate_token');
        localStorage.removeItem('clawdate_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: Agent) => {
    localStorage.setItem('clawdate_token', newToken);
    localStorage.setItem('clawdate_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('clawdate_token');
    localStorage.removeItem('clawdate_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<Agent>) => {
    if (user) {
      const updated = { ...user, ...updates };
      localStorage.setItem('clawdate_user', JSON.stringify(updated));
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateUser,
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
