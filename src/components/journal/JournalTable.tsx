import { GradeCell } from "./GradeCell";

export interface JournalDate {
  /** ISO-строка или метка даты */
  key:    string;
  /** Отображаемая метка, напр. "1.09" */
  label:  string;
}

export interface JournalStudent {
  id:     string | number;
  name:   string;
  /** Оценки по ключам дат */
  grades: Record<string, number | string | null>;
  /** Средний балл, если считается снаружи */
  avg?:   number | null;
}

interface JournalTableProps {
  dates:      JournalDate[];
  students:   JournalStudent[];
  /** Вызывается при клике на ячейку оценки */
  onCellClick?: (studentId: string | number, dateKey: string) => void;
}

function avgColor(avg: number): string {
  if (avg >= 4.5) return "text-green-700 dark:text-green-400";
  if (avg >= 3.5) return "text-blue-700  dark:text-blue-400";
  if (avg >= 2.5) return "text-amber-700 dark:text-amber-400";
  return "text-red-700 dark:text-red-400";
}

export function JournalTable({ dates, students, onCellClick }: JournalTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full border-collapse text-sm" style={{ tableLayout: "fixed" }}>
        <colgroup>
          {/* Колонка с именем */}
          <col style={{ width: "200px" }} />
          {dates.map((d) => (
            <col key={d.key} style={{ width: "52px" }} />
          ))}
          {/* Средний балл */}
          <col style={{ width: "60px" }} />
        </colgroup>

        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            <th className="py-2.5 px-3 text-left font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              Ученик
            </th>
            {dates.map((d) => (
              <th
                key={d.key}
                className="py-2.5 px-1 text-center font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
              >
                {d.label}
              </th>
            ))}
            <th className="py-2.5 px-1 text-center font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              Ср.
            </th>
          </tr>
        </thead>

        <tbody>
          {students.map((student, idx) => {
            const isLast = idx === students.length - 1;
            const rowCls = isLast ? "" : "border-b border-gray-100 dark:border-gray-800";

            return (
              <tr key={student.id} className={`${rowCls} hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors`}>
                <td className="py-1.5 px-3 text-gray-900 dark:text-gray-100 truncate">
                  {student.name}
                </td>

                {dates.map((d) => (
                  <td key={d.key} className="py-1.5 px-1 text-center">
                    <GradeCell
                      value={student.grades[d.key]}
                      onClick={onCellClick ? () => onCellClick(student.id, d.key) : undefined}
                    />
                  </td>
                ))}

                <td className="py-1.5 px-1 text-center">
                  {student.avg != null ? (
                    <span className={`font-medium ${avgColor(student.avg)}`}>
                      {student.avg.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">—</span>
                  )}
                </td>
              </tr>
            );
          })}

          {students.length === 0 && (
            <tr>
              <td
                colSpan={dates.length + 2}
                className="py-10 text-center text-gray-400 dark:text-gray-500"
              >
                Нет учеников
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
