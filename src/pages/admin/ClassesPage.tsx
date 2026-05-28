import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
} from "@/hooks/journal/useClasses";
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

interface ClassRow {
  id:             string;
  className:      string;
  yearOfStudy:    number;
  graduationYear: number;
}

export default function ClassesPage() {
  const params = useMemo(() => ({}), []);
  const list = useClasses(params);

  const createMut = useCreateClass();
  const updateMut = useUpdateClass();
  const deleteMut = useDeleteClass();

  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const classes = list.data?.classes ?? [];

  const handleSubmit = async (form: ClassFormValues) => {
    if (editing) {
      await updateMut.mutate({
        id:             editing.id,
        className:      form.className,
        yearOfStudy:    form.yearOfStudy,
        graduationYear: form.graduationYear,
      });
    } else {
      await createMut.mutate({
        className:      form.className,
        yearOfStudy:    form.yearOfStudy,
        graduationYear: form.graduationYear,
      });
    }
    setModalOpen(false);
    list.refetch();
  };

  const handleDelete = async (c: ClassRow) => {
    if (!confirm(`Удалить класс «${c.className}»?`)) return;
    await deleteMut.mutate({ id: c.id });
    list.refetch();
  };

  return (
    <div style={styles.wrapper}>
      <PageHeader title="Классы" onCreate={() => { setEditing(null); setModalOpen(true); }} createLabel="Добавить класс" />

      {list.error && <ErrorBox message={list.error} />}
      {deleteMut.error && <ErrorBox message={deleteMut.error} />}

      {list.loading ? (
        <Loading />
      ) : classes.length === 0 ? (
        <Empty message="Классов пока нет." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th style={styles.th}>Название</th>
              <th style={styles.th}>Год обучения</th>
              <th style={styles.th}>Год выпуска</th>
              <th style={{ ...styles.th, ...styles.thActions }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td style={styles.td}>
                  <Link to={`/classes/${c.id}/journal`} style={styles.link}>
                    {c.className}
                  </Link>
                </td>
                <td style={styles.td}>{c.yearOfStudy}</td>
                <td style={styles.td}>{c.graduationYear}</td>
                <td style={{ ...styles.td, ...styles.tdActions }}>
                  <button onClick={() => { setEditing(c); setModalOpen(true); }} style={styles.btnSecondary}>
                    Изменить
                  </button>
                  <button onClick={() => handleDelete(c)} style={styles.btnDanger}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {modalOpen && (
        <ClassFormModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          loading={createMut.loading || updateMut.loading}
          error={createMut.error ?? updateMut.error}
        />
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────

interface ClassFormValues {
  className:      string;
  yearOfStudy:    number;
  graduationYear: number;
}

interface ClassFormModalProps {
  initial:  ClassRow | null;
  onClose:  () => void;
  onSubmit: (values: ClassFormValues) => Promise<void>;
  loading:  boolean;
  error:    string | null;
}

function ClassFormModal({ initial, onClose, onSubmit, loading, error }: ClassFormModalProps) {
  const currentYear = new Date().getFullYear();

  const [className,      setClassName]      = useState(initial?.className ?? "");
  const [yearOfStudy,    setYearOfStudy]    = useState<number>(initial?.yearOfStudy    ?? 1);
  const [graduationYear, setGraduationYear] = useState<number>(initial?.graduationYear ?? currentYear + 11);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    if (className.trim().length < 1) return setFormError("Введите название класса");
    if (yearOfStudy < 1 || yearOfStudy > 11) return setFormError("Год обучения должен быть от 1 до 11");
    if (graduationYear < currentYear) return setFormError("Год выпуска не может быть в прошлом");
    setFormError(null);

    try {
      await onSubmit({ className: className.trim(), yearOfStudy, graduationYear });
    } catch { /* error из пропа */ }
  };

  return (
    <Modal title={initial ? "Изменить класс" : "Новый класс"} onClose={onClose}>
      <Field label="Название (например, «5А»)">
        <input
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          disabled={loading}
          style={styles.input}
          autoFocus
        />
      </Field>

      <Field label="Год обучения (1—11)">
        <input
          type="number"
          min={1}
          max={11}
          value={yearOfStudy}
          onChange={(e) => setYearOfStudy(Number(e.target.value))}
          disabled={loading}
          style={styles.input}
        />
      </Field>

      <Field label="Год выпуска">
        <input
          type="number"
          min={currentYear}
          value={graduationYear}
          onChange={(e) => setGraduationYear(Number(e.target.value))}
          disabled={loading}
          style={styles.input}
        />
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
