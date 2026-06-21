import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useTeachingLoads,
  useCreateTeachingLoad,
  useDeleteTeachingLoad,
} from "@/hooks/journal/useTeachingLoad";
import { useTeachers } from "@/hooks/journal/useTeachers";
import { useSubjects } from "@/hooks/journal/useSubjects";
import { useClasses } from "@/hooks/journal/useClasses";
import { teachingLoadStyles } from "./TeachingLoadPage.styles";

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
  const { t } = useTranslation();
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
    teacherList.forEach((teacher) => m.set(teacher.id, teacher.fullName));
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
    if (teacherList.length === 0) missing.push(t("teachingLoad.missingTeachers"));
    if (subjectList.length === 0) missing.push(t("teachingLoad.missingSubjects"));
    if (classListData.length === 0) missing.push(t("teachingLoad.missingClasses"));
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
    const teacher = teacherMap.get(row.teacherId) ?? row.teacherId;
    const subject = subjectMap.get(row.subjectId) ?? row.subjectId;
    const cls = classMap.get(row.classId) ?? row.classId;
    if (!confirm(t("teachingLoad.deleteConfirm", { teacher, subject, class: cls }))) return;
    await deleteMut.mutate({ id: row.id });
    list.refetch();
  };

  return (
    <div className="tlp">
      <PageStyles />

      <header className="tlp__head">
        <div>
          <h1 className="tlp__title">{t("teachingLoad.title")}</h1>
          <p className="tlp__subtitle">{t("teachingLoad.subtitle")}</p>
        </div>
        <button
          className="btn btn--primary"
          disabled={!canCreate}
          onClick={() => setModalOpen(true)}
          title={canCreate ? undefined : t("teachingLoad.needDicts")}
        >
          {t("teachingLoad.assign")}
        </button>
      </header>

      {missing.length > 0 && (
        <p className="tlp__hint">
          {t("teachingLoad.missingHint", { items: missing.join(", ") })}
        </p>
      )}

      {/* Фильтр */}
      <div className="tlp__card tlp__toolbar">
        <label className="tlp__field">
          <span className="tlp__muted">{t("teachingLoad.filter")}</span>
          <select
            value={filterMode}
            onChange={(e) => {
              setFilterMode(e.target.value as FilterMode);
              setFilterValue("");
            }}
          >
            <option value="all">{t("teachingLoad.filterAll")}</option>
            <option value="teacher">{t("teachingLoad.filterByTeacher")}</option>
            <option value="class">{t("teachingLoad.filterByClass")}</option>
          </select>
        </label>

        {filterMode === "teacher" && (
          <label className="tlp__field">
            <span className="tlp__muted">{t("teachingLoad.teacher")}</span>
            <select value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
              <option value="">{t("common.select")}</option>
              {teacherList.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
          </label>
        )}

        {filterMode === "class" && (
          <label className="tlp__field">
            <span className="tlp__muted">{t("teachingLoad.class")}</span>
            <select value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
              <option value="">{t("common.select")}</option>
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
          <div className="tlp__empty tlp__muted">{t("common.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="tlp__empty tlp__muted">{t("teachingLoad.empty")}</div>
        ) : (
          <table className="tlp__table">
            <thead>
              <tr>
                <th>{t("teachingLoad.teacher")}</th>
                <th>{t("teachingLoad.subject")}</th>
                <th>{t("teachingLoad.class")}</th>
                <th className="tlp__col-actions">{t("common.actions")}</th>
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
                      {t("common.delete")}
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
  const { t } = useTranslation();
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
    if (!teacherId) return setFormError(t("teachingLoad.errTeacher"));
    if (!subjectId) return setFormError(t("teachingLoad.errSubject"));
    if (!classId) return setFormError(t("teachingLoad.errClass"));
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
          <h2 className="tlp__modal-title">{t("teachingLoad.modalTitle")}</h2>
          <button className="tlp__modal-x" onClick={onClose} disabled={loading} aria-label={t("common.close")}>
            ✕
          </button>
        </div>

        <label className="tlp__field">
          <span className="tlp__muted">{t("teachingLoad.teacher")}</span>
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} disabled={loading} autoFocus>
            <option value="">{t("common.select")}</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="tlp__field">
          <span className="tlp__muted">{t("teachingLoad.subject")}</span>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={loading}>
            <option value="">{t("common.select")}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="tlp__field">
          <span className="tlp__muted">{t("teachingLoad.class")}</span>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} disabled={loading}>
            <option value="">{t("common.select")}</option>
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
            {t("common.cancel")}
          </button>
          <button className="btn btn--primary" onClick={submit} disabled={loading}>
            {loading ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Стили (та же бело-оранжевая тема, что и UsersPage) — вынесены в
 * ./TeachingLoadPage.styles.ts
 * ────────────────────────────────────────────────────────────────────────*/

function PageStyles() {
  return <style>{teachingLoadStyles}</style>;
}
