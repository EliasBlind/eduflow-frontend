import { useState } from "react";
import { auth } from "@/api/client";

interface RegisterParams {
  login:    string;
  password: string;
  email:    string;
  appId?:   number;
}

interface UseRegisterReturn {
  register: (params: RegisterParams) => Promise<void>;
  loading:  boolean;
  error:    string | null;
}

/**
 * Хук регистрации нового пользователя.
 * После успешной регистрации пользователю нужно верифицировать email (useVerifyEmail).
 */
export function useRegister(): UseRegisterReturn {
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState<string | null>(null);

  const register = async ({ login, password, email, appId = 1 }: RegisterParams) => {
    setLoading(true);
    setError(null);

    try {
      await auth.register({ login, password, email, appId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
}
