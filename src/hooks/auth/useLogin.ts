import { useState } from "react";
import { auth } from "@/api/client";
import { useAuthStore } from "@/storage/auth.store";

interface LoginParams {
  login:    string;
  password: string;
  appId?:   number;
}

interface UseLoginReturn {
  login:    (params: LoginParams) => Promise<void>;
  loading:  boolean;
  error:    string | null;
}

/**
 * Хук для логина.
 * Сохраняет токены в стор после успешного ответа.
 */
export function useLogin(): UseLoginReturn {
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState<string | null>(null);

  const setTokens = useAuthStore((s) => s.setTokens);

  const login = async ({ login, password, appId = 1 }: LoginParams) => {
    setLoading(true);
    setError(null);

    try {
      const tokens = await auth.login({ login, password, appId });
      setTokens(tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
