import { useAuthStore, selectIsAdmin, selectIsTeacher, selectIsStudent } from "@/storage/auth.store";

/**
 * Основной хук аутентификации.
 * Возвращает состояние и флаги ролей.
 */
export function useAuth() {
  const accessToken     = useAuthStore((s) => s.accessToken);
  const refreshToken    = useAuthStore((s) => s.refreshToken);
  const user            = useAuthStore((s) => s.user);
  const role            = useAuthStore((s) => s.role);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isAdmin   = useAuthStore(selectIsAdmin);
  const isTeacher = useAuthStore(selectIsTeacher);
  const isStudent = useAuthStore(selectIsStudent);

  return {
    accessToken,
    refreshToken,
    user,
    role,
    isAuthenticated,
    isAdmin,
    isTeacher,
    isStudent,
  };
}
