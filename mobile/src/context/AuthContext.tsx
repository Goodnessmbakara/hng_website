import React, { createContext, useContext, useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { UserProfile } from '../types';
import { apiRequest, saveAuthSession, clearAuthSession, getStoredToken, getStoredUser } from '../api/client';
import { initApiConfig, getApiUrl } from '../config';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithAccount: (email: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isGoogleReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Google Web Client ID from existing shop configuration
const GOOGLE_CLIENT_ID = '212651201837-ac7ieibjs9inahedir14cg5db95hvv6b.apps.googleusercontent.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Google Auth Request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
  });

  // 1. Restore saved session on launch
  useEffect(() => {
    async function loadSession() {
      try {
        await initApiConfig();
        const savedToken = await getStoredToken();
        const savedUser = await getStoredUser();
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
        }
      } catch (e) {
        console.error('Failed to load session:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  // 2. Handle Google Auth Response
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token || (response as any)?.authentication?.idToken;
      if (idToken) {
        handleGoogleToken(idToken);
      }
    }
  }, [response]);


  const handleGoogleToken = async (idToken: string) => {
    setIsLoading(true);
    try {
      const result = await apiRequest('/api/auth/mobile', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'google',
          idToken,
        }),
      });

      if (result.success && result.data?.user) {
        const loggedUser: UserProfile = result.data.user;
        const sessionToken: string = result.data.token || loggedUser.id;
        await saveAuthSession(sessionToken, loggedUser);
        setUser(loggedUser);
        setToken(sessionToken);
      }
    } catch (err) {
      console.error('Failed to handle Google token:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (request) {
        const res = await promptAsync();
        if (res.type === 'success') {
          return { success: true };
        }
        if (res.type === 'cancel' || res.type === 'dismiss') {
          return { success: false, error: 'Sign-in was cancelled' };
        }
      }

      // WebBrowser fallback if native prompt is unavailable in current simulator/container
      const redirectUrl = `${getApiUrl()}/api/auth/signin/google`;
      const authResult = await WebBrowser.openAuthSessionAsync(redirectUrl);
      if (authResult.type === 'success') {
        return { success: true };
      }
      return { success: false, error: 'Google sign-in incomplete' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google login failed' };
    }
  };

  const loginWithAccount = async (
    email: string,
    name?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await apiRequest('/api/auth/mobile', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'account',
          email: email.trim().toLowerCase(),
          name: name?.trim(),
        }),
      });

      if (result.success && result.data?.user) {
        const loggedUser: UserProfile = result.data.user;
        const sessionToken: string = result.data.token || loggedUser.id;
        await saveAuthSession(sessionToken, loggedUser);
        setUser(loggedUser);
        setToken(sessionToken);
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Failed to sign in with account',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login request error' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await clearAuthSession();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginWithGoogle,
        loginWithAccount,
        logout,
        isGoogleReady: Boolean(request),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
