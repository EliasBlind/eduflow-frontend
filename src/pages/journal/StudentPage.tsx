import { useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useStudent } from "@/hooks/journal/useStudents";
import { useGrades } from "@/hooks/journal/useGrades";
import { useSubjects } from "@/hooks/journal/useSubjects";

/**
 * Профиль студента — общая инфа + оценки за текущий учебный год,
 * сгруппированные по предметам, со средним баллом.
 */
export default function StudentPage() {
  const { studentId } = useParams<{ studentId: string }>();

  if (!studentId) {
    return <Navigate to="/dashboard" replace />;
  }

  return <StudentView studentId={studentId} />;
}

function StudentView({ studentId }: { studentId: string }) {
  const range = useMemo(() => currentSchoolYearRange(), []);

  const studentState  = useStudent({ studentId });
  const subjectsState = useSubjects();

  const gradesParams = useMemo(
    () => ({
      studentId,
      start: range.start,
      end:   range.end,
    }),
    [studentId, range.start, range.end],
  );
  const gradesState = useGrades(gradesParams);

  const student  = studentState.data;
  const subjects = subjectsState.data?.subjects ?? [];
  const grades   = gradesState.data?.grades;

  const isLoading =
    studentState.loading || subjectsState.loading || gradesState.loading;
  const errorMessage =
    studentState.error || subjectsState.error || gradesState.error;

  // Группировка оценок по предметам
  const bySubject = useMemo(() => {
    const map = new Map<string, typeof grades>();
    for (const g of grades ?? []) {
      const list = map.get(g.subjectId) ?? [];
      list.push(g);
      map.set(g.subjectId, list);
    }
    return map;
  }, [grades]);

  if (isLoading) {
    return <div style={styles.loading}>Загрузка…</div>;
  }

  if (errorMessage) {
    return (
      <div style={styles.wrapper}>
        <Link to="/dashboard" style={styles.back}>← Назад</Link>
        <div role="alert" style={styles.error}>{errorMessage}</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={styles.wrapper}>
        <Link to="/dashboard" style={styles.back}>← Назад</Link>
        <div style={styles.empty}>Студент не найден.</div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <Link to="/dashboard" style={styles.back}>← Назад</Link>

      <header style={styles.header}>
        <div style={styles.avatar}>{getInitials(student.fullName)}</div>
        <div>
          <h1 style={styles.title}>{student.fullName}</h1>
          {student.classId ? (
            <Link
              to={`/classes/${student.classId}/journal`}
              style={styles.classLink}
            >
              Перейти в журнал класса →
            </Link>
          ) : (
            <p style={styles.muted}>Не назначен в класс</p>
          )}
        </div>
      </header>

      <section>
        <h2 style={styles.sectionTitle}>Оценки за учебный год</h2>

        {subjects.length === 0 ? (
          <p style={styles.muted}>Нет данных о предметах.</p>
        ) : (
          <div style={styles.subjectGrid}>
            {subjects.map((subject) => {
              const subjGrades = bySubject.get(subject.id) ?? [];
              const numeric = subjGrades
                .map((g) => g.grade)
                .filter((v): v is number => typeof v === "number");
              const avg = numeric.length
                ? numeric.reduce((s, n) => s + n, 0) / numeric.length
                : null;

              return (
                <article key={subject.id} style={styles.subjectCard}>
                  <header style={styles.subjectHeader}>
                    <h3 style={styles.subjectName}>{subject.fullName}</h3>
                    {avg !== null && (
                      <span style={styles.avg}>{avg.toFixed(2)}</span>
                    )}
                  </header>

                  {subjGrades.length === 0 ? (
                    <p style={styles.muted}>Нет оценок</p>
                  ) : (
                    <div style={styles.gradesList}>
                      {subjGrades.map((g) => {
                        const isNumeric = typeof g.grade === "number";
                        return (
                          <span
                            key={g.id}
                            title={g.note}
                            style={{
                              ...styles.gradeBadge,
                              ...(isNumeric
                                ? gradeColor(g.grade as number)
                                : styles.gradeStatus),
                            }}
                          >
                            {isNumeric ? g.grade : "Н"}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function currentSchoolYearRange() {
  const now = new Date();
  // Учебный год начинается в сентябре (месяц 8)
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return {
    start: new Date(year, 8, 1),       // 1 сентября
    end:   new Date(year + 1, 5, 30),  // 30 июня
  };
}

function gradeColor(grade: number): React.CSSProperties {
  if (grade >= 5) return { background: "#d1fae5", color: "#065f46" };
  if (grade >= 4) return { background: "#dbeafe", color: "#1e40af" };
  if (grade >= 3) return { background: "#fef3c7", color: "#92400e" };
  return { background: "#fee2e2", color: "#991b1b" };
}

// ── Styles ────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: { padding: 32, maxWidth: 1000, margin: "0 auto" },
  back: {
    display: "inline-block",
    marginBottom: 16,
    color: "#2563eb",
    textDecoration: "none",
    fontSize: 14,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    marginBottom: 32,
    padding: 24,
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e5e5ea",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#eef2ff",
    color: "#3730a3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 600,
    flexShrink: 0,
  },
  title: { margin: "0 0 4px", fontSize: 22, fontWeight: 600 },
  classLink: { color: "#2563eb", textDecoration: "none", fontSize: 14 },
  sectionTitle: { margin: "0 0 16px", fontSize: 18, fontWeight: 600 },
  subjectGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 12,
  },
  subjectCard: {
    padding: 16,
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e5e5ea",
  },
  subjectHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subjectName: { margin: 0, fontSize: 15, fontWeight: 600 },
  avg: {
    padding: "2px 8px",
    background: "#eef2ff",
    color: "#3730a3",
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
  },
  gradesList: { display: "flex", flexWrap: "wrap", gap: 6 },
  gradeBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 28,
    height: 28,
    padding: "0 6px",
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
  },
  gradeStatus: { background: "#fde68a", color: "#78350f" },
  muted: { color: "#666", fontSize: 13, margin: 0 },
  loading: { padding: 40, textAlign: "center", color: "#666" },
  error: {
    padding: "10px 14px",
    background: "#fee",
    color: "#b00020",
    border: "1px solid #fbb",
    borderRadius: 6,
    fontSize: 13,
  },
  empty: {
    padding: 40,
    textAlign: "center",
    color: "#666",
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e5e5ea",
  },
};
