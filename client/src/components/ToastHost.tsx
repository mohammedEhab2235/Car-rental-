import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast";

const kindStyles: Record<string, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-50",
  error: "border-red-500/30 bg-red-500/10 text-red-50",
  info: "border-white/20 bg-white/5 text-white"
};

export default function ToastHost() {
  const items = useToastStore((s) => s.items);
  const remove = useToastStore((s) => s.remove);

  return (
    <div className="pointer-events-none fixed left-4 top-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto rounded-xl border p-4 shadow-[0_18px_60px_-22px_rgba(0,0,0,0.9)] backdrop-blur",
            "animate-[toastIn_220ms_ease-out]",
            kindStyles[t.kind]
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{t.title}</div>
              {t.message ? <div className="mt-1 text-xs opacity-90">{t.message}</div> : null}
            </div>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="rounded-lg p-1 opacity-70 transition hover:opacity-100"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <style>{`@keyframes toastIn{from{transform:translateY(-6px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

