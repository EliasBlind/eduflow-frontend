import { useState } from "react";
import { auth } from "@/api/client";
import type { TRole } from "@/domain/person";

interface UseSetRoleReturn {
  setRole: (userId: string, role: TRole) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useSetRole(): UseSetRoleReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setRole = async (userId: string, role: TRole) => {
    setLoading(true);
    setError(null);
    try {
      await auth.setRole({ userId, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось изменить роль");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { setRole, loading, error };
}
