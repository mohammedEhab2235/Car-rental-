import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Car,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Wrench,
  X
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { path: "/available-cars", label: "السيارات", icon: Car },
  { path: "/analytics", label: "التحليلات", icon: BarChart3 },
  { path: "/rent-history", label: "سجل الإيجارات", icon: History },
  { path: "/maintenance", label: "الصيانة", icon: Wrench }
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  async function onLogout() {
    await logout();
    navigate("/login", { replace: true });
    setOpen(false);
  }

  function go(path: string) {
    navigate(path);
    setOpen(false);
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-[#1e1e2a]/90 text-white shadow-lg backdrop-blur md:hidden"
        aria-label="فتح القائمة"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-60 flex-col border-l border-white/10 bg-[#13131A]/95 shadow-2xl backdrop-blur transition-transform duration-300",
          "md:translate-x-0",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Close button (mobile only) */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white md:hidden"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="border-b border-white/10 px-5 py-5">
          <div className="text-lg font-bold text-white">Bilay's Car Rent</div>
          <div className="mt-1 text-xs text-white/50">مرحبًا {user?.username}</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => go(item.path)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-[#D10F1A]/15 text-[#D10F1A]"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active && "text-[#D10F1A]")} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 px-3 py-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>
      </aside>
    </>
  );
}
