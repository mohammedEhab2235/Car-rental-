import { useEffect, useState } from "react";
import { Wrench, Settings, AlertTriangle, RotateCcw } from "lucide-react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import MaintenanceModal from "@/components/MaintenanceModal";
import Input from "@/components/Input";
import { useToastStore } from "@/stores/toast";
import type { Car, MaintenanceAlert } from "@/types";
import { api } from "@/utils/api";

const ARABIC_TO_ENGLISH: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9"
};

function toEnglishNumbers(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => ARABIC_TO_ENGLISH[d] ?? d);
}

function oilStatusText(current: number, target: number | null) {
  if (!target || target <= 0) return "—";
  const currentNum = current ?? 0;
  if (currentNum >= target) return "يجب التغيير";
  return `${currentNum.toLocaleString()} / ${target.toLocaleString()} كم`;
}

function oilStatusClass(current: number, target: number | null) {
  if (!target || target <= 0) return "text-white/85";
  const currentNum = current ?? 0;
  if (currentNum >= target) return "text-red-400 font-semibold";
  return "text-emerald-400";
}

export default function Maintenance() {
  const push = useToastStore((s) => s.push);

  const [cars, setCars] = useState<Car[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [editCar, setEditCar] = useState<Car | null>(null);
  const [oilNormalTarget, setOilNormalTarget] = useState("");
  const [oilTransmissionTarget, setOilTransmissionTarget] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);
  const [resettingOil, setResettingOil] = useState<string | null>(null);

  async function loadCars() {
    setLoading(true);
    try {
      const data = await api<{ cars: Car[] }>("/cars");
      setCars(data.cars);
    } catch (err) {
      push({ kind: "error", title: "تعذر تحميل السيارات", message: err instanceof Error ? err.message : "" });
    } finally {
      setLoading(false);
    }
  }

  async function loadAlerts() {
    setAlertsLoading(true);
    try {
      const data = await api<{ alerts: MaintenanceAlert[] }>("/maintenance/alerts");
      setAlerts(data.alerts);
    } catch (err) {
      push({ kind: "error", title: "تعذر تحميل التنبيهات", message: err instanceof Error ? err.message : "" });
    } finally {
      setAlertsLoading(false);
    }
  }

  useEffect(() => {
    loadCars();
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openTargetModal(car: Car) {
    setEditCar(car);
    setOilNormalTarget(car.oil_normal_target ? String(car.oil_normal_target) : "");
    setOilTransmissionTarget(car.oil_transmission_target ? String(car.oil_transmission_target) : "");
  }

  async function saveTargets() {
    if (!editCar) return;
    setSavingTarget(true);
    try {
      const normalTarget = toEnglishNumbers(oilNormalTarget);
      const transmissionTarget = toEnglishNumbers(oilTransmissionTarget);
      const body: Record<string, unknown> = {};
      if (normalTarget.trim()) body.oil_normal_target = Number(normalTarget);
      if (transmissionTarget.trim()) body.oil_transmission_target = Number(transmissionTarget);

      await api(`/cars/${editCar.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setCars((list) =>
        list.map((c) =>
          c.id === editCar.id
            ? {
                ...c,
                oil_normal_target: oilNormalTarget.trim() ? Number(oilNormalTarget) : c.oil_normal_target,
                oil_transmission_target: oilTransmissionTarget.trim() ? Number(oilTransmissionTarget) : c.oil_transmission_target
              }
            : c
        )
      );
      setEditCar(null);
      push({ kind: "success", title: "تم حفظ إعدادات الزيت" });
    } catch (err) {
      push({ kind: "error", title: "تعذر الحفظ", message: err instanceof Error ? err.message : "" });
    } finally {
      setSavingTarget(false);
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl border border-white/20 bg-[#1e1e2a]/90 px-5 py-4 shadow-[0_24px_70px_-55px_rgba(0,0,0,0.9)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white/75">الصيانة</div>
              <div className="mt-2 text-xl font-bold">Bilay's Car Rent</div>
            </div>

          </div>
        </div>

        {/* Alerts */}
        <div className="mt-6">
          <div className="rounded-2xl border border-white/20 bg-[#1e1e2a]/95 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.9)] backdrop-blur overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-white/20 px-5 py-4">
              <div>
                <div className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  تنبيهات الصيانة
                </div>
                <div className="mt-1 text-xs text-white/65">سيارات تحتاج تغيير زيت</div>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white/60">
                الإجمالي: {alerts.length}
              </div>
            </div>

            {alertsLoading ? (
              <div className="p-8 text-center text-sm text-white/60">جاري التحميل...</div>
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center text-sm text-white/65">لا توجد سيارات تحتاج صيانة حالياً.</div>
            ) : (
              <div className="space-y-3 p-4">
                {alerts.map((alert) => (
                  <div key={alert.car_id} className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-bold">
                          {alert.car_name} — {alert.model}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {alert.normal_needed ? (
                            <button
                              type="button"
                              disabled={resettingOil === `${alert.car_id}:normal`}
                              onClick={async () => {
                                setResettingOil(`${alert.car_id}:normal`);
                                try {
                                  await api(`/cars/${alert.car_id}`, {
                                    method: "PATCH",
                                    body: JSON.stringify({ km_since_oil_normal_change: 0 })
                                  });
                                  await loadCars();
                                  await loadAlerts();
                                  push({ kind: "success", title: "تم تصفير عداد زيت المحرك" });
                                } catch (err) {
                                  push({ kind: "error", title: "تعذر التحديث", message: err instanceof Error ? err.message : "" });
                                } finally {
                                  setResettingOil(null);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                            >
                              <RotateCcw className="h-3 w-3" />
                              يجب تغيير زيت المحرك — تصفير
                            </button>
                          ) : alert.normal_target ? (
                            <span className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                              زيت المحرك: متبقي {alert.normal_remaining?.toLocaleString()} كم
                            </span>
                          ) : null}
                          {alert.transmission_needed ? (
                            <button
                              type="button"
                              disabled={resettingOil === `${alert.car_id}:transmission`}
                              onClick={async () => {
                                setResettingOil(`${alert.car_id}:transmission`);
                                try {
                                  await api(`/cars/${alert.car_id}`, {
                                    method: "PATCH",
                                    body: JSON.stringify({ km_since_oil_transmission_change: 0 })
                                  });
                                  await loadCars();
                                  await loadAlerts();
                                  push({ kind: "success", title: "تم تصفير عداد زيت الفتيس" });
                                } catch (err) {
                                  push({ kind: "error", title: "تعذر التحديث", message: err instanceof Error ? err.message : "" });
                                } finally {
                                  setResettingOil(null);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                            >
                              <RotateCcw className="h-3 w-3" />
                              يجب تغيير زيت الفتيس — تصفير
                            </button>
                          ) : alert.transmission_target ? (
                            <span className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                              زيت الفتيس: متبقي {alert.transmission_remaining?.toLocaleString()} كم
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 text-xs text-white/60">
                          العداد الحالي: {alert.odometer.toLocaleString()} كم
                        </div>
                      </div>
                      <Button className="shrink-0 px-3 py-2 text-xs" onClick={() => {
                        const car = cars.find((c) => c.id === alert.car_id);
                        if (car) setSelectedCar(car);
                      }}>
                        <Wrench className="h-4 w-4" />
                        صيانة
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-2xl border border-white/20 bg-white/5 p-8 text-center text-sm text-white/60">
              جاري التحميل...
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-[#1e1e2a]/95 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.9)] backdrop-blur">
              <div className="flex items-center justify-between gap-4 border-b border-white/20 px-5 py-4">
                <div>
                  <div className="text-sm font-bold">جدول السيارات</div>
                  <div className="mt-1 text-xs text-white/65">اختر سيارة لإضافة صيانتها</div>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white/60">
                  الإجمالي: {cars.length}
                </div>
              </div>

              <div className="md:hidden">
                {cars.length ? (
                  <div className="space-y-3 p-4">
                    {cars.map((car) => (
                      <div key={car.id} className="rounded-2xl border border-white/20 bg-[#181825]/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold truncate">{car.car_name} — {car.model}</div>
                            <div className="mt-1 text-xs text-white/75">{car.color}</div>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                            <div className="text-[11px] font-semibold text-white/75">زيت المحرك</div>
                            <div className={`mt-1 text-sm ${oilStatusClass(car.km_since_oil_normal_change, car.oil_normal_target)}`}>
                              {oilStatusText(car.km_since_oil_normal_change, car.oil_normal_target)}
                            </div>
                            {car.oil_normal_target ? (
                              <div className="mt-1 text-[10px] text-white/50">هدف: كل {car.oil_normal_target.toLocaleString()} كم</div>
                            ) : null}
                          </div>
                          <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                            <div className="text-[11px] font-semibold text-white/75">زيت الفتيس</div>
                            <div className={`mt-1 text-sm ${oilStatusClass(car.km_since_oil_transmission_change, car.oil_transmission_target)}`}>
                              {oilStatusText(car.km_since_oil_transmission_change, car.oil_transmission_target)}
                            </div>
                            {car.oil_transmission_target ? (
                              <div className="mt-1 text-[10px] text-white/50">هدف: كل {car.oil_transmission_target.toLocaleString()} كم</div>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button variant="secondary" className="flex-1 px-3 py-2 text-xs" onClick={() => openTargetModal(car)}>
                            <Settings className="h-4 w-4" />
                            إعدادات الزيت
                          </Button>
                          <Button className="flex-1 px-3 py-2 text-xs" onClick={() => setSelectedCar(car)}>
                            <Wrench className="h-4 w-4" />
                            فتح الصيانة
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-white/65">لا توجد سيارات.</div>
                )}
              </div>

              <div className="hidden overflow-auto md:block">
                <table className="w-full min-w-[700px] text-right text-sm">
                  <thead className="bg-[#181825]/70 text-xs text-white/75">
                    <tr>
                      <th className="px-5 py-3 font-semibold">السيارة</th>
                      <th className="px-5 py-3 font-semibold">اللون</th>
                      <th className="px-5 py-3 font-semibold">زيت المحرك</th>
                      <th className="px-5 py-3 font-semibold">زيت الفتيس</th>
                      <th className="px-5 py-3 font-semibold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {cars.length ? (
                      cars.map((car) => (
                        <tr key={car.id} className="transition hover:bg-white/[0.08]">
                          <td className="px-5 py-4 font-semibold">{car.car_name} — {car.model}</td>
                          <td className="px-5 py-4 text-white/80">{car.color}</td>
                          <td className="px-5 py-4">
                            <div className={`text-sm ${oilStatusClass(car.km_since_oil_normal_change, car.oil_normal_target)}`}>
                              {oilStatusText(car.km_since_oil_normal_change, car.oil_normal_target)}
                            </div>
                            {car.oil_normal_target ? (
                              <div className="mt-1 text-[11px] text-white/50">هدف: {car.oil_normal_target.toLocaleString()} كم</div>
                            ) : null}
                          </td>
                          <td className="px-5 py-4">
                            <div className={`text-sm ${oilStatusClass(car.km_since_oil_transmission_change, car.oil_transmission_target)}`}>
                              {oilStatusText(car.km_since_oil_transmission_change, car.oil_transmission_target)}
                            </div>
                            {car.oil_transmission_target ? (
                              <div className="mt-1 text-[11px] text-white/50">هدف: {car.oil_transmission_target.toLocaleString()} كم</div>
                            ) : null}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => openTargetModal(car)}>
                                <Settings className="h-4 w-4" />
                                إعدادات الزيت
                              </Button>
                              <Button className="px-3 py-2 text-xs" onClick={() => setSelectedCar(car)}>
                                <Wrench className="h-4 w-4" />
                                صيانة
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-sm text-white/65">
                          لا توجد سيارات.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!selectedCar}
        title={selectedCar ? `صيانة: ${selectedCar.car_name} — ${selectedCar.model}` : "صيانة"}
        onClose={() => setSelectedCar(null)}
        widthClassName="max-w-[640px]"
      >
        {selectedCar ? (
          <MaintenanceModal
            car={selectedCar}
            onClose={() => setSelectedCar(null)}
            onSaved={() => {
              push({ kind: "success", title: "تم حفظ الصيانة" });
              loadCars();
              loadAlerts();
            }}
          />
        ) : null}
      </Modal>

      <Modal open={!!editCar} title="إعدادات تغيير الزيت" onClose={() => setEditCar(null)}>
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-semibold text-white/80">تغيير زيت المحرك كل (كم)</div>
            <Input
              type="text"
              inputMode="numeric"
              value={oilNormalTarget}
              onChange={(e) => setOilNormalTarget(toEnglishNumbers(e.target.value))}
              placeholder="مثال: 5000"
              dir="ltr"
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold text-white/80">تغيير زيت الفتيس كل (كم)</div>
            <Input
              type="text"
              inputMode="numeric"
              value={oilTransmissionTarget}
              onChange={(e) => setOilTransmissionTarget(toEnglishNumbers(e.target.value))}
              placeholder="مثال: 40000"
              dir="ltr"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditCar(null)}>
              إلغاء
            </Button>
            <Button loading={savingTarget} onClick={saveTargets}>
              حفظ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
