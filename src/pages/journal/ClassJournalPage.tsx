import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { utils, writeFile } from "xlsx";

import {
  useClasses,
  useSubjects,
  useStudents,
  useGrades,
  useStatusCodes,
  useHomeworkList,
  useRecordHomework,
  useDeleteHomework,
  useRecordGrade,
  useUpdateGrade,
  useTeachingLoads,
} from "@/hooks/journal";
import { useAuthStore } from "@/storage/auth.store";
import { useLogout } from "@/hooks/auth/useLogout";
import { ThemeToggle } from "@/theme";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import { styles } from "./ClassJournalPage.styles";

type Id = string;

interface ClassVM { id: Id; name: string }
interface SubjectVM { id: Id; name: string }
interface StudentVM { id: Id; name: string }
interface StatusCodeVM { id: Id; code: string; label: string; color?: string }
interface GradeVM { id: Id; studentId: Id; date: string; value: number | null; statusCodeId: Id | null; comment?: string; lessonNumber?: number }
interface HomeworkVM { id: Id; date: string; subjectId?: Id; description: string }

//! TODO: убери any
/* eslint-disable @typescript-eslint/no-explicit-any */
function toClass(x: any): ClassVM {
  return { id: String(x.id), name: x.className ?? x.name ?? x.title ?? `Класс ${x.id}` };
}
function toSubject(x: any): SubjectVM {
  return { id: String(x.id), name: x.fullName ?? x.name ?? x.title ?? `Предмет ${x.id}` };
}
function toStudent(x: any): StudentVM {
  const id = String(x.id ?? x.studentId);
  const composed = [x.lastName, x.firstName, x.middleName].filter(Boolean).join(" ");
  const name = x.fullName ?? x.name ?? (composed || `#${id}`);
  return { id, name };
}
function toStatusCode(x: any): StatusCodeVM {
  return {
    id: String(x.id),
    code: x.code ?? x.shortName ?? x.symbol ?? x.value ?? x.fullName ?? "•",
    label: x.fullName ?? x.name ?? x.label ?? "",
    color: x.color,
  };
}
function toGrade(x: any): GradeVM {
  const value =
    typeof x.grade === "number" ? x.grade :
    typeof x.value === "number" ? x.value : null;
  const statusCodeId =
    x.statusCodeId != null ? String(x.statusCodeId) :
    x.statusCode?.id != null ? String(x.statusCode.id) : null;
  return {
    id: String(x.id),
    studentId: String(x.studentId ?? x.student_id),
    date: dateKey(x.dateOfGrade ?? x.date ?? x.createdAt ?? x.gradedAt),
    value,
    statusCodeId,
    comment: x.note ?? x.comment,
    lessonNumber: typeof x.lessonNumber === "number" ? x.lessonNumber : undefined,
  };
}
function toHomework(x: any): HomeworkVM {
  return {
    id: String(x.id),
    date: dateKey(x.start ?? x.date ?? x.dueDate ?? x.assignedAt),
    subjectId: x.subjectId != null ? String(x.subjectId) : undefined,
    description: x.descriptionTask ?? x.description ?? x.text ?? x.task ?? "",
  };
}

function listOf(data: unknown, ...keys: string[]): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const obj = data as Record<string, unknown>;
  for (const k of keys) if (Array.isArray(obj[k])) return obj[k] as any[];
  for (const v of Object.values(obj)) if (Array.isArray(v)) return v as any[];
  return [];
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function dateKey(input: unknown): string {
  if (!input) return "";
  if (typeof input === "string") {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? input.slice(0, 10) : iso(d);
  }
  if (input instanceof Date) return iso(input);
  if (typeof input === "object") {
    const o = input as { seconds?: number | string };
    if (o.seconds != null) return iso(new Date(Number(o.seconds) * 1000));
  }
  return "";
}
function toApiDate(d: string): Date {
  return new Date(d);
}
function formatDateLabel(d: string): string {
  if (!d) return "";
  const [, m, day] = d.split("-");
  return day && m ? `${day}.${m}` : d;
}
function firstDayOfMonth(): string {
  const now = new Date();
  return iso(new Date(now.getFullYear(), now.getMonth(), 1));
}
function todayIso(): string {
  return iso(new Date());
}

const cellKey = (studentId: Id, date: string) => `${studentId}::${date}`;

function gradeToken(g: GradeVM, statusById: Map<Id, StatusCodeVM>): string {
  if (g.value != null) return String(g.value);
  if (g.statusCodeId) return statusById.get(g.statusCodeId)?.code ?? "";
  return "";
}

interface PairSlot {
  lessonNumber: number;
  shift: 1 | 2;
  indexInShift: number;
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
}

const SCHEDULE = {
  pairDurationMin: 90,
  shortBreakMin: 10,
  longBreakMin: 30,
  longBreakAfterPair: 2,
  shifts: [
    { shift: 1 as const, start: "08:30", pairs: 3 },
    { shift: 2 as const, start: "13:50", pairs: 4 },
  ],
};

function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}
function minutesToHm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const DAY_SCHEDULE: PairSlot[] = (() => {
  const slots: PairSlot[] = [];
  let lessonNumber = 0;
  for (const s of SCHEDULE.shifts) {
    let cursor = hmToMinutes(s.start);
    for (let i = 1; i <= s.pairs; i++) {
      lessonNumber += 1;
      const startMinutes = cursor;
      const endMinutes = startMinutes + SCHEDULE.pairDurationMin;
      slots.push({
        lessonNumber,
        shift: s.shift,
        indexInShift: i,
        start: minutesToHm(startMinutes),
        end: minutesToHm(endMinutes),
        startMinutes,
        endMinutes,
      });
      cursor =
        endMinutes +
        (i === SCHEDULE.longBreakAfterPair ? SCHEDULE.longBreakMin : SCHEDULE.shortBreakMin);
    }
  }
  return slots;
})();

function pairLabel(p: PairSlot, t: TFunction): string {
  return t("journal.pairLabel", {
    shift: p.shift,
    index: p.indexInShift,
    start: p.start,
    end: p.end,
  });
}
function pairLabelByLesson(n: number, t: TFunction): string {
  const p = DAY_SCHEDULE.find((x) => x.lessonNumber === n);
  return p ? pairLabel(p, t) : t("journal.pairFallback", { n });
}

function currentPair(now: Date = new Date()): PairSlot | null {
  const mins = now.getHours() * 60 + now.getMinutes();
  return DAY_SCHEDULE.find((p) => mins >= p.startMinutes && mins < p.endMinutes) ?? null;
}

function defaultPairForDate(dateStr: string): PairSlot {
  if (dateStr === todayIso()) {
    const active = currentPair();
    if (active) return active;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const started = [...DAY_SCHEDULE].reverse().find((p) => mins >= p.startMinutes);
    if (started) return started;
  }
  return DAY_SCHEDULE[0];
}

function Spinner() {
  const { t } = useTranslation();
  return <span style={styles.spinner} aria-label={t("common.loading")} />;
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHead}>
          <h3 style={styles.modalTitle}>{title}</h3>
          <button style={styles.iconBtn} onClick={onClose} aria-label={t("common.close")}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ClassJournalPage() {
  const { t } = useTranslation();
  const teacherId = useAuthStore((s) => s.id) ?? "";
  const { logout } = useLogout();

  const [classId, setClassId] = useState<Id>("");
  const [subjectId, setSubjectId] = useState<Id>("");
  const [start, setStart] = useState<string>(firstDayOfMonth());
  const [end, setEnd] = useState<string>(todayIso());
  const [hwOpen, setHwOpen] = useState(false);

  const classesQ = useClasses();
  const subjectsQ = useSubjects();
  const statusQ = useStatusCodes();
  const studentsQ = useStudents({ classId, limit: 1000, offset: 0 }, { skip: !classId });

  const startDate = useMemo(() => toApiDate(start), [start]);
  const endDate = useMemo(() => toApiDate(end), [end]);

  const gradesQ = useGrades(
    { classId, subjectId, start: startDate, end: endDate },
    { skip: !classId || !subjectId },
  );
  const homeworkQ = useHomeworkList(
    { classId, subjectId, start: startDate, end: endDate },
    { skip: !classId || !subjectId },
  );

  const tlParams = useMemo(() => ({ teacherId }), [teacherId]);
  const loadsQ = useTeachingLoads(tlParams);

  const recordHomework = useRecordHomework();
  const deleteHomework = useDeleteHomework();
  const recordGrade = useRecordGrade();
  const updateGrade = useUpdateGrade();

  const classes = useMemo<ClassVM[]>(
    () => listOf(classesQ.data, "classes").map(toClass),
    [classesQ.data],
  );
  const subjects = useMemo<SubjectVM[]>(
    () => listOf(subjectsQ.data, "subjects").map(toSubject),
    [subjectsQ.data],
  );
  const subjectById = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  const statusCodes = useMemo<StatusCodeVM[]>(
    () => listOf(statusQ.data, "statusCodes", "statusCode", "codes").map(toStatusCode),
    [statusQ.data],
  );
  const statusById = useMemo(
    () => new Map(statusCodes.map((s) => [s.id, s])),
    [statusCodes],
  );
  const students = useMemo<StudentVM[]>(
    () =>
      listOf(studentsQ.data, "students")
        .map(toStudent)
        .sort((a, b) => a.name.localeCompare(b.name, "ru")),
    [studentsQ.data],
  );
  const grades = useMemo<GradeVM[]>(
    () => listOf(gradesQ.data, "grades").map(toGrade),
    [gradesQ.data],
  );
  const homework = useMemo<HomeworkVM[]>(
    () =>
      listOf(homeworkQ.data, "homework", "homeworks", "items")
        .map(toHomework)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [homeworkQ.data],
  );

  const dates = useMemo<string[]>(() => {
    const set = new Set(grades.map((g) => g.date).filter(Boolean));
    return [...set].sort();
  }, [grades]);

  const gradesByCell = useMemo(() => {
    const map = new Map<string, GradeVM[]>();
    for (const g of grades) {
      const key = cellKey(g.studentId, g.date);
      const bucket = map.get(key);
      if (bucket) bucket.push(g);
      else map.set(key, [g]);
    }
    return map;
  }, [grades]);

  const selectedClassName = classes.find((c) => c.id === classId)?.name ?? "";
  const selectedSubjectName = subjects.find((s) => s.id === subjectId)?.name ?? "";

  const loads = useMemo(
    () => listOf(loadsQ.data, "teachingLoads", "teaching_loads", "loads"),
    [loadsQ.data],
  );
  const tsId = useMemo(() => {
    const l = loads.find(
      (x) => String(x.classId) === classId && String(x.subjectId) === subjectId,
    );
    return l ? String(l.id) : "";
  }, [loads, classId, subjectId]);

  const tableLoading = studentsQ.loading || gradesQ.loading;
  const canExport = !!classId && !!subjectId && students.length > 0;

  const [gradeCell, setGradeCell] = useState<{
    studentId: Id;
    studentName: string;
    date: string;
  } | null>(null);

  function openGradeCell(studentId: Id, studentName: string, date: string) {
    setGradeCell({ studentId, studentName, date });
  }

  function findCellGrade(studentId: Id, date: string, lessonNumber: number): GradeVM | undefined {
    const bucket = gradesByCell.get(cellKey(studentId, date)) ?? [];
    const exact = bucket.find((g) => g.lessonNumber === lessonNumber);
    if (exact) return exact;
    if (bucket.length === 1 && bucket[0].lessonNumber == null) return bucket[0];
    return undefined;
  }

  async function handleSubmitGrade(form: {
    date: string;
    mode: "grade" | "status";
    grade: number;
    statusCodeId: Id;
    lessonNumber: number;
    note: string;
    editingGradeId?: Id;
  }) {
    if (!gradeCell) return;
    const filter =
      form.mode === "grade"
        ? { grade: form.grade }
        : { statusCodeId: form.statusCodeId };

    if (form.editingGradeId) {
      await updateGrade.mutate({
        gradeId: form.editingGradeId,
        ...filter,
        note: form.note || undefined,
      });
    } else {
      await recordGrade.mutate({
        tsId,
        studentId: gradeCell.studentId,
        dateOfGrade: toApiDate(form.date),
        ...filter,
        lessonNumber: form.lessonNumber,
        note: form.note || undefined,
      });
    }
    setGradeCell(null);
    gradesQ.refetch();
  }

  function handleExport() {
    const header = [t("journal.student"), ...dates.map(formatDateLabel)];
    const rows = students.map((s) => {
      const row: (string | number)[] = [s.name];
      for (const d of dates) {
        const cell = gradesByCell.get(cellKey(s.id, d)) ?? [];
        row.push(cell.map((g) => gradeToken(g, statusById)).filter(Boolean).join(" "));
      }
      return row;
    });

    const ws = utils.aoa_to_sheet([header, ...rows]);
    ws["!cols"] = [{ wch: 28 }, ...dates.map(() => ({ wch: 6 }))];

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, t("journal.sheetGrades"));

    const className = selectedClassName || t("journal.classFallbackWord");
    const subjectName = selectedSubjectName || t("journal.subjectFallbackWord");
    const fname = `${t("journal.fileJournal")}_${className}_${subjectName}_${start}_${end}.xlsx`;
    writeFile(wb, fname);
  }

  async function handleAddHomework(form: { date: string; subjectId: Id; description: string }) {
    const start = toApiDate(form.date);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    await recordHomework.mutate({
      teacherId,
      classId,
      subjectId: form.subjectId,
      descriptionTask: form.description,
      start,
      end,
    });
    setHwOpen(false);
    homeworkQ.refetch();
  }

  async function handleDeleteHomework(id: Id) {
    await deleteHomework.mutate({ id });
    homeworkQ.refetch();
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.h1}>{t("journal.title")}</h1>
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
          <button
            style={{ ...styles.btn, ...styles.btnPrimary, ...(canExport ? {} : styles.btnDisabled) }}
            onClick={handleExport}
            disabled={!canExport}
          >
            {t("journal.downloadExcel")}
          </button>
        </div>
      </header>

      <section style={styles.filters}>
        <label style={styles.field}>
          <span style={styles.label}>{t("teachingLoad.class")}</span>
          <select style={styles.input} value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">{t("common.select")}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          <span style={styles.label}>{t("teachingLoad.subject")}</span>
          <select style={styles.input} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">{t("common.select")}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          <span style={styles.label}>{t("journal.dateFrom")}</span>
          <input style={styles.input} type="date" value={start} max={end} onChange={(e) => setStart(e.target.value)} />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>{t("journal.dateTo")}</span>
          <input style={styles.input} type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </section>

      <section style={styles.card}>
        <div style={styles.cardHead}>
          <h2 style={styles.h2}>{t("journal.gradesAndStatus")}</h2>
          {tableLoading && <Spinner />}
        </div>

        {!classId ? (
          <p style={styles.hint}>{t("journal.pickClass")}</p>
        ) : !subjectId ? (
          <p style={styles.hint}>{t("journal.pickSubject")}</p>
        ) : gradesQ.error ? (
          <p style={styles.error}>{t("journal.gradesError", { error: gradesQ.error })}</p>
        ) : students.length === 0 && !tableLoading ? (
          <p style={styles.hint}>{t("journal.noStudents")}</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, ...styles.thSticky }}>{t("journal.student")}</th>
                  {dates.map((d) => (
                    <th key={d} style={styles.thDate}>{formatDateLabel(d)}</th>
                  ))}
                  <th style={styles.thDate} title={t("journal.setGradeTitle")}>＋</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st.id}>
                    <td style={{ ...styles.td, ...styles.tdSticky }}>{st.name}</td>
                    {dates.map((d) => {
                      const cell = gradesByCell.get(cellKey(st.id, d)) ?? [];
                      return (
                        <td
                          key={d}
                          style={{ ...styles.tdCell, ...styles.tdClickable }}
                          onClick={() => openGradeCell(st.id, st.name, d)}
                          title={t("journal.clickToEdit")}
                        >
                          {cell.map((g) => {
                            const code = g.statusCodeId ? statusById.get(g.statusCodeId) : undefined;
                            const isStatus = g.value == null && !!code;
                            return (
                              <span
                                key={g.id}
                                title={[
                                  g.lessonNumber != null ? pairLabelByLesson(g.lessonNumber, t) : "",
                                  g.comment,
                                  code?.label,
                                ].filter(Boolean).join(" · ")}
                                style={{
                                  ...styles.gradeChip,
                                  ...(isStatus ? styles.statusChip : {}),
                                  ...(code?.color ? { borderColor: code.color, color: code.color } : {}),
                                }}
                              >
                                {gradeToken(g, statusById)}
                              </span>
                            );
                          })}
                        </td>
                      );
                    })}
                    <td
                      style={{ ...styles.tdCell, ...styles.tdClickable, color: "var(--text-muted)" }}
                      onClick={() => openGradeCell(st.id, st.name, todayIso())}
                      title={t("journal.setNewGradeTitle")}
                    >
                      ＋
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {statusCodes.length > 0 && (
          <div style={styles.legend}>
            {statusCodes.map((s) => (
              <span key={s.id} style={styles.legendItem}>
                <b style={styles.legendCode}>{s.code}</b>
                {s.code !== s.label ? <> — {s.label}</> : null}
              </span>
            ))}
          </div>
        )}

        {classId && subjectId && (
          <p style={styles.hint}>
            {tsId
              ? t("journal.cellHintCanEdit")
              : t("journal.cellHintNoLoad")}
          </p>
        )}
      </section>

      <section style={styles.card}>
        <div style={styles.cardHead}>
          <h2 style={styles.h2}>{t("journal.homeworkTitle")}</h2>
          <button
            style={{ ...styles.btn, ...(classId ? {} : styles.btnDisabled) }}
            onClick={() => setHwOpen(true)}
            disabled={!classId}
          >
            {t("journal.addHomework")}
          </button>
        </div>

        {homeworkQ.loading ? (
          <Spinner />
        ) : homework.length === 0 ? (
          <p style={styles.hint}>{t("journal.noHomeworkPeriod")}</p>
        ) : (
          <ul style={styles.hwList}>
            {homework.map((hw) => (
              <li key={hw.id} style={styles.hwCard}>
                <div style={styles.hwMeta}>
                  <span style={styles.hwDate}>{formatDateLabel(hw.date)}</span>
                  {hw.subjectId && (
                    <span style={styles.hwSubject}>{subjectById.get(hw.subjectId)?.name ?? ""}</span>
                  )}
                </div>
                <p style={styles.hwText}>{hw.description}</p>
                <button
                  style={styles.hwDelete}
                  onClick={() => handleDeleteHomework(hw.id)}
                  aria-label={t("journal.deleteHomeworkAria")}
                >
                  {t("common.delete")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {gradeCell && (
        <GradeModal
          studentName={gradeCell.studentName}
          date={gradeCell.date}
          resolveGrade={(date, lessonNumber) =>
            findCellGrade(gradeCell.studentId, date, lessonNumber)
          }
          statusCodes={statusCodes}
          canCreate={!!tsId}
          saving={recordGrade.loading || updateGrade.loading}
          error={recordGrade.error || updateGrade.error}
          onSubmit={handleSubmitGrade}
          onClose={() => setGradeCell(null)}
        />
      )}

      {hwOpen && (
        <HomeworkModal
          subjects={subjects}
          defaultSubjectId={subjectId}
          defaultDate={end}
          saving={recordHomework.loading}
          error={recordHomework.error}
          onSubmit={handleAddHomework}
          onClose={() => setHwOpen(false)}
        />
      )}
    </div>
  );
}

function HomeworkModal({
  subjects,
  defaultSubjectId,
  defaultDate,
  saving,
  error,
  onSubmit,
  onClose,
}: {
  subjects: SubjectVM[];
  defaultSubjectId: Id;
  defaultDate: string;
  saving: boolean;
  error: string | null;
  onSubmit: (form: { date: string; subjectId: Id; description: string }) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [date, setDate] = useState(defaultDate || todayIso());
  const [subjectId, setSubjectId] = useState(defaultSubjectId || subjects[0]?.id || "");
  const [description, setDescription] = useState("");

  const valid = !!date && !!subjectId && description.trim().length > 0;

  return (
    <ModalShell title={t("journal.hwModalTitle")} onClose={onClose}>
      <div style={styles.formGrid}>
        <label style={styles.field}>
          <span style={styles.label}>{t("journal.date")}</span>
          <input style={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>{t("teachingLoad.subject")}</span>
          <select style={styles.input} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">{t("common.select")}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label style={{ ...styles.field, marginTop: 12 }}>
        <span style={styles.label}>{t("journal.task")}</span>
        <textarea
          style={{ ...styles.input, height: 96, resize: "vertical", paddingTop: 8 }}
          value={description}
          placeholder={t("journal.taskPlaceholder")}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.modalFooter}>
        <button style={styles.btn} onClick={onClose} disabled={saving}>{t("common.cancel")}</button>
        <button
          style={{ ...styles.btn, ...styles.btnPrimary, ...(valid && !saving ? {} : styles.btnDisabled) }}
          onClick={() => valid && onSubmit({ date, subjectId, description: description.trim() })}
          disabled={!valid || saving}
        >
          {saving ? t("common.saving") : t("common.save")}
        </button>
      </div>
    </ModalShell>
  );
}

function GradeModal({
  studentName,
  date,
  resolveGrade,
  statusCodes,
  canCreate,
  saving,
  error,
  onSubmit,
  onClose,
}: {
  studentName: string;
  date: string;
  resolveGrade: (date: string, lessonNumber: number) => GradeVM | undefined;
  statusCodes: StatusCodeVM[];
  canCreate: boolean;
  saving: boolean;
  error: string | null;
  onSubmit: (form: {
    date: string;
    mode: "grade" | "status";
    grade: number;
    statusCodeId: Id;
    lessonNumber: number;
    note: string;
    editingGradeId?: Id;
  }) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [d, setD] = useState(date);
  const [lessonNumber, setLessonNumber] = useState<number>(() => {
    for (const p of DAY_SCHEDULE) if (resolveGrade(date, p.lessonNumber)) return p.lessonNumber;
    return defaultPairForDate(date).lessonNumber;
  });

  const existing = resolveGrade(d, lessonNumber);
  const isEdit = !!existing;

  const [mode, setMode] = useState<"grade" | "status">(
    existing && existing.value == null && existing.statusCodeId ? "status" : "grade",
  );
  const [grade, setGrade] = useState<number>(existing?.value ?? 5);
  const [statusCodeId, setStatusCodeId] = useState<Id>(
    existing?.statusCodeId ?? statusCodes[0]?.id ?? "",
  );
  const [note, setNote] = useState(existing?.comment ?? "");

  useEffect(() => {
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (existing.value != null) setGrade(existing.value);
      if (existing.statusCodeId) setStatusCodeId(existing.statusCodeId);
      setNote(existing.comment ?? "");
    } else {
      setMode("grade");
      setGrade(5);
      setNote("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const valid =
    !!d &&
    (mode === "grade" ? grade >= 1 : !!statusCodeId) &&
    (isEdit || canCreate);

  return (
    <ModalShell
      title={isEdit
        ? t("journal.gradeTitleEdit", { name: studentName })
        : t("journal.gradeTitleNew", { name: studentName })}
      onClose={onClose}
    >
      <div style={styles.segmented}>
        <button
          style={{ ...styles.segment, ...(mode === "grade" ? styles.segmentActive : {}) }}
          onClick={() => setMode("grade")}
        >
          {t("journal.grade")}
        </button>
        <button
          style={{ ...styles.segment, ...(mode === "status" ? styles.segmentActive : {}) }}
          onClick={() => setMode("status")}
        >
          {t("journal.statusCode")}
        </button>
      </div>

      {mode === "grade" ? (
        <div style={styles.gradeButtons}>
          {[2, 3, 4, 5].map((n) => (
            <button
              key={n}
              style={{ ...styles.gradeBtn, ...(grade === n ? styles.gradeBtnActive : {}) }}
              onClick={() => setGrade(n)}
            >
              {n}
            </button>
          ))}
        </div>
      ) : (
        <label style={styles.field}>
          <span style={styles.label}>{t("journal.statusCode")}</span>
          <select
            style={styles.input}
            value={statusCodeId}
            onChange={(e) => setStatusCodeId(e.target.value)}
          >
            {statusCodes.map((s) => (
              <option key={s.id} value={s.id}>{s.label || s.code}</option>
            ))}
          </select>
        </label>
      )}

      <div style={{ ...styles.formGrid, marginTop: 12 }}>
        <label style={styles.field}>
          <span style={styles.label}>{t("journal.date")}</span>
          <input
            style={styles.input}
            type="date"
            value={d}
            max={todayIso()}
            onChange={(e) => setD(e.target.value)}
          />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>{t("journal.pair")}</span>
          <select
            style={styles.input}
            value={lessonNumber}
            onChange={(e) => setLessonNumber(Number(e.target.value))}
          >
            {DAY_SCHEDULE.map((p) => (
              <option key={p.lessonNumber} value={p.lessonNumber}>
                {pairLabel(p, t)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p style={styles.hint}>
        {isEdit
          ? t("journal.gradeExists")
          : t("journal.gradeFree")}
      </p>

      <label style={{ ...styles.field, marginTop: 4 }}>
        <span style={styles.label}>{t("journal.commentOptional")}</span>
        <input
          style={styles.input}
          value={note}
          placeholder={t("journal.commentPlaceholder")}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      {!isEdit && !canCreate && (
        <p style={styles.error}>
          {t("journal.noLoadCannotGrade")}
        </p>
      )}
      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.modalFooter}>
        <button style={styles.btn} onClick={onClose} disabled={saving}>{t("common.cancel")}</button>
        <button
          style={{ ...styles.btn, ...styles.btnPrimary, ...(valid && !saving ? {} : styles.btnDisabled) }}
          onClick={() =>
            valid &&
            onSubmit({
              date: d,
              mode,
              grade,
              statusCodeId,
              lessonNumber,
              note: note.trim(),
              editingGradeId: existing?.id,
            })
          }
          disabled={!valid || saving}
        >
          {saving ? t("common.saving") : t("common.save")}
        </button>
      </div>
    </ModalShell>
  );
}
