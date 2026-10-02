import { getApiUrl } from '../config';
import * as SecureStore from 'expo-secure-store';

const TOKEN_STORAGE_KEY = 'techhaven_auth_token_v1';
const USER_STORAGE_KEY = 'techhaven_auth_user_v1';

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function saveAuthSession(token: string, user: any): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save auth session:', e);
  }
}

export async function clearAuthSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear auth session:', e);
  }
}

export async function getStoredUser(): Promise<any | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const baseUrl = getApiUrl();
    const token = await getStoredToken();
    const user = await getStoredUser();
    const userId = token || user?.id || user?.email;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (userId) {
      headers['x-user-id'] = userId;
      headers['Authorization'] = `Bearer ${userId}`;
    }

    const fullUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    // Create timeout controller and link caller's signal if provided
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    const res = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);


    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: json?.error || `HTTP error ${res.status}: ${res.statusText}`,
      };
    }

    return {
      success: true,
      data: json,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'Network request timed out. Please check your connection or server IP.',
      };
    }
    return {
      success: false,
      error: err.message || 'Network request failed',
    };
  }
}
