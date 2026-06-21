import type { CSSProperties } from "react";

export const styles: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 20, padding: "clamp(14px, 3.5vw, 24px)", maxWidth: 1200, margin: "0 auto" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  h1: { fontSize: 24, fontWeight: 700, margin: 0 },
  h2: { fontSize: 17, fontWeight: 600, margin: 0 },

  filters: { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" },
  field: { display: "flex", flexDirection: "column", gap: 4, minWidth: 160, flex: "0 0 auto" },
  label: { fontSize: 12, color: "var(--text-muted)" },
  input: {
    height: 38, padding: "0 10px", border: "1px solid var(--border)", borderRadius: 8,
    fontSize: 14, background: "var(--surface)", boxSizing: "border-box", width: "100%",
  },

  card: { border: "1px solid var(--border)", borderRadius: 12, padding: 16, background: "var(--surface)" },
  cardHead: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 },

  hint: { color: "var(--text-muted)", fontSize: 14, margin: "8px 0" },
  error: { color: "var(--danger)", fontSize: 14, margin: "8px 0" },

  tableWrap: { overflowX: "auto", border: "1px solid var(--surface-2)", borderRadius: 8 },
  table: { borderCollapse: "collapse", width: "100%", fontSize: 14 },
  th: { textAlign: "left", padding: "10px 12px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", fontWeight: 600 },
  thSticky: { position: "sticky", left: 0, zIndex: 2, minWidth: 220 },
  thDate: { padding: "10px 8px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", borderLeft: "1px solid var(--surface-2)", textAlign: "center", fontWeight: 600, whiteSpace: "nowrap" },

  td: { padding: "8px 12px", borderBottom: "1px solid var(--surface-2)", verticalAlign: "middle" },
  tdSticky: { position: "sticky", left: 0, background: "var(--surface)", zIndex: 1, fontWeight: 500, minWidth: 220 },
  tdCell: { padding: "6px 8px", borderBottom: "1px solid var(--surface-2)", borderLeft: "1px solid var(--surface-2)", textAlign: "center", whiteSpace: "nowrap" },
  tdClickable: { cursor: "pointer" },

  gradeChip: {
    display: "inline-block", minWidth: 22, padding: "2px 6px", margin: "0 2px",
    border: "1px solid var(--accent-border)", borderRadius: 6, fontWeight: 600, color: "var(--accent-text)", background: "var(--accent-soft)",
  },
  statusChip: { background: "var(--danger-bg)", borderColor: "var(--danger-border)", color: "var(--danger)" },

  legend: { display: "flex", flexWrap: "wrap", gap: 14, marginTop: 12, fontSize: 12, color: "var(--text-muted)" },
  legendItem: { display: "inline-flex", alignItems: "center", gap: 4 },
  legendCode: { display: "inline-block", minWidth: 18, textAlign: "center", color: "var(--danger)" },

  hwList: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" },
  hwCard: { position: "relative", border: "1px solid var(--border)", borderRadius: 10, padding: 12, background: "var(--surface-2)" },
  hwMeta: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  hwDate: { fontWeight: 700, fontSize: 14 },
  hwSubject: { fontSize: 12, color: "var(--text-muted)" },
  hwText: { margin: 0, fontSize: 14, whiteSpace: "pre-wrap" },
  hwDelete: { marginTop: 10, fontSize: 12, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", padding: 0 },

  logoutBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    background: "var(--surface)",
    color: "var(--danger)",
    border: "1px solid var(--danger-border)",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    whiteSpace: "nowrap",
  },

  btn: { height: 38, padding: "0 14px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", fontSize: 14, cursor: "pointer" },
  btnPrimary: { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--on-accent)" },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 },
  modal: { background: "var(--surface)", borderRadius: 12, padding: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" },
  modalHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 600 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 },
  iconBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text-muted)" },
  inputDisabled: { background: "var(--surface-2)", color: "var(--text-muted)", cursor: "not-allowed" },

  segmented: { display: "flex", gap: 8, marginBottom: 12 },
  segment: {
    flex: 1, height: 38, border: "1px solid var(--border)", borderRadius: 8,
    background: "var(--surface-2)", color: "var(--text-muted)", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  segmentActive: { background: "var(--accent-soft)", borderColor: "var(--accent-border)", color: "var(--accent-text)" },

  gradeButtons: { display: "flex", gap: 8 },
  gradeBtn: {
    flex: 1, height: 44, border: "1px solid var(--border)", borderRadius: 8,
    background: "var(--surface-2)", color: "var(--text)", fontSize: 17, fontWeight: 600, cursor: "pointer",
  },
  gradeBtnActive: { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--on-accent)" },

  spinner: {
    width: 16, height: 16, borderRadius: "50%",
    border: "2px solid var(--accent-border)", borderTopColor: "var(--accent)",
    display: "inline-block", animation: "spin 0.7s linear infinite",
  },
};
