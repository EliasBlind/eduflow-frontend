type Size = "sm" | "md" | "lg";

interface SpinnerProps {
  size?:  Size;
  label?: string;
}

const sizes: Record<Size, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-9 h-9 border-[3px]",
};

export function Spinner({ size = "md", label = "Загрузка..." }: SpinnerProps) {
  return (
    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
      <span
        className={`${sizes[size]} inline-block rounded-full border-gray-300 border-t-blue-600 animate-spin dark:border-gray-600 dark:border-t-blue-400`}
        role="status"
        aria-label={label}
      />
      {size === "lg" && (
        <span className="text-sm">{label}</span>
      )}
    </div>
  );
}

export function SpinnerFull({ label }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <Spinner size="lg" label={label} />
    </div>
  );
}
