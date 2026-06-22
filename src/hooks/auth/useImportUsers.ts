import { useState } from "react";
import { auth } from "@/api/client";
import type { User } from "@/api/gen/sso/sso";

export function useImportUsers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importUsers = async (users: User[]) => {
    setLoading(true);
    setError(null);
    try {
      await auth.createUsers(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать пользователей");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { importUsers, loading, error };
}
