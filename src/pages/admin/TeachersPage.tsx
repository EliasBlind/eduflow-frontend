import { useMemo, useState } from "react";
import {
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
} from "@/hooks/journal/useTeachers";

interface TeacherRow {
  id:       string;
  fullName: string;
}

export default function TeachersPage() {
  const listParams = useMemo(() => ({ limit: 0, offset: 0 }), []);
  const list = useTeachers(listParams);

  const createMut = useCreateTeacher();
  const updateMut = useUpdateTeacher();
  const deleteMut = useDeleteTeacher();

  const [editing, setEditing] = useState<TeacherRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const teachers = list.data?.teachers ?? [];

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (t: TeacherRow) => { setEditing(t); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const handleSubmit = async (fullName: string) => {
    if (editing) {
      await updateMut.mutate({ id: editing.id, fullName });
    } else {
      await createMut.mutate({ fullName });
    }
    closeModal();
    list.refetch();
  };

  const handleDelete = async (t: TeacherRow) => {
    if (!confirm(`Удалить учителя «${t.fullName}»?`)) return;
    await deleteMut.mutate({ id: t.id });
    list.refetch();
  };

  return (
    <div style={styles.wrapper}>
      <PageHeader title="Учителя" onCreate={openCreate} createLabel="Добавить учителя" />

      {list.error && <ErrorBox message={list.error} />}
      {deleteMut.error && <ErrorBox message={deleteMut.error} />}

      {list.loading ? (
        <Loading />
      ) : teachers.length === 0 ? (
        <Empty message="Учителей пока нет." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th style={styles.th}>ФИО</th>
              <th style={{ ...styles.th, ...styles.thActions }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id}>
                <td style={styles.td}>{t.fullName}</td>
                <td style={{ ...styles.td, ...styles.tdActions }}>
                  <button onClick={() => openEdit(t)} style={styles.btnSecondary}>
                    Изменить
                  </button>
                  <button onClick={() => handleDelete(t)} style={styles.btnDanger}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {modalOpen && (
        <TeacherFormModal
          initial={editing}
          onClose={closeModal}
          onSubmit={handleSubmit}
          loading={createMut.loading || updateMut.loading}
          error={createMut.error ?? updateMut.error}
        />
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────

interface TeacherFormModalProps {
  initial:  TeacherRow | null;
  onClose:  () => void;
  onSubmit: (fullName: string) => Promise<void>;
  loading:  boolean;
  error:    string | null;
}

function TeacherFormModal({ initial, onClose, onSubmit, loading, error }: TeacherFormModalProps) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    if (fullName.trim().length < 2) {
      setFormError("ФИО должно содержать минимум 2 символа");
      return;
    }
    setFormError(null);
    try {
      await onSubmit(fullName.trim());
    } catch {
      // ошибка в `error` пропе
    }
  };

  return (
    <Modal title={initial ? "Изменить учителя" : "Новый учитель"} onClose={onClose}>
      <Field label="ФИО">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
          style={styles.input}
          autoFocus
        />
      </Field>

      {(formError ?? error) && <ErrorBox message={formError ?? error!} />}

      <ModalActions>
        <button onClick={onClose} disabled={loading} style={styles.btnSecondary}>
          Отмена
        </button>
        <button onClick={submit} disabled={loading} style={styles.btnPrimary}>
          {loading ? "Сохранение…" : "Сохранить"}
        </button>
      </ModalActions>
    </Modal>
  );
}

import { styles } from "./_shared.styles"
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
