import { useMemo, useState } from "react";
import {
  useTeachingLoads,
  useCreateTeachingLoad,
  useDeleteTeachingLoad,
} from "@/hooks/journal/useTeachingLoad";
import { useTeachers } from "@/hooks/journal/useTeachers";
import { useSubjects } from "@/hooks/journal/useSubjects";
import { useClasses }  from "@/hooks/journal/useClasses";
import { styles } from "./_shared.styles";
import {
  PageHeader,
  Modal,
  ModalActions,
  Field,
  Table,
  Loading,
  Empty,
  ErrorBox,
} from "./_shared";


type FilterMode = "all" | "teacher" | "class";

interface LoadRow {
  id:        string;
  teacherId: string;
  subjectId: string;
  classId:   string;
}

export default function TeachingLoadPage() {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [filterValue, setFilterValue] = useState<string>("");

  // ── Параметры списка с учётом фильтра ────────────────────────
  const listParams = useMemo(() => {
    if (filterMode === "teacher" && filterValue) return { teacherId: filterValue };
    if (filterMode === "class"   && filterValue) return { classId:   filterValue };
    return {};
  }, [filterMode, filterValue]);

  const list = useTeachingLoads(listParams);

  // Справочники для резолва имён и для select'ов в модалке
  const teachersParams = useMemo(() => ({ limit: 0, offset: 0 }), []);
  const classesParams  = useMemo(() => ({}), []);
  const teachers = useTeachers(teachersParams);
  const subjects = useSubjects();
  const classes  = useClasses(classesParams);

  const createMut = useCreateTeachingLoad();
  const deleteMut = useDeleteTeachingLoad();

  const [modalOpen, setModalOpen] = useState(false);

  // ── Lookup-мапы id → name ───────────────────────────────────
  const teacherMap = useMemo(() => {
    const m = new Map<string, string>();
    teachers.data?.teachers?.forEach((t) => m.set(t.id, t.fullName));
    return m;
  }, [teachers.data]);

  const subjectMap = useMemo(() => {
    const m = new Map<string, string>();
    subjects.data?.subjects?.forEach((s) => m.set(s.id, s.fullName));
    return m;
  }, [subjects.data]);

  const classMap = useMemo(() => {
    const m = new Map<string, string>();
    classes.data?.classes?.forEach((c) => m.set(c.id, c.className));
    return m;
  }, [classes.data]);

  const rows = list.data?.teachingLoads ?? [];

  const handleCreate = async (values: {
    teacherId: string;
    subjectId: string;
    classId:   string;
  }) => {
    await createMut.mutate(values);
    setModalOpen(false);
    list.refetch();
  };

  const handleDelete = async (row: LoadRow) => {
    const t = teacherMap.get(row.teacherId) ?? row.teacherId;
    const s = subjectMap.get(row.subjectId) ?? row.subjectId;
    const c = classMap.get(row.classId)     ?? row.classId;
    if (!confirm(`Удалить нагрузку: ${t} → ${s} в ${c}?`)) return;
    await deleteMut.mutate({ id: row.id });
    list.refetch();
  };

  const dictsLoading = teachers.loading || subjects.loading || classes.loading;
  const dictsReady   = !dictsLoading &&
                       (teachers.data?.teachers?.length ?? 0) > 0 &&
                       (subjects.data?.subjects?.length ?? 0) > 0 &&
                       (classes.data?.classes?.length   ?? 0) > 0;

  return (
    <div style={styles.wrapper}>
      <PageHeader
        title="Учебная нагрузка"
        onCreate={() => setModalOpen(true)}
        createLabel="Назначить нагрузку"
        createDisabled={!dictsReady}
      />

      {!dictsReady && !dictsLoading && (
        <p style={styles.helper}>
          Чтобы назначить нагрузку, нужно сначала добавить хотя бы одного учителя, предмет и класс.
        </p>
      )}

      {/* ── Фильтр ───────────────────────────────────────────── */}
      <div style={styles.toolbar}>
        <Field label="Фильтр">
          <select
            value={filterMode}
            onChange={(e) => {
              setFilterMode(e.target.value as FilterMode);
              setFilterValue("");
            }}
            style={styles.input}
          >
            <option value="all">Все</option>
            <option value="teacher">По учителю</option>
            <option value="class">По классу</option>
          </select>
        </Field>

        {filterMode === "teacher" && (
          <Field label="Учитель">
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              style={styles.input}
            >
              <option value="">— выберите —</option>
              {teachers.data?.teachers?.map((t) => (
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </select>
          </Field>
        )}

        {filterMode === "class" && (
          <Field label="Класс">
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              style={styles.input}
            >
              <option value="">— выберите —</option>
              {classes.data?.classes?.map((c) => (
                <option key={c.id} value={c.id}>{c.className}</option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {list.error && <ErrorBox message={list.error} />}
      {deleteMut.error && <ErrorBox message={deleteMut.error} />}

      {list.loading || dictsLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty message="Записей о нагрузке нет." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th style={styles.th}>Учитель</th>
              <th style={styles.th}>Предмет</th>
              <th style={styles.th}>Класс</th>
              <th style={{ ...styles.th, ...styles.thActions }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={styles.td}>{teacherMap.get(r.teacherId) ?? r.teacherId}</td>
                <td style={styles.td}>{subjectMap.get(r.subjectId) ?? r.subjectId}</td>
                <td style={styles.td}>{classMap.get(r.classId)     ?? r.classId}</td>
                <td style={{ ...styles.td, ...styles.tdActions }}>
                  <button onClick={() => handleDelete(r)} style={styles.btnDanger}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {modalOpen && dictsReady && (
        <LoadFormModal
          teachers={teachers.data?.teachers ?? []}
          subjects={subjects.data?.subjects ?? []}
          classes={classes.data?.classes    ?? []}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreate}
          loading={createMut.loading}
          error={createMut.error}
        />
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────

interface LoadFormModalProps {
  teachers: { id: string; fullName:  string }[];
  subjects: { id: string; fullName:  string }[];
  classes:  { id: string; className: string }[];
  onClose:  () => void;
  onSubmit: (v: { teacherId: string; subjectId: string; classId: string }) => Promise<void>;
  loading:  boolean;
  error:    string | null;
}

function LoadFormModal({ teachers, subjects, classes, onClose, onSubmit, loading, error }: LoadFormModalProps) {
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classId,   setClassId]   = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    if (!teacherId) return setFormError("Выберите учителя");
    if (!subjectId) return setFormError("Выберите предмет");
    if (!classId)   return setFormError("Выберите класс");
    setFormError(null);

    try {
      await onSubmit({ teacherId, subjectId, classId });
    } catch { /* error из пропа */ }
  };

  return (
    <Modal title="Назначить нагрузку" onClose={onClose}>
      <Field label="Учитель">
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          disabled={loading}
          style={styles.input}
          autoFocus
        >
          <option value="">— выберите —</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.fullName}</option>
          ))}
        </select>
      </Field>

      <Field label="Предмет">
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          disabled={loading}
          style={styles.input}
        >
          <option value="">— выберите —</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.fullName}</option>
          ))}
        </select>
      </Field>

      <Field label="Класс">
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          disabled={loading}
          style={styles.input}
        >
          <option value="">— выберите —</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.className}</option>
          ))}
        </select>
      </Field>

      {(formError ?? error) && <ErrorBox message={formError ?? error!} />}

      <ModalActions>
        <button onClick={onClose} disabled={loading} style={styles.btnSecondary}>Отмена</button>
        <button onClick={submit} disabled={loading} style={styles.btnPrimary}>
          {loading ? "Сохранение…" : "Сохранить"}
        </button>
      </ModalActions>
    </Modal>
  );
}
