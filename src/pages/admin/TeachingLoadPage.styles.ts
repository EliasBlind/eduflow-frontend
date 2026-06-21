/* Стили страницы «Учебная нагрузка» (бело-оранжевая тема, scoped через .tlp). */
export const teachingLoadStyles = /* css */ `
  .tlp {
    --orange: var(--accent);
    --orange-dark: var(--accent-strong);
    --orange-soft: var(--accent-soft);
    --orange-border: var(--accent-border);
    --ink: var(--text);
    --muted: var(--text-muted);
    --line: var(--border-soft);
    --err: var(--danger);
    --err-bg: var(--danger-bg);

    max-width: 1080px;
    margin: 0 auto;
    padding: 32px 20px 64px;
    color: var(--ink);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }

  .tlp__head {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; flex-wrap: wrap; margin-bottom: 16px;
  }
  .tlp__title { font-size: 26px; font-weight: 700; margin: 0; }
  .tlp__subtitle { margin: 6px 0 0; color: var(--muted); font-size: 14px; }
  .tlp__muted { color: var(--muted); font-size: 13px; }

  .tlp__hint {
    margin: 0 0 16px; font-size: 14px; color: var(--orange-dark);
    background: var(--orange-soft); border: 1px solid var(--orange-border);
    border-radius: 10px; padding: 10px 14px;
  }

  .tlp__card {
    background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
    padding: 18px; box-shadow: 0 1px 2px rgba(0,0,0,.03); margin-bottom: 16px;
  }

  .tlp__toolbar { display: flex; gap: 18px; flex-wrap: wrap; align-items: flex-end; }
  .tlp__field { display: flex; flex-direction: column; gap: 6px; min-width: 200px; }

  .tlp__field select {
    width: 100%; box-sizing: border-box; border: 1px solid var(--border);
    border-radius: 8px; padding: 8px 10px; font-size: 14px; background: var(--surface);
    color: var(--ink); font-family: inherit;
  }
  .tlp__field select:focus {
    outline: none; border-color: var(--orange); box-shadow: 0 0 0 3px var(--ring);
  }

  .tlp__table-wrap { padding: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .tlp__table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .tlp__table th {
    text-align: left; padding: 12px 14px; background: var(--orange-soft);
    color: var(--orange-dark); font-weight: 600; font-size: 12px;
    text-transform: uppercase; letter-spacing: .03em; white-space: nowrap;
  }
  .tlp__table td { padding: 10px 14px; border-top: 1px solid var(--line); }
  .tlp__table tbody tr:hover { background: var(--surface-2); }
  .tlp__col-actions { text-align: right; width: 130px; }

  .tlp__empty { padding: 48px 20px; text-align: center; }

  .tlp__error {
    margin: 0 0 16px; color: var(--err); background: var(--err-bg);
    border: 1px solid var(--danger-border); border-radius: 10px; padding: 10px 14px; font-size: 14px;
  }

  .btn {
    border: none; border-radius: 9px; padding: 10px 18px; font-size: 14px;
    font-weight: 600; cursor: pointer; font-family: inherit;
    transition: background .15s, border-color .15s;
  }
  .btn--sm { padding: 7px 12px; font-size: 13px; }
  .btn--primary { background: var(--orange); color: var(--on-accent); }
  .btn--primary:hover:not(:disabled) { background: var(--orange-dark); }
  .btn--ghost { background: var(--surface); color: var(--orange-dark); border: 1px solid var(--orange-border); }
  .btn--ghost:hover:not(:disabled) { background: var(--orange-soft); }
  .btn--danger { background: var(--surface); color: var(--err); border: 1px solid var(--danger-border); }
  .btn--danger:hover:not(:disabled) { background: var(--err-bg); }
  .btn:disabled { opacity: .5; cursor: not-allowed; }

  .tlp__overlay {
    position: fixed; inset: 0; background: rgba(17,24,39,.45);
    display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 50;
  }
  .tlp__modal {
    background: var(--surface); border-radius: 16px; width: 100%; max-width: 420px;
    max-height: 90vh; overflow-y: auto;
    padding: 22px; box-shadow: 0 20px 50px rgba(0,0,0,.25);
    display: flex; flex-direction: column; gap: 14px;
  }
  .tlp__modal-head { display: flex; align-items: center; justify-content: space-between; }
  .tlp__modal-title { margin: 0; font-size: 18px; font-weight: 700; }
  .tlp__modal-x {
    background: none; border: none; font-size: 16px; color: var(--muted);
    cursor: pointer; padding: 4px 8px; border-radius: 6px;
  }
  .tlp__modal-x:hover:not(:disabled) { background: var(--line); color: var(--ink); }
  .tlp__modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }

  @media (max-width: 640px) {
    .tlp { padding: 20px 14px 48px; }
    .tlp__head { flex-direction: column; align-items: stretch; }
    .tlp__head .btn { width: 100%; }
    .tlp__field { min-width: 0; }
    .tlp__toolbar { gap: 12px; }
    /* Колонок четыре — на узком экране даём таблице прокручиваться. */
    .tlp__table { min-width: 560px; }
    .tlp__modal-actions { flex-direction: column-reverse; }
    .tlp__modal-actions .btn { width: 100%; }
  }
`;
