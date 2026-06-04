import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const push = useToastStore((s) => s.push);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      push({ kind: "error", title: "تحقق من الحقول", message: "الرجاء إدخال اسم المستخدم وكلمة المرور." });
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      push({ kind: "success", title: "تم تسجيل الدخول", message: "مرحبًا بك في لوحة التحكم." });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      push({ kind: "error", title: "فشل تسجيل الدخول", message: err instanceof Error ? err.message : "حاول مرة أخرى" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh]">
      <div className="mx-auto grid min-h-screen min-h-[100dvh] max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2">
        <div className="hidden lg:block">
          <div className="rounded-3xl border border-white/20 bg-white/5 p-10 shadow-[0_40px_120px_-70px_rgba(209,15,26,0.9)] backdrop-blur">
            <div className="text-xs font-semibold text-white/60">لوحة تحكم</div>
            <div className="mt-3 text-3xl font-bold tracking-tight">Bilay's Car Rent</div>
            <div className="mt-4 max-w-md text-sm leading-7 text-white/70">
              واجهة عربية Premium لإدارة السيارات والعقود والتحليلات مع تجربة سلسة.
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <Feature title="إدارة السيارات" desc="إضافة سيارات وتحديث بياناتها بسهولة." />
              <Feature title="رفع صور" desc="حتى 5 صور مع معاينة مباشرة." />
              <Feature title="تحليلات" desc="أكثر سيارة تأجيرًا والأعلى ربحًا." />
              <Feature title="تصميم فاخر" desc="أحمر/أسود مع Glassmorphism." />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-white/20 bg-[#1e1e2a]/95 p-7 shadow-[0_30px_90px_-50px_rgba(0,0,0,0.95)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white/75">تسجيل الدخول</div>
                <div className="mt-2 text-xl font-bold">مرحبًا بك</div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-[#D10F1A]/15 ring-1 ring-[#D10F1A]/25" />
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Input
                label="اسم المستخدم"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
              <Input
                label="كلمة المرور"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Button type="submit" className="h-11 w-full" loading={loading}>
                دخول
              </Button>
            </form>

            <div className="mt-5 text-xs text-white/65">
              تلميح: بيانات الدخول تُضبط من الخادم عبر متغيرات البيئة.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-[#181825]/70 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-xs leading-6 text-white/75">{desc}</div>
    </div>
  );
}
