/* Стили страницы «Пользователи» (бело-оранжевая тема, scoped через .usp). */
export const usersPageStyles = /* css */ `
  .usp {
    --orange: var(--accent);
    --orange-dark: var(--accent-strong);
    --orange-soft: var(--accent-soft);
    --orange-border: var(--accent-border);
    --ink: var(--text);
    --muted: var(--text-muted);
    --line: var(--border-soft);
    --err: var(--danger);
    --err-bg: var(--danger-bg);
    --ok: var(--ok);
    --ok-bg: var(--ok-bg);

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
    background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
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
    background: var(--surface); border-radius: 8px; cursor: pointer; color: var(--ink);
  }
  .usp__sheet.is-active { background: var(--orange); border-color: var(--orange); color: var(--on-accent); }

  .usp__options { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
  .usp__field { display: flex; flex-direction: column; gap: 6px; }
  .usp__checkbox { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
  .usp__stats { display: flex; gap: 8px; margin-left: auto; flex-wrap: wrap; }

  .usp__table-wrap { padding: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .usp__table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .usp__table th {
    text-align: left; padding: 12px 14px; background: var(--orange-soft);
    color: var(--orange-dark); font-weight: 600; font-size: 12px;
    text-transform: uppercase; letter-spacing: .03em; white-space: nowrap;
  }
  .usp__table td { padding: 8px 14px; border-top: 1px solid var(--line); vertical-align: middle; }
  .usp__table tbody tr:hover { background: var(--surface-2); }
  .usp__table tr.is-disabled { opacity: .5; }
  .usp__table tr.is-invalid td { background: var(--err-bg); }
  .usp__col-check { width: 44px; text-align: center; }
  .usp__col-role { width: 220px; }

  .cell-input, .usp__search, .usp__field select, .usp__toolbar select,
  .usp__table select {
    width: 100%; box-sizing: border-box; border: 1px solid var(--border);
    border-radius: 8px; padding: 7px 10px; font-size: 14px; background: var(--surface);
    color: var(--ink); font-family: inherit;
  }
  .cell-input--sm { max-width: 90px; }
  .usp__group-select { max-width: 150px; }
  .cell-input.is-auto { color: var(--orange-dark); font-style: italic; }
  .cell-input:focus, .usp__search:focus, select:focus {
    outline: none; border-color: var(--orange); box-shadow: 0 0 0 3px var(--ring);
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
    border: 1px solid var(--danger-border); border-radius: 10px; padding: 10px 14px; font-size: 14px;
  }

  .badge { display: inline-block; padding: 3px 9px; border-radius: 999px;
    font-size: 12px; font-weight: 600; white-space: nowrap; }
  .badge--ok { background: var(--ok-bg); color: var(--ok); }
  .badge--err { background: var(--err-bg); color: var(--err);
    max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
  .badge--neutral { background: var(--surface-2); color: var(--muted); }

  .btn { border: none; border-radius: 9px; padding: 10px 18px; font-size: 14px;
    font-weight: 600; cursor: pointer; font-family: inherit; transition: background .15s, border-color .15s; }
  .btn--sm { padding: 7px 12px; font-size: 13px; }
  .btn--primary { background: var(--orange); color: var(--on-accent); }
  .btn--primary:hover:not(:disabled) { background: var(--orange-dark); }
  .btn--ghost { background: var(--surface); color: var(--orange-dark); border: 1px solid var(--orange-border); }
  .btn--ghost:hover:not(:disabled) { background: var(--orange-soft); }
  .btn:disabled { opacity: .5; cursor: not-allowed; }

  /* Стилизуем кнопку выбора файла внутри FileUploader без правки компонента */
  .usp__dropzone button[type="button"] {
    background: var(--orange); color: var(--on-accent); border: none; border-radius: 9px;
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

    /* Вкладки на всю ширину для удобного тапа. */
    .usp__tab { flex: 1; text-align: center; padding: 12px 8px; }

    /* Загрузка файла: всё в колонку, кнопки на всю ширину. */
    .usp__dropzone { flex-direction: column; align-items: stretch; }
    .usp__drop-actions { flex-wrap: wrap; }
    .usp__drop-actions > * { flex: 1 1 auto; }

    /* Тулбар: поиск занимает строку целиком, фильтр/счётчик ниже. */
    .usp__toolbar { gap: 10px; }
    .usp__search { min-width: 0; flex: 1 1 100%; }
    .usp__toolbar select { width: 100%; min-width: 0; flex: 1 1 auto; }
    .usp__count { margin-left: 0; }

    /* Опции импорта складываем в колонку. */
    .usp__options { flex-direction: column; align-items: stretch; gap: 14px; }
    .usp__field { width: 100%; }
    .usp__stats { margin-left: 0; }

    /* Широкие таблицы прокручиваются по горизонтали, а не сжимаются в кашу. */
    .usp__table { min-width: 760px; }

    .usp__footer { flex-direction: column; align-items: stretch; }
    .usp__footer .btn { width: 100%; }

    .usp__row-actions { flex-direction: column; }
    .usp__row-actions .btn { width: 100%; }
  }
`;
