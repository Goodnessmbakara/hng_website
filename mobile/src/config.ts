import * as SecureStore from 'expo-secure-store';

// Default live production endpoint of the Next.js server
export const DEFAULT_API_URL = 'https://hngwebsite.vercel.app';

const API_STORAGE_KEY = 'techhaven_api_url_v2';

let currentApiUrl = DEFAULT_API_URL;

export async function initApiConfig(): Promise<string> {
  try {
    const saved = await SecureStore.getItemAsync(API_STORAGE_KEY);
    if (saved) {
      currentApiUrl = saved;
    }
  } catch {
    // fallback
  }
  return currentApiUrl;
}

export function getApiUrl(): string {
  return currentApiUrl;
}

export async function setApiUrl(url: string): Promise<void> {
  let cleaned = url.trim().replace(/\/+$/, '');
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `http://${cleaned}`;
  }
  currentApiUrl = cleaned;
  try {
    await SecureStore.setItemAsync(API_STORAGE_KEY, cleaned);
  } catch (e) {
    console.error('Failed to save API URL to storage:', e);
  }
}
