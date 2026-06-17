import { useCallback, useState } from "react";
import { useAuthStore } from "@/storage/auth.store";

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
  const storeRefresh = useAuthStore((s) => s.refresh);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ok = await storeRefresh();
      if (!ok) {
        const msg = "Ошибка обновления токена";
        setError(msg);
        throw new Error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [storeRefresh]);

  return { refresh, loading, error };
}
