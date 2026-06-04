import { useEffect, useState } from "react";
import { ArrowRight, Car as CarIcon, LogOut, Wrench, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import MaintenanceModal from "@/components/MaintenanceModal";
import Input from "@/components/Input";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import type { Car } from "@/types";
import { api } from "@/utils/api";

export default function Maintenance() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const push = useToastStore((s) => s.push);

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [editCar, setEditCar] = useState<Car | null>(null);
  const [oilNormalTarget, setOilNormalTarget] = useState("");
  const [oilTransmissionTarget, setOilTransmissionTarget] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);

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

  useEffect(() => {
    loadCars();
  }, []);

  async function onLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function openTargetModal(car: Car) {
    setEditCar(car);
    setOilNormalTarget(car.oil_normal_target ? String(car.oil_normal_target) : "");
    setOilTransmissionTarget(car.oil_transmission_target ? String(car.oil_transmission_target) : "");
  }

  async function saveTargets() {
    if (!editCar) return;
    setSavingTarget(true);
    try {
      const body: Record<string, unknown> = {};
      if (oilNormalTarget.trim()) body.oil_normal_target = Number(oilNormalTarget);
      if (oilTransmissionTarget.trim()) body.oil_transmission_target = Number(oilTransmissionTarget);

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
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                <ArrowRight className="h-4 w-4" />
                رجوع
              </Button>
              <Button variant="secondary" onClick={() => navigate("/available-cars")}>
                <CarIcon className="h-4 w-4" />
                السيارات المتوفر
              </Button>
              <Button variant="ghost" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                خروج
              </Button>
            </div>
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
                            <div className="mt-1 text-sm text-white/85">
                              {car.oil_normal_target ? `كل ${car.oil_normal_target.toLocaleString()} كم` : "—"}
                            </div>
                          </div>
                          <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                            <div className="text-[11px] font-semibold text-white/75">زيت الفتيس</div>
                            <div className="mt-1 text-sm text-white/85">
                              {car.oil_transmission_target ? `كل ${car.oil_transmission_target.toLocaleString()} كم` : "—"}
                            </div>
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
                      <th className="px-5 py-3 font-semibold">زيت المحرك (هدف)</th>
                      <th className="px-5 py-3 font-semibold">زيت الفتيس (هدف)</th>
                      <th className="px-5 py-3 font-semibold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {cars.length ? (
                      cars.map((car) => (
                        <tr key={car.id} className="transition hover:bg-white/[0.08]">
                          <td className="px-5 py-4 font-semibold">{car.car_name} — {car.model}</td>
                          <td className="px-5 py-4 text-white/80">{car.color}</td>
                          <td className="px-5 py-4 text-white/80">
                            {car.oil_normal_target ? `كل ${car.oil_normal_target.toLocaleString()} كم` : "—"}
                          </td>
                          <td className="px-5 py-4 text-white/80">
                            {car.oil_transmission_target ? `كل ${car.oil_transmission_target.toLocaleString()} كم` : "—"}
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
            onSaved={() => push({ kind: "success", title: "تم حفظ الصيانة" })}
          />
        ) : null}
      </Modal>

      <Modal open={!!editCar} title="إعدادات تغيير الزيت" onClose={() => setEditCar(null)}>
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-semibold text-white/80">تغيير زيت المحرك كل (كم)</div>
            <Input
              type="number"
              value={oilNormalTarget}
              onChange={(e) => setOilNormalTarget(e.target.value)}
              placeholder="مثال: 5000"
              dir="ltr"
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold text-white/80">تغيير زيت الفتيس كل (كم)</div>
            <Input
              type="number"
              value={oilTransmissionTarget}
              onChange={(e) => setOilTransmissionTarget(e.target.value)}
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
