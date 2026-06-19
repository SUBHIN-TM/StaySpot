import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthApi } from '../api';
import { setToken, loadToken } from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (body: {
    email: string; password: string; name: string; role?: string;
    gender?: string; occupation?: string; mobile_number?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On boot, restore a stored token and fetch the current user.
  useEffect(() => {
    (async () => {
      try {
        const token = await loadToken();
        if (token) {
          const me = await AuthApi.me();
          setUserState(me);
        }
      } catch {
        await setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { token, user } = await AuthApi.login(email, password);
    await setToken(token);
    setUserState(user);
  }, []);

  const signUp = useCallback(async (body: any) => {
    const { token, user } = await AuthApi.register(body);
    await setToken(token);
    setUserState(user);
  }, []);

  const signOut = useCallback(async () => {
    await setToken(null);
    setUserState(null);
  }, []);

  const refresh = useCallback(async () => {
    const me = await AuthApi.me();
    setUserState(me);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, refresh, setUser: setUserState }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
