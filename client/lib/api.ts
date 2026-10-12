import { useAuthStore } from './auth-store';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface Options {
  method?: string;
  body?: unknown;
  auth?: boolean; // attach the JWT (default true)
}

export async function api<T>(path: string, { method = 'GET', body, auth = true }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = useAuthStore.getState().token;
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network error, CORS block, or the free Render server still waking up.
    throw new ApiError('Cannot reach the server. If it was idle, wait a minute and try again.', 0);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Expired or invalid token on a protected call: clear the session and force login.
    if (res.status === 401 && auth) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.replace('/login');
    }
    throw new ApiError(data?.errors?.[0]?.message ?? data?.message ?? 'Request failed', res.status);
  }

  return data as T;
}