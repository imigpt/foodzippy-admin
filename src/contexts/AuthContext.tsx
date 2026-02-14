import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface AdminUser {
  email: string;
}

interface AuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('admin_token');
    const storedAdmin = localStorage.getItem('foodzippy_admin');
    
    if (token && storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.login(email, password);
      
      if (response.success && response.token) {
        const adminUser = { email: response.admin.email };
        setAdmin(adminUser);
        localStorage.setItem('admin_token', response.token);
        localStorage.setItem('foodzippy_admin', JSON.stringify(adminUser));
        return { success: true };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Invalid email or password' 
      };
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('foodzippy_admin');
  };

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: !!admin, login, logout, isLoading }}>
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
