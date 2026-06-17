import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  children:  ReactNode;
}

const base =
  "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1";

const variants: Record<Variant, string> = {
  primary:   "bg-blue-700 text-white hover:bg-blue-800 active:scale-[0.98]",
  secondary: "bg-transparent text-gray-800 border border-gray-300 hover:bg-gray-100 active:scale-[0.98] dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800",
  danger:    "bg-transparent text-red-700 border border-red-300 hover:bg-red-50 active:scale-[0.98] dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950",
  ghost:     "bg-transparent text-gray-600 hover:bg-gray-100 active:scale-[0.98] dark:text-gray-400 dark:hover:bg-gray-800",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
};

export function Button({
  variant  = "primary",
  size     = "md",
  loading  = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
