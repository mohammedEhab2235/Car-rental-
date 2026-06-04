import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

export default function Button({
  className,
  variant = "primary",
  loading,
  disabled,
  children,
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary:
      "bg-[#D10F1A] text-white shadow-[0_14px_40px_-18px_rgba(209,15,26,0.9)] hover:bg-[#B10D16]",
    secondary:
      "border border-white/20 bg-white/5 text-white hover:bg-white/10",
    ghost: "text-white/90 hover:bg-white/5"
  };

  return (
    <button
      className={cn(base, variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : null}
      <span className="truncate">{children}</span>
    </button>
  );
}

