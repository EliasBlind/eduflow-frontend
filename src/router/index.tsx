import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useParams } from "react-router-dom";
import { useAuthStore } from "@/storage/auth.store";

const LoginPage        = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage     = lazy(() => import("@/pages/auth/RegisterPage"));
const VerifyEmailPage  = lazy(() => import("@/pages/auth/VerifyEmailPage"));

const DashboardPage    = lazy(() => import("@/pages/journal/DashboardPage"));
const DashboardHome    = lazy(() =>
  import("@/pages/journal/DashboardPage").then((m) => ({ default: m.DashboardHome }))
);
const ClassJournalPage = lazy(() => import("@/pages/journal/ClassJournalPage"));
const StudentPage      = lazy(() => import("@/pages/journal/StudentPage"));

const TeachingLoadPage = lazy(() => import("@/pages/admin/TeachingLoadPage"));
const ClassesPage      = lazy(() => import("@/pages/admin/ClassesPage"));
const SubjectsPage     = lazy(() => import("@/pages/admin/SubjectsPage"));
const StatusCodesPage  = lazy(() => import("@/pages/admin/StatusCodesPage"));
const UsersPage        = lazy(() => import("@/pages/admin/UsersPage"));

const NotFoundPage     = lazy(() => import("@/pages/NotFoundPage"));

import { Role } from "@/domain/person";
import { AuthStatus } from "@/domain/authStatus";

// Заглушка
function AuthPending() {
  return <div className="auth-pending">Загрузка…</div>;
}

function AuthGuard() {
  const status = useAuthStore((s) => s.status);

  if (status === AuthStatus.Pending) return <AuthPending />;
  if (status === AuthStatus.Unauthenticated) return <Navigate to="/auth/login" replace />;
  return <Outlet />;
}

function GuestGuard() {
  const status = useAuthStore((s) => s.status);

  if (status === AuthStatus.Pending) return <AuthPending />;
  if (status === AuthStatus.Authenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

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

function StudentAccessGuard() {
  const status = useAuthStore((s) => s.status);
  const role   = useAuthStore((s) => s.role);
  const myId   = useAuthStore((s) => s.id);
  const { studentId } = useParams<{ studentId: string }>();
  console.log("[StudentAccessGuard] role=%o status=%o studentId=%o myId=%o",
    role, status, studentId, myId);

  if (status === AuthStatus.Pending) return <AuthPending />;
  if (status === AuthStatus.Authenticated && role === Role.Unauthorized) {
    return <AuthPending />; // роль не подтянулась
  }
  if (status === AuthStatus.Unauthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (role === Role.Teacher || role === Role.Admin) return <Outlet />;

  if (role === Role.Student && studentId === myId) return <Outlet />;

  return <Navigate to="/dashboard" replace />;
}

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


const router = createBrowserRouter([
  {
    element: <GuestGuard />,
    children: [
      { path: "/auth/login", element: <LoginPage /> },
      { path: "/auth/register", element: <RegisterPage /> },
      { path: "/auth/verify", element: <VerifyEmailPage /> },
    ],
  },

  {
    element: <AuthGuard />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" replace /> },

      {
        element: <DashboardPage />,
        children: [
          { path: "/dashboard", element: <DashboardHome /> },
          {
            element: <AdminGuard />,
            children: [
              { path: "/admin/teaching-load", element: <TeachingLoadPage /> },
              { path: "/admin/classes", element: <ClassesPage /> },
              { path: "/admin/subjects", element: <SubjectsPage /> },
              { path: "/admin/status-codes", element: <StatusCodesPage /> },
              { path: "/admin/users", element: <UsersPage /> },
            ],
          },
        ],
      },

      {
        element: <TeacherGuard />,
        children: [
          { path: "/classes/journal", element: <ClassJournalPage /> },
        ],
      },
      {
        element: <StudentAccessGuard />,
        children: [
          { path: "/students/:studentId", element: <StudentPage /> },
        ],
      },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);

export function AppRouter() {
  return (
    <Suspense fallback={<AuthPending />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
