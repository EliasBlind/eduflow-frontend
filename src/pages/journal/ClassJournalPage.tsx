import { useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useStudents } from "@/hooks/journal/useStudents";
import { useGrades } from "@/hooks/journal/useGrades";
import { useSubjects } from "@/hooks/journal/useSubjects";
import { useHomeworkList } from "@/hooks/journal/useHomework";
import { useClass } from "@/hooks/journal/useClasses";

/**
 * Журнал класса.
 * Таблица «студенты × даты» по выбранному предмету + блок ДЗ.
 */
export default function ClassJournalPage() {
  const { classId } = useParams<{ classId: string }>();

  if (!classId) {
    return <Navigate to="/dashboard" replace />;
  }

  return <ClassJournalView classId={classId} />;
}

function ClassJournalView({ classId }: { classId: string }) {
  // ── Локальный стейт ──────────────────────────────────────────
  const [startStr, setStartStr] = useState(() => toInputDate(defaultStart()));
  const [endStr,   setEndStr]   = useState(() => toInputDate(new Date()));
  const [subjectId, setSubjectId] = useState<string>("");

  // ── Стабильные параметры для хуков ──────────────────────────
  const start = useMemo(() => fromInputDate(startStr), [startStr]);
  const end   = useMemo(() => fromInputDate(endStr),   [endStr]);

  const studentsParams = useMemo(
    () => ({ classId, limit: 0, offset: 0 }),
    [classId],
  );

  const gradesParams = useMemo(
    () => ({
      classId,
      subjectId: subjectId || undefined,
      start,
      end,
    }),
    [classId, subjectId, start, end],
  );

  const homeworkParams = useMemo(
    () => ({
      classId,
      subjectId,
      start,
      end,
    }),
    [classId, subjectId, start, end],
  );

  // ── Загрузка данных ──────────────────────────────────────────
  const classState    = useClass({ id: classId });
  const subjectsState = useSubjects();
  const studentsState = useStudents(studentsParams);
  const gradesState   = useGrades(gradesParams);
  const homeworkState = useHomeworkList(homeworkParams);

  const subjects = useMemo(() => subjectsState.data?.subjects ?? [], [subjectsState.data?.subjects]);
  const students = useMemo(() => studentsState.data?.students ?? [], [studentsState.data?.students]);
  const grades   = useMemo(() => gradesState.data?.grades ?? [], [gradesState.data?.grades]);
  const homework = useMemo(() => homeworkState.data?.homeworks ?? [], [homeworkState.data?.homeworks]);

  const effectiveSubjectId = subjectId || subjects[0]?.id || "";

  const isLoading =
    subjectsState.loading || studentsState.loading || gradesState.loading;
  const errorMessage =
    subjectsState.error || studentsState.error || gradesState.error;

  // Дни в выбранном диапазоне (только если диапазон валиден)
  const dates = useMemo(() => {
    if (!start || !end || start > end) return [];
    return buildDateRange(start, end);
  }, [start, end]);

  // ── Индекс оценок: studentId → 'YYYY-MM-DD' → Grade ─────────
  const gradeIndex = useMemo(() => {
    const idx = new Map<string, Map<string, (typeof grades)[number]>>();
    for (const g of grades) {
      if (effectiveSubjectId && g.subjectId !== effectiveSubjectId) continue;
      const dateKey = formatDateKey(g.dateOfGrade);
      if (!dateKey) continue;
      let row = idx.get(g.studentId);
      if (!row) {
        row = new Map();
        idx.set(g.studentId, row);
      }
      row.set(dateKey, g);
    }
    return idx;
  }, [grades, effectiveSubjectId]);

  return (
    <div style={styles.wrapper}>
      <header style={styles.headerRow}>
        <Link to="/dashboard" style={styles.back}>← Назад</Link>
        <h1 style={styles.title}>
          Журнал{" "}
          {classState.data?.className && (
            <span style={styles.className}>· {classState.data.className}</span>
          )}
        </h1>
      </header>

      <div style={styles.toolbar}>
        <label style={styles.field}>
          <span style={styles.label}>Предмет</span>
          <select
            value={effectiveSubjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={subjectsState.loading || subjects.length === 0}
            style={styles.select}
          >
            {subjects.length === 0 && <option value="">— нет данных —</option>}
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          <span style={styles.label}>С</span>
          <input
            type="date"
            value={startStr}
            onChange={(e) => setStartStr(e.target.value)}
            style={styles.input}
          />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>По</span>
          <input
            type="date"
            value={endStr}
            onChange={(e) => setEndStr(e.target.value)}
            style={styles.input}
          />
        </label>
      </div>

      {errorMessage && (
        <div role="alert" style={styles.error}>
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div style={styles.loading}>Загрузка…</div>
      ) : students.length === 0 ? (
        <div style={styles.empty}>В этом классе пока нет студентов.</div>
      ) : dates.length === 0 ? (
        <div style={styles.empty}>Неверный диапазон дат.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, ...styles.thSticky }}>Студент</th>
                {dates.map((d) => (
                  <th key={d.toISOString()} style={styles.th}>
                    {formatDateShort(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const row = gradeIndex.get(student.id);
                return (
                  <tr key={student.id}>
                    <td style={{ ...styles.td, ...styles.tdName }}>
                      <Link
                        to={`/students/${student.id}`}
                        style={styles.studentLink}
                      >
                        {student.fullName}
                      </Link>
                    </td>
                    {dates.map((d) => {
                      const g = row?.get(toInputDate(d));
                      return (
                        <td key={d.toISOString()} style={styles.td}>
                          <GradeCell grade={g} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <section style={styles.homework}>
        <h2 style={styles.sectionTitle}>Домашнее задание</h2>
        {homeworkState.loading ? (
          <p style={styles.muted}>Загрузка…</p>
        ) : homeworkState.error ? (
          <p style={styles.error}>{homeworkState.error}</p>
        ) : !effectiveSubjectId ? (
          <p style={styles.muted}>Выберите предмет.</p>
        ) : homework.length === 0 ? (
          <p style={styles.muted}>Нет заданий на выбранный период.</p>
        ) : (
          <ul style={styles.hwList}>
            {homework.map((h) => (
              <li key={h.id} style={styles.hwItem}>
                <div style={styles.hwDate}>
                  {formatTimestamp(h.start)}
                  {h.end ? ` — ${formatTimestamp(h.end)}` : ""}
                </div>
                <div style={styles.hwText}>{h.descriptionTask}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ── Маленький компонент ячейки оценки ─────────────────────────

interface GradeLike {
  grade?:        number;
  statusCodeId?: string;
  note?:         string;
}

function GradeCell({ grade }: { grade?: GradeLike }) {
  if (!grade) return <span style={styles.gradeEmpty}>·</span>;

  if (typeof grade.grade === "number") {
    return (
      <span
        title={grade.note}
        style={{ ...styles.gradeBadge, ...gradeColor(grade.grade) }}
      >
        {grade.grade}
      </span>
    );
  }

  if (grade.statusCodeId) {
    return (
      <span
        title={grade.note}
        style={{ ...styles.gradeBadge, ...styles.gradeStatus }}
      >
        Н
      </span>
    );
  }

  return <span style={styles.gradeEmpty}>·</span>;
}

// ── Helpers ───────────────────────────────────────────────────

function defaultStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 13);
  return d;
}

function buildDateRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromInputDate(s: string): Date {
  return new Date(`${s}T00:00:00`);
}

function formatDateShort(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Нормализуем Timestamp/Date/строку → 'YYYY-MM-DD'. */
function formatDateKey(value: unknown): string | null {
  const d = toDate(value);
  return d ? toInputDate(d) : null;
}

function formatTimestamp(value: unknown): string {
  const d = toDate(value);
  return d ? d.toLocaleDateString() : "—";
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && value !== null && "seconds" in value) {
    const sec = Number((value as { seconds: number | string }).seconds);
    return isNaN(sec) ? null : new Date(sec * 1000);
  }
  return null;
}

function gradeColor(grade: number): React.CSSProperties {
  if (grade >= 5) return { background: "#d1fae5", color: "#065f46" };
  if (grade >= 4) return { background: "#dbeafe", color: "#1e40af" };
  if (grade >= 3) return { background: "#fef3c7", color: "#92400e" };
  return { background: "#fee2e2", color: "#991b1b" };
}

// ── Styles ────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: { padding: 32, maxWidth: 1400, margin: "0 auto" },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  back: { color: "#2563eb", textDecoration: "none", fontSize: 14 },
  title: { margin: 0, fontSize: 22, fontWeight: 600 },
  className: { color: "#666", fontWeight: 400 },
  toolbar: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 20,
    padding: 16,
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e5e5ea",
  },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12, color: "#666" },
  select: {
    padding: "8px 10px",
    fontSize: 14,
    border: "1px solid #d0d0d5",
    borderRadius: 6,
    minWidth: 180,
  },
  input: {
    padding: "8px 10px",
    fontSize: 14,
    border: "1px solid #d0d0d5",
    borderRadius: 6,
  },
  error: {
    padding: "10px 14px",
    marginBottom: 16,
    background: "#fee",
    color: "#b00020",
    border: "1px solid #fbb",
    borderRadius: 6,
    fontSize: 13,
  },
  loading: { padding: 40, textAlign: "center", color: "#666" },
  empty: {
    padding: 40,
    textAlign: "center",
    color: "#666",
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e5e5ea",
  },
  tableWrap: {
    overflowX: "auto",
    background: "#fff",
    border: "1px solid #e5e5ea",
    borderRadius: 8,
  },
  table: { borderCollapse: "collapse", width: "100%", fontSize: 13 },
  th: {
    padding: "10px 8px",
    textAlign: "center",
    background: "#fafafa",
    borderBottom: "1px solid #e5e5ea",
    fontWeight: 600,
    color: "#333",
    whiteSpace: "nowrap",
  },
  thSticky: {
    position: "sticky",
    left: 0,
    background: "#fafafa",
    textAlign: "left",
    minWidth: 200,
    zIndex: 1,
  },
  td: {
    padding: "8px",
    textAlign: "center",
    borderBottom: "1px solid #f0f0f3",
  },
  tdName: {
    textAlign: "left",
    position: "sticky",
    left: 0,
    background: "#fff",
    minWidth: 200,
    fontWeight: 500,
  },
  studentLink: { color: "#1a1a1a", textDecoration: "none" },
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
  gradeEmpty: { color: "#ccc" },
  homework: { marginTop: 32 },
  sectionTitle: { margin: "0 0 12px", fontSize: 16, fontWeight: 600 },
  hwList: { listStyle: "none", padding: 0, margin: 0 },
  hwItem: {
    padding: 12,
    marginBottom: 8,
    background: "#fff",
    borderRadius: 6,
    border: "1px solid #e5e5ea",
  },
  hwDate: { fontSize: 12, color: "#666", marginBottom: 4 },
  hwText: { fontSize: 14, color: "#1a1a1a" },
  muted: { color: "#666", fontSize: 14 },
};
