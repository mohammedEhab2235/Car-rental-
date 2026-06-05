import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Wrench } from "lucide-react";
import Button from "@/components/Button";
import { useToastStore } from "@/stores/toast";
import type { Car, MaintenanceRecord } from "@/types";
import { api } from "@/utils/api";
import { formatDate } from "@/utils/dates";

export default function CarMaintenanceHistory() {
  const { id } = useParams<{ id: string }>();
  const push = useToastStore((s) => s.push);

  const [car, setCar] = useState<Car | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      try {
        const [carData, recData] = await Promise.all([
          api<{ car: Car }>(`/cars/${encodeURIComponent(id)}`),
          api<{ records: MaintenanceRecord[] }>(`/maintenance?car_id=${encodeURIComponent(id)}`)
        ]);
        setCar(carData.car);
        setRecords(recData.records);
      } catch (err) {
        push({ kind: "error", title: "تعذر تحميل البيانات", message: err instanceof Error ? err.message : "" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return (
    <div className="min-h-screen min-h-[100dvh]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl border border-white/20 bg-[#1e1e2a]/90 px-5 py-4 shadow-[0_24px_70px_-55px_rgba(0,0,0,0.9)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white/75">سجل الصيانة</div>
              <div className="mt-2 text-xl font-bold">
                {car ? `${car.car_name} — ${car.model}` : "..."}
              </div>
            </div>

          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/20 bg-[#1e1e2a]/95 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.9)] backdrop-blur">
          <div className="flex items-center justify-between gap-4 border-b border-white/20 px-5 py-4">
            <div>
              <div className="text-sm font-bold">سجل الصيانة</div>
              <div className="mt-1 text-xs text-white/65">كل عمليات الصيانة المسجلة لهذه السيارة</div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-white/60">جاري التحميل...</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-sm text-white/65">لا توجد سجلات صيانة لهذه السيارة.</div>
          ) : (
            <div className="space-y-3 p-4">
              {records.map((rec) => (
                <div key={rec.id} className="rounded-2xl border border-white/20 bg-[#181825]/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold text-white/80">{formatDate(rec.created_at)}</div>
                    <div className="text-sm font-bold" dir="ltr">
                      {rec.total_price.toFixed(2)} ج.م
                    </div>
                  </div>
                  {rec.oil_normal_current ? (
                    <div className="mt-1 text-[11px] text-white/60">
                      زيت المحرك: {rec.oil_normal_current.toLocaleString()} كم
                    </div>
                  ) : null}
                  {rec.oil_transmission_current ? (
                    <div className="mt-1 text-[11px] text-white/60">
                      زيت الفتيس: {rec.oil_transmission_current.toLocaleString()} كم
                    </div>
                  ) : null}
                  <div className="mt-2 space-y-1">
                    {rec.items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-white/75">{it.item_type}</span>
                        <span className="text-white/90" dir="ltr">
                          {Number(it.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
