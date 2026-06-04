import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

export default function Protected({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] items-center justify-center">
        <div className="rounded-2xl border border-white/20 bg-white/5 px-5 py-4 text-sm text-white/80">
          جاري التحميل...
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
