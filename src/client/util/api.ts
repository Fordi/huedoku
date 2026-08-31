// helper functions for API access
export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}

/** Same-origin JSON fetch. Paths are relative to the current document, which is always served from the app's own base path. */
export async function api<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => undefined);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

export function apiGet<T = unknown>(
  path: string,
  query?: Record<string, unknown>,
): Promise<T> {
  const url = new URL(path, location.href);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) url.searchParams.append(key, String(v));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return api<T>(url.pathname + url.search, { method: "GET" });
}

export function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPut<T = unknown>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, {
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiDelete(path: string): Promise<void> {
  return api<void>(path, { method: "DELETE" });
}
