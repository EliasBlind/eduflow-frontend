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

const SIDEBAR_WIDTH = 240;
const COLLAPSED_WIDTH = 64;
const MIN_WIDTH = 180;
const MAX_WIDTH = 480;
const MOBILE_DRAWER_WIDTH = "min(82vw, 280px)";

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

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
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

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, role, isAdmin, isTeacher, isStudent, isUnauthorized } = useAuth();
  const { logout } = useLogout();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
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

  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  const expanded = isMobile ? true : open;

  useEffect(() => {
    if (!isMobile || !mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, mobileNavOpen]);

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
      {/* Верхняя панель */}
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

      {isMobile && mobileNavOpen && (
        <div style={styles.backdrop} onClick={closeMobileNav} aria-hidden="true" />
      )}

      {/* Боковая панель (для мобилок будет выезжать) */}
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
        {/* Шапка */}
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

        <div style={styles.sidebarFooter}>
          {expanded && (
            <div style={styles.userBox}>
              <span style={styles.userName}>
                {t("dashboard.user", { login: user?.login ?? "—" })}
              </span>
              <span style={styles.role}>{role ?? "—"}</span>
            </div>
          )}

          {/* Переключатель языка*/}
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

        {/* Ресайзер */}
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

      <main style={isMobile ? { ...styles.main, ...styles.mainMobile } : styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
