import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLogout } from "@/hooks/auth/useLogout";

/**
 * Dashboard — рендерит разный контент в зависимости от роли.
 */
export default function DashboardPage() {
  const { user, role, isAdmin, isTeacher, isStudent } = useAuth();
  const { logout } = useLogout();

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>EduFlow</h1>
          <p style={styles.subtitle}>
            {user?.login ?? "Пользователь"} ·{" "}
            <span style={styles.role}>{role ?? "—"}</span>
          </p>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>
          Выйти
        </button>
      </header>

      <main style={styles.main}>
        {isAdmin && <AdminDashboard />}
        {isTeacher && !isAdmin && <TeacherDashboard />}
        {isStudent && <StudentDashboard userId={user?.id} />}
        {!isAdmin && !isTeacher && !isStudent && (
          <p style={styles.muted}>
            Роль не определена. Обратитесь к администратору.
          </p>
        )}
      </main>
    </div>
  );
}

// ── Admin ─────────────────────────────────────────────────────

function AdminDashboard() {
  return (
    <section>
      <h2 style={styles.sectionTitle}>Администрирование</h2>
      <div style={styles.grid}>
        <DashboardCard
          to="/admin/teachers"
          title="Учителя"
          description="Список преподавателей, создание и редактирование"
        />
        <DashboardCard
          to="/admin/teaching-load"
          title="Учебная нагрузка"
          description="Распределение предметов и классов между учителями"
        />
        <DashboardCard
          to="/admin/classes"
          title="Классы"
          description="Управление классами учебного заведения"
        />
        <DashboardCard
          to="/admin/subjects"
          title="Предметы"
          description="Справочник предметов"
        />
        <DashboardCard
          to="/admin/status-codes"
          title="Статус-коды"
          description="Коды посещаемости: Н, Б и т.д."
        />
      </div>
    </section>
  );
}

// ── Teacher ───────────────────────────────────────────────────

function TeacherDashboard() {
  return (
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
  );
}

// ── Student ───────────────────────────────────────────────────

function StudentDashboard({ userId }: { userId?: string }) {
  return (
    <section>
      <h2 style={styles.sectionTitle}>Моя успеваемость</h2>
      {userId ? (
        <Link to={`/students/${userId}`} style={styles.primaryLink}>
          Открыть мой профиль →
        </Link>
      ) : (
        <p style={styles.muted}>Не удалось определить ваш профиль.</p>
      )}
    </section>
  );
}

// ── Card ──────────────────────────────────────────────────────

interface DashboardCardProps {
  to:          string;
  title:       string;
  description: string;
}

function DashboardCard({ to, title, description }: DashboardCardProps) {
  return (
    <Link to={to} style={styles.card}>
      <h3 style={styles.cardTitle}>{title}</h3>
      <p style={styles.cardDesc}>{description}</p>
    </Link>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: { minHeight: "100vh", background: "#f5f5f7" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 32px",
    background: "#fff",
    borderBottom: "1px solid #e5e5ea",
  },
  title: { margin: 0, fontSize: 22, fontWeight: 600 },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "#666" },
  role: {
    display: "inline-block",
    padding: "1px 8px",
    background: "#eef2ff",
    color: "#3730a3",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
  },
  logoutBtn: {
    padding: "8px 16px",
    background: "#fff",
    color: "#b00020",
    border: "1px solid #fbb",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
  main: { padding: 32, maxWidth: 1200, margin: "0 auto" },
  sectionTitle: { margin: "0 0 16px", fontSize: 18, fontWeight: 600 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 16,
  },
  card: {
    display: "block",
    padding: 20,
    background: "#fff",
    border: "1px solid #e5e5ea",
    borderRadius: 8,
    textDecoration: "none",
    color: "inherit",
  },
  cardTitle: {
    margin: "0 0 6px",
    fontSize: 16,
    fontWeight: 600,
    color: "#1a1a1a",
  },
  cardDesc: { margin: 0, fontSize: 13, color: "#666", lineHeight: 1.5 },
  muted: { color: "#666", fontSize: 14 },
  link: { color: "#2563eb", textDecoration: "none" },
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
