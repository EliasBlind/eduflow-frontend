import { Role } from '@/domain/person';
import { useAuthStore } from "@/storage/auth.store";

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

  const isAdmin   = useAuthStore((s) => s.role === Role.Admin);
  const isTeacher = useAuthStore((s) => s.role === Role.Teacher);
  const isStudent = useAuthStore((s) => s.role === Role.Student);
  const isUnauthorized = useAuthStore((s) => s.role === Role.Unauthorized);

  return {
    accessToken,
    refreshToken,
    user,
    role,
    isAuthenticated,
    isAdmin,
    isTeacher,
    isStudent,
    isUnauthorized,
  };
}
