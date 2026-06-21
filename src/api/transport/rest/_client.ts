import { useAuthStore } from "@/storage/auth.store";
import i18n from "@/i18n"; // импортируем i18n инстанс

/**
 * Базовый REST-клиент.
 * Автоматически подставляет Bearer-токен из localStorage,
 * заголовок Accept-Language с текущим языком интерфейса
 * и выбрасывает RestError при не-2xx ответе.
 */

const BASE_URL = import.meta.env.VITE_REST_BASE_URL ?? "http://localhost:8080";

const NO_AUTH_PATHS = ["/v1/auth/refresh"];

function isNoAuthPath(path: string): boolean {
  return NO_AUTH_PATHS.some((p) => path.startsWith(p));
}

export class RestError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: unknown;

  constructor(status: number, statusText: string, body: unknown) {
    super(`HTTP ${status}: ${statusText}`);
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { body = null; }
    throw new RestError(res.status, res.statusText, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function getHeaders(path: string, extra?: Record<string, string>): Record<string, string> {
  const token = isNoAuthPath(path) ? undefined : useAuthStore.getState().accessToken;

  // Текущий язык интерфейса
  const lang = i18n.language || i18n.resolvedLanguage || "en";

  return {
    "Content-Type": "application/json",
    "Accept-Language": lang,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export const http = {
  get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(BASE_URL + path);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }
    return fetch(url.toString(), { headers: getHeaders(path) }).then(handleResponse<T>);
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return fetch(BASE_URL + path, {
      method: "POST",
      headers: getHeaders(path),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse<T>);
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return fetch(BASE_URL + path, {
      method: "PUT",
      headers: getHeaders(path),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse<T>);
  },

  delete<T>(path: string): Promise<T> {
    return fetch(BASE_URL + path, {
      method: "DELETE",
      headers: getHeaders(path),
    }).then(handleResponse<T>);
  },
};
