import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from "@/hooks/journal/useSubjects";
import { styles } from "./_shared.styles";
import {
  PageWrapper,
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
  const { t } = useTranslation();
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
    if (!confirm(t("subjects.deleteConfirm", { name: s.fullName }))) return;
    await deleteMut.mutate({ id: s.id });
    list.refetch();
  };

  return (
    <PageWrapper>
      <PageHeader title={t("subjects.title")} onCreate={openCreate} createLabel={t("subjects.create")} />

      {list.error && <ErrorBox message={list.error} />}
      {deleteMut.error && <ErrorBox message={deleteMut.error} />}

      {list.loading ? (
        <Loading />
      ) : subjects.length === 0 ? (
        <Empty message={t("subjects.empty")} />
      ) : (
        <Table>
          <thead>
            <tr>
              <th style={styles.th}>{t("common.name")}</th>
              <th style={{ ...styles.th, ...styles.thActions }}>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id}>
                <td style={styles.td}>{s.fullName}</td>
                <td style={{ ...styles.td, ...styles.tdActions }}>
                  <button onClick={() => openEdit(s)} style={styles.btnSecondary}>{t("common.edit")}</button>
                  <button onClick={() => handleDelete(s)} style={styles.btnDanger}>{t("common.delete")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {modalOpen && (
        <SimpleNameModal
          title={editing ? t("subjects.modalEdit") : t("subjects.modalNew")}
          initialValue={editing?.fullName ?? ""}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          loading={createMut.loading || updateMut.loading}
          error={createMut.error ?? updateMut.error}
        />
      )}
    </PageWrapper>
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
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    if (value.trim().length < 2) {
      setFormError(t("subjects.errShort"));
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
      <Field label={t("common.name")}>
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
        <button onClick={onClose} disabled={loading} style={styles.btnSecondary}>{t("common.cancel")}</button>
        <button onClick={submit} disabled={loading} style={styles.btnPrimary}>
          {loading ? t("common.saving") : t("common.save")}
        </button>
      </ModalActions>
    </Modal>
  );
}
