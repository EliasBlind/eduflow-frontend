import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/auth";
import { useLogout } from "@/hooks/auth";

interface NavItem {
  to:    string;
  label: string;
  icon:  string;
}

const teacherNav: NavItem[] = [
  { to: "/dashboard",           label: "Главная",   icon: "⊞" },
];

const adminNav: NavItem[] = [
  { to: "/dashboard",           label: "Главная",      icon: "⊞" },
  { to: "/admin/classes",       label: "Классы",       icon: "◫" },
  { to: "/admin/teachers",      label: "Учителя",      icon: "♟" },
  { to: "/admin/teaching-load", label: "Нагрузка",     icon: "⊜" },
  { to: "/admin/subjects",      label: "Предметы",     icon: "☰" },
  { to: "/admin/status-codes",  label: "Статус-коды",  icon: "◈" },
];

const studentNav: NavItem[] = [
  { to: "/dashboard", label: "Мой журнал", icon: "⊞" },
];

export function AppLayout() {
  const { user, role, isAdmin, isTeacher } = useAuth();
  const { logout } = useLogout();

  const nav = isAdmin ? adminNav : isTeacher ? teacherNav : studentNav;

  const initials = user
    ? (user as { name?: string }).name
        ?.split(" ")
        .slice(0, 2)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase() ?? "?"
    : "?";

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Logo */}
        <div className="flex h-14 items-center px-4 border-b border-gray-100 dark:border-gray-800">
          <span className="text-base font-medium text-gray-900 dark:text-gray-100">
            📓 Журнал
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                [
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-950 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
                ].join(" ")
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 px-3 py-3 dark:border-gray-800">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-gray-900 dark:text-gray-100">
                {(user as { name?: string })?.name ?? "Пользователь"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          >
            Выйти
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
