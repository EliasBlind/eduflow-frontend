import { useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import i18n from "@/i18n";
import { useStudent } from "@/hooks/journal/useStudents";
import { useGrades } from "@/hooks/journal/useGrades";
import { useSubjects } from "@/hooks/journal/useSubjects";
import { useStatusCodes } from "@/hooks/journal/useStatusCodes";
import { useHomeworkList } from "@/hooks/journal/useHomework";
import { useLogout } from "@/hooks/auth/useLogout";
import { ThemeToggle } from "@/theme";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import { styles } from "./StudentPage.styles";

export default function StudentPage() {
  const { studentId } = useParams<{ studentId: string }>();

  if (!studentId) {
    return <Navigate to="/dashboard" replace />;
  }

  return <StudentView studentId={studentId} />;
}

function StudentView({ studentId }: { studentId: string }) {
  const { t } = useTranslation();
  const { logout } = useLogout();
  const range = useMemo(() => currentSchoolYearRange(), []);

  const studentState  = useStudent({ studentId });
  const subjectsState = useSubjects();
  const statusState   = useStatusCodes();

  const gradesParams = useMemo(
    () => ({
      studentId,
      start: range.start,
      end:   range.end,
    }),
    [studentId, range.start, range.end],
  );
  const gradesState = useGrades(gradesParams);

  const student     = studentState.data;
  const subjects    = useMemo(() => subjectsState.data?.subjects ?? [], [subjectsState.data]);
  const statusCodes = useMemo(() => statusState.data?.statusCodes ?? [], [statusState.data]);
  const grades      = gradesState.data?.grades;

  const subjectNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of subjects) m.set(s.id, s.fullName);
    return m;
  }, [subjects]);

  const statusNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of statusCodes) m.set(s.id, s.fullName);
    return m;
  }, [statusCodes]);

  const [hwSubjectId, setHwSubjectId] = useState<string>("");

  const hwParams = useMemo(
    () => ({
      classId:   student?.classId ?? "",
      subjectId: hwSubjectId,
    }),
    [student?.classId, hwSubjectId],
  );
  const homeworkState = useHomeworkList(hwParams, {
    skip: !student?.classId || !hwSubjectId,
  });
  const homeworks = homeworkState.data?.homeworks ?? [];

  // ── Группировка / сортировка оценок ───────────────────────────
  const bySubject = useMemo(() => {
    const map = new Map<string, NonNullable<typeof grades>>();
    for (const g of grades ?? []) {
      const list = map.get(g.subjectId) ?? [];
      list.push(g);
      map.set(g.subjectId, list);
    }
    return map;
  }, [grades]);

  const sortedGrades = useMemo(
    () =>
      [...(grades ?? [])].sort(
        (a, b) =>
          (toDate(b.dateOfGrade)?.getTime() ?? 0) -
          (toDate(a.dateOfGrade)?.getTime() ?? 0),
      ),
    [grades],
  );

  const subjectStats = useMemo(
    () =>
      subjects.map((s) => {
        const list = bySubject.get(s.id) ?? [];
        const numeric = list
          .map((g) => g.grade)
          .filter((v): v is number => typeof v === "number");
        const avg = numeric.length
          ? numeric.reduce((acc, n) => acc + n, 0) / numeric.length
          : null;
        return { id: s.id, name: s.fullName, total: list.length, avg };
      }),
    [subjects, bySubject],
  );

  const isLoading =
    studentState.loading || subjectsState.loading || gradesState.loading;
  const errorMessage =
    studentState.error || subjectsState.error || gradesState.error;

  function handleExportExcel() {
    if (!student) return;

    const gradeRows = sortedGrades.map((g) => ({
      [t("journal.date")]: formatDate(g.dateOfGrade),
      [t("teachingLoad.subject")]: subjectNameById.get(g.subjectId) ?? "—",
      [t("student.lessonNo")]: g.lessonNumber ?? "",
      [t("journal.grade")]: typeof g.grade === "number" ? g.grade : "",
      [t("journal.status")]: typeof g.grade === "number"
        ? ""
        : statusNameById.get(g.statusCodeId ?? "") ?? "",
      [t("journal.comment")]: g.note ?? "",
    }));

    const wb = XLSX.utils.book_new();

    const wsGrades = XLSX.utils.json_to_sheet(gradeRows);
    wsGrades["!cols"] = [
      { wch: 12 }, { wch: 26 }, { wch: 8 },
      { wch: 8 },  { wch: 20 }, { wch: 45 },
    ];
    XLSX.utils.book_append_sheet(wb, wsGrades, t("journal.sheetGrades"));

    const statusRows = statusCodes.map((s) => ({ [t("journal.statusCode")]: s.fullName }));
    if (statusRows.length) {
      const wsStatus = XLSX.utils.json_to_sheet(statusRows);
      wsStatus["!cols"] = [{ wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsStatus, t("statusCodes.title"));
    }

    const safeName = student.fullName.replace(/[\\/:*?"<>|]/g, "_").trim();
    XLSX.writeFile(wb, `${t("journal.sheetGrades")}_${safeName || t("student.studentFallback")}.xlsx`);
  }

  if (isLoading) {
    return <div style={styles.loading}>{t("common.loading")}</div>;
  }

  if (errorMessage) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.topBar}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <LanguageSwitcher direction='down'/>
            <ThemeToggle />
            <button type="button" onClick={logout} style={styles.logoutBtn} title={t("common.logout")}>
              <span>⏏</span>
              <span>{t("common.logout")}</span>
            </button>
          </div>
        </div>
        <div role="alert" style={styles.error}>{errorMessage}</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.topBar}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <LanguageSwitcher direction='down' />
            <ThemeToggle />
            <button type="button" onClick={logout} style={styles.logoutBtn} title={t("common.logout")}>
              <span>⏏</span>
              <span>{t("common.logout")}</span>
            </button>
          </div>
        </div>
        <div style={styles.empty}>{t("student.notFound")}</div>
      </div>
    );
  }

  const hasGrades = sortedGrades.length > 0;

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div style={styles.avatar}>{getInitials(student.fullName)}</div>
        <div>
          <h1 style={styles.title}>{student.fullName}</h1>
          {!student.classId && (
            <p style={styles.muted}>{t("student.noClass")}</p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <LanguageSwitcher direction='down'/>
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            style={styles.logoutBtn}
            title={t("common.logout")}
          >
            <span>⏏</span>
            <span>{t("common.logout")}</span>
          </button>
        </div>
      </header>

      {/*Средний балл */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>{t("student.avgBySubject")}</h2>
        {subjectStats.length === 0 ? (
          <p style={styles.muted}>{t("student.noSubjects")}</p>
        ) : (
          <div style={styles.tableScroll}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{t("teachingLoad.subject")}</th>
                  <th style={{ ...styles.th, ...styles.thCenter }}>{t("student.gradesCount")}</th>
                  <th style={{ ...styles.th, ...styles.thCenter }}>{t("student.avgGrade")}</th>
                </tr>
              </thead>
              <tbody>
                {subjectStats.map((s) => (
                  <tr key={s.id}>
                    <td style={styles.td}>{s.name}</td>
                    <td style={{ ...styles.td, ...styles.tdCenter }}>{s.total}</td>
                    <td style={{ ...styles.td, ...styles.tdCenter }}>
                      {s.avg !== null ? (
                        <span style={{ ...styles.avg, ...gradeColor(Math.round(s.avg)) }}>
                          {s.avg.toFixed(2)}
                        </span>
                      ) : (
                        <span style={styles.muted}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* статус коды*/}
      <section style={styles.section}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>{t("journal.gradesAndStatus")}</h2>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={!hasGrades}
            style={{
              ...styles.exportBtn,
              ...(hasGrades ? {} : styles.exportBtnDisabled),
            }}
          >
            ↓ {t("journal.downloadExcel")}
          </button>
        </div>

        {!hasGrades ? (
          <p style={styles.muted}>{t("student.noGradesYear")}</p>
        ) : (
          <div style={styles.tableScroll}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{t("journal.date")}</th>
                  <th style={styles.th}>{t("teachingLoad.subject")}</th>
                  <th style={{ ...styles.th, ...styles.thCenter }}>{t("student.lessonNo")}</th>
                  <th style={{ ...styles.th, ...styles.thCenter }}>{t("student.gradeOrStatus")}</th>
                  <th style={styles.th}>{t("journal.comment")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedGrades.map((g) => {
                  const isNumeric = typeof g.grade === "number";
                  const statusName =
                    statusNameById.get(g.statusCodeId ?? "") ?? "—";
                  return (
                    <tr key={g.id}>
                      <td style={{ ...styles.td, ...styles.nowrap }}>
                        {formatDate(g.dateOfGrade)}
                      </td>
                      <td style={styles.td}>
                        {subjectNameById.get(g.subjectId) ?? "—"}
                      </td>
                      <td style={{ ...styles.td, ...styles.tdCenter }}>
                        {g.lessonNumber ?? "—"}
                      </td>
                      <td style={{ ...styles.td, ...styles.tdCenter }}>
                        {isNumeric ? (
                          <span
                            style={{
                              ...styles.gradeBadge,
                              ...gradeColor(g.grade as number),
                            }}
                          >
                            {g.grade}
                          </span>
                        ) : (
                          <span style={{ ...styles.gradeBadge, ...styles.gradeStatus }}>
                            {statusName}
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {g.note ? (
                          <span style={styles.note}>{g.note}</span>
                        ) : (
                          <span style={styles.muted}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/*ДЗ*/}
      <section style={styles.section}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>{t("student.homeworkTitle")}</h2>
          {subjects.length > 0 && (
            <select
              value={hwSubjectId}
              onChange={(e) => setHwSubjectId(e.target.value)}
              style={styles.select}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>
          )}
        </div>

        {!student.classId ? (
          <p style={styles.muted}>{t("student.notAssignedClass")}</p>
        ) : homeworkState.loading ? (
          <p style={styles.muted}>{t("common.loading")}</p>
        ) : homeworkState.error ? (
          <div role="alert" style={styles.error}>{homeworkState.error}</div>
        ) : homeworks.length === 0 ? (
          <p style={styles.muted}>{t("student.noHomeworkSubject")}</p>
        ) : (
          <div style={styles.hwList}>
            {homeworks.map((hw) => (
              <article key={hw.id} style={styles.hwCard}>
                <div style={styles.hwMeta}>
                  <span style={styles.hwGiven}>
                    {t("student.given", { date: formatDate(hw.start) })}
                  </span>
                  <span style={styles.hwDue}>
                    {t("student.due", { date: formatDate(hw.end) })}
                  </span>
                </div>
                <p style={styles.hwTask}>{hw.descriptionTask}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function currentSchoolYearRange() {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return {
    start: new Date(year, 8, 1),
    end:   new Date(year + 1, 5, 30),
  };
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "object" && v !== null && "seconds" in (v as Record<string, unknown>)) {
    const s = Number((v as { seconds: unknown }).seconds);
    if (!isNaN(s)) return new Date(s * 1000);
  }
  return null;
}

function formatDate(v: unknown): string {
  const d = toDate(v);
  return d ? d.toLocaleDateString(i18n.language || "ru-RU") : "—";
}

function gradeColor(grade: number): React.CSSProperties {
  if (grade >= 5) return { background: "var(--ok-bg)", color: "var(--ok)" };
  if (grade >= 4) return { background: "var(--accent-soft)", color: "var(--accent-text)" };
  if (grade >= 3) return { background: "var(--warn-bg)", color: "var(--warn)" };
  return { background: "var(--danger-bg)", color: "var(--danger)" };
}
