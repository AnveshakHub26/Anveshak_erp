// API Client Wrapper for AnveshakHub Backend REST API

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const correlationId = typeof window !== 'undefined' ? (window as any).__correlationId || Date.now().toString() : 'SSR';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-correlation-id': correlationId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || 'An error occurred during API execution';
    const err = new Error(errorMsg) as any;
    err.status = response.status;
    err.code = data.code || 'API_ERROR';
    err.errors = data.errors;
    throw err;
  }

  return data;
}
