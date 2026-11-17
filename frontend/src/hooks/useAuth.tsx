import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, User } from '../lib/api';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
export const getSocket = () => socket;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: (redirectPath?: string) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !socket) {
      socket = io(window.location.origin);
      socket.emit('auth', user.id);
    } else if (!user && socket) {
      socket.disconnect();
      socket = null;
    }
  }, [user]);

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (userData: User) => setUser(userData);
  const logout = (redirectPath: string = '/login') => {
    api.logout().finally(() => {
      setUser(null);
      window.location.href = redirectPath;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
