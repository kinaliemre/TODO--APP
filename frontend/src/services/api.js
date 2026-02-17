import { API_BASE } from "../constants/i18n";

export async function apiRequest({ path, token, options = {}, requiresAuth = true, onUnauthorized }) {
  const headers = { ...(options.headers || {}) };
  if (requiresAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const detail = data?.detail || `HTTP ${response.status}`;
    if (response.status === 401 && requiresAuth && onUnauthorized) {
      onUnauthorized();
    }
    throw new Error(detail);
  }

  return data;
}

