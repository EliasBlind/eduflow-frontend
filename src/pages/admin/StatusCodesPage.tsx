import { useState } from "react";
import {
  useStatusCodes,
  useCreateStatusCode,
  useUpdateStatusCode,
  useDeleteStatusCode,
} from "@/hooks/journal/useStatusCodes";
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

interface StatusCodeRow {
  id:       string;
  fullName: string;
}

export default function StatusCodesPage() {
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
      setFormError("Введите название");
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
    if (!confirm(`Удалить статус-код «${c.fullName}»?`)) return;
    await deleteMut.mutate({ id: c.id });
    list.refetch();
  };

  const mutLoading = createMut.loading || updateMut.loading;
  const mutError   = createMut.error ?? updateMut.error;

  return (
    <div style={styles.wrapper}>
      <PageHeader title="Статус-коды" onCreate={openCreate} createLabel="Добавить код" />

      <p style={styles.helper}>
        Статус-коды используются в журнале вместо оценок (например, «Н» — отсутствовал, «Б» — болен).
      </p>

      {list.error && <ErrorBox message={list.error} />}
      {deleteMut.error && <ErrorBox message={deleteMut.error} />}

      {list.loading ? (
        <Loading />
      ) : codes.length === 0 ? (
        <Empty message="Статус-кодов пока нет." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th style={styles.th}>Название</th>
              <th style={{ ...styles.th, ...styles.thActions }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id}>
                <td style={styles.td}>{c.fullName}</td>
                <td style={{ ...styles.td, ...styles.tdActions }}>
                  <button onClick={() => openEdit(c)} style={styles.btnSecondary}>Изменить</button>
                  <button onClick={() => handleDelete(c)} style={styles.btnDanger}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {modalOpen && (
        <Modal
          title={editing ? "Изменить статус-код" : "Новый статус-код"}
          onClose={() => setModalOpen(false)}
        >
          <Field label="Название">
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
            <button onClick={() => setModalOpen(false)} disabled={mutLoading} style={styles.btnSecondary}>Отмена</button>
            <button onClick={submit} disabled={mutLoading} style={styles.btnPrimary}>
              {mutLoading ? "Сохранение…" : "Сохранить"}
            </button>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}
