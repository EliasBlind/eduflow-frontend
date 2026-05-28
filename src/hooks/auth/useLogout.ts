import { useCallback } from "react";
import { useAuthStore } from "@/storage/auth.store";

/**
 * Хук для выхода из аккаунта.
 * Очищает весь стор аутентификации.
 */
export function useLogout() {
  const clear = useAuthStore((s) => s.clear);

  const logout = useCallback(() => {
    clear();
  }, [clear]);

  return { logout };
}
