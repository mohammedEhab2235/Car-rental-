import { create } from "zustand";
import { api } from "@/utils/api";

type User = { username: string; loggedInAt: number };

type AuthState = {
  user: User | null;
  loading: boolean;
  load: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  load: async () => {
    set({ loading: true });
    try {
      const data = await api<{ user: User | null }>("/session");
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  login: async (username, password) => {
    await api<{ ok: true }>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    await (useAuthStore.getState().load());
  },
  logout: async () => {
    try {
      await api<{ ok: true }>("/logout", { method: "POST", body: "{}" });
    } finally {
      set({ user: null });
    }
  }
}));

