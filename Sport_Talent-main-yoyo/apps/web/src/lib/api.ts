/**
 * API client and data fetching utilities for ATHENA Web.
 * Connects to FastAPI backend at http://127.0.0.1:8000/api/v1 with seamless graceful fallbacks.
 */
const isBrowser = typeof window !== 'undefined';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || (isBrowser ? "/api/v1" : "http://127.0.0.1:8000/api/v1");

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const hosts = [
    API_BASE,
    isBrowser ? "/api/v1" : "",
    "http://127.0.0.1:8000/api/v1",
    "http://localhost:8000/api/v1",
  ].filter(Boolean);
  const uniqueHosts = Array.from(new Set(hosts));

  let lastErr = null;
  for (const base of uniqueHosts) {
    const url = `${base}${cleanEndpoint}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  console.warn(`Fetch to ${cleanEndpoint} failed across all hosts, utilizing local fallback if available.`, lastErr);
  throw lastErr;
}
