import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, API_BASE_URL } from '@/lib/api';

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

// Helper: fetch with automatic retry for Render cold-start
async function fetchWithRetry(url: string, opts: RequestInit, retries = 2): Promise<Response> {
  try {
    return await fetch(url, opts);
  } catch {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1500));
      return fetchWithRetry(url, opts, retries - 1);
    }
    throw new Error('Network error');
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wake up the Render backend immediately (fire-and-forget)
    api.ping();

    // Verify existing session against the server
    const token = localStorage.getItem('admin_token');
    const storedAdmin = localStorage.getItem('foodzippy_admin');

    if (token && storedAdmin) {
      // Validate the token by hitting a lightweight protected endpoint (with retry)
      fetchWithRetry(`${API_BASE_URL}/api/admin/vendors?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) {
            setAdmin(JSON.parse(storedAdmin));
          } else {
            // Token invalid/expired — clear it so user is sent to login
            localStorage.removeItem('admin_token');
            localStorage.removeItem('foodzippy_admin');
          }
        })
        .catch(() => {
          // Network error — keep the session so the user isn't logged out
          // when the server is temporarily unavailable
          setAdmin(JSON.parse(storedAdmin));
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
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
