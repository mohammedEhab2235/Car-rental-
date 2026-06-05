import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, History } from "lucide-react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import type { RentalLog, RentalPhoto } from "@/types";
import { api } from "@/utils/api";
import { formatDateTime } from "@/utils/dates";

export default function RentHistory() {
  const push = useToastStore((s) => s.push);

  const [logs, setLogs] = useState<RentalLog[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [previewLog, setPreviewLog] = useState<RentalLog | null>(null);
  const [photos, setPhotos] = useState<RentalPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / perPage);

  async function loadLogs(targetPage: number) {
    setLoading(true);
    try {
      const data = await api<{ logs: RentalLog[]; total: number; page: number; per_page: number }>(
        `/rental-logs?page=${targetPage}&per_page=${perPage}`
      );
      setLogs(data.logs);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      push({ kind: "error", title: "تعذر تحميل السجلات", message: err instanceof Error ? err.message : "" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs(1);
  }, []);

  async function openPreview(log: RentalLog) {
    if (!log.rental_id) return;
    setPreviewLog(log);
    setLoadingPhotos(true);
    setPhotosError(null);
    setPhotos([]);
    try {
      const data = await api<{ photos: RentalPhoto[] }>(`/rentals/${log.rental_id}/photos`);
      setPhotos(data.photos);
    } catch (err) {
      setPhotosError(err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الصور");
    } finally {
      setLoadingPhotos(false);
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl border border-white/20 bg-[#1e1e2a]/90 px-5 py-4 shadow-[0_24px_70px_-55px_rgba(0,0,0,0.9)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white/75">سجل الإيجارات</div>
              <div className="mt-2 text-xl font-bold">Bilay's Car Rent</div>
            </div>

          </div>
        </div>

        <div className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-[#1e1e2a]/95 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.9)] backdrop-blur">
            <div className="flex items-center justify-between gap-4 border-b border-white/20 px-5 py-4">
              <div>
                <div className="text-sm font-bold">سجل العمليات</div>
                <div className="mt-1 text-xs text-white/65">عرض أحداث العقود</div>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white/60">
                الإجمالي: {total}
              </div>
            </div>

            <div className="md:hidden">
              {loading ? (
                <div className="p-8 text-center text-sm text-white/60">جاري التحميل...</div>
              ) : logs.length ? (
                <div className="space-y-3 p-4">
                  {logs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-white/20 bg-[#181825]/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-bold truncate">{log.action}</div>
                          <div className="mt-1 text-xs text-white/75 truncate">
                            {log.rentals?.name ?? "—"}
                          </div>
                        </div>
                        <div className="text-xs text-white/65" dir="ltr">
                          {new Date(log.created_at).toLocaleString("ar-EG")}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                          <div className="text-[11px] font-semibold text-white/75">السيارة</div>
                          <div className="mt-1 text-sm text-white/85 truncate">
                            {log.cars ? `${log.cars.car_name} — ${log.cars.model}` : "—"}
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                          <div className="text-[11px] font-semibold text-white/75">المستخدم</div>
                          <div className="mt-1 text-sm text-white/85">{log.actor_username ?? "—"}</div>
                        </div>
                      </div>
                      {log.rental_id ? (
                        <div className="mt-3">
                          <Button variant="secondary" className="w-full text-xs" onClick={() => openPreview(log)}>
                            <Eye className="h-4 w-4" /> معاينة الصور
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-white/65">لا توجد سجلات.</div>
              )}
            </div>

            <div className="hidden overflow-auto md:block">
              <table className="w-full min-w-[700px] text-right text-sm">
                <thead className="bg-[#181825]/70 text-xs text-white/75">
                  <tr>
                    <th className="px-5 py-3 font-semibold">العملية</th>
                    <th className="px-5 py-3 font-semibold">العميل</th>
                    <th className="px-5 py-3 font-semibold">السيارة</th>
                    <th className="px-5 py-3 font-semibold">المستخدم</th>
                    <th className="px-5 py-3 font-semibold">التاريخ</th>
                    <th className="px-5 py-3 font-semibold">صور</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm text-white/60">
                        جاري التحميل...
                      </td>
                    </tr>
                  ) : logs.length ? (
                    logs.map((log) => (
                      <tr key={log.id} className="transition hover:bg-white/[0.08]">
                        <td className="px-5 py-4 font-semibold">{log.action}</td>
                        <td className="px-5 py-4 text-white/80">{log.rentals?.name ?? "—"}</td>
                        <td className="px-5 py-4 text-white/80">
                          {log.cars ? `${log.cars.car_name} — ${log.cars.model}` : "—"}
                        </td>
                        <td className="px-5 py-4 text-white/80">{log.actor_username ?? "—"}</td>
                        <td className="px-5 py-4 text-white/60" dir="ltr">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          {log.rental_id ? (
                            <Button variant="ghost" onClick={() => openPreview(log)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm text-white/65">
                        لا توجد سجلات.
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
                  onClick={() => loadLogs(page - 1)}
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
                  onClick={() => loadLogs(page + 1)}
                >
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Modal open={Boolean(previewLog)} title="صور العقد" onClose={() => setPreviewLog(null)} widthClassName="max-w-[900px]">
        <div className="space-y-4">
          {previewLog ? (
            <div className="rounded-2xl border border-white/20 bg-[#181825]/70 px-4 py-3 text-sm text-white/80">
              {previewLog.rentals?.name ?? "—"} - {previewLog.cars ? `${previewLog.cars.car_name} — ${previewLog.cars.model}` : "—"}
            </div>
          ) : null}
          {loadingPhotos ? <div className="text-sm text-white/60">جاري تحميل الصور...</div> : null}
          {photosError ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-50">{photosError}</div> : null}
          {!loadingPhotos && !photosError && !photos.length ? (
            <div className="rounded-2xl border border-white/20 bg-[#181825]/70 p-8 text-center text-sm text-white/65">لا توجد صور مرفوعة لهذا العقد.</div>
          ) : null}
          {!loadingPhotos && photos.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo, index) => (
                <a
                  key={photo.id}
                  href={photo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-2xl border border-white/20 bg-[#181825]/70 transition hover:border-white/20"
                >
                  <img src={photo.url} alt={`Rental photo ${index + 1}`} className="h-56 w-full object-cover" />
                  <div className="px-3 py-2 text-xs text-white/75">Open full image</div>
                </a>
              ))}
            </div>
          ) : null}
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setPreviewLog(null)}>
              إغلاق
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
