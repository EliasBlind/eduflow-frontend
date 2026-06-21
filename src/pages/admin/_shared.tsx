import { useEffect, useState, type ReactNode } from "react";
import { styles } from "./_shared.styles";

// ── Адаптив: определяем «мобильный» брейкпоинт ────────────────

const MOBILE_QUERY = "(max-width: 640px)";

/** true, когда ширина вьюпорта ≤ 640px. Реагирует на ресайз/поворот. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(MOBILE_QUERY).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

/** Контейнер страницы с адаптивными отступами. */
export function PageWrapper({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <div style={isMobile ? { ...styles.wrapper, ...styles.wrapperMobile } : styles.wrapper}>
      {children}
    </div>
  );
}

// ── Shared layout components ──────────────────────────────────

interface PageHeaderProps {
  title:           string;
  createLabel:     string;
  onCreate:        () => void;
  createDisabled?: boolean;
}

export function PageHeader({ title, createLabel, onCreate, createDisabled }: PageHeaderProps) {
  const isMobile = useIsMobile();
  return (
    <header style={isMobile ? { ...styles.pageHeader, ...styles.pageHeaderMobile } : styles.pageHeader}>
      <div>
        <h1 style={styles.pageTitle}>{title}</h1>
      </div>
      <button
        onClick={onCreate}
        disabled={createDisabled}
        style={isMobile ? { ...styles.btnPrimary, width: "100%" } : styles.btnPrimary}
      >
        {createLabel}
      </button>
    </header>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>{children}</table>
    </div>
  );
}

export function Loading() {
  return <div style={styles.loading}>Загрузка…</div>;
}

export function Empty({ message }: { message: string }) {
  return <div style={styles.empty}>{message}</div>;
}

export function ErrorBox({ message }: { message: string }) {
  return <div role="alert" style={styles.error}>{message}</div>;
}

// ── Modal ─────────────────────────────────────────────────────

interface ModalProps {
  title:    string;
  onClose:  () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{title}</h2>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Закрыть">×</button>
        </header>
        <div style={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

export function ModalActions({ children }: { children: ReactNode }) {
  return <div style={styles.modalActions}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}
