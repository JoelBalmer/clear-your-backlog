import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

export class ApiError extends Error {
  constructor(public status: number, public body: unknown, message?: string) {
    super(message ?? `API ${status}`);
  }
}

export function useApi() {
  const { getToken } = useAuth();

  return useCallback(
    async <T = unknown>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = await getToken();
      const headers = new Headers(init.headers);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (init.body && !headers.has('Content-Type'))
        headers.set('Content-Type', 'application/json');

      const res = await fetch(path, { ...init, headers });
      const text = await res.text();
      const body = text ? safeJson(text) : null;

      if (!res.ok) throw new ApiError(res.status, body);
      return body as T;
    },
    [getToken],
  );
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
