import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useStatusCodes,
  useCreateStatusCode,
  useUpdateStatusCode,
  useDeleteStatusCode,
} from "@/hooks/journal/useStatusCodes";
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

interface StatusCodeRow {
  id:       string;
  fullName: string;
}

export default function StatusCodesPage() {
  const { t } = useTranslation();
  const list = useStatusCodes();
  const createMut = useCreateStatusCode();
  const updateMut = useUpdateStatusCode();
  const deleteMut = useDeleteStatusCode();

  const [editing, setEditing] = useState<StatusCodeRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [value, setValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const codes = list.data?.statusCodes ?? [];

  const openCreate = () => {
    setEditing(null);
    setValue("");
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (c: StatusCodeRow) => {
    setEditing(c);
    setValue(c.fullName);
    setFormError(null);
    setModalOpen(true);
  };

  const submit = async () => {
    if (value.trim().length < 1) {
      setFormError(t("statusCodes.errName"));
      return;
    }
    try {
      if (editing) {
        await updateMut.mutate({ id: editing.id, fullName: value.trim() });
      } else {
        await createMut.mutate({ fullName: value.trim() });
      }
      setModalOpen(false);
      list.refetch();
    } catch {
      /* ошибка из хука */
    }
  };

  const handleDelete = async (c: StatusCodeRow) => {
    if (!confirm(t("statusCodes.deleteConfirm", { name: c.fullName }))) return;
    await deleteMut.mutate({ id: c.id });
    list.refetch();
  };

  const mutLoading = createMut.loading || updateMut.loading;
  const mutError   = createMut.error ?? updateMut.error;

  return (
    <PageWrapper>
      <PageHeader title={t("statusCodes.title")} onCreate={openCreate} createLabel={t("statusCodes.create")} />

      <p style={styles.helper}>
        {t("statusCodes.helper")}
      </p>

      {list.error && <ErrorBox message={list.error} />}
      {deleteMut.error && <ErrorBox message={deleteMut.error} />}

      {list.loading ? (
        <Loading />
      ) : codes.length === 0 ? (
        <Empty message={t("statusCodes.empty")} />
      ) : (
        <Table>
          <thead>
            <tr>
              <th style={styles.th}>{t("common.name")}</th>
              <th style={{ ...styles.th, ...styles.thActions }}>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id}>
                <td style={styles.td}>{c.fullName}</td>
                <td style={{ ...styles.td, ...styles.tdActions }}>
                  <button onClick={() => openEdit(c)} style={styles.btnSecondary}>{t("common.edit")}</button>
                  <button onClick={() => handleDelete(c)} style={styles.btnDanger}>{t("common.delete")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {modalOpen && (
        <Modal
          title={editing ? t("statusCodes.modalEdit") : t("statusCodes.modalNew")}
          onClose={() => setModalOpen(false)}
        >
          <Field label={t("common.name")}>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={mutLoading}
              style={styles.input}
              autoFocus
            />
          </Field>

          {(formError ?? mutError) && <ErrorBox message={formError ?? mutError!} />}

          <ModalActions>
            <button onClick={() => setModalOpen(false)} disabled={mutLoading} style={styles.btnSecondary}>{t("common.cancel")}</button>
            <button onClick={submit} disabled={mutLoading} style={styles.btnPrimary}>
              {mutLoading ? t("common.saving") : t("common.save")}
            </button>
          </ModalActions>
        </Modal>
      )}
    </PageWrapper>
  );
}
