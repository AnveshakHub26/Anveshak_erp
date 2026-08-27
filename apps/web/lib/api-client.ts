// API Client Wrapper for AnveshakHub Backend REST API with In-Flight Deduplication & Abort Safety
// C-01 Security: This client uses credentials:'include' so the browser automatically sends
// the HttpOnly access_token cookie on every request. No JWT is ever stored in or read from
// localStorage, sessionStorage, or any other JavaScript-readable storage.

const inFlightGetRequests = new Map<string, Promise<any>>();

async function executeApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const correlationId =
    typeof window !== 'undefined'
      ? (window as any).__correlationId || Date.now().toString()
      : 'SSR';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-correlation-id': correlationId,
    ...(options.headers || {}),
  };

  let url = endpoint;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const defaultProdUrl = 'https://anveshak-erp.onrender.com/api/v1';
    let rawEnv = process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
      if (!rawEnv || rawEnv.startsWith('/') || rawEnv.includes('localhost')) {
        rawEnv = defaultProdUrl;
      }
    }
    let base = (rawEnv || '/api/v1').replace(/\/+$/, '');
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
      if (base.startsWith('http://')) {
        base = base.replace('http://', 'https://');
      }
    }
    if (base.startsWith('http') && !base.includes('/api/v1')) {
      base = `${base}/api/v1`;
    }
    let path = endpoint;
    if (path.startsWith('/api/v1')) {
      path = path.substring('/api/v1'.length);
    } else if (path.startsWith('api/v1')) {
      path = path.substring('api/v1'.length);
    }
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    url = `${base}${path}`;
  }

  if (typeof window !== 'undefined') {
    console.log('[Anveshak API Client] Requesting:', url);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      // credentials: 'include' instructs the browser to attach the HttpOnly access_token
      // cookie automatically. This is the ONLY authentication mechanism — no token is ever
      // read from localStorage or injected as an Authorization header.
      credentials: 'include',
      headers,
    });
  } catch (netErr: any) {
    if (typeof window !== 'undefined') {
      console.error('[Anveshak API Client Error]:', netErr);
    }
    if (netErr.name === 'AbortError') {
      const err = new Error('Request aborted.') as any;
      err.status = 0;
      err.code = 'ABORTED';
      throw err;
    }
    const err = new Error(
      `Network connection failed (${netErr.message || 'Failed to fetch'}). Please check network or API server availability.`,
    ) as any;
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
      // HttpOnly cookie is absent or expired — clear in-memory auth state via a soft dispatch.
      // No localStorage cleanup is needed because no token is stored there.
      const { useAuthStore } = await import('@/hooks/useAuth');
      useAuthStore.getState().clearSession();
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

  // Deduplicate identical concurrent in-flight GET requests (keyed by endpoint only,
  // since authentication is now via cookie — no per-request token to vary the key).
  if (method === 'GET' && !options.signal) {
    const dedupeKey = endpoint;

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

// Axios-compatible helper object for quick API requests
export const api = {
  get: async (endpoint: string, config?: { params?: Record<string, any> }) => {
    let url = endpoint;
    if (config?.params) {
      const q = new URLSearchParams();
      Object.entries(config.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
      });
      const queryStr = q.toString();
      if (queryStr) url += (url.includes('?') ? '&' : '?') + queryStr;
    }
    const data = await apiRequest(url, { method: 'GET' });
    return { data };
  },
  post: async (endpoint: string, body?: any) => {
    const data = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body || {}),
    });
    return { data };
  },
  patch: async (endpoint: string, body?: any) => {
    const data = await apiRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body || {}),
    });
    return { data };
  },
  delete: async (endpoint: string) => {
    const data = await apiRequest(endpoint, { method: 'DELETE' });
    return { data };
  },
};
