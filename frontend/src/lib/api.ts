/**
 * API client and data fetching utilities for ATHENA Web.
 * Connects to FastAPI backend at Railway with seamless graceful fallbacks.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://sporttalent-production.up.railway.app/api/v1";
export const CV_API_BASE = process.env.NEXT_PUBLIC_CV_API_URL || "https://sporttalent-production.up.railway.app";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
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
    console.warn(`Fetch to ${endpoint} failed, utilizing local fallback if available.`, err);
    throw err;
  }
}
