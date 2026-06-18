import { useEffect, useMemo, useState } from "react";
import {
  useTeachingLoads,
  useCreateTeachingLoad,
  useDeleteTeachingLoad,
} from "@/hooks/journal/useTeachingLoad";
import { useTeachers } from "@/hooks/journal/useTeachers";
import { useSubjects } from "@/hooks/journal/useSubjects";
import { useClasses } from "@/hooks/journal/useClasses";

/* ──────────────────────────────────────────────────────────────────────────
 * Типы
 * ────────────────────────────────────────────────────────────────────────*/

type FilterMode = "all" | "teacher" | "class";

interface LoadRow {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
}

interface NamedFull {
  id: string;
  fullName: string;
}
interface NamedClass {
  id: string;
  className: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Страница
 * ────────────────────────────────────────────────────────────────────────*/

export default function TeachingLoadPage() {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [filterValue, setFilterValue] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);

  // Параметры списка с учётом фильтра.
  const listParams = useMemo(() => {
    if (filterMode === "teacher" && filterValue) return { teacherId: filterValue };
    if (filterMode === "class" && filterValue) return { classId: filterValue };
    return {};
  }, [filterMode, filterValue]);

  const list = useTeachingLoads(listParams);

  // Справочники. limit берём заведомо большим: limit: 0 на бэке трактуется
  // как «ноль записей», из-за чего список учителей приходил пустым.
  const teachersParams = useMemo(() => ({ limit: 1000, offset: 0 }), []);
  const classesParams = useMemo(() => ({}), []);
  const teachers = useTeachers(teachersParams);
  const subjects = useSubjects();
  const classes = useClasses(classesParams);

  const createMut = useCreateTeachingLoad();
  const deleteMut = useDeleteTeachingLoad();

  const teacherList = useMemo<NamedFull[]>(
    () => (teachers.data?.teachers ?? []) as NamedFull[],
    [teachers.data],
  );
  const subjectList = useMemo<NamedFull[]>(
    () => (subjects.data?.subjects ?? []) as NamedFull[],
    [subjects.data],
  );
  const classListData = useMemo<NamedClass[]>(
    () => (classes.data?.classes ?? []) as NamedClass[],
    [classes.data],
  );

  // Lookup-мапы id → имя.
  const teacherMap = useMemo(() => {
    const m = new Map<string, string>();
    teacherList.forEach((t) => m.set(t.id, t.fullName));
    return m;
  }, [teacherList]);

  const subjectMap = useMemo(() => {
    const m = new Map<string, string>();
    subjectList.forEach((s) => m.set(s.id, s.fullName));
    return m;
  }, [subjectList]);

  const classMap = useMemo(() => {
    const m = new Map<string, string>();
    classListData.forEach((c) => m.set(c.id, c.className));
    return m;
  }, [classListData]);

  const rows = (list.data?.teachingLoads ?? []) as LoadRow[];

  const dictsLoading = teachers.loading || subjects.loading || classes.loading;
  // Чего из справочников не хватает, чтобы вообще можно было назначить нагрузку.
  const missing: string[] = [];
  if (!dictsLoading) {
    if (teacherList.length === 0) missing.push("учителя");
    if (subjectList.length === 0) missing.push("предметы");
    if (classListData.length === 0) missing.push("классы");
  }
  const canCreate = !dictsLoading && missing.length === 0;

  const handleCreate = async (values: LoadRow) => {
    await createMut.mutate({
      teacherId: values.teacherId,
      subjectId: values.subjectId,
      classId: values.classId,
    });
    setModalOpen(false);
    list.refetch();
  };

  const handleDelete = async (row: LoadRow) => {
    const t = teacherMap.get(row.teacherId) ?? row.teacherId;
    const s = subjectMap.get(row.subjectId) ?? row.subjectId;
    const c = classMap.get(row.classId) ?? row.classId;
    if (!confirm(`Удалить нагрузку: ${t} → ${s} в ${c}?`)) return;
    await deleteMut.mutate({ id: row.id });
    list.refetch();
  };

  return (
    <div className="tlp">
      <PageStyles />

      <header className="tlp__head">
        <div>
          <h1 className="tlp__title">Учебная нагрузка</h1>
          <p className="tlp__subtitle">Назначение предметов учителям по классам.</p>
        </div>
        <button
          className="btn btn--primary"
          disabled={!canCreate}
          onClick={() => setModalOpen(true)}
          title={canCreate ? undefined : "Сначала добавьте справочники"}
        >
          Назначить нагрузку
        </button>
      </header>

      {missing.length > 0 && (
        <p className="tlp__hint">
          Чтобы назначить нагрузку, сначала добавьте: {missing.join(", ")}.
        </p>
      )}

      {/* Фильтр */}
      <div className="tlp__card tlp__toolbar">
        <label className="tlp__field">
          <span className="tlp__muted">Фильтр</span>
          <select
            value={filterMode}
            onChange={(e) => {
              setFilterMode(e.target.value as FilterMode);
              setFilterValue("");
            }}
          >
            <option value="all">Все</option>
            <option value="teacher">По учителю</option>
            <option value="class">По классу</option>
          </select>
        </label>

        {filterMode === "teacher" && (
          <label className="tlp__field">
            <span className="tlp__muted">Учитель</span>
            <select value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
              <option value="">— выберите —</option>
              {teacherList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </label>
        )}

        {filterMode === "class" && (
          <label className="tlp__field">
            <span className="tlp__muted">Класс</span>
            <select value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
              <option value="">— выберите —</option>
              {classListData.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {list.error && <p className="tlp__error">{list.error}</p>}
      {deleteMut.error && <p className="tlp__error">{deleteMut.error}</p>}

      <div className="tlp__card tlp__table-wrap">
        {list.loading || dictsLoading ? (
          <div className="tlp__empty tlp__muted">Загрузка…</div>
        ) : rows.length === 0 ? (
          <div className="tlp__empty tlp__muted">Записей о нагрузке нет.</div>
        ) : (
          <table className="tlp__table">
            <thead>
              <tr>
                <th>Учитель</th>
                <th>Предмет</th>
                <th>Класс</th>
                <th className="tlp__col-actions">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{teacherMap.get(r.teacherId) ?? r.teacherId}</td>
                  <td>{subjectMap.get(r.subjectId) ?? r.subjectId}</td>
                  <td>{classMap.get(r.classId) ?? r.classId}</td>
                  <td className="tlp__col-actions">
                    <button className="btn btn--danger btn--sm" onClick={() => handleDelete(r)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && canCreate && (
        <LoadFormModal
          teachers={teacherList}
          subjects={subjectList}
          classes={classListData}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreate}
          loading={createMut.loading}
          error={createMut.error}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Модалка создания
 * ────────────────────────────────────────────────────────────────────────*/

interface LoadFormModalProps {
  teachers: NamedFull[];
  subjects: NamedFull[];
  classes: NamedClass[];
  onClose: () => void;
  onSubmit: (v: LoadRow) => Promise<void>;
  loading: boolean;
  error: string | null;
}

function LoadFormModal({
  teachers,
  subjects,
  classes,
  onClose,
  onSubmit,
  loading,
  error,
}: LoadFormModalProps) {
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Esc закрывает модалку.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, loading]);

  const submit = async () => {
    if (!teacherId) return setFormError("Выберите учителя");
    if (!subjectId) return setFormError("Выберите предмет");
    if (!classId) return setFormError("Выберите класс");
    setFormError(null);
    try {
      await onSubmit({ id: "", teacherId, subjectId, classId });
    } catch {
      /* ошибка придёт через проп error */
    }
  };

  return (
    <div className="tlp__overlay" onClick={() => !loading && onClose()}>
      <div className="tlp__modal" onClick={(e) => e.stopPropagation()}>
        <div className="tlp__modal-head">
          <h2 className="tlp__modal-title">Назначить нагрузку</h2>
          <button className="tlp__modal-x" onClick={onClose} disabled={loading} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <label className="tlp__field">
          <span className="tlp__muted">Учитель</span>
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} disabled={loading} autoFocus>
            <option value="">— выберите —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="tlp__field">
          <span className="tlp__muted">Предмет</span>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={loading}>
            <option value="">— выберите —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="tlp__field">
          <span className="tlp__muted">Класс</span>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} disabled={loading}>
            <option value="">— выберите —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className}
              </option>
            ))}
          </select>
        </label>

        {(formError ?? error) && <p className="tlp__error">{formError ?? error}</p>}

        <div className="tlp__modal-actions">
          <button className="btn btn--ghost" onClick={onClose} disabled={loading}>
            Отмена
          </button>
          <button className="btn btn--primary" onClick={submit} disabled={loading}>
            {loading ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Стили (та же бело-оранжевая тема, что и UsersPage)
 * ────────────────────────────────────────────────────────────────────────*/

function PageStyles() {
  return (
    <style>{`
      .tlp {
        --orange: #f97316;
        --orange-dark: #ea580c;
        --orange-soft: #fff7ed;
        --orange-border: #fed7aa;
        --ink: #1f2937;
        --muted: #6b7280;
        --line: #f0f0f0;
        --err: #dc2626;
        --err-bg: #fef2f2;

        max-width: 1080px;
        margin: 0 auto;
        padding: 32px 20px 64px;
        color: var(--ink);
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }

      .tlp__head {
        display: flex; align-items: flex-start; justify-content: space-between;
        gap: 16px; flex-wrap: wrap; margin-bottom: 16px;
      }
      .tlp__title { font-size: 26px; font-weight: 700; margin: 0; }
      .tlp__subtitle { margin: 6px 0 0; color: var(--muted); font-size: 14px; }
      .tlp__muted { color: var(--muted); font-size: 13px; }

      .tlp__hint {
        margin: 0 0 16px; font-size: 14px; color: var(--orange-dark);
        background: var(--orange-soft); border: 1px solid var(--orange-border);
        border-radius: 10px; padding: 10px 14px;
      }

      .tlp__card {
        background: #fff; border: 1px solid var(--line); border-radius: 14px;
        padding: 18px; box-shadow: 0 1px 2px rgba(0,0,0,.03); margin-bottom: 16px;
      }

      .tlp__toolbar { display: flex; gap: 18px; flex-wrap: wrap; align-items: flex-end; }
      .tlp__field { display: flex; flex-direction: column; gap: 6px; min-width: 200px; }

      .tlp__field select {
        width: 100%; box-sizing: border-box; border: 1px solid #e5e7eb;
        border-radius: 8px; padding: 8px 10px; font-size: 14px; background: #fff;
        color: var(--ink); font-family: inherit;
      }
      .tlp__field select:focus {
        outline: none; border-color: var(--orange); box-shadow: 0 0 0 3px rgba(249,115,22,.15);
      }

      .tlp__table-wrap { padding: 0; overflow-x: auto; }
      .tlp__table { width: 100%; border-collapse: collapse; font-size: 14px; }
      .tlp__table th {
        text-align: left; padding: 12px 14px; background: var(--orange-soft);
        color: var(--orange-dark); font-weight: 600; font-size: 12px;
        text-transform: uppercase; letter-spacing: .03em; white-space: nowrap;
      }
      .tlp__table td { padding: 10px 14px; border-top: 1px solid var(--line); }
      .tlp__table tbody tr:hover { background: #fffdfa; }
      .tlp__col-actions { text-align: right; width: 130px; }

      .tlp__empty { padding: 48px 20px; text-align: center; }

      .tlp__error {
        margin: 0 0 16px; color: var(--err); background: var(--err-bg);
        border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; font-size: 14px;
      }

      .btn {
        border: none; border-radius: 9px; padding: 10px 18px; font-size: 14px;
        font-weight: 600; cursor: pointer; font-family: inherit;
        transition: background .15s, border-color .15s;
      }
      .btn--sm { padding: 7px 12px; font-size: 13px; }
      .btn--primary { background: var(--orange); color: #fff; }
      .btn--primary:hover:not(:disabled) { background: var(--orange-dark); }
      .btn--ghost { background: #fff; color: var(--orange-dark); border: 1px solid var(--orange-border); }
      .btn--ghost:hover:not(:disabled) { background: var(--orange-soft); }
      .btn--danger { background: #fff; color: var(--err); border: 1px solid #fecaca; }
      .btn--danger:hover:not(:disabled) { background: var(--err-bg); }
      .btn:disabled { opacity: .5; cursor: not-allowed; }

      .tlp__overlay {
        position: fixed; inset: 0; background: rgba(17,24,39,.45);
        display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 50;
      }
      .tlp__modal {
        background: #fff; border-radius: 16px; width: 100%; max-width: 420px;
        padding: 22px; box-shadow: 0 20px 50px rgba(0,0,0,.25);
        display: flex; flex-direction: column; gap: 14px;
      }
      .tlp__modal-head { display: flex; align-items: center; justify-content: space-between; }
      .tlp__modal-title { margin: 0; font-size: 18px; font-weight: 700; }
      .tlp__modal-x {
        background: none; border: none; font-size: 16px; color: var(--muted);
        cursor: pointer; padding: 4px 8px; border-radius: 6px;
      }
      .tlp__modal-x:hover:not(:disabled) { background: var(--line); color: var(--ink); }
      .tlp__modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }

      @media (max-width: 640px) {
        .tlp { padding: 20px 14px 48px; }
        .tlp__head { flex-direction: column; align-items: stretch; }
        .tlp__field { min-width: 0; }
      }
    `}</style>
  );
}

