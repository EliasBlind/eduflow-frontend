import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileUploader } from "@/components/ui/LoadFile";
import { utils, write } from "xlsx";
import { ExelFile } from "@/utils/exclFile/get-exel";
import { Person, Role, type TRole } from "@/domain/person";
import type { User } from "@/api/gen/sso/sso";
import type { Class } from "@/api/gen/journal/journal";
import { classes as classesApi, students as studentsApi } from "@/api/client";
import { useImportUsers, useListUsers, useSetRole } from "@/hooks/auth";
import { useCreateClass, useCreateStudent, useCreateTeacher, useUpdateStudent } from "@/hooks/journal";
import { usersPageStyles } from "./UsersPage.styles";

/* ──────────────────────────────────────────────────────────────────────────
 * Справочники
 * ────────────────────────────────────────────────────────────────────────*/

/** Роль → ключ перевода. Сам перевод берём через t(roleKey(role)) в компоненте. */
const ROLE_KEYS: Record<string, string> = {
  [Role.Admin]: "roles.admin",
  [Role.Teacher]: "roles.teacher",
  [Role.Student]: "roles.student",
  [Role.Unauthorized]: "roles.unassigned",
};

/** Роли, которые можно назначить (без «пустой»). */
const ASSIGNABLE_ROLES: TRole[] = [Role.Student, Role.Teacher, Role.Admin, Role.Unauthorized];

function roleKey(role: TRole | string | undefined): string {
  return ROLE_KEYS[role ?? ""] ?? "roles.unassigned";
}

/* ──────────────────────────────────────────────────────────────────────────
 * Утилиты
 * ────────────────────────────────────────────────────────────────────────*/

function generatePassword(len = 10): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789;:.|-/";
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[buf[i] % alphabet.length];
  return out;
}

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Собирает .xlsx из массива строк и отдаёт на скачивание. */
function downloadXlsx(
  aoa: (string | number)[][],
  sheetName: string,
  filename: string,
  colWidths?: number[],
) {
  const ws = utils.aoa_to_sheet(aoa);
  if (colWidths) ws["!cols"] = colWidths.map((wch) => ({ wch }));
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, sheetName);
  const out = write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  downloadBlob(new Uint8Array(out), filename, XLSX_MIME);
}

/* ──────────────────────────────────────────────────────────────────────────
 * Тип строки предпросмотра импорта
 * ────────────────────────────────────────────────────────────────────────*/

interface ImportRow {
  id: string;
  login: string;
  email: string;
  password: string;
  group: string;
  role: TRole;
  /** роль проставлена дефолтом (а не из файла) — обновляется при смене дефолта */
  autoRole: boolean;
  /** пароль сгенерирован автоматически */
  autoPwd: boolean;
  include: boolean;
}

function rowFromPerson(
  p: Person,
  index: number,
  defaultRole: TRole,
  autoPassword: boolean,
): ImportRow {
  const login = p.login ?? "";
  const email = p.email ?? "";
  // роль из файла, только если она реальная (не пустая); иначе — дефолт
  const fromFileRole = p.role && (p.role as string) !== Role.Unauthorized ? p.role : undefined;
  const autoRole = !fromFileRole;
  const role = (fromFileRole ?? defaultRole) as TRole;

  const hasPwd = !!p.password;
  const autoPwd = !hasPwd && autoPassword;
  const password = hasPwd ? (p.password as string) : autoPassword ? generatePassword() : "";

  const isBlank = !login && !email && !p.password && !p.group;

  return {
    id: `row-${index}-${Math.random().toString(36).slice(2, 8)}`,
    login,
    email,
    password,
    group: p.group ?? "",
    role,
    autoRole,
    autoPwd,
    include: !isBlank,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Главный компонент
 * ────────────────────────────────────────────────────────────────────────*/

type TabKey = "import" | "manage";

export default function UsersPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>("import");

  return (
    <div className="usp">
      <PageStyles />

      <header className="usp__head">
        <div>
          <h1 className="usp__title">{t("users.title")}</h1>
          <p className="usp__subtitle">
            {t("users.subtitle")}
          </p>
        </div>
      </header>

      <nav className="usp__tabs" role="tablist" aria-label={t("users.tabsAria")}>
        <button
          role="tab"
          aria-selected={tab === "import"}
          className={`usp__tab ${tab === "import" ? "is-active" : ""}`}
          onClick={() => setTab("import")}
        >
          {t("users.tabImport")}
        </button>
        <button
          role="tab"
          aria-selected={tab === "manage"}
          className={`usp__tab ${tab === "manage" ? "is-active" : ""}`}
          onClick={() => setTab("manage")}
        >
          {t("users.tabManage")}
        </button>
      </nav>

      {tab === "import" ? <ImportTab onDone={() => setTab("manage")} /> : <ManageTab />}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Вкладка «Импорт из Excel»
 * ────────────────────────────────────────────────────────────────────────*/

function ImportTab({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const roleLabel = (role: TRole | string | undefined) => t(roleKey(role));

  const { importUsers } = useImportUsers();
  const createClass = useCreateClass();
  const createStudent = useCreateStudent();
  const createTeacher = useCreateTeacher();

  // Классы грузим РОВНО ОДИН раз за монтирование, напрямую через клиент,
  // без useQuery — это исключает повторные запросы при ре-рендерах.
  const [classList, setClassList] = useState<Class[]>([]);

  useEffect(() => {
    let cancelled = false;
    classesApi
      .listClasses({})
      .then((res) => {
        if (!cancelled) setClassList(res?.classes ?? []);
      })
      .catch(() => {
        if (!cancelled) setClassList([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshClasses = async () => {
    try {
      const res = await classesApi.listClasses({});
      setClassList(res?.classes ?? []);
    } catch {
      /* список не критичен для результата создания */
    }
  };

  const classNames = useMemo(
    () => classList.map((c) => c.className).filter((n): n is string => !!n),
    [classList],
  );

  const [exel, setExel] = useState<ExelFile | null>(null);
  const [fileName, setFileName] = useState("");
  const [sheetIndex, setSheetIndex] = useState(0);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [defaultRole, setDefaultRole] = useState<TRole>(Role.Student);
  const [autoPassword, setAutoPassword] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<{ count: number; users: ImportRow[] } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const parseSheet = useCallback(
    (ef: ExelFile, idx: number, role: TRole, autoPwd: boolean) => {
      ef.currentPageNumber = idx;
      const persons = ef.parseCurrentPage();
      setRows(persons.map((p, i) => rowFromPerson(p, i, role, autoPwd)));
    },
    [],
  );

  const handleFile = useCallback(
    async (file: File) => {
      setFileError(null);
      setResult(null);
      setSubmitError(null);
      try {
        const ef = await ExelFile.create(file);
        setExel(ef);
        setFileName(file.name);
        setSheetIndex(0);
        parseSheet(ef, 0, defaultRole, autoPassword);
      } catch {
        setExel(null);
        setRows([]);
        setFileName("");
        setFileError(t("users.fileOpenError"));
      }
    },
    [parseSheet, defaultRole, autoPassword, t],
  );

  const selectSheet = (idx: number) => {
    if (!exel) return;
    setSheetIndex(idx);
    parseSheet(exel, idx, defaultRole, autoPassword);
  };

  // Смена дефолтной роли — обновляем только строки, где роль проставлена авто.
  const changeDefaultRole = (role: TRole) => {
    setDefaultRole(role);
    setRows((prev) => prev.map((r) => (r.autoRole ? { ...r, role } : r)));
  };

  // Тумблер авто-пароля: включаем — заполняем пустые; выключаем — чистим сгенерированные.
  const toggleAutoPassword = (on: boolean) => {
    setAutoPassword(on);
    setRows((prev) =>
      prev.map((r) => {
        if (on && !r.password) return { ...r, password: generatePassword(), autoPwd: true };
        if (!on && r.autoPwd) return { ...r, password: "", autoPwd: false };
        return r;
      }),
    );
  };

  const patchRow = (id: string, patch: Partial<ImportRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  // Ручное добавление: пустая строка с текущими дефолтами.
  const addBlankRow = () => {
    setResult(null);
    setRows((prev) => [
      ...prev,
      {
        id: `row-manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        login: "",
        email: "",
        password: autoPassword ? generatePassword() : "",
        group: "",
        role: defaultRole,
        autoRole: true,
        autoPwd: autoPassword,
        include: true,
      },
    ]);
  };

  // Дубликаты внутри включённых строк (по email и по логину).
  const duplicates = useMemo(() => {
    const emails = new Map<string, number>();
    const logins = new Map<string, number>();
    for (const r of rows) {
      if (!r.include) continue;
      if (r.email) emails.set(r.email.toLowerCase(), (emails.get(r.email.toLowerCase()) ?? 0) + 1);
      if (r.login) logins.set(r.login.toLowerCase(), (logins.get(r.login.toLowerCase()) ?? 0) + 1);
    }
    const dupIds = new Set<string>();
    for (const r of rows) {
      if (!r.include) continue;
      if (r.email && (emails.get(r.email.toLowerCase()) ?? 0) > 1) dupIds.add(r.id);
      if (r.login && (logins.get(r.login.toLowerCase()) ?? 0) > 1) dupIds.add(r.id);
    }
    return dupIds;
  }, [rows]);

  /** Возвращает текст ошибки строки или null, если всё валидно. */
  const validateRow = useCallback(
    (r: ImportRow): string | null => {
      if (!r.role) return t("users.errNoRole");
      const person = new Person(r.login, r.email, r.password, r.group, r.role);
      // Сообщения person.validate() приходят из domain/person.ts и здесь не
      // локализуются — при необходимости переведите их там же.
      return person.validate();
    },
    [t],
  );

  const rowIssue = (r: ImportRow): string | null => {
    if (duplicates.has(r.id)) return t("users.errDuplicate");
    return validateRow(r);
  };

  const stats = useMemo(() => {
    let ready = 0;
    let errors = 0;
    for (const r of rows) {
      if (!r.include) continue;
      const issue = duplicates.has(r.id) ? "dup" : validateRow(r);
      if (issue) errors++;
      else ready++;
    }
    return { total: rows.length, ready, errors };
  }, [rows, duplicates, validateRow]);

  const submit = async () => {
    setSubmitError(null);
    const valid = rows.filter((r) => r.include && !rowIssue(r));
    if (valid.length === 0) return;

    // Каждому — свой uuid: им связываем учётную запись (SSO) и запись в журнале.
    const prepared = valid.map((r) => ({ row: r, id: crypto.randomUUID() }));

    setSubmitting(true);
    try {
      // 1. Учётные записи (SSO Auth).
      const users: User[] = prepared.map(({ row, id }) => ({
        id,
        login: row.login,
        email: row.email,
        password: row.password,
        role: row.role,
      }));
      await importUsers(users);

      // 2. Классы: берём существующие, недостающие создаём; собираем имя → id.
      const nameToId = new Map<string, string>();
      for (const c of classList) {
        if (c.className && c.id) nameToId.set(c.className.trim().toLowerCase(), c.id);
      }
      const wantedClasses = Array.from(
        new Set<string>(
          prepared
            .filter(({ row }) => row.role === Role.Student)
            .map(({ row }) => row.group.trim())
            .filter((g) => g.length > 0),
        ),
      );
      for (const name of wantedClasses) {
        if (nameToId.has(name.toLowerCase())) continue;
        const match = name.match(/\d+/);
        const created = await createClass.mutate({
          className: name,
          yearOfStudy: match ? Number(match[0]) : 1,
        });
        if (created?.id) nameToId.set(name.toLowerCase(), created.id);
      }

      // 3. Записи в журнале: студент — с классом, учитель — без. Админ — только SSO.
      for (const { row, id } of prepared) {
        if (row.role === Role.Student) {
          await createStudent.mutate({
            id,
            fullName: row.login,
            classId: row.group ? nameToId.get(row.group.trim().toLowerCase()) : undefined,
          });
        } else if (row.role === Role.Teacher) {
          await createTeacher.mutate({ id, fullName: row.login });
        }
      }

      await refreshClasses();
      setResult({ count: valid.length, users: valid });
      setRows([]);
      setExel(null);
      setFileName("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("users.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  const exportCredentials = () => {
    if (!result) return;
    const aoa: (string | number)[][] = [
      [t("users.colLogin"), t("users.colEmail"), t("users.colPassword"), t("users.colRole")],
      ...result.users.map((r) => [r.login, r.email, r.password, roleLabel(r.role)]),
    ];
    downloadXlsx(aoa, t("users.sheetCredentials"), "users-credentials.xlsx", [16, 26, 14, 14]);
  };

  const downloadTemplate = () => {
    const aoa: (string | number)[][] = [
      [t("users.colLogin"), t("users.colEmail"), t("users.colPassword"), t("users.colClass"), t("users.colRole")],
      ["ivanov_ii", "ivanov@school.ru", "", "9А", roleLabel(Role.Student)],
      ["petrova_aa", "petrova@school.ru", "", "9А", roleLabel(Role.Teacher)],
    ];
    downloadXlsx(aoa, t("users.sheetUsers"), "import-template.xlsx", [16, 26, 14, 8, 14]);
  };

  /* ── Экран успеха ───────────────────────────────────────────────────── */
  if (result) {
    return (
      <section className="usp__card usp__success">
        <div className="usp__success-icon" aria-hidden>✓</div>
        <h2 className="usp__success-title">{t("users.successTitle", { count: result.count })}</h2>
        <p className="usp__muted">
          {t("users.successHint")}
        </p>
        <div className="usp__row-actions">
          <button className="btn btn--primary" onClick={exportCredentials}>
            {t("users.exportCreds")}
          </button>
          <button className="btn btn--ghost" onClick={() => setResult(null)}>
            {t("users.importMore")}
          </button>
          <button className="btn btn--ghost" onClick={onDone}>
            {t("users.toList")}
          </button>
        </div>
      </section>
    );
  }

  /* ── Основной экран импорта ─────────────────────────────────────────── */
  return (
    <section className="usp__stack">
      <div className="usp__card">
        <div className="usp__dropzone">
          <div className="usp__drop-text">
            <strong>{t("users.chooseFile")}</strong>
            <span className="usp__muted">{t("users.supportedColumns", { headers: t("users.acceptedHeaders") })}</span>
          </div>
          <div className="usp__drop-actions">
            <FileUploader onFileSelect={handleFile} accept=".xlsx,.xls" />
            <button className="btn btn--ghost btn--sm" onClick={downloadTemplate}>
              {t("users.downloadTemplate")}
            </button>
          </div>
        </div>

        {fileName && (
          <p className="usp__filename">
            {t("users.fileLabel")}: <strong>{fileName}</strong>
          </p>
        )}
        {fileError && <p className="usp__error">{fileError}</p>}

        {exel && exel.pages > 1 && (
          <div className="usp__sheets" role="group" aria-label={t("users.sheetsAria")}>
            <span className="usp__muted usp__sheets-label">{t("users.sheetLabel")}</span>
            {Array.from({ length: exel.pages }).map((_, i) => (
              <button
                key={i}
                className={`usp__sheet ${i === sheetIndex ? "is-active" : ""}`}
                onClick={() => selectSheet(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        <div className="usp__manual">
          <span className="usp__manual-line" aria-hidden />
          <span className="usp__muted">{t("users.orDivider")}</span>
          <button className="btn btn--ghost btn--sm" onClick={addBlankRow}>
            {t("users.addManual")}
          </button>
          <span className="usp__manual-line" aria-hidden />
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div className="usp__card usp__options">
            <label className="usp__field">
              <span className="usp__muted">{t("users.defaultRole")}</span>
              <select
                value={defaultRole}
                onChange={(e) => changeDefaultRole(e.target.value as TRole)}
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </label>

            <label className="usp__checkbox">
              <input
                type="checkbox"
                checked={autoPassword}
                onChange={(e) => toggleAutoPassword(e.target.checked)}
              />
              <span>{t("users.autoPassword")}</span>
            </label>

            <div className="usp__stats">
              <span className="badge badge--neutral">{t("users.statsTotal", { count: stats.total })}</span>
              <span className="badge badge--ok">{t("users.statsReady", { count: stats.ready })}</span>
              {stats.errors > 0 && (
                <span className="badge badge--err">{t("users.statsErrors", { count: stats.errors })}</span>
              )}
            </div>
          </div>

          <div className="usp__card usp__table-wrap">
            <table className="usp__table">
              <thead>
                <tr>
                  <th className="usp__col-check" />
                  <th>{t("users.colLogin")}</th>
                  <th>{t("users.colEmail")}</th>
                  <th>{t("users.colPassword")}</th>
                  <th>{t("users.colClass")}</th>
                  <th>{t("users.colRole")}</th>
                  <th>{t("users.colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const issue = rowIssue(r);
                  const disabled = !r.include;
                  return (
                    <tr key={r.id} className={disabled ? "is-disabled" : issue ? "is-invalid" : ""}>
                      <td className="usp__col-check">
                        <input
                          type="checkbox"
                          checked={r.include}
                          onChange={(e) => patchRow(r.id, { include: e.target.checked })}
                          aria-label={t("users.includeRowAria")}
                        />
                      </td>
                      <td>
                        <input
                          className="cell-input"
                          value={r.login}
                          onChange={(e) => patchRow(r.id, { login: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="cell-input"
                          value={r.email}
                          onChange={(e) => patchRow(r.id, { email: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className={`cell-input ${r.autoPwd ? "is-auto" : ""}`}
                          value={r.password}
                          onChange={(e) =>
                            patchRow(r.id, { password: e.target.value, autoPwd: false })
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="usp__group-select"
                          value={r.group}
                          onChange={(e) => patchRow(r.id, { group: e.target.value })}
                        >
                          <option value="">{t("users.noClass")}</option>
                          {/* значение из файла, даже если такого класса ещё нет */}
                          {r.group && !classNames.includes(r.group) && (
                            <option value={r.group}>{t("users.newClassSuffix", { name: r.group })}</option>
                          )}
                          {classNames.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={r.role}
                          onChange={(e) =>
                            patchRow(r.id, { role: e.target.value as TRole, autoRole: false })
                          }
                        >
                          {ASSIGNABLE_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {roleLabel(role)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {disabled ? (
                          <span className="badge badge--neutral">{t("users.statusSkipped")}</span>
                        ) : issue ? (
                          <span className="badge badge--err" title={issue}>
                            {issue}
                          </span>
                        ) : (
                          <span className="badge badge--ok">{t("users.statusReady")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="usp__table-foot">
              <button className="btn btn--ghost btn--sm" onClick={addBlankRow}>
                {t("users.addRow")}
              </button>
            </div>
          </div>

          {submitError && <p className="usp__error">{submitError}</p>}

          <div className="usp__footer">
            <p className="usp__muted">
              {t("users.createFooter")}
            </p>
            <button
              className="btn btn--primary"
              disabled={stats.ready === 0 || submitting}
              onClick={submit}
            >
              {submitting ? t("users.creating") : t("users.createButton", { count: stats.ready })}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Вкладка «Все пользователи»
 * ────────────────────────────────────────────────────────────────────────*/

function ManageTab() {
  const { t } = useTranslation();
  const roleLabel = (role: TRole | string | undefined) => t(roleKey(role));

  const { users, total, loading, error, refetch } = useListUsers();
  const { setRole } = useSetRole();
  const updateStudent = useUpdateStudent();

  // Оптимистичные изменения роли: id → новая роль. Накладываются на серверные
  // данные при рендере, поэтому отдельное зеркало стейта/эффект не нужны.
  const [overrides, setOverrides] = useState<Record<string, TRole>>({});
  // Оптимистичные изменения класса студента: id → classId ("" = без класса).
  const [classOverrides, setClassOverrides] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<TRole | "all">("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingClassId, setSavingClassId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  // Справочник классов и карта «студент → класс». Грузим один раз за монтирование
  // напрямую через клиент (как в ImportTab) — без useQuery, чтобы не плодить
  // повторные запросы при ре-рендерах.
  const [classList, setClassList] = useState<Class[]>([]);
  const [studentClass, setStudentClass] = useState<Record<string, string>>({});
  const [refDataLoading, setRefDataLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRefDataLoading(true);
      try {
        const res = await classesApi.listClasses({});
        const cl = res?.classes ?? [];
        if (cancelled) return;
        setClassList(cl);

        // Текущий класс студента отдельным полем у User не приходит, поэтому
        // собираем карту id → classId, пройдясь по спискам учеников каждого класса.
        const map: Record<string, string> = {};
        await Promise.all(
          cl.map(async (c) => {
            const classId = c.id;
            if (!classId) return;
            try {
              const sr = await studentsApi.listStudents({
                classId,
                limit: 1000,
                offset: 0,
              });
              for (const s of sr?.students ?? []) {
                if (s.id) map[s.id] = classId;
              }
            } catch {
              /* недоступность одного класса не должна ронять всю карту */
            }
          }),
        );
        if (!cancelled) setStudentClass(map);
      } catch {
        if (!cancelled) {
          setClassList([]);
          setStudentClass({});
        }
      } finally {
        if (!cancelled) setRefDataLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const list = useMemo<User[]>(
    () =>
      users.map((u) =>
        u.id && overrides[u.id] != null ? { ...u, role: overrides[u.id] } : u,
      ),
    [users, overrides],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((u) => {
      const matchesRole = roleFilter === "all" || (u.role ?? "") === roleFilter;
      const matchesText =
        !q ||
        (u.login ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q);
      return matchesRole && matchesText;
    });
  }, [list, search, roleFilter]);

  const changeRole = async (user: User, nextRole: TRole) => {
    const id = user.id;
    if (!id || nextRole === user.role) return;

    setRowError(null);
    setSavingId(id);
    setOverrides((o) => ({ ...o, [id]: nextRole })); // оптимистично

    try {
      await setRole(id, nextRole);
    } catch (err) {
      setOverrides((o) => {
        const next = { ...o };
        delete next[id];
        return next;
      });
      setRowError(
        t("users.changeRoleError", {
          user: user.login || user.email,
          message: err instanceof Error ? err.message : t("users.networkError"),
        }),
      );
    } finally {
      setSavingId(null);
    }
  };

  // Текущий класс пользователя с учётом оптимистичных правок.
  const classOf = (user: User): string => {
    const id = user.id;
    if (!id) return "";
    if (classOverrides[id] != null) return classOverrides[id];
    return studentClass[id] ?? "";
  };

  const changeClass = async (user: User, nextClassId: string) => {
    const id = user.id;
    if (!id) return;
    const current = classOf(user);
    if (nextClassId === current) return;

    setRowError(null);
    setSavingClassId(id);
    setClassOverrides((o) => ({ ...o, [id]: nextClassId })); // оптимистично

    try {
      await updateStudent.mutate({ id, classId: nextClassId || undefined });
    } catch (err) {
      setClassOverrides((o) => {
        const next = { ...o };
        delete next[id];
        return next;
      });
      setRowError(
        t("users.changeClassError", {
          user: user.login || user.email,
          message: err instanceof Error ? err.message : t("users.networkError"),
          defaultValue: "Не удалось изменить класс пользователя {{user}}: {{message}}",
        }),
      );
    } finally {
      setSavingClassId(null);
    }
  };

  return (
    <section className="usp__stack">
      <div className="usp__card usp__toolbar">
        <input
          className="usp__search"
          placeholder={t("users.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as TRole | "all")}>
          <option value="all">{t("roles.allRoles")}</option>
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <span className="usp__muted usp__count">
          {loading ? t("common.loading") : t("users.found", { count: filtered.length, total })}
        </span>
        <button className="btn btn--ghost btn--sm" onClick={() => void refetch()} disabled={loading}>
          {t("common.refresh")}
        </button>
      </div>

      {rowError && <p className="usp__error">{rowError}</p>}

      <div className="usp__card usp__table-wrap">
        {error ? (
          <div className="usp__empty">
            <p>{error}</p>
            <button className="btn btn--primary btn--sm" onClick={() => void refetch()}>
              {t("common.retry")}
            </button>
          </div>
        ) : loading ? (
          <div className="usp__empty usp__muted">{t("users.loadingUsers")}</div>
        ) : filtered.length === 0 ? (
          <div className="usp__empty usp__muted">
            {list.length === 0
              ? t("users.empty")
              : t("users.noMatch")}
          </div>
        ) : (
          <table className="usp__table">
            <thead>
              <tr>
                <th>{t("users.colLogin")}</th>
                <th>{t("users.colEmail")}</th>
                <th>{t("users.colClass")}</th>
                <th className="usp__col-role">{t("users.colRole")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id ?? u.email ?? u.login}>
                  <td>{u.login || "—"}</td>
                  <td>{u.email || "—"}</td>
                  <td>
                    {(u.role ?? "") === Role.Student ? (
                      <div className="usp__role-cell">
                        <select
                          value={classOf(u)}
                          disabled={!u.id || savingClassId === u.id || refDataLoading}
                          onChange={(e) => void changeClass(u, e.target.value)}
                        >
                          <option value="">{t("users.noClass")}</option>
                          {classList.map((c) =>
                            c.id ? (
                              <option key={c.id} value={c.id}>
                                {c.className}
                              </option>
                            ) : null,
                          )}
                        </select>
                        {savingClassId === u.id && <span className="usp__spinner" aria-hidden />}
                      </div>
                    ) : (
                      <span className="usp__muted">—</span>
                    )}
                  </td>
                  <td className="usp__col-role">
                    {(u.role ?? "") === Role.Admin ? (
                      <span
                        title={t("users.adminRoleLocked", {
                          defaultValue: "Роль администратора изменить нельзя",
                        })}
                      >
                        {roleLabel(Role.Admin)}
                      </span>
                    ) : (
                      <div className="usp__role-cell">
                        <select
                          value={u.role ?? Role.Unauthorized}
                          disabled={!u.id || savingId === u.id}
                          onChange={(e) => void changeRole(u, e.target.value as TRole)}
                        >
                          {(u.role ?? "") === Role.Unauthorized && (
                            <option value={Role.Unauthorized}>{t("roles.unassigned")}</option>
                          )}
                          {ASSIGNABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {roleLabel(r)}
                            </option>
                          ))}
                        </select>
                        {savingId === u.id && <span className="usp__spinner" aria-hidden />}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Стили (бело-оранжевая тема, scoped через .usp) — вынесены в
 * ./UsersPage.styles.ts
 * ────────────────────────────────────────────────────────────────────────*/

function PageStyles() {
  return <style>{usersPageStyles}</style>;
}
