import { useState, useEffect, useCallback, memo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLogout } from "@/hooks/auth/useLogout";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const SIDEBAR_WIDTH = 240;
const COLLAPSED_WIDTH = 64;
const MIN_WIDTH = 180;
const MAX_WIDTH = 480;

// -----------------------------------------------------------------------------
// Custom hook: управление ресайзом боковой панели
// -----------------------------------------------------------------------------
const useSidebarResize = (initialWidth: number) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const onMove = (e: MouseEvent) => {
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(next);
    };
    const onUp = () => setIsResizing(false);

    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
    };
  }, [isResizing]);

  const resetWidth = useCallback(() => setWidth(SIDEBAR_WIDTH), []);

  return { width, isResizing, startResize, resetWidth };
};

// -----------------------------------------------------------------------------
// Компоненты
// -----------------------------------------------------------------------------

interface NavItemProps {
  to: string;
  label: string;
  icon: string;
  open: boolean;
  active: boolean;
}

const NavItem = memo(({ to, label, icon, open, active }: NavItemProps) => {
  return (
    <Link
      to={to}
      title={label}
      style={{
        ...styles.navItem,
        ...(active ? styles.navItemActive : {}),
        justifyContent: open ? "flex-start" : "center",
      }}
    >
      <span style={styles.navIcon}>{icon}</span>
      {open && <span style={styles.navLabel}>{label}</span>}
    </Link>
  );
});

NavItem.displayName = "NavItem";

const Welcome = ({ title, hint }: { title: string; hint: string }) => (
  <section>
    <h2 style={styles.sectionTitle}>{title}</h2>
    <p style={styles.muted}>{hint}</p>
  </section>
);

// -----------------------------------------------------------------------------
// Основной компонент
// -----------------------------------------------------------------------------
export default function DashboardPage() {
  const { user, role, isAdmin, isTeacher, isStudent, isUnauthorized } = useAuth();
  const { logout } = useLogout();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Делаем редирект только если пользователь находится на корневом /dashboard
    // чтобы не зацикливать переходы, когда он ходит по внутренним вкладкам
    if (pathname === "/dashboard" || pathname === "/") {
      if (isTeacher) {
        navigate("/classes/journal", { replace: true });
      } else if (isStudent && user?.id) {
        navigate(`/students/${user.id}`, { replace: true });
      }
    }
  }, [isTeacher, isStudent, user, pathname, navigate]);

  const [open, setOpen] = useState(true);
  const { width, isResizing, startResize, resetWidth } =
    useSidebarResize(SIDEBAR_WIDTH);

  // Генерация пунктов меню – вычисляется каждый рендер (недорого)
  const navItems: Omit<NavItemProps, "open" | "active">[] = [];

  if (isAdmin) {
    navItems.push(
      { to: "/admin/users", label: "Пользователи", icon: "👥" },
      { to: "/admin/teaching-load", label: "Учебная нагрузка", icon: "📚" },
      { to: "/admin/classes", label: "Классы", icon: "🏫" },
      { to: "/admin/subjects", label: "Предметы", icon: "📖" },
      { to: "/admin/status-codes", label: "Статус-коды", icon: "🔖" },
    );
  }

  const toggleSidebar = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const currentWidth = open ? width : COLLAPSED_WIDTH;

  return (
    <div style={styles.wrapper}>
      {/* Боковая панель */}
      <aside
        style={{
          ...styles.sidebar,
          width: currentWidth,
          transition: isResizing ? "none" : "width 0.2s ease",
        }}
        aria-label="Боковая навигация"
      >
        {/* Шапка панели */}
        <div style={styles.sidebarHeader}>
          {open && <span style={styles.brand}>EduFlow</span>}
          <button
            onClick={toggleSidebar}
            style={styles.toggleBtn}
            aria-label={open ? "Свернуть панель" : "Развернуть панель"}
            title={open ? "Свернуть панель" : "Развернуть панель"}
          >
            {open ? "«" : "»"}
          </button>
        </div>

        {/* Навигация */}
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              open={open}
              active={pathname.startsWith(item.to)}
            />
          ))}
          {isUnauthorized && open && (
            <p style={styles.muted}>Роль не определена.</p>
          )}
        </nav>

        {/* Нижняя часть панели: пользователь и выход */}
        <div style={styles.sidebarFooter}>
          {open && (
            <div style={styles.userBox}>
              <span style={styles.userName}>
                Пользователь: {user?.login ?? "—"}
              </span>
              <span style={styles.role}>{role ?? "—"}</span>
            </div>
          )}
          <button
            onClick={logout}
            style={{
              ...styles.logoutBtn,
              justifyContent: open ? "flex-start" : "center",
            }}
            title="Выйти"
          >
            <span>⏏</span>
            {open && <span>Выйти</span>}
          </button>
        </div>

        {/* Ресайзер (разделитель) */}
        {open && (
          <div
            onMouseDown={startResize}
            onDoubleClick={resetWidth}
            style={{
              ...styles.resizer,
              background: isResizing ? "#2563eb" : "transparent",
            }}
            title="Потяните, чтобы изменить ширину (двойной клик — сброс)"
            role="separator"
            aria-orientation="vertical"
          />
        )}
      </aside>

      {/* Основной контент */}
      <main style={styles.main}>
        {isAdmin && (
          <Welcome title="Администрирование" hint="Выберите раздел в боковой панели." />
        )}
        {isTeacher && (
          <section>
            <h2 style={styles.sectionTitle}>Журналы</h2>
            <p style={styles.muted}>
              Выберите класс на странице{" "}
              <Link to="/admin/classes" style={styles.link}>
                списка классов
              </Link>{" "}
              или перейдите по ссылке вида <code>/classes/:classId/journal</code>.
            </p>
          </section>
        )}
        {isStudent && (
          <section>
            <h2 style={styles.sectionTitle}>Моя успеваемость</h2>
            {user?.id ? (
              <Link to={`/students/${user.id}`} style={styles.primaryLink}>
                Открыть мой профиль →
              </Link>
            ) : (
              <p style={styles.muted}>Не удалось определить ваш профиль.</p>
            )}
          </section>
        )}
        {isUnauthorized && (
          <p style={styles.muted}>
            Роль не определена. Обратитесь к администратору.
          </p>
        )}
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Стили
// -----------------------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "#f5f5f7",
  },

  sidebar: {
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    borderRight: "1px solid #e5e5ea",
    overflow: "hidden",
    flexShrink: 0,
    position: "sticky",
    top: 0,
    height: "100vh",
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 12px",
    borderBottom: "1px solid #e5e5ea",
    minHeight: 56,
    boxSizing: "border-box",
  },
  brand: {
    fontSize: 20,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  toggleBtn: {
    width: 32,
    height: 32,
    flexShrink: 0,
    background: "#f5f5f7",
    border: "1px solid #e5e5ea",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
    color: "#444",
  },
  nav: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: 8,
    overflowY: "auto",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 8,
    textDecoration: "none",
    color: "#1a1a1a",
    fontSize: 14,
    whiteSpace: "nowrap",
  },
  navItemActive: {
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600,
  },
  navIcon: {
    fontSize: 18,
    width: 20,
    textAlign: "center",
    flexShrink: 0,
  },
  navLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  resizer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 6,
    height: "100%",
    cursor: "col-resize",
    transition: "background 0.15s ease",
    zIndex: 10,
  },

  sidebarFooter: {
    borderTop: "1px solid #e5e5ea",
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  userBox: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "4px 8px",
  },
  userName: {
    fontSize: 13,
    fontWeight: 500,
    color: "#1a1a1a",
  },
  role: {
    display: "inline-block",
    alignSelf: "flex-start",
    padding: "1px 8px",
    background: "#eef2ff",
    color: "#3730a3",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    background: "#fff",
    color: "#b00020",
    border: "1px solid #fbb",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    whiteSpace: "nowrap",
  },

  main: {
    flex: 1,
    padding: 32,
    maxWidth: 1200,
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: 18,
    fontWeight: 600,
  },
  muted: {
    color: "#666",
    fontSize: 14,
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
  },
  primaryLink: {
    display: "inline-block",
    padding: "10px 16px",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 6,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
  },
};
