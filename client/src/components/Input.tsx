import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export default function Input({ className, label, hint, error, id, ...props }: Props) {
  const inputId = id ?? props.name;
  return (
    <label className="block">
      {label ? <div className="mb-2 text-xs font-semibold text-white/80">{label}</div> : null}
      <input
        id={inputId}
        className={cn(
          "h-11 w-full rounded-xl border bg-white/5 px-4 text-base text-white outline-none transition sm:text-sm",
          "placeholder:text-white/35",
          error ? "border-red-500/40 focus:border-red-500/70" : "border-white/20 focus:border-white/35",
          "focus:ring-4 focus:ring-[#D10F1A]/15",
          className
        )}
        {...props}
      />
      {error ? <div className="mt-2 text-xs text-red-200/90">{error}</div> : null}
      {!error && hint ? <div className="mt-2 text-xs text-white/65">{hint}</div> : null}
    </label>
  );
}
