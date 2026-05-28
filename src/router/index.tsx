import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { useAuthStore, selectIsAdmin, selectIsTeacher } from "@/storage/auth.store";

// ── Страницы (заглушки — замените на реальные импорты) ────────
// Auth
import LoginPage         from "@/pages/auth/LoginPage";
import RegisterPage      from "@/pages/auth/RegisterPage";
import VerifyEmailPage   from "@/pages/auth/VerifyEmailPage";

// Journal
import DashboardPage     from "@/pages/journal/DashboardPage";
import ClassJournalPage  from "@/pages/journal/ClassJournalPage";
import StudentPage       from "@/pages/journal/StudentPage";

// Admin
import TeachersPage      from "@/pages/admin/TeachersPage";
import TeachingLoadPage  from "@/pages/admin/TeachingLoadPage";
import ClassesPage       from "@/pages/admin/ClassesPage";
import SubjectsPage      from "@/pages/admin/SubjectsPage";
import StatusCodesPage   from "@/pages/admin/StatusCodesPage";

// Misc
import  NotFoundPage      from "@/pages/NotFoundPage";


// ── Guards ────────────────────────────────────────────────────

/**
 * Пускает только аутентифицированных.
 * Неавторизованных — на /login.
 */
function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

/**
 * Пускает только администраторов.
 * Остальных — на /dashboard.
 */
function AdminGuard() {
  const isAdmin = useAuthStore(selectIsAdmin);
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

/**
 * Пускает администраторов и учителей.
 * Учеников — на /dashboard.
 */
function TeacherGuard() {
  const isTeacher = useAuthStore(selectIsTeacher);
  const isAdmin   = useAuthStore(selectIsAdmin);
  return isTeacher || isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

/**
 * Перенаправляет уже авторизованных со страниц auth обратно в приложение.
 */
function GuestGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}


// ── Router ────────────────────────────────────────────────────

const router = createBrowserRouter([
  // ── Публичные маршруты (только для гостей) ─────────────────
  {
    element: <GuestGuard />,
    children: [
      { path: "/auth/login",        element: <LoginPage       /> },
      { path: "/auth/register",     element: <RegisterPage    /> },
      { path: "/auth/verify_email", element: <VerifyEmailPage /> },
    ],
  },

  // ── Защищённые маршруты ────────────────────────────────────
  {
    element: <AuthGuard />,
    children: [

      // Главная — редирект на dashboard
      { path: "/", element: <Navigate to="/dashboard" replace /> },

      // Dashboard — для всех ролей (сам компонент рендерит нужный вид)
      { path: "/dashboard", element: <DashboardPage /> },

      // ── Журнал (учитель + admin) ───────────────────────────
      {
        element: <TeacherGuard />,
        children: [
          { path: "/classes/:classId/journal", element: <ClassJournalPage /> },
          { path: "/students/:studentId",      element: <StudentPage      /> },
        ],
      },

      // ── Администрирование (только admin) ───────────────────
      {
        element: <AdminGuard />,
        children: [
          { path: "/admin/teachers",      element: <TeachersPage     /> },
          { path: "/admin/teaching-load", element: <TeachingLoadPage /> },
          { path: "/admin/classes",       element: <ClassesPage      /> },
          { path: "/admin/subjects",      element: <SubjectsPage     /> },
          { path: "/admin/status-codes",  element: <StatusCodesPage  /> },
        ],
      },
    ],
  },

  // ── 404 ────────────────────────────────────────────────────
  { path: "*", element: <NotFoundPage /> },
]);


// ── Export ────────────────────────────────────────────────────

export function AppRouter() {
  return <RouterProvider router={router} />;
}
