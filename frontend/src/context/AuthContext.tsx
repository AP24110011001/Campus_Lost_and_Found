import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { api, getStoredUserId, setStoredUserId, clearStoredUserId } from '../api/client';
import { useToast } from './ToastContext';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  loading: boolean;
  isDemoMode: boolean;
  switchUser: (userId: string) => Promise<void>;
  createPersona: (data: { name: string; email: string; role: string; department?: string }) => Promise<void>;
  clearPersona: () => void;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const { success, error, info } = useToast();

  const loadInitialAuth = useCallback(async () => {
    try {
      setLoading(true);
      // If no persona selected yet, initialize with Alex Rivera for demonstration ease
      let storedId = getStoredUserId();
      if (!storedId) {
        storedId = 'usr_alex';
        setStoredUserId(storedId);
      }

      const [usersRes, meRes] = await Promise.all([
        api.getUsers(),
        api.getCurrentUser(),
      ]);

      setAllUsers(usersRes.users);
      setIsDemoMode(usersRes.is_demo_mode);

      if (meRes.user) {
        setCurrentUser(meRes.user);
      } else if (usersRes.users.length > 0) {
        // Find stored user or fallback to first
        const match = usersRes.users.find((u) => u.id === storedId) || usersRes.users[0];
        setCurrentUser(match);
        setStoredUserId(match.id);
      }
    } catch (err: any) {
      console.error('Failed to load initial authentication state:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialAuth();
  }, [loadInitialAuth]);

  const switchUser = useCallback(async (userId: string) => {
    try {
      setStoredUserId(userId);
      const res = await api.switchUser({ userId });
      setCurrentUser(res.user);
      success(`Switched active demo persona to ${res.user.name} (${res.user.role})`);
    } catch (err: any) {
      error(err.message || 'Failed to switch demo persona');
    }
  }, [success, error]);

  const createPersona = useCallback(async (data: { name: string; email: string; role: string; department?: string }) => {
    try {
      const res = await api.switchUser(data);
      setCurrentUser(res.user);
      setStoredUserId(res.user.id);
      const usersRes = await api.getUsers();
      setAllUsers(usersRes.users);
      success(`Created and switched to demo persona: ${res.user.name}`);
    } catch (err: any) {
      error(err.message || 'Failed to create demo persona');
      throw err;
    }
  }, [success, error]);

  const clearPersona = useCallback(() => {
    clearStoredUserId();
    setCurrentUser(null);
    info('Switched to Anonymous Campus Guest mode (unauthenticated).');
  }, [info]);

  const refreshUsers = useCallback(async () => {
    try {
      const res = await api.getUsers();
      setAllUsers(res.users);
      setIsDemoMode(res.is_demo_mode);
    } catch (err) {
      console.error('Failed to refresh demo personas:', err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        loading,
        isDemoMode,
        switchUser,
        createPersona,
        clearPersona,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
