'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Manager' | 'Kasir';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // 1. Inisialisasi: Pulihkan state sesi dari localStorage saat pertama kali dimuat
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('prek_auth_token');
      const savedUser = localStorage.getItem('prek_auth_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Gagal membaca sesi auth dari storage:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Fungsi Login: Menyimpan data user & token ke State + LocalStorage
  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    try {
      localStorage.setItem('prek_auth_token', authToken);
      localStorage.setItem('prek_auth_user', JSON.stringify(userData));
    } catch (e) {
      console.error('Gagal menyimpan sesi auth:', e);
    }
  };

  // 3. Fungsi Logout: Membersihkan State + LocalStorage dan kembali ke /login
  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('prek_auth_token');
      localStorage.removeItem('prek_auth_user');
    } catch (e) {
      console.error('Gagal menghapus sesi auth:', e);
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook kustom agar komponen lain mudah mengakses AuthState
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
