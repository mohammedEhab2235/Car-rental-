import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, History, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import NewCarForm from "@/components/NewCarForm";
import EditCarForm from "@/components/EditCarForm";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import type { Car } from "@/types";
import { api } from "@/utils/api";
import { formatDateTime } from "@/utils/dates";

export default function AvailableCars() {
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);

  const [cars, setCars] = useState<Car[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openCar, setOpenCar] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [deletingCar, setDeletingCar] = useState<Car | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const totalPages = Math.ceil(total / perPage);

  async function loadCars(targetPage: number) {
    setLoading(true);
    try {
      const data = await api<{ cars: Car[]; total: number; page: number; per_page: number }>(
        `/cars?page=${targetPage}&per_page=${perPage}`
      );
      setCars(data.cars);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      push({ kind: "error", title: "تعذر تحميل السيارات", message: err instanceof Error ? err.message : "" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCars(1);
  }, []);

  async function confirmDelete() {
    if (!deletingCar) return;
    setDeleteLoading(true);
    try {
      await api<void>(`/cars/${deletingCar.id}`, { method: "DELETE" });
      setCars((c) => c.filter((x) => x.id !== deletingCar.id));
      setTotal((t) => t - 1);
      push({ kind: "success", title: "تم حذف السيارة" });
      setDeletingCar(null);
      if (cars.length === 1 && page > 1) {
        loadCars(page - 1);
      }
    } catch (err) {
      push({ kind: "error", title: "تعذر حذف السيارة", message: err instanceof Error ? err.message : "" });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl border border-white/20 bg-[#1e1e2a]/90 px-5 py-4 shadow-[0_24px_70px_-55px_rgba(0,0,0,0.9)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white/75">السيارات المتوفر</div>
              <div className="mt-2 text-xl font-bold">Bilay's Car Rent</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => setOpenCar(true)}>
                <Plus className="h-4 w-4" />
                سيارة جديدة
              </Button>

            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/20 bg-[#1e1e2a]/95 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.9)] backdrop-blur">
          <div className="flex items-center justify-between gap-4 border-b border-white/20 px-5 py-4">
            <div>
              <div className="text-sm font-bold">السيارات المتوفر</div>
              <div className="mt-1 text-xs text-white/65">كل السيارات المسجلة لديك</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white/60">
              الإجمالي: {total}
            </div>
          </div>

          <div className="md:hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-white/60">جاري التحميل...</div>
            ) : cars.length ? (
              <div className="space-y-3 p-4">
                {cars.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-white/20 bg-[#181825]/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold">{c.car_name}</div>
                        <div className="mt-1 truncate text-xs text-white/75">{c.model}</div>
                      </div>
                      <div className="text-base font-bold text-white" dir="ltr">
                        {Number(c.daily_price ?? 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                        <div className="text-[11px] font-semibold text-white/75">اللون</div>
                        <div className="mt-1 text-sm text-white/85">{c.color}</div>
                      </div>
                      <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                        <div className="text-[11px] font-semibold text-white/75">الموديل</div>
                        <div className="mt-1 text-sm text-white/85">{c.model}</div>
                      </div>
                      <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                        <div className="text-[11px] font-semibold text-white/75">العداد</div>
                        <div className="mt-1 text-sm text-white/85" dir="ltr">{(c.odometer ?? 0).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => setEditingCar(c)}>
                        <Pencil className="h-4 w-4" />
                        تعديل
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        onClick={() => navigate(`/cars/${c.id}/maintenance`)}
                      >
                        <History className="h-4 w-4" />
                        سجل الصيانة
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-3 py-2 text-xs text-red-50 hover:bg-red-500/15"
                        onClick={() => setDeletingCar(c)}
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-white/65">لا توجد سيارات بعد.</div>
            )}
          </div>

          <div className="hidden overflow-auto md:block">
            <table className="w-full min-w-[860px] text-right text-sm">
              <thead className="bg-[#181825]/70 text-xs text-white/75">
                <tr>
                  <th className="px-5 py-3 font-semibold">اسم السيارة</th>
                  <th className="px-5 py-3 font-semibold">الموديل</th>
                  <th className="px-5 py-3 font-semibold">اللون</th>
                  <th className="px-5 py-3 font-semibold">السعر اليومي</th>
                  <th className="px-5 py-3 font-semibold">العداد</th>
                  <th className="px-5 py-3 font-semibold">تاريخ الإضافة</th>
                  <th className="px-5 py-3 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-white/60">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : cars.length ? (
                  cars.map((c) => (
                    <tr key={c.id} className="transition hover:bg-white/[0.08]">
                      <td className="px-5 py-4 font-semibold">{c.car_name}</td>
                      <td className="px-5 py-4 text-white/80">{c.model}</td>
                      <td className="px-5 py-4 text-white/80">{c.color}</td>
                      <td className="px-5 py-4 font-bold text-white" dir="ltr">
                        {Number(c.daily_price ?? 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-white/80" dir="ltr">
                        {(c.odometer ?? 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-white/80" dir="ltr">
                        {formatDateTime(c.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => setEditingCar(c)}>
                            <Pencil className="h-4 w-4" />
                            تعديل
                          </Button>
                          <Button
                            variant="ghost"
                            className="px-3 py-2 text-xs"
                            onClick={() => navigate(`/cars/${c.id}/maintenance`)}
                          >
                            <History className="h-4 w-4" />
                            سجل الصيانة
                          </Button>
                          <Button
                            variant="ghost"
                            className="px-3 py-2 text-xs text-red-50 hover:bg-red-500/15"
                            onClick={() => setDeletingCar(c)}
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-white/65">
                      لا توجد سيارات بعد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-4 border-t border-white/20 px-5 py-4">
              <Button
                variant="secondary"
                className="px-3 py-2 text-xs"
                disabled={page <= 1 || loading}
                onClick={() => loadCars(page - 1)}
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </Button>
              <div className="text-xs text-white/60">
                صفحة {page} من {totalPages}
              </div>
              <Button
                variant="secondary"
                className="px-3 py-2 text-xs"
                disabled={page >= totalPages || loading}
                onClick={() => loadCars(page + 1)}
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <Modal open={openCar} title="إضافة سيارة" onClose={() => setOpenCar(false)}>
        <NewCarForm
          onCreated={() => {
            push({ kind: "success", title: "تمت إضافة السيارة" });
            setOpenCar(false);
            loadCars(1);
          }}
        />
      </Modal>

      <Modal open={Boolean(editingCar)} title="تعديل السيارة" onClose={() => setEditingCar(null)}>
        {editingCar ? (
          <EditCarForm
            car={editingCar}
            onSaved={(updated) => {
              setCars((c) => c.map((x) => (x.id === updated.id ? updated : x)));
              push({ kind: "success", title: "تم حفظ التعديلات" });
              setEditingCar(null);
            }}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingCar)}
        title="تأكيد حذف السيارة"
        message={
          deletingCar ? (
            <>
              هل أنت متأكد أنك تريد حذف <span className="font-bold">{deletingCar.car_name}</span>؟
            </>
          ) : null
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeletingCar(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
