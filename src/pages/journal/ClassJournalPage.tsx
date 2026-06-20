import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
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

/* ───────────────────────────────────────────────────────────────────────────
 * ПРЕДПОЛОЖЕНИЯ ПО ТИПАМ (адаптируйте под ваш @/api/gen/journal/journal)
 *
 * У меня нет сгенерированных типов, поэтому данные читаются через адаптеры
 * (toClass/toSubject/... + listOf), которые терпимы к разным именам полей.
 * Если имена в вашем proto отличаются — правьте ТОЛЬКО адаптеры ниже,
 * остальной код трогать не нужно.
 *
 *   Class        { id, name | title }
 *   Subject      { id, name | title }
 *   Student      { id | studentId, fullName | name | lastName/firstName/middleName }
 *   StatusCode   { id, code | shortName, name | label, color? }
 *   Grade        { id, studentId, date, value (число) | statusCodeId, comment? }
 *   Homework     { id, date | dueDate, subjectId?, description | text | task }
 *
 * Ответы list*-методов могут быть обёрнуты ({ grades: [...] } и т.п.) —
 * listOf() сам находит массив в ответе по ключу или как первое поле-массив.
 *
 * Запросы дат (start/end) и RecordHomeworkRequest отправляются строками
 * "YYYY-MM-DD". Если ваш бэкенд ждёт google.protobuf.Timestamp — оберните
 * значения в toApiDate() ниже.
 * ─────────────────────────────────────────────────────────────────────────── */

type Id = string;

interface ClassVM { id: Id; name: string }
interface SubjectVM { id: Id; name: string }
interface StudentVM { id: Id; name: string }
interface StatusCodeVM { id: Id; code: string; label: string; color?: string }
interface GradeVM { id: Id; studentId: Id; date: string; value: number | null; statusCodeId: Id | null; comment?: string; lessonNumber?: number }
interface HomeworkVM { id: Id; date: string; subjectId?: Id; description: string }

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

/** Достаёт массив сущностей из (возможно обёрнутого) ответа list-метода. */
function listOf(data: unknown, ...keys: string[]): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const obj = data as Record<string, unknown>;
  for (const k of keys) if (Array.isArray(obj[k])) return obj[k] as any[];
  for (const v of Object.values(obj)) if (Array.isArray(v)) return v as any[];
  return [];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ─── Работа с датами ─────────────────────────────────────────────────────── */

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
/** Приводит любое представление даты к ключу "YYYY-MM-DD". */
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
/**
 * Преобразует значение даты из input[type=date] ("YYYY-MM-DD") в Date,
 * который ждут сгенерированные запросы (Timestamp -> Date).
 */
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

/** Текст оценки/статуса для ячейки и Excel. */
function gradeToken(g: GradeVM, statusById: Map<Id, StatusCodeVM>): string {
  if (g.value != null) return String(g.value);
  if (g.statusCodeId) return statusById.get(g.statusCodeId)?.code ?? "";
  return "";
}

/* ─── Расписание звонков (пары) ──────────────────────────────────────────────
 * Пара = 90 минут (1,5 часа). Перерывы по 10 минут, кроме перерыва после
 * 2-й пары каждой смены — он 30 минут. 1-я смена начинается в 08:30,
 * 2-я смена — в 13:50. Количество пар в смене настраивается в SCHEDULE ниже:
 * правьте только этот объект, остальной код пересчитает времёна сам.
 *
 * При параметрах по умолчанию получается:
 *   1 см. · Пара 1  08:30–10:00
 *   1 см. · Пара 2  10:10–11:40   (далее перерыв 30 мин)
 *   1 см. · Пара 3  12:10–13:40
 *   2 см. · Пара 1  13:50–15:20
 *   2 см. · Пара 2  15:30–17:00   (далее перерыв 30 мин)
 *   2 см. · Пара 3  17:30–19:00
 *   2 см. · Пара 4  19:10–20:40
 * ─────────────────────────────────────────────────────────────────────────── */

interface PairSlot {
  lessonNumber: number; // сквозной номер пары за день (уникальный, уходит в бэкенд)
  shift: 1 | 2;
  indexInShift: number; // номер пары внутри смены (для подписи)
  start: string;        // "HH:MM"
  end: string;          // "HH:MM"
  startMinutes: number; // минуты от полуночи
  endMinutes: number;
}

const SCHEDULE = {
  pairDurationMin: 90,
  shortBreakMin: 10,
  longBreakMin: 30,      // перерыв после 2-й пары смены
  longBreakAfterPair: 2,
  shifts: [
    { shift: 1 as const, start: "08:30", pairs: 3 }, // заканчивается в 13:40
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

/** Все пары дня (обе смены) с рассчитанными временами. */
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

function pairLabel(p: PairSlot): string {
  return `${p.shift} см. · Пара ${p.indexInShift} (${p.start}–${p.end})`;
}
function pairLabelByLesson(n: number): string {
  const p = DAY_SCHEDULE.find((x) => x.lessonNumber === n);
  return p ? pairLabel(p) : `Пара ${n}`;
}

/** Идущая прямо сейчас пара (null — если перемена / вне занятий). */
function currentPair(now: Date = new Date()): PairSlot | null {
  const mins = now.getHours() * 60 + now.getMinutes();
  return DAY_SCHEDULE.find((p) => mins >= p.startMinutes && mins < p.endMinutes) ?? null;
}

/** Пара по умолчанию для даты: для сегодня — текущая/ближайшая, иначе первая. */
function defaultPairForDate(dateStr: string): PairSlot {
  if (dateStr === todayIso()) {
    const active = currentPair();
    if (active) return active;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    // ближайшая уже начавшаяся пара (если идёт перемена / после занятий)
    const started = [...DAY_SCHEDULE].reverse().find((p) => mins >= p.startMinutes);
    if (started) return started;
  }
  return DAY_SCHEDULE[0];
}

/* ─── Мелкие UI-помощники (замените на свои Button/Select/Modal при желании) ─ */

function Spinner() {
  return <span style={styles.spinner} aria-label="Загрузка" />;
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
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHead}>
          <h3 style={styles.modalTitle}>{title}</h3>
          <button style={styles.iconBtn} onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Страница
 * ═══════════════════════════════════════════════════════════════════════════ */

export default function ClassJournalPage() {
  const teacherId = useAuthStore((s) => s.id) ?? "";

  // ── фильтры ───────────────────────────────────────────────────────────────
  const [classId, setClassId] = useState<Id>("");
  const [subjectId, setSubjectId] = useState<Id>("");
  const [start, setStart] = useState<string>(firstDayOfMonth());
  const [end, setEnd] = useState<string>(todayIso());

  // ── модалка ДЗ ────────────────────────────────────────────────────────────
  const [hwOpen, setHwOpen] = useState(false);

  // ── запросы данных ────────────────────────────────────────────────────────
  const classesQ = useClasses();
  const subjectsQ = useSubjects();
  const statusQ = useStatusCodes();

  const studentsQ = useStudents({ classId, limit: 1000, offset: 0 }, { skip: !classId });

  // Стабильные Date: toApiDate() создаёт new Date() на каждый рендер, а start/end
  // попадают в deps useGrades/useHomeworkList -> без мемоизации эффект
  // перезапускается каждый рендер = бесконечный поток запросов на сервер.
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

  // Учебная нагрузка учителя -> нужна, чтобы получить ts_id (id записи
  // «учитель ведёт предмет в классе») для выставления оценок.
  const tlParams = useMemo(() => ({ teacherId }), [teacherId]);
  const loadsQ = useTeachingLoads(tlParams);

  // ── мутации ───────────────────────────────────────────────────────────────
  const recordHomework = useRecordHomework();
  const deleteHomework = useDeleteHomework();
  const recordGrade = useRecordGrade();
  const updateGrade = useUpdateGrade();

  // ── нормализованные данные ────────────────────────────────────────────────
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

  // колонки таблицы = уникальные даты оценок в диапазоне
  const dates = useMemo<string[]>(() => {
    const set = new Set(grades.map((g) => g.date).filter(Boolean));
    return [...set].sort();
  }, [grades]);

  // быстрый доступ: оценки по (ученик, дата)
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

  // ts_id записи нагрузки для выбранной пары класс+предмет (нужен для записи оценок)
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

  // ── модалка оценки ──────────────────────────────────────────────────────
  const [gradeCell, setGradeCell] = useState<{
    studentId: Id;
    studentName: string;
    date: string;
  } | null>(null);

  function openGradeCell(studentId: Id, studentName: string, date: string) {
    setGradeCell({ studentId, studentName, date });
  }

  /**
   * Находит оценку конкретного ученика на дату по номеру пары.
   * На одну дату теперь может приходиться несколько оценок (по разным парам),
   * поэтому ищем по паре, а не «первую попавшуюся».
   * Подстраховка для старых данных без номера пары: если в ячейке ровно одна
   * такая оценка — отдаём её, чтобы её всё ещё можно было отредактировать.
   */
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
    // oneof filter: либо grade, либо statusCodeId
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

  // ── экспорт в Excel ───────────────────────────────────────────────────────
  function handleExport() {
    const header = ["Ученик", ...dates.map(formatDateLabel)];
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
    utils.book_append_sheet(wb, ws, "Оценки");

    const fname = `Журнал_${selectedClassName || "класс"}_${selectedSubjectName || "предмет"}_${start}_${end}.xlsx`;
    writeFile(wb, fname);
  }

  // ── добавление / удаление ДЗ ──────────────────────────────────────────────
  async function handleAddHomework(form: { date: string; subjectId: Id; description: string }) {
    // Бэкенд валидирует поле end тегом `gtfield=Start`, т.е. требует строго end > start.
    // Раньше start и end были равны (start: when, end: when) -> валидация падала с
    //   "Field validation for 'End' failed on the 'gtfield' tag".
    // Берём start = начало выбранного дня, end = конец того же дня (на 1 мс раньше
    // следующей полуночи): end строго больше start и остаётся в пределах той же даты.
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

  // ── рендер ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.h1}>Журнал класса</h1>
        <button
          style={{ ...styles.btn, ...styles.btnPrimary, ...(canExport ? {} : styles.btnDisabled) }}
          onClick={handleExport}
          disabled={!canExport}
        >
          Скачать Excel
        </button>
      </header>

      {/* фильтры */}
      <section style={styles.filters}>
        <label style={styles.field}>
          <span style={styles.label}>Класс</span>
          <select style={styles.input} value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">— выберите —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          <span style={styles.label}>Предмет</span>
          <select style={styles.input} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">— выберите —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          <span style={styles.label}>С</span>
          <input style={styles.input} type="date" value={start} max={end} onChange={(e) => setStart(e.target.value)} />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>По</span>
          <input style={styles.input} type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </section>

      {/* таблица оценок */}
      <section style={styles.card}>
        <div style={styles.cardHead}>
          <h2 style={styles.h2}>Оценки и статус-коды</h2>
          {tableLoading && <Spinner />}
        </div>

        {!classId ? (
          <p style={styles.hint}>Выберите класс, чтобы увидеть учеников.</p>
        ) : !subjectId ? (
          <p style={styles.hint}>Выберите предмет, чтобы загрузить оценки.</p>
        ) : gradesQ.error ? (
          <p style={styles.error}>Ошибка загрузки оценок: {gradesQ.error}</p>
        ) : students.length === 0 && !tableLoading ? (
          <p style={styles.hint}>В этом классе нет учеников.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, ...styles.thSticky }}>Ученик</th>
                  {dates.map((d) => (
                    <th key={d} style={styles.thDate}>{formatDateLabel(d)}</th>
                  ))}
                  <th style={styles.thDate} title="Выставить оценку">＋</th>
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
                          title="Нажмите, чтобы изменить"
                        >
                          {cell.map((g) => {
                            const code = g.statusCodeId ? statusById.get(g.statusCodeId) : undefined;
                            const isStatus = g.value == null && !!code;
                            return (
                              <span
                                key={g.id}
                                title={[
                                  g.lessonNumber != null ? pairLabelByLesson(g.lessonNumber) : "",
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
                      style={{ ...styles.tdCell, ...styles.tdClickable, color: "#9ca3af" }}
                      onClick={() => openGradeCell(st.id, st.name, todayIso())}
                      title="Выставить новую оценку"
                    >
                      ＋
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* легенда статус-кодов */}
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
              ? "Нажмите на ячейку, чтобы выставить или изменить оценку, статус-код и комментарий."
              : "Выставление оценок недоступно: у вас нет учебной нагрузки по выбранной паре класс + предмет."}
          </p>
        )}
      </section>

      {/* домашние задания */}
      <section style={styles.card}>
        <div style={styles.cardHead}>
          <h2 style={styles.h2}>Домашние задания</h2>
          <button
            style={{ ...styles.btn, ...(classId ? {} : styles.btnDisabled) }}
            onClick={() => setHwOpen(true)}
            disabled={!classId}
          >
            + Добавить ДЗ
          </button>
        </div>

        {homeworkQ.loading ? (
          <Spinner />
        ) : homework.length === 0 ? (
          <p style={styles.hint}>За выбранный период домашних заданий нет.</p>
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
                  aria-label="Удалить ДЗ"
                >
                  Удалить
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

/* ─── Модалка добавления ДЗ ──────────────────────────────────────────────── */

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
  const [date, setDate] = useState(defaultDate || todayIso());
  const [subjectId, setSubjectId] = useState(defaultSubjectId || subjects[0]?.id || "");
  const [description, setDescription] = useState("");

  const valid = !!date && !!subjectId && description.trim().length > 0;

  return (
    <ModalShell title="Новое домашнее задание" onClose={onClose}>
      <div style={styles.formGrid}>
        <label style={styles.field}>
          <span style={styles.label}>Дата</span>
          <input style={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>Предмет</span>
          <select style={styles.input} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">— выберите —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label style={{ ...styles.field, marginTop: 12 }}>
        <span style={styles.label}>Задание</span>
        <textarea
          style={{ ...styles.input, height: 96, resize: "vertical", paddingTop: 8 }}
          value={description}
          placeholder="Например: §12, упражнения 3–5"
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.modalFooter}>
        <button style={styles.btn} onClick={onClose} disabled={saving}>Отмена</button>
        <button
          style={{ ...styles.btn, ...styles.btnPrimary, ...(valid && !saving ? {} : styles.btnDisabled) }}
          onClick={() => valid && onSubmit({ date, subjectId, description: description.trim() })}
          disabled={!valid || saving}
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </ModalShell>
  );
}

/* ─── Модалка выставления / изменения оценки ─────────────────────────────── */

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
  /** Возвращает уже выставленную оценку ученика на дату по номеру пары. */
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
  const [d, setD] = useState(date);

  // Номер пары: если на эту дату уже есть оценка по какой-то паре — открываем
  // её на редактирование, иначе берём текущую пару по расписанию (для сегодня)
  // или первую пару дня.
  const [lessonNumber, setLessonNumber] = useState<number>(() => {
    for (const p of DAY_SCHEDULE) if (resolveGrade(date, p.lessonNumber)) return p.lessonNumber;
    return defaultPairForDate(date).lessonNumber;
  });

  // Оценка, соответствующая выбранным дате+паре (если есть — режим редактирования).
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

  // При смене даты/пары: подтягиваем существующую оценку либо сбрасываем форму
  // под новую (пустую) пару.
  useEffect(() => {
    if (existing) {
      setMode(existing.value == null && existing.statusCodeId ? "status" : "grade");
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
      title={`${isEdit ? "Оценка" : "Новая оценка"} · ${studentName}`}
      onClose={onClose}
    >
      {/* Переключатель: оценка / статус */}
      <div style={styles.segmented}>
        <button
          style={{ ...styles.segment, ...(mode === "grade" ? styles.segmentActive : {}) }}
          onClick={() => setMode("grade")}
        >
          Оценка
        </button>
        <button
          style={{ ...styles.segment, ...(mode === "status" ? styles.segmentActive : {}) }}
          onClick={() => setMode("status")}
        >
          Статус-код
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
          <span style={styles.label}>Статус-код</span>
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
          <span style={styles.label}>Дата</span>
          {/* Дату можно менять — в т.ч. ставить оценки за прошедшие дни.
              max=сегодня запрещает будущие даты. */}
          <input
            style={styles.input}
            type="date"
            value={d}
            max={todayIso()}
            onChange={(e) => setD(e.target.value)}
          />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>Пара</span>
          <select
            style={styles.input}
            value={lessonNumber}
            onChange={(e) => setLessonNumber(Number(e.target.value))}
          >
            {DAY_SCHEDULE.map((p) => (
              <option key={p.lessonNumber} value={p.lessonNumber}>
                {pairLabel(p)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p style={styles.hint}>
        {isEdit
          ? "На эту пару уже есть оценка — она будет изменена."
          : "Свободная пара — будет создана новая оценка."}
      </p>

      <label style={{ ...styles.field, marginTop: 4 }}>
        <span style={styles.label}>Комментарий (необязательно)</span>
        <input
          style={styles.input}
          value={note}
          placeholder="например: контрольная работа"
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      {!isEdit && !canCreate && (
        <p style={styles.error}>
          Нет учебной нагрузки по выбранной паре класс + предмет — оценку выставить нельзя.
        </p>
      )}
      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.modalFooter}>
        <button style={styles.btn} onClick={onClose} disabled={saving}>Отмена</button>
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
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </ModalShell>
  );
}

/* ─── Стили (нейтральные inline; замените на вашу систему при желании) ────── */

const styles: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 20, padding: 24, maxWidth: 1200, margin: "0 auto" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  h1: { fontSize: 24, fontWeight: 700, margin: 0 },
  h2: { fontSize: 17, fontWeight: 600, margin: 0 },

  filters: { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" },
  field: { display: "flex", flexDirection: "column", gap: 4, minWidth: 160, flex: "0 0 auto" },
  label: { fontSize: 12, color: "#6b7280" },
  input: {
    height: 38, padding: "0 10px", border: "1px solid #d1d5db", borderRadius: 8,
    fontSize: 14, background: "#fff", boxSizing: "border-box", width: "100%",
  },

  card: { border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff" },
  cardHead: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 },

  hint: { color: "#6b7280", fontSize: 14, margin: "8px 0" },
  error: { color: "#dc2626", fontSize: 14, margin: "8px 0" },

  tableWrap: { overflowX: "auto", border: "1px solid #f1f5f9", borderRadius: 8 },
  table: { borderCollapse: "collapse", width: "100%", fontSize: 14 },
  th: { textAlign: "left", padding: "10px 12px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontWeight: 600 },
  thSticky: { position: "sticky", left: 0, zIndex: 2, minWidth: 220 },
  thDate: { padding: "10px 8px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb", borderLeft: "1px solid #f1f5f9", textAlign: "center", fontWeight: 600, whiteSpace: "nowrap" },

  td: { padding: "8px 12px", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" },
  tdSticky: { position: "sticky", left: 0, background: "#fff", zIndex: 1, fontWeight: 500, minWidth: 220 },
  tdCell: { padding: "6px 8px", borderBottom: "1px solid #f1f5f9", borderLeft: "1px solid #f8fafc", textAlign: "center", whiteSpace: "nowrap" },
  tdClickable: { cursor: "pointer" },

  gradeChip: {
    display: "inline-block", minWidth: 22, padding: "2px 6px", margin: "0 2px",
    border: "1px solid #c7d2fe", borderRadius: 6, fontWeight: 600, color: "#3730a3", background: "#eef2ff",
  },
  statusChip: { background: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" },

  legend: { display: "flex", flexWrap: "wrap", gap: 14, marginTop: 12, fontSize: 12, color: "#6b7280" },
  legendItem: { display: "inline-flex", alignItems: "center", gap: 4 },
  legendCode: { display: "inline-block", minWidth: 18, textAlign: "center", color: "#b91c1c" },

  hwList: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" },
  hwCard: { position: "relative", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fafafa" },
  hwMeta: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  hwDate: { fontWeight: 700, fontSize: 14 },
  hwSubject: { fontSize: 12, color: "#6b7280" },
  hwText: { margin: 0, fontSize: 14, whiteSpace: "pre-wrap" },
  hwDelete: { marginTop: 10, fontSize: 12, color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0 },

  btn: { height: 38, padding: "0 14px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", fontSize: 14, cursor: "pointer" },
  btnPrimary: { background: "#4f46e5", borderColor: "#4f46e5", color: "#fff" },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 },
  modal: { background: "#fff", borderRadius: 12, padding: 20, width: "100%", maxWidth: 480, boxShadow: "0 10px 40px rgba(0,0,0,0.2)" },
  modalHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 600 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  iconBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" },
  inputDisabled: { background: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" },

  segmented: { display: "flex", gap: 8, marginBottom: 12 },
  segment: {
    flex: 1, height: 38, border: "1px solid #d1d5db", borderRadius: 8,
    background: "#f9fafb", color: "#6b7280", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  segmentActive: { background: "#eef2ff", borderColor: "#c7d2fe", color: "#4338ca" },

  gradeButtons: { display: "flex", gap: 8 },
  gradeBtn: {
    flex: 1, height: 44, border: "1px solid #e5e7eb", borderRadius: 8,
    background: "#f9fafb", color: "#374151", fontSize: 17, fontWeight: 600, cursor: "pointer",
  },
  gradeBtnActive: { background: "#4f46e5", borderColor: "#4f46e5", color: "#fff" },

  spinner: {
    width: 16, height: 16, borderRadius: "50%",
    border: "2px solid #c7d2fe", borderTopColor: "#4f46e5",
    display: "inline-block", animation: "spin 0.7s linear infinite",
  },
};
