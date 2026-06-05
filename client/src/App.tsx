import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import ToastHost from "@/components/ToastHost";
import Sidebar from "@/components/Sidebar";
import Protected from "@/components/Protected";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const RentHistory = lazy(() => import("@/pages/RentHistory"));
const AvailableCars = lazy(() => import("@/pages/AvailableCars"));
const Maintenance = lazy(() => import("@/pages/Maintenance"));
const CarMaintenanceHistory = lazy(() => import("@/pages/CarMaintenanceHistory"));

export default function App() {
  const load = useAuthStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Router>
      <AppInner />
    </Router>
  );
}

function AppInner() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  return (
    <div className="min-h-screen min-h-[100dvh]">
      {!isLogin && <Sidebar />}
      <div className={cn(!isLogin && "md:pr-60")}>
        <ToastHost />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<IndexRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <Protected>
                  <Dashboard />
                </Protected>
              }
            />
            <Route
              path="/analytics"
              element={
                <Protected>
                  <Analytics />
                </Protected>
              }
            />
            <Route
              path="/rent-history"
              element={
                <Protected>
                  <RentHistory />
                </Protected>
              }
            />
            <Route
              path="/available-cars"
              element={
                <Protected>
                  <AvailableCars />
                </Protected>
              }
            />
            <Route
              path="/maintenance"
              element={
                <Protected>
                  <Maintenance />
                </Protected>
              }
            />
            <Route
              path="/cars/:id/maintenance"
              element={
                <Protected>
                  <CarMaintenanceHistory />
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

function IndexRedirect() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  if (loading) return null;
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center">
      <div className="rounded-2xl border border-white/20 bg-white/5 px-5 py-4 text-sm text-white/80">
        Loading...
      </div>
    </div>
  );
}
