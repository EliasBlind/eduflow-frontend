import { useState } from "react";
import { auth } from "@/api/client";
import { useAuthStore } from "@/storage/auth.store";

interface UseVerifyEmailReturn {
  verify:  (code: string, email: string) => Promise<void>;
  loading: boolean;
  error:   string | null;
}

export function useVerifyEmail(): UseVerifyEmailReturn {
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState<string | null>(null);

  const setTokens = useAuthStore((s) => s.setTokens);

  const verify = async (code: string, email: string) => {
    setLoading(true);
    setError(null);

    try {
      const tokens = await auth.verifyEmail({ code, email });
      setTokens(tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка верификации");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { verify, loading, error };
}
