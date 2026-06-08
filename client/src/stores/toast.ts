import { create } from "zustand";

export type ToastKind = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
};

type ToastState = {
  items: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => void;
  remove: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (t) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const item: ToastItem = { id, ...t };
    set((s) => ({ items: [item, ...s.items].slice(0, 4) }));
    setTimeout(() => set((s) => ({ items: s.items.filter((x) => x.id !== id) })), 3200);
  },
  remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) }))
}));

