import { useCallback, useEffect, useMemo, useState } from "react";
import { FileUploader } from "@/components/ui/LoadFile";
import { utils, write } from "xlsx";
import { ExelFile } from "@/utils/exclFile/get-exel";
import { Person, Role, type TRole } from "@/domain/person";
import type { User } from "@/api/gen/sso/sso";
import type { Class } from "@/api/gen/journal/journal";
import { classes as classesApi } from "@/api/client";
import { useImportUsers, useListUsers, useSetRole } from "@/hooks/auth";
import { useCreateClass, useCreateStudent, useCreateTeacher } from "@/hooks/journal";

/* ──────────────────────────────────────────────────────────────────────────
 * Справочники
 * ────────────────────────────────────────────────────────────────────────*/

const ROLE_LABELS: Record<string, string> = {
  [Role.Admin]: "Администратор",
  [Role.Teacher]: "Учитель",
  [Role.Student]: "Студент",
  [Role.Unauthorized]: "Не назначена",
};

/** Роли, которые можно назначить (без «пустой»). */
const ASSIGNABLE_ROLES: TRole[] = [Role.Student, Role.Teacher, Role.Admin, Role.Unauthorized];

const ACCEPTED_HEADERS =
  "Логин / ФИО · Email / Почта · Пароль · Класс / Группа · Роль";

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

function roleLabel(role: TRole | string | undefined): string {
  return ROLE_LABELS[role ?? ""] ?? "Не назначена";
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
  const fromFileRole = p.role && p.role !== Role.Unauthorized ? p.role : undefined;
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

/** Возвращает текст ошибки строки или null, если всё валидно. */
function validateRow(r: ImportRow): string | null {
  if (!r.role) return "Не выбрана роль";
  const person = new Person(r.login, r.email, r.password, r.group, r.role);
  return person.validate();
}

/* ──────────────────────────────────────────────────────────────────────────
 * Главный компонент
 * ────────────────────────────────────────────────────────────────────────*/

type TabKey = "import" | "manage";

export default function UsersPage() {
  const [tab, setTab] = useState<TabKey>("import");

  return (
    <div className="usp">
      <PageStyles />

      <header className="usp__head">
        <div>
          <h1 className="usp__title">Пользователи</h1>
          <p className="usp__subtitle">
            Загрузка студентов и учителей из Excel и управление их ролями.
          </p>
        </div>
      </header>

      <nav className="usp__tabs" role="tablist" aria-label="Разделы">
        <button
          role="tab"
          aria-selected={tab === "import"}
          className={`usp__tab ${tab === "import" ? "is-active" : ""}`}
          onClick={() => setTab("import")}
        >
          Импорт из Excel
        </button>
        <button
          role="tab"
          aria-selected={tab === "manage"}
          className={`usp__tab ${tab === "manage" ? "is-active" : ""}`}
          onClick={() => setTab("manage")}
        >
          Все пользователи
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
        setFileError("Не удалось открыть файл. Поддерживаются .xlsx и .xls.");
      }
    },
    [parseSheet, defaultRole, autoPassword],
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

  const rowIssue = (r: ImportRow): string | null => {
    if (duplicates.has(r.id)) return "Дубликат логина или email в файле";
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
  }, [rows, duplicates]);

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
      setSubmitError(err instanceof Error ? err.message : "Не удалось создать пользователей");
    } finally {
      setSubmitting(false);
    }
  };

  const exportCredentials = () => {
    if (!result) return;
    const aoa: (string | number)[][] = [
      ["Логин", "Email", "Пароль", "Роль"],
      ...result.users.map((r) => [r.login, r.email, r.password, roleLabel(r.role)]),
    ];
    downloadXlsx(aoa, "Учётные данные", "users-credentials.xlsx", [16, 26, 14, 14]);
  };

  const downloadTemplate = () => {
    const aoa: (string | number)[][] = [
      ["Логин", "Email", "Пароль", "Класс", "Роль"],
      ["ivanov_ii", "ivanov@school.ru", "", "9А", "Студент"],
      ["petrova_aa", "petrova@school.ru", "", "9А", "Учитель"],
    ];
    downloadXlsx(aoa, "Пользователи", "import-template.xlsx", [16, 26, 14, 8, 14]);
  };

  /* ── Экран успеха ───────────────────────────────────────────────────── */
  if (result) {
    return (
      <section className="usp__card usp__success">
        <div className="usp__success-icon" aria-hidden>✓</div>
        <h2 className="usp__success-title">Создано пользователей: {result.count}</h2>
        <p className="usp__muted">
          Сохраните логины и пароли — раздайте их пользователям для первого входа.
        </p>
        <div className="usp__row-actions">
          <button className="btn btn--primary" onClick={exportCredentials}>
            Скачать логины и пароли (Excel)
          </button>
          <button className="btn btn--ghost" onClick={() => setResult(null)}>
            Импортировать ещё
          </button>
          <button className="btn btn--ghost" onClick={onDone}>
            К списку пользователей
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
            <strong>Выберите файл Excel</strong>
            <span className="usp__muted">Поддерживаемые колонки: {ACCEPTED_HEADERS}</span>
          </div>
          <div className="usp__drop-actions">
            <FileUploader onFileSelect={handleFile} accept=".xlsx,.xls" />
            <button className="btn btn--ghost btn--sm" onClick={downloadTemplate}>
              Скачать шаблон
            </button>
          </div>
        </div>

        {fileName && (
          <p className="usp__filename">
            Файл: <strong>{fileName}</strong>
          </p>
        )}
        {fileError && <p className="usp__error">{fileError}</p>}

        {exel && exel.pages > 1 && (
          <div className="usp__sheets" role="group" aria-label="Листы книги">
            <span className="usp__muted usp__sheets-label">Лист:</span>
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
          <span className="usp__muted">или</span>
          <button className="btn btn--ghost btn--sm" onClick={addBlankRow}>
            + Добавить пользователя вручную
          </button>
          <span className="usp__manual-line" aria-hidden />
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div className="usp__card usp__options">
            <label className="usp__field">
              <span className="usp__muted">Роль по умолчанию</span>
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
              <span>Генерировать пароль для пустых ячеек</span>
            </label>

            <div className="usp__stats">
              <span className="badge badge--neutral">Всего: {stats.total}</span>
              <span className="badge badge--ok">К созданию: {stats.ready}</span>
              {stats.errors > 0 && (
                <span className="badge badge--err">С ошибками: {stats.errors}</span>
              )}
            </div>
          </div>

          <div className="usp__card usp__table-wrap">
            <table className="usp__table">
              <thead>
                <tr>
                  <th className="usp__col-check" />
                  <th>Логин</th>
                  <th>Email</th>
                  <th>Пароль</th>
                  <th>Класс</th>
                  <th>Роль</th>
                  <th>Статус</th>
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
                          aria-label="Включить строку в импорт"
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
                          <option value="">— без класса —</option>
                          {/* значение из файла, даже если такого класса ещё нет */}
                          {r.group && !classNames.includes(r.group) && (
                            <option value={r.group}>{r.group} (новый)</option>
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
                          <span className="badge badge--neutral">Пропущена</span>
                        ) : issue ? (
                          <span className="badge badge--err" title={issue}>
                            {issue}
                          </span>
                        ) : (
                          <span className="badge badge--ok">Готова</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="usp__table-foot">
              <button className="btn btn--ghost btn--sm" onClick={addBlankRow}>
                + Добавить ещё строку
              </button>
            </div>
          </div>

          {submitError && <p className="usp__error">{submitError}</p>}

          <div className="usp__footer">
            <p className="usp__muted">
              Для каждого создаётся учётная запись и запись в журнале (студент — с классом,
              учитель — без). Недостающие классы создаются автоматически.
            </p>
            <button
              className="btn btn--primary"
              disabled={stats.ready === 0 || submitting}
              onClick={submit}
            >
              {submitting ? "Создание…" : `Создать ${stats.ready} пользователей`}
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
  const { users, total, loading, error, refetch } = useListUsers();
  const { setRole } = useSetRole();

  // Оптимистичные изменения роли: id → новая роль. Накладываются на серверные
  // данные при рендере, поэтому отдельное зеркало стейта/эффект не нужны.
  const [overrides, setOverrides] = useState<Record<string, TRole>>({});
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<TRole | "all">("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

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
        `Не удалось изменить роль для ${user.login || user.email}: ` +
          (err instanceof Error ? err.message : "ошибка сети"),
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="usp__stack">
      <div className="usp__card usp__toolbar">
        <input
          className="usp__search"
          placeholder="Поиск по логину или email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as TRole | "all")}>
          <option value="all">Все роли</option>
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <span className="usp__muted usp__count">
          {loading ? "Загрузка…" : `Найдено: ${filtered.length} из ${total}`}
        </span>
        <button className="btn btn--ghost btn--sm" onClick={() => void refetch()} disabled={loading}>
          Обновить
        </button>
      </div>

      {rowError && <p className="usp__error">{rowError}</p>}

      <div className="usp__card usp__table-wrap">
        {error ? (
          <div className="usp__empty">
            <p>{error}</p>
            <button className="btn btn--primary btn--sm" onClick={() => void refetch()}>
              Повторить
            </button>
          </div>
        ) : loading ? (
          <div className="usp__empty usp__muted">Загружаем пользователей…</div>
        ) : filtered.length === 0 ? (
          <div className="usp__empty usp__muted">
            {list.length === 0
              ? "Пользователей пока нет. Импортируйте их из Excel на соседней вкладке."
              : "Под фильтры никто не подходит. Измените поиск или роль."}
          </div>
        ) : (
          <table className="usp__table">
            <thead>
              <tr>
                <th>Логин</th>
                <th>Email</th>
                <th className="usp__col-role">Роль</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id ?? u.email ?? u.login}>
                  <td>{u.login || "—"}</td>
                  <td>{u.email || "—"}</td>
                  <td className="usp__col-role">
                    <div className="usp__role-cell">
                      <select
                        value={u.role ?? Role.Unauthorized}
                        disabled={!u.id || savingId === u.id}
                        onChange={(e) => void changeRole(u, e.target.value as TRole)}
                      >
                        {(u.role ?? "") === Role.Unauthorized && (
                          <option value={Role.Unauthorized}>Не назначена</option>
                        )}
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleLabel(r)}
                          </option>
                        ))}
                      </select>
                      {savingId === u.id && <span className="usp__spinner" aria-hidden />}
                    </div>
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
 * Стили (бело-оранжевая тема, scoped через .usp)
 * ────────────────────────────────────────────────────────────────────────*/

function PageStyles() {
  return (
    <style>{`
      .usp {
        --orange: #f97316;
        --orange-dark: #ea580c;
        --orange-soft: #fff7ed;
        --orange-border: #fed7aa;
        --ink: #1f2937;
        --muted: #6b7280;
        --line: #f0f0f0;
        --err: #dc2626;
        --err-bg: #fef2f2;
        --ok: #16a34a;
        --ok-bg: #f0fdf4;

        max-width: 1080px;
        margin: 0 auto;
        padding: 32px 20px 64px;
        color: var(--ink);
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }

      .usp__head { margin-bottom: 20px; }
      .usp__title { font-size: 26px; font-weight: 700; margin: 0; }
      .usp__subtitle { margin: 6px 0 0; color: var(--muted); font-size: 14px; }
      .usp__muted { color: var(--muted); font-size: 13px; }

      .usp__tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); margin-bottom: 24px; }
      .usp__tab {
        background: none; border: none; cursor: pointer;
        padding: 12px 16px; font-size: 15px; color: var(--muted);
        border-bottom: 2px solid transparent; margin-bottom: -1px;
      }
      .usp__tab:hover { color: var(--ink); }
      .usp__tab.is-active { color: var(--orange-dark); border-bottom-color: var(--orange); font-weight: 600; }

      .usp__stack { display: flex; flex-direction: column; gap: 16px; }
      .usp__card {
        background: #fff; border: 1px solid var(--line); border-radius: 14px;
        padding: 18px; box-shadow: 0 1px 2px rgba(0,0,0,.03);
      }

      .usp__dropzone {
        display: flex; align-items: center; justify-content: space-between;
        gap: 16px; flex-wrap: wrap;
        border: 1.5px dashed var(--orange-border); background: var(--orange-soft);
        border-radius: 12px; padding: 18px 20px;
      }
      .usp__drop-text { display: flex; flex-direction: column; gap: 4px; }
      .usp__drop-actions { display: flex; align-items: center; gap: 10px; }
      .usp__filename { font-size: 13px; margin: 12px 0 0; color: var(--ink); }

      .usp__manual { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
      .usp__manual-line { flex: 1; height: 1px; background: var(--line); }

      .usp__table-foot { padding: 12px 14px; border-top: 1px solid var(--line); }

      .usp__sheets { display: flex; align-items: center; gap: 6px; margin-top: 14px; flex-wrap: wrap; }
      .usp__sheets-label { margin-right: 4px; }
      .usp__sheet {
        min-width: 30px; height: 30px; border: 1px solid var(--orange-border);
        background: #fff; border-radius: 8px; cursor: pointer; color: var(--ink);
      }
      .usp__sheet.is-active { background: var(--orange); border-color: var(--orange); color: #fff; }

      .usp__options { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
      .usp__field { display: flex; flex-direction: column; gap: 6px; }
      .usp__checkbox { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
      .usp__stats { display: flex; gap: 8px; margin-left: auto; flex-wrap: wrap; }

      .usp__table-wrap { padding: 0; overflow-x: auto; }
      .usp__table { width: 100%; border-collapse: collapse; font-size: 14px; }
      .usp__table th {
        text-align: left; padding: 12px 14px; background: var(--orange-soft);
        color: var(--orange-dark); font-weight: 600; font-size: 12px;
        text-transform: uppercase; letter-spacing: .03em; white-space: nowrap;
      }
      .usp__table td { padding: 8px 14px; border-top: 1px solid var(--line); vertical-align: middle; }
      .usp__table tbody tr:hover { background: #fffdfa; }
      .usp__table tr.is-disabled { opacity: .5; }
      .usp__table tr.is-invalid td { background: var(--err-bg); }
      .usp__col-check { width: 44px; text-align: center; }
      .usp__col-role { width: 220px; }

      .cell-input, .usp__search, .usp__field select, .usp__toolbar select,
      .usp__table select {
        width: 100%; box-sizing: border-box; border: 1px solid #e5e7eb;
        border-radius: 8px; padding: 7px 10px; font-size: 14px; background: #fff;
        color: var(--ink); font-family: inherit;
      }
      .cell-input--sm { max-width: 90px; }
      .usp__group-select { max-width: 150px; }
      .cell-input.is-auto { color: var(--orange-dark); font-style: italic; }
      .cell-input:focus, .usp__search:focus, select:focus {
        outline: none; border-color: var(--orange); box-shadow: 0 0 0 3px rgba(249,115,22,.15);
      }

      .usp__toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
      .usp__search { flex: 1; min-width: 220px; }
      .usp__toolbar select { width: auto; min-width: 150px; }
      .usp__count { margin-left: auto; white-space: nowrap; }

      .usp__role-cell { display: flex; align-items: center; gap: 8px; }
      .usp__spinner {
        width: 14px; height: 14px; border: 2px solid var(--orange-border);
        border-top-color: var(--orange); border-radius: 50%;
        animation: usp-spin .7s linear infinite; flex: none;
      }
      @keyframes usp-spin { to { transform: rotate(360deg); } }

      .usp__empty { padding: 48px 20px; text-align: center; display: flex;
        flex-direction: column; align-items: center; gap: 12px; }

      .usp__footer { display: flex; align-items: center; justify-content: space-between;
        gap: 16px; flex-wrap: wrap; }
      .usp__error {
        margin: 0; color: var(--err); background: var(--err-bg);
        border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; font-size: 14px;
      }

      .badge { display: inline-block; padding: 3px 9px; border-radius: 999px;
        font-size: 12px; font-weight: 600; white-space: nowrap; }
      .badge--ok { background: var(--ok-bg); color: var(--ok); }
      .badge--err { background: var(--err-bg); color: var(--err);
        max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
      .badge--neutral { background: #f3f4f6; color: var(--muted); }

      .btn { border: none; border-radius: 9px; padding: 10px 18px; font-size: 14px;
        font-weight: 600; cursor: pointer; font-family: inherit; transition: background .15s, border-color .15s; }
      .btn--sm { padding: 7px 12px; font-size: 13px; }
      .btn--primary { background: var(--orange); color: #fff; }
      .btn--primary:hover:not(:disabled) { background: var(--orange-dark); }
      .btn--ghost { background: #fff; color: var(--orange-dark); border: 1px solid var(--orange-border); }
      .btn--ghost:hover:not(:disabled) { background: var(--orange-soft); }
      .btn:disabled { opacity: .5; cursor: not-allowed; }

      /* Стилизуем кнопку выбора файла внутри FileUploader без правки компонента */
      .usp__dropzone button[type="button"] {
        background: var(--orange); color: #fff; border: none; border-radius: 9px;
        padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer;
        font-family: inherit;
      }
      .usp__dropzone button[type="button"]:hover { background: var(--orange-dark); }

      .usp__success { text-align: center; display: flex; flex-direction: column;
        align-items: center; gap: 10px; padding: 40px 24px; }
      .usp__success-icon {
        width: 56px; height: 56px; border-radius: 50%; background: var(--ok-bg);
        color: var(--ok); font-size: 28px; display: flex; align-items: center;
        justify-content: center; margin-bottom: 4px;
      }
      .usp__success-title { margin: 0; font-size: 20px; }
      .usp__row-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 12px; }

      @media (max-width: 640px) {
        .usp { padding: 20px 14px 48px; }
        .usp__options { gap: 14px; }
        .usp__stats { margin-left: 0; }
        .usp__count { margin-left: 0; }
        .usp__footer { flex-direction: column; align-items: stretch; }
      }
    `}</style>
  );
}
