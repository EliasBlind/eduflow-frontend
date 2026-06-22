import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "./index";

function Flag({ code, size = 20 }: { code: LanguageCode; size?: number }) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  const wrap: CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: "50%",
    overflow: "hidden",
    display: "inline-block",
    lineHeight: 0,
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
  };

  if (code === "ru") {
    return (
      <span style={wrap} aria-hidden>
        <svg width={size} height={size} viewBox="0 0 3 3" preserveAspectRatio="xMidYMid slice">
          <rect width="3" height="1" y="0" fill="#ffffff" />
          <rect width="3" height="1" y="1" fill="#0039a6" />
          <rect width="3" height="1" y="2" fill="#d52b1e" />
        </svg>
      </span>
    );
  }

  if (code === "en") {
    return (
      <span style={wrap} aria-hidden>
        <svg width={size} height={size} viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice">
          <clipPath id={`uj-cross-${uid}`}>
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
          </clipPath>
          <rect width="60" height="30" fill="#012169" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" strokeWidth="6" />
          <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#uj-cross-${uid})`} stroke="#c8102e" strokeWidth="4" />
          <path d="M30,0 v30 M0,15 h60" stroke="#ffffff" strokeWidth="10" />
          <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
        </svg>
      </span>
    );
  }

  if (code === "da") {
    return (
      <span style={wrap} aria-hidden>
        <svg width={size} height={size} viewBox="0 0 3 3" preserveAspectRatio="xMidYMid slice">
          <rect width="3" height="3" fill="#c8102e" />
          <rect x="0.9" width="1.2" height="3" fill="#ffffff" />
          <rect y="0.9" width="3" height="1.2" fill="#ffffff" />
        </svg>
      </span>
    );
  }

  if (code === "es") {
    return (
      <span style={wrap} aria-hidden>
        <svg width={size} height={size} viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice">
          <rect width="3" height="0.5" y="0" fill="#c60b1e" />
          <rect width="3" height="1" y="0.5" fill="#ffc400" />
          <rect width="3" height="0.5" y="1.5" fill="#c60b1e" />
        </svg>
      </span>
    );
  }

  if (code === "fr") {
    return (
      <span style={wrap} aria-hidden>
        <svg width={size} height={size} viewBox="0 0 3 3" preserveAspectRatio="xMidYMid slice">
          <rect width="1" height="3" fill="#002395" />
          <rect x="1" width="1" height="3" fill="#ffffff" />
          <rect x="2" width="1" height="3" fill="#ed2939" />
        </svg>
      </span>
    );
  }

  if (code === "it") {
    return (
      <span style={wrap} aria-hidden>
        <svg width={size} height={size} viewBox="0 0 3 3" preserveAspectRatio="xMidYMid slice">
          <rect width="1" height="3" fill="#009246" />
          <rect x="1" width="1" height="3" fill="#ffffff" />
          <rect x="2" width="1" height="3" fill="#ce2b37" />
        </svg>
      </span>
    );
  }

  if (code === "ja") {
    return (
      <span style={wrap} aria-hidden>
        <svg width={size} height={size} viewBox="0 0 3 3" preserveAspectRatio="xMidYMid slice">
          <rect width="3" height="3" fill="#ffffff" />
          <circle cx="1.5" cy="1.5" r="0.9" fill="#bc002d" />
        </svg>
      </span>
    );
  }

  if (code === "zh") {
    return (
      <span style={wrap} aria-hidden>
        <svg width={size} height={size} viewBox="0 0 3 3" preserveAspectRatio="xMidYMid slice">
          <rect width="3" height="3" fill="#de2910" />
          <circle cx="1.5" cy="1.5" r="0.6" fill="#ffde00" />
        </svg>
      </span>
    );
  }

  if (code === "pt") {
    return (
      <span style={wrap} aria-hidden>
        <svg width={size} height={size} viewBox="0 0 3 3" preserveAspectRatio="xMidYMid slice">
          <rect width="1.2" height="3" fill="#006600" />
          <rect x="1.2" width="1.8" height="3" fill="#cc0000" />
        </svg>
      </span>
    );
  }

  if (code === "tt") {
    return (
      <span style={wrap} aria-hidden>
        <svg width={size} height={size} viewBox="0 0 3 3" preserveAspectRatio="xMidYMid slice">
          <rect width="3" height="1" y="0" fill="#1e8c3c" />
          <rect width="3" height="1" y="1" fill="#ffffff" />
          <rect width="3" height="1" y="2" fill="#c8102e" />
        </svg>
      </span>
    );
  }

  if (code === "sah") {
    return (
      <span style={wrap} aria-hidden>
        <svg width={size} height={size} viewBox="0 0 3 3" preserveAspectRatio="xMidYMid slice">
          <rect width="3" height="1" y="0" fill="#0088cc" />
          <rect width="3" height="1" y="1" fill="#ffffff" />
          <rect width="3" height="1" y="2" fill="#1e8c3c" />
        </svg>
      </span>
    );
  }

  if (code === "cv") {
    return (
      <span style={wrap} aria-hidden>
        <svg width={size} height={size} viewBox="0 0 3 3" preserveAspectRatio="xMidYMid slice">
          <rect width="3" height="3" fill="#c8102e" />
          <circle cx="1.5" cy="1.5" r="0.8" fill="#ffcc00" />
        </svg>
      </span>
    );
  }

  return null;
}

interface LanguageSwitcherProps {
  compact?: boolean;
  style?: CSSProperties;
  direction?: "up" | "down";
}

export function LanguageSwitcher({
  compact = false,
  direction = "up",
  style,
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<LanguageCode | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const current =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ??
    SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (code: LanguageCode) => {
    void i18n.changeLanguage(code);
    setOpen(false);
  };

  const btnStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 10px",
    border: "1px solid var(--border, rgba(127,127,127,0.25))",
    borderRadius: 8,
    background: "transparent",
    color: "var(--text, inherit)",
    cursor: "pointer",
    font: "inherit",
    fontSize: 14,
    lineHeight: 1.2,
    justifyContent: compact ? "center" : "space-between",
  };

  const menuPosition: CSSProperties =
    direction === "down"
      ? { top: "calc(100% + 6px)", bottom: "auto" }
      : { bottom: "calc(100% + 6px)", top: "auto" };

  const menuStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    minWidth: compact ? 168 : "100%",
    margin: 0,
    padding: 4,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    background: "var(--surface, var(--card, var(--bg, #ffffff)))",
    border: "1px solid var(--border, rgba(127,127,127,0.25))",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    zIndex: 50,
    ...menuPosition,
  };

  return (
    <div ref={rootRef} style={{ position: "relative", ...style }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("common.language")}
        title={current.label}
        style={btnStyle}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Flag code={current.code} />
          {!compact && (
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {current.label}
            </span>
          )}
        </span>
        {!compact && (
          <span
            aria-hidden
            style={{
              opacity: 0.6,
              transition: "transform .15s ease",
              transform: open ? "rotate(180deg)" : "none",
            }}
          >
            ▾
          </span>
        )}
      </button>

      {open && (
        <ul role="menu" aria-label={t("common.language")} style={menuStyle}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = lang.code === current.code;
            const isHover = hovered === lang.code;
            return (
              <li key={lang.code} style={{ margin: 0 }}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => select(lang.code)}
                  onMouseEnter={() => setHovered(lang.code)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "8px 10px",
                    border: "none",
                    borderRadius: 6,
                    background:
                      active || isHover
                        ? "var(--accent-soft, rgba(127,127,127,0.14))"
                        : "transparent",
                    color: "var(--text, inherit)",
                    cursor: "pointer",
                    font: "inherit",
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    textAlign: "left",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Flag code={lang.code} />
                  <span>{lang.label}</span>
                  {active && (
                    <span aria-hidden style={{ marginLeft: "auto", color: "var(--accent, currentColor)" }}>
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default LanguageSwitcher;
