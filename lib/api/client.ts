import { env } from '@/env.mjs';

const API_BASE_URL = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}/api/${input}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || 'An error occurred while fetching the data.'
    );
  }

  return response.json();
}

export const apiClient = {
  get: <T>(url: string, options?: RequestInit): Promise<T> =>
    fetchWithAuth(url, { ...options, method: 'GET' }),
  
  post: <T>(url: string, data?: any, options?: RequestInit): Promise<T> =>
    fetchWithAuth(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  patch: <T>(url: string, data: any, options?: RequestInit): Promise<T> =>
    fetchWithAuth(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: <T>(url: string, options?: RequestInit): Promise<T> =>
    fetchWithAuth(url, { ...options, method: 'DELETE' }),
};

export default apiClient;
