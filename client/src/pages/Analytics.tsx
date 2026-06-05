import { useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

import type { AnalyticsResponse } from "@/types";
import { api } from "@/utils/api";
import { useToastStore } from "@/stores/toast";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Analytics() {
  const push = useToastStore((s) => s.push);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api<AnalyticsResponse>("/analytics");
        setData(res);
      } catch (err) {
        push({ kind: "error", title: "تعذر تحميل التحليلات", message: err instanceof Error ? err.message : "" });
      } finally {
        setLoading(false);
      }
    })();
  }, [push]);

  const rentedChart = useMemo(() => {
    const labels = data?.chartMostRented.map((x) => x.label) ?? [];
    const values = data?.chartMostRented.map((x) => x.value) ?? [];
    return {
      labels,
      datasets: [
        {
          label: "عدد الإيجارات",
          data: values,
          backgroundColor: "rgba(209, 15, 26, 0.65)",
          borderColor: "rgba(209, 15, 26, 0.95)",
          borderWidth: 1,
          borderRadius: 10
        }
      ]
    };
  }, [data]);

  const profitChart = useMemo(() => {
    const labels = data?.chartMostProfit.map((x) => x.label) ?? [];
    const values = data?.chartMostProfit.map((x) => x.value) ?? [];
    return {
      labels,
      datasets: [
        {
          label: "الإيراد",
          data: values,
          backgroundColor: "rgba(242, 242, 245, 0.14)",
          borderColor: "rgba(242, 242, 245, 0.28)",
          borderWidth: 1,
          borderRadius: 10
        }
      ]
    };
  }, [data]);

  const maintenanceChart = useMemo(() => {
    const labels = data?.chartMaintenanceCost.map((x) => x.label) ?? [];
    const values = data?.chartMaintenanceCost.map((x) => x.value) ?? [];
    return {
      labels,
      datasets: [
        {
          label: "تكلفة الصيانة",
          data: values,
          backgroundColor: "rgba(245, 158, 11, 0.65)",
          borderColor: "rgba(245, 158, 11, 0.95)",
          borderWidth: 1,
          borderRadius: 10
        }
      ]
    };
  }, [data]);

  return (
    <div className="min-h-screen min-h-[100dvh]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-[#D10F1A]" />
          <div>
            <div className="text-xs font-semibold text-white/75">التحليلات</div>
            <div className="mt-2 text-xl font-bold">لوحة التحليلات</div>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-white/20 bg-white/5 p-8 text-center text-sm text-white/60">
            جاري التحميل...
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <KpiCard
                label="الأكثر تأجيرًا"
                value={data?.mostRentedCar ? `${data.mostRentedCar.label}` : "—"}
                sub={data?.mostRentedCar ? `عدد العقود: ${data.mostRentedCar.count}` : "لا توجد بيانات"}
              />
              <KpiCard
                label="الأعلى ربحًا"
                value={data?.mostProfitableCar ? `${data.mostProfitableCar.label}` : "—"}
                sub={data?.mostProfitableCar ? `الإيراد: ${data.mostProfitableCar.total.toFixed(2)}` : "لا توجد بيانات"}
                dir="ltr"
              />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ChartCard title="أكثر السيارات تأجيرًا">
                <Bar
                  data={rentedChart}
                  options={{
                    responsive: true,
                    plugins: { legend: { labels: { color: "rgba(242,242,245,0.75)" } } },
                    scales: {
                      x: { ticks: { color: "rgba(242,242,245,0.6)" }, grid: { color: "rgba(255,255,255,0.06)" } },
                      y: { ticks: { color: "rgba(242,242,245,0.6)" }, grid: { color: "rgba(255,255,255,0.06)" } }
                    }
                  }}
                />
              </ChartCard>
              <ChartCard title="الأعلى ربحًا">
                <Bar
                  data={profitChart}
                  options={{
                    responsive: true,
                    plugins: { legend: { labels: { color: "rgba(242,242,245,0.75)" } } },
                    scales: {
                      x: { ticks: { color: "rgba(242,242,245,0.6)" }, grid: { color: "rgba(255,255,255,0.06)" } },
                      y: { ticks: { color: "rgba(242,242,245,0.6)" }, grid: { color: "rgba(255,255,255,0.06)" } }
                    }
                  }}
                />
              </ChartCard>
            </div>

            {data?.chartMaintenanceCost && data.chartMaintenanceCost.length > 0 ? (
              <div className="mt-6">
                <ChartCard title="تكاليف الصيانة per سيارة">
                  <Bar
                    data={maintenanceChart}
                    options={{
                      responsive: true,
                      plugins: { legend: { labels: { color: "rgba(242,242,245,0.75)" } } },
                      scales: {
                        x: { ticks: { color: "rgba(242,242,245,0.6)" }, grid: { color: "rgba(255,255,255,0.06)" } },
                        y: { ticks: { color: "rgba(242,242,245,0.6)" }, grid: { color: "rgba(255,255,255,0.06)" } }
                      }
                    }}
                  />
                </ChartCard>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  dir
}: {
  label: string;
  value: string;
  sub: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-[#1e1e2a]/95 p-5 shadow-[0_20px_70px_-55px_rgba(0,0,0,0.9)] backdrop-blur">
      <div className="text-xs font-semibold text-white/75">{label}</div>
      <div className="mt-2 text-lg font-bold" dir={dir}>
        {value}
      </div>
      <div className="mt-2 text-xs text-white/65" dir={dir}>
        {sub}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-[#1e1e2a]/95 p-5 shadow-[0_20px_70px_-55px_rgba(0,0,0,0.9)] backdrop-blur">
      <div className="text-sm font-bold">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
