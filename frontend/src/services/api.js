import { API_BASE } from "../constants/i18n";

const REQUEST_TIMEOUT_MS = 12000;

export async function apiRequest({ path, token, options = {}, requiresAuth = true, onUnauthorized }) {
  const headers = { ...(options.headers || {}) };
  if (requiresAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Sunucu yanit vermiyor, lutfen tekrar dene.");
    }
    throw new Error("Sunucuya baglanilamadi. Backend calisiyor mu kontrol et.");
  } finally {
    clearTimeout(timeoutId);
  }

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
