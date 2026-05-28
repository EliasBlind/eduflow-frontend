/**
 * GradeCell — ячейка оценки в журнале.
 *
 * Поддерживает числовые оценки (1–5), статус-коды (строки вроде "Б", "Н", "УП")
 * и пустое состояние.
 */

type GradeValue = number | string | null | undefined;

interface GradeCellProps {
  value?:     GradeValue;
  /** Сделать ячейку кликабельной (для редактирования) */
  onClick?:   () => void;
  className?: string;
}

// Цвета для числовых оценок
const gradeColors: Record<number, string> = {
  5: "bg-green-50  text-green-800  dark:bg-green-950 dark:text-green-200",
  4: "bg-blue-50   text-blue-800   dark:bg-blue-950  dark:text-blue-200",
  3: "bg-amber-50  text-amber-800  dark:bg-amber-950 dark:text-amber-200",
  2: "bg-red-50    text-red-800    dark:bg-red-950   dark:text-red-200",
  1: "bg-red-100   text-red-900    dark:bg-red-900   dark:text-red-100",
};

function colorForValue(value: GradeValue): string {
  if (value === null || value === undefined || value === "") {
    // Пустая ячейка
    return "bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500";
  }
  const num = typeof value === "number" ? value : Number(value);
  if (!isNaN(num) && gradeColors[num]) return gradeColors[num];
  // Статус-код (буква)
  return "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
}

function displayValue(value: GradeValue): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function GradeCell({ value, onClick, className = "" }: GradeCellProps) {
  const color    = colorForValue(value);
  const display  = displayValue(value);
  const isEmpty  = value === null || value === undefined || value === "";
  const isShort  = display.length <= 2;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={[
        "flex items-center justify-center rounded-lg font-medium transition-all",
        "w-9 h-9 text-sm",
        !isShort && "text-xs",
        color,
        onClick
          ? "cursor-pointer hover:opacity-80 hover:scale-105 active:scale-95"
          : "cursor-default",
        isEmpty && onClick && "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-300",
        className,
      ].filter(Boolean).join(" ")}
      aria-label={isEmpty ? "Нет оценки, нажмите чтобы добавить" : `Оценка: ${display}`}
    >
      {display}
    </button>
  );
}
