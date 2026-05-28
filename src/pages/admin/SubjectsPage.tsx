import { useState } from "react";
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from "@/hooks/journal/useSubjects";
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

interface SubjectRow {
  id:       string;
  fullName: string;
}

export default function SubjectsPage() {
  const list = useSubjects();
  const createMut = useCreateSubject();
  const updateMut = useUpdateSubject();
  const deleteMut = useDeleteSubject();

  const [editing, setEditing] = useState<SubjectRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const subjects = list.data?.subjects ?? [];

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (s: SubjectRow) => { setEditing(s); setModalOpen(true); };

  const handleSubmit = async (fullName: string) => {
    if (editing) {
      await updateMut.mutate({ id: editing.id, fullName });
    } else {
      await createMut.mutate({ fullName });
    }
    setModalOpen(false);
    list.refetch();
  };

  const handleDelete = async (s: SubjectRow) => {
    if (!confirm(`Удалить предмет «${s.fullName}»?`)) return;
    await deleteMut.mutate({ id: s.id });
    list.refetch();
  };

  return (
    <div style={styles.wrapper}>
      <PageHeader title="Предметы" onCreate={openCreate} createLabel="Добавить предмет" />

      {list.error && <ErrorBox message={list.error} />}
      {deleteMut.error && <ErrorBox message={deleteMut.error} />}

      {list.loading ? (
        <Loading />
      ) : subjects.length === 0 ? (
        <Empty message="Предметов пока нет." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th style={styles.th}>Название</th>
              <th style={{ ...styles.th, ...styles.thActions }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id}>
                <td style={styles.td}>{s.fullName}</td>
                <td style={{ ...styles.td, ...styles.tdActions }}>
                  <button onClick={() => openEdit(s)} style={styles.btnSecondary}>Изменить</button>
                  <button onClick={() => handleDelete(s)} style={styles.btnDanger}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {modalOpen && (
        <SimpleNameModal
          title={editing ? "Изменить предмет" : "Новый предмет"}
          initialValue={editing?.fullName ?? ""}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          loading={createMut.loading || updateMut.loading}
          error={createMut.error ?? updateMut.error}
        />
      )}
    </div>
  );
}

// ── Reusable single-field modal ───────────────────────────────

interface SimpleNameModalProps {
  title:        string;
  initialValue: string;
  onClose:      () => void;
  onSubmit:     (value: string) => Promise<void>;
  loading:      boolean;
  error:        string | null;
}

function SimpleNameModal({ title, initialValue, onClose, onSubmit, loading, error }: SimpleNameModalProps) {
  const [value, setValue] = useState(initialValue);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    if (value.trim().length < 2) {
      setFormError("Название слишком короткое");
      return;
    }
    setFormError(null);
    try {
      await onSubmit(value.trim());
    } catch {
      /* error отображается из пропа */
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <Field label="Название">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
          style={styles.input}
          autoFocus
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
