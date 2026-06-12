import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({ children, className = "", variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: "primary" | "outline" | "danger" }) {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary: "border border-ink bg-ink text-white",
    outline: "border border-line bg-white text-ink hover:bg-slate-50",
    danger: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

