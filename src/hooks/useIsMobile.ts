import { useEffect, useState } from "react";

/**
 * Возвращает true, когда ширина вьюпорта ≤ breakpoint (по умолчанию 640px).
 * Реагирует на ресайз окна и поворот устройства.
 *
 * Положите файл в src/hooks/ (импорт `@/hooks/useIsMobile`).
 */
export function useIsMobile(breakpoint = 640): boolean {
  const query = `(max-width: ${breakpoint}px)`;

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return isMobile;
}

export default useIsMobile;
