// API Client Wrapper for AnveshakHub Backend REST API with In-Flight Deduplication & Abort Safety

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const inFlightGetRequests = new Map<string, Promise<any>>();

async function executeApiRequest<T = any>(
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

  let cleanEndpoint = endpoint;
  if (cleanEndpoint.startsWith('/api/v1')) {
    cleanEndpoint = cleanEndpoint.substring('/api/v1'.length);
  } else if (cleanEndpoint.startsWith('api/v1')) {
    cleanEndpoint = cleanEndpoint.substring('api/v1'.length);
  }

  if (!cleanEndpoint.startsWith('/')) {
    cleanEndpoint = `/${cleanEndpoint}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${cleanEndpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    if (netErr.name === 'AbortError') {
      const err = new Error('Request aborted.') as any;
      err.status = 0;
      err.code = 'ABORTED';
      throw err;
    }
    const err = new Error('Network connection failed. Please check network or API server availability.') as any;
    err.status = 0;
    err.code = 'NETWORK_ERROR';
    throw err;
  }

  let data: any = null;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = { message: 'Invalid JSON response received from API server.' };
    }
  } else {
    const textBody = await response.text();
    data = { message: textBody || `HTTP ${response.status} ${response.statusText}` };
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch {
        // Fallback
      }
    }

    let errorMsg = data?.message;
    if (response.status === 429) {
      errorMsg = 'Too many requests. Please wait a moment and try again.';
    } else if (!errorMsg) {
      errorMsg = `HTTP ${response.status} Error`;
    }

    const err = new Error(errorMsg) as any;
    err.status = response.status;
    err.code = response.status === 429 ? 'TOO_MANY_REQUESTS' : (data?.code || 'API_ERROR');
    err.errors = data?.errors;
    throw err;
  }

  return data as T;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();

  // Deduplicate identical concurrent in-flight GET requests
  if (method === 'GET' && !options.signal) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const dedupeKey = `${endpoint}:${token}`;

    if (inFlightGetRequests.has(dedupeKey)) {
      return inFlightGetRequests.get(dedupeKey) as Promise<T>;
    }

    const promise = executeApiRequest<T>(endpoint, options).finally(() => {
      inFlightGetRequests.delete(dedupeKey);
    });

    inFlightGetRequests.set(dedupeKey, promise);
    return promise;
  }

  return executeApiRequest<T>(endpoint, options);
}
