import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
} from "@/hooks/journal/useClasses";
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

interface ClassRow {
  id:             string;
  className:      string;
  yearOfStudy:    number;
  graduationYear: number;
}

export default function ClassesPage() {
  const { t } = useTranslation();
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
    if (!confirm(t("classes.deleteConfirm", { name: c.className }))) return;
    await deleteMut.mutate({ id: c.id });
    list.refetch();
  };

  return (
    <PageWrapper>
      <PageHeader title={t("classes.title")} onCreate={() => { setEditing(null); setModalOpen(true); }} createLabel={t("classes.create")} />

      {list.error && <ErrorBox message={list.error} />}
      {deleteMut.error && <ErrorBox message={deleteMut.error} />}

      {list.loading ? (
        <Loading />
      ) : classes.length === 0 ? (
        <Empty message={t("classes.empty")} />
      ) : (
        <Table>
          <thead>
            <tr>
              <th style={styles.th}>{t("classes.colName")}</th>
              <th style={styles.th}>{t("classes.colYears")}</th>
              <th style={styles.th}>{t("classes.colGradYear")}</th>
              <th style={{ ...styles.th, ...styles.thActions }}>{t("common.actions")}</th>
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
                    {t("common.edit")}
                  </button>
                  <button onClick={() => handleDelete(c)} style={styles.btnDanger}>
                    {t("common.delete")}
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
    </PageWrapper>
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
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const [className,      setClassName]      = useState(initial?.className ?? "");
  const [yearOfStudy,    setYearOfStudy]    = useState<number>(initial?.yearOfStudy    ?? 1);
  const [graduationYear, setGraduationYear] = useState<number>(initial?.graduationYear ?? currentYear + 11);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    if (className.trim().length < 1) return setFormError(t("classes.errName"));
    if (yearOfStudy < 1 || yearOfStudy > 11) return setFormError(t("classes.errYears"));
    if (graduationYear < currentYear) return setFormError(t("classes.errGradYear"));
    setFormError(null);

    try {
      await onSubmit({ className: className.trim(), yearOfStudy, graduationYear });
    } catch { /* error из пропа */ }
  };

  return (
    <Modal title={initial ? t("classes.modalEdit") : t("classes.modalNew")} onClose={onClose}>
      <Field label={t("classes.fieldName")}>
        <input
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          disabled={loading}
          style={styles.input}
          autoFocus
        />
      </Field>

      <Field label={t("classes.fieldYears")}>
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

      <Field label={t("classes.fieldGradYear")}>
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
        <button onClick={onClose} disabled={loading} style={styles.btnSecondary}>{t("common.cancel")}</button>
        <button onClick={submit} disabled={loading} style={styles.btnPrimary}>
          {loading ? t("common.saving") : t("common.save")}
        </button>
      </ModalActions>
    </Modal>
  );
}
