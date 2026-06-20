import { createBrowserRouter, RouterProvider, Navigate, Outlet, useParams } from "react-router-dom";
import { useAuthStore } from "@/storage/auth.store";

// ── Страницы ──────────────────────────────────────────────────
import LoginPage         from "@/pages/auth/LoginPage";
import RegisterPage      from "@/pages/auth/RegisterPage";
import VerifyEmailPage   from "@/pages/auth/VerifyEmailPage";

import DashboardPage     from "@/pages/journal/DashboardPage";
import ClassJournalPage  from "@/pages/journal/ClassJournalPage";
import StudentPage       from "@/pages/journal/StudentPage";

import TeachingLoadPage  from "@/pages/admin/TeachingLoadPage";
import ClassesPage       from "@/pages/admin/ClassesPage";
import SubjectsPage      from "@/pages/admin/SubjectsPage";
import StatusCodesPage   from "@/pages/admin/StatusCodesPage";
import UsersPage         from "@/pages/admin/UsersPage";

import NotFoundPage      from "@/pages/NotFoundPage";
import { Role } from "@/domain/person";
import { AuthStatus } from '@/domain/authStatus';


// ── Заглушка лоадера — замени на свой ─────────────────────────
function AuthPending() {
  return <div className="auth-pending">Загрузка…</div>;
}


// ── Guards ────────────────────────────────────────────────────

/**
 * Пускает только аутентифицированных.
 * Пока идёт рехидрация/рефреш (status === AuthStatus.Pending) — показывает лоадер,
 * НЕ редиректит, иначе разлогинит во время обновления токена.
 */
function AuthGuard() {
  const status = useAuthStore((s) => s.status);

  if (status === AuthStatus.Pending) return <AuthPending />;
  if (status === AuthStatus.Unauthenticated) return <Navigate to="/auth/login" replace />;
  return <Outlet />;
}

/**
 * Перенаправляет уже авторизованных со страниц auth обратно в приложение.
 */
function GuestGuard() {
  const status = useAuthStore((s) => s.status);

  if (status === AuthStatus.Pending) return <AuthPending />;
  if (status === AuthStatus.Authenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/**
 * Пускает администраторов и учителей. Остальных — на /dashboard.
 */
function TeacherGuard() {
  const status = useAuthStore((s) => s.status);
  const role   = useAuthStore((s) => s.role);
  console.log("[TeacherGuard] role=%o status=%o (teacher? %o admin? %o)",
    role, status, role === Role.Teacher, role === Role.Admin);

  if (status === AuthStatus.Pending) return <AuthPending />;
  if (status === AuthStatus.Authenticated && role === Role.Unauthorized) {
    return <AuthPending />; // роль ещё не подтянулась
  }
  if (status === AuthStatus.Unauthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  return role === Role.Teacher || role === Role.Admin
    ? <Outlet />
    : <Navigate to="/dashboard" replace />;
}

/**
 * Доступ к профилю студента /students/:studentId.
 * Учитель и админ — на любого студента; ученик — только на свой профиль.
 *
 * ВАЖНО: гард читает useParams(), поэтому должен рендериться ВНУТРИ ветки
 * с параметром :studentId — иначе studentId будет undefined.
 */
function StudentAccessGuard() {
  const status = useAuthStore((s) => s.status);
  const role   = useAuthStore((s) => s.role);
  const myId   = useAuthStore((s) => s.id);
  const { studentId } = useParams<{ studentId: string }>();
  console.log("[StudentAccessGuard] role=%o status=%o studentId=%o myId=%o",
    role, status, studentId, myId);

  if (status === AuthStatus.Pending) return <AuthPending />;
  if (status === AuthStatus.Authenticated && role === Role.Unauthorized) {
    return <AuthPending />; // роль ещё не подтянулась
  }
  if (status === AuthStatus.Unauthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // учитель и админ — на любого студента
  if (role === Role.Teacher || role === Role.Admin) return <Outlet />;

  // ученик — только на свою страницу
  if (role === Role.Student && studentId === myId) return <Outlet />;

  return <Navigate to="/dashboard" replace />;
}

/**
 * Пускает только администраторов. Остальных — на /dashboard.
 */
function AdminGuard() {
  const status = useAuthStore((s) => s.status);
  const role   = useAuthStore((s) => s.role);

  if (status === AuthStatus.Pending) return <AuthPending />;
  if (status === AuthStatus.Authenticated && role === Role.Unauthorized) {
    return <AuthPending />;
  }
  return role === Role.Admin
    ? <Outlet />
    : <Navigate to="/dashboard" replace />;
}


// ── Router ────────────────────────────────────────────────────

const router = createBrowserRouter([
  {
    element: <GuestGuard />,
    children: [
      { path: "/auth/login",        element: <LoginPage       /> },
      { path: "/auth/register",     element: <RegisterPage    /> },
      { path: "/auth/verify", element: <VerifyEmailPage /> },
    ],
  },

  {
    element: <AuthGuard />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" replace /> },
      { path: "/dashboard", element: <DashboardPage /> },

      // Журнал класса — только учитель/админ
      {
        element: <TeacherGuard />,
        children: [
          { path: "/classes/journal", element: <ClassJournalPage /> },
        ],
      },

      // Профиль студента — учитель/админ на любого, ученик на свой
      {
        element: <StudentAccessGuard />,
        children: [
          { path: "/students/:studentId", element: <StudentPage /> },
        ],
      },

      {
        element: <AdminGuard />,
        children: [
          { path: "/admin/teaching-load", element: <TeachingLoadPage /> },
          { path: "/admin/classes",       element: <ClassesPage      /> },
          { path: "/admin/subjects",      element: <SubjectsPage     /> },
          { path: "/admin/status-codes",  element: <StatusCodesPage  /> },
          { path: "/admin/users",         element: <UsersPage        /> },
        ],
      },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);


export function AppRouter() {
  return <RouterProvider router={router} />;
}
