import { useState, useEffect, useCallback, memo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLogout } from "@/hooks/auth/useLogout";
import { styles } from "./DashboardPage.styles";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ThemeToggle } from "@/theme";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import {
  FaUsers,
  FaChalkboardTeacher,
  FaSchool,
  FaBookOpen,
  FaTag,
  FaBars,
} from "react-icons/fa";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const SIDEBAR_WIDTH = 240;
const COLLAPSED_WIDTH = 64;
const MIN_WIDTH = 180;
const MAX_WIDTH = 480;
// Ширина выезжающей панели (drawer) на мобильных.
const MOBILE_DRAWER_WIDTH = "min(82vw, 280px)";

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
  icon: React.ReactNode; // теперь это React-узел (компонент иконки)
  open: boolean;
  active: boolean;
  onClick?: () => void;
}

const NavItem = memo(({ to, label, icon, open, active, onClick }: NavItemProps) => {
  return (
    <Link
      to={to}
      title={label}
      onClick={onClick}
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
// Контент правой части для самого маршрута /dashboard (index-маршрут).
// Раньше этот блок был прямо внутри <main>. Теперь он вынесен в отдельный
// компонент, который рендерится в <Outlet />, когда никакая вложенная
// страница не выбрана.
// -----------------------------------------------------------------------------
export function DashboardHome() {
  const { t } = useTranslation();
  const { user, isAdmin, isTeacher, isStudent, isUnauthorized } = useAuth();

  return (
    <>
      {isAdmin && (
        <Welcome
          title={t("dashboard.adminTitle")}
          hint={t("dashboard.adminHint")}
        />
      )}
      {isTeacher && (
        <section>
          <h2 style={styles.sectionTitle}>{t("dashboard.journalsTitle")}</h2>
          <p style={styles.muted}>
            <Trans
              i18nKey="dashboard.teacherHint"
              components={{
                classLink: <Link to="/admin/classes" style={styles.link} />,
                code: <code />,
              }}
            />
          </p>
        </section>
      )}
      {isStudent && (
        <section>
          <h2 style={styles.sectionTitle}>{t("dashboard.myPerformance")}</h2>
          {user?.id ? (
            <Link to={`/students/${user.id}`} style={styles.primaryLink}>
              {t("dashboard.openMyProfile")}
            </Link>
          ) : (
            <p style={styles.muted}>{t("dashboard.profileNotFound")}</p>
          )}
        </section>
      )}
      {isUnauthorized && (
        <p style={styles.muted}>{t("dashboard.roleUndefinedAdmin")}</p>
      )}
    </>
  );
}

// -----------------------------------------------------------------------------
// Основной компонент — теперь это LAYOUT.
// Боковая панель остаётся на месте, а страницы рендерятся в <Outlet />.
// -----------------------------------------------------------------------------
export default function DashboardPage() {
  const { t } = useTranslation();
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

  // На мобильных боковая панель превращается в выезжающий drawer.
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  // На мобильных drawer всегда показывает подписи (как в развёрнутом виде).
  const expanded = isMobile ? true : open;

  // Закрываем мобильное меню при переходе на другой маршрут.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Пока drawer открыт — блокируем прокрутку фона.
  useEffect(() => {
    if (!isMobile || !mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, mobileNavOpen]);

  // Генерация пунктов меню – вычисляется каждый рендер (недорого).
  // Подписи берём из тех же ключей, что и заголовки соответствующих страниц.
  // Теперь используем React-иконки вместо эмодзи.
  const navItems: Omit<NavItemProps, "open" | "active">[] = [];

  if (isAdmin) {
    navItems.push(
      { to: "/admin/users", label: t("users.title"), icon: <FaUsers size={20} aria-hidden="true" /> },
      { to: "/admin/teaching-load", label: t("teachingLoad.title"), icon: <FaChalkboardTeacher size={20} aria-hidden="true" /> },
      { to: "/admin/classes", label: t("classes.title"), icon: <FaSchool size={20} aria-hidden="true" /> },
      { to: "/admin/subjects", label: t("subjects.title"), icon: <FaBookOpen size={20} aria-hidden="true" /> },
      { to: "/admin/status-codes", label: t("statusCodes.title"), icon: <FaTag size={20} aria-hidden="true" /> },
    );
  }

  const toggleSidebar = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const currentWidth = open ? width : COLLAPSED_WIDTH;

  return (
    <div style={isMobile ? { ...styles.wrapper, ...styles.wrapperMobile } : styles.wrapper}>
      {/* Верхняя панель с бургером — только на мобильных */}
      {isMobile && (
        <header style={styles.topbar}>
          <button
            onClick={() => setMobileNavOpen(true)}
            style={styles.hamburger}
            aria-label={t("dashboard.expand")}
            aria-expanded={mobileNavOpen}
          >
            <FaBars size={18} aria-hidden="true" />
          </button>
          <span style={styles.brand}>EduFlow</span>
        </header>
      )}

      {/* Затемнение под выехавшим drawer */}
      {isMobile && mobileNavOpen && (
        <div style={styles.backdrop} onClick={closeMobileNav} aria-hidden="true" />
      )}

      {/* Боковая панель (на мобильных — выезжающий drawer) */}
      <aside
        style={
          isMobile
            ? {
                ...styles.sidebar,
                ...styles.sidebarMobile,
                width: MOBILE_DRAWER_WIDTH,
                transform: mobileNavOpen ? "translateX(0)" : "translateX(-100%)",
              }
            : {
                ...styles.sidebar,
                width: currentWidth,
                transition: isResizing ? "none" : "width 0.2s ease",
              }
        }
        aria-label={t("dashboard.sidebarAria")}
        aria-hidden={isMobile && !mobileNavOpen}
      >
        {/* Шапка панели */}
        <div style={styles.sidebarHeader}>
          {expanded && <span style={styles.brand}>EduFlow</span>}
          <button
            onClick={isMobile ? closeMobileNav : toggleSidebar}
            style={styles.toggleBtn}
            aria-label={
              isMobile
                ? t("common.close")
                : open
                  ? t("dashboard.collapse")
                  : t("dashboard.expand")
            }
            title={
              isMobile
                ? t("common.close")
                : open
                  ? t("dashboard.collapse")
                  : t("dashboard.expand")
            }
          >
            {isMobile ? "✕" : open ? "«" : "»"}
          </button>
        </div>

        {/* Навигация */}
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              open={expanded}
              active={pathname.startsWith(item.to)}
              onClick={isMobile ? closeMobileNav : undefined}
            />
          ))}
          {isUnauthorized && expanded && (
            <p style={styles.muted}>{t("dashboard.roleUndefined")}</p>
          )}
        </nav>

        {/* Нижняя часть панели: пользователь и выход */}
        <div style={styles.sidebarFooter}>
          {expanded && (
            <div style={styles.userBox}>
              <span style={styles.userName}>
                {t("dashboard.user", { login: user?.login ?? "—" })}
              </span>
              <span style={styles.role}>{role ?? "—"}</span>
            </div>
          )}

          {/* Переключатель языка (с флагами стран) */}
          <LanguageSwitcher
            compact={!expanded}
            style={!expanded ? { width: "100%" } : undefined}
          />

          <ThemeToggle
            compact={!expanded}
            style={!expanded ? { width: "100%" } : undefined}
          />

          <button
            onClick={logout}
            style={{
              ...styles.logoutBtn,
              justifyContent: expanded ? "flex-start" : "center",
            }}
            title={t("common.logout")}
          >
            <span>⏏</span>
            {expanded && <span>{t("common.logout")}</span>}
          </button>
        </div>

        {/* Ресайзер (разделитель) — только на десктопе */}
        {!isMobile && open && (
          <div
            onMouseDown={startResize}
            onDoubleClick={resetWidth}
            style={{
              ...styles.resizer,
              background: isResizing ? "var(--accent)" : "transparent",
            }}
            title={t("dashboard.resizerTitle")}
            role="separator"
            aria-orientation="vertical"
          />
        )}
      </aside>

      {/* Основной контент — сюда подставляются вложенные страницы */}
      <main style={isMobile ? { ...styles.main, ...styles.mainMobile } : styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
