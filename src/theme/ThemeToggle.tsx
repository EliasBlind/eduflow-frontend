import type { CSSProperties } from "react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  /** Компактный режим — только иконка (для свёрнутой панели). */
  compact?: boolean;
  style?: CSSProperties;
}

export function ThemeToggle({ compact = false, style }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Светлая тема" : "Тёмная тема";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: 36,
        width: compact ? 36 : "auto",
        padding: compact ? 0 : "0 12px",
        background: "var(--surface)",
        color: "var(--text)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 14,
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>
        {isDark ? "☀" : "☾"}
      </span>
    </button>
  );
}
