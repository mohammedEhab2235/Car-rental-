import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName?: string;
};

export default function Modal({ open, title, onClose, children, widthClassName }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="إغلاق"
      />
      <div className="relative z-10 flex h-full items-center justify-center p-4">
        <div
          className={`w-full ${
            widthClassName ?? "max-w-[560px]"
          } max-h-[90dvh] overflow-hidden rounded-2xl border border-white/20 bg-[#1e1e2a]/95 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.95)] backdrop-blur`}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/20 px-5 py-4">
            <div className="min-w-0">
              <div className="text-sm font-bold">{title}</div>
              <div className="mt-1 text-xs text-white/65">Bilay's Car Rent</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">إغلاق</span>
            </button>
          </div>
          <div className="max-h-[calc(90dvh-80px)] overflow-auto px-4 py-5 sm:px-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
