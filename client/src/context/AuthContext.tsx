import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  provider: 'local' | 'discord';
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: (onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  loginWithEmail: (email: string, password: string, turnstileToken?: string) => Promise<{ success: boolean; message: string }>;
  registerWithEmail: (email: string, username: string, password: string, turnstileToken?: string) => Promise<{ success: boolean; message: string }>;
  loginWithDiscord: (profile?: Partial<UserProfile>) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  requireAuth: (callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [postAuthAction, setPostAuthAction] = useState<(() => void) | null>(null);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const openAuthModal = (onSuccess?: () => void) => {
    if (onSuccess) setPostAuthAction(() => onSuccess);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPostAuthAction(null);
  };

  const handleAuthSuccess = (userData: UserProfile) => {
    setUser(userData);
    setIsAuthModalOpen(false);
    if (postAuthAction) {
      postAuthAction();
      setPostAuthAction(null);
    }
  };

  const loginWithEmail = async (email: string, password: string, turnstileToken?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, turnstileToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        handleAuthSuccess(data.user);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Login failed.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error.' };
    }
  };

  const registerWithEmail = async (email: string, username: string, password: string, turnstileToken?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, username, password, turnstileToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        handleAuthSuccess(data.user);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Registration failed.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error.' };
    }
  };

  const loginWithDiscord = async (profile?: Partial<UserProfile>) => {
    try {
      const res = await fetch('/api/auth/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profile || {}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        handleAuthSuccess(data.user);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Discord sign-in failed.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const requireAuth = (callback: () => void) => {
    if (user) {
      callback();
    } else {
      openAuthModal(callback);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        loginWithEmail,
        registerWithEmail,
        loginWithDiscord,
        logout,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
