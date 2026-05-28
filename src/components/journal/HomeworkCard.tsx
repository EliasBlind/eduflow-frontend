import { Button } from "../ui/Button";

interface HomeworkCardProps {
  subject:     string;
  date:        string;
  description: string;
  onEdit?:     () => void;
  onDelete?:   () => void;
}

export function HomeworkCard({ subject, date, description, onEdit, onDelete }: HomeworkCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {subject}
          </span>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{date}</p>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex shrink-0 gap-1">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Редактировать">
                ✎
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Удалить">
                ✕
              </Button>
            )}
          </div>
        )}
      </div>

      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{description}</p>
    </div>
  );
}
