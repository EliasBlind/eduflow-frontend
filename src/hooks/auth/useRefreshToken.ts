import { useCallback, useState } from "react";
import { auth } from "@/api/client";
import { useAuthStore } from "@/storage/auth.store";
import { APP_ID } from "@/api/appId";

interface UseRefreshTokenReturn {
  refresh: () => Promise<void>;
  loading: boolean;
  error:   string | null;
}

/**
 * Хук обновления пары токенов.
 * Как правило вызывается интерцептором, а не напрямую из компонентов.
 */
export function useRefreshToken(): UseRefreshTokenReturn {
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState<string | null>(null);

  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setTokens    = useAuthStore((s) => s.setTokens);
  const clear        = useAuthStore((s) => s.clear);

  const refresh = useCallback(async () => {
    if (!refreshToken) {
      clear();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tokens = await auth.refreshToken({ refreshToken, appId: APP_ID });
      setTokens(tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка обновления токена");
      clear();
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshToken, setTokens, clear]);

  return { refresh, loading, error };
}
