import { useState } from "react";
import { Eye, CheckCircle } from "lucide-react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { cn } from "@/lib/utils";
import type { Car, Rental, RentalPhoto } from "@/types";
import { api } from "@/utils/api";
import { formatDate, formatDateTimeShort } from "@/utils/dates";

function canEndRental(r: Rental): boolean {
  if (r.final_odometer != null) return false;
  const today = new Date().toISOString().slice(0, 10);
  return today >= r.end_date;
}

export default function RentalsTable({
  rentals,
  cars,
  className,
  onUpdate
}: {
  rentals: Rental[];
  cars: Car[];
  className?: string;
  onUpdate?: (rental: Rental) => void;
}) {
  const carLabel = new Map(cars.map((c) => [c.id, `${c.car_name} — ${c.model}`] as const));
  const [previewRental, setPreviewRental] = useState<Rental | null>(null);
  const [photos, setPhotos] = useState<RentalPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);

  const [endRental, setEndRental] = useState<Rental | null>(null);
  const [finalOdometer, setFinalOdometer] = useState("");
  const [endingLoading, setEndingLoading] = useState(false);
  const [endingError, setEndingError] = useState<string | null>(null);

  async function openPreview(rental: Rental) {
    setPreviewRental(rental);
    setLoadingPhotos(true);
    setPhotosError(null);
    setPhotos([]);
    try {
      const data = await api<{ photos: RentalPhoto[] }>(`/rentals/${rental.id}/photos`);
      setPhotos(data.photos);
    } catch (err) {
      setPhotosError(err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الصور");
    } finally {
      setLoadingPhotos(false);
    }
  }

  function openEndRental(rental: Rental) {
    setEndRental(rental);
    setFinalOdometer("");
    setEndingError(null);
    setEndingLoading(false);
  }

  async function submitEndRental() {
    if (!endRental) return;
    const value = Number(finalOdometer);
    if (!Number.isFinite(value) || value < 0 || finalOdometer.trim() === "") {
      setEndingError("الرجاء إدخال عداد صحيح.");
      return;
    }
    setEndingLoading(true);
    setEndingError(null);
    try {
      const data = await api<{ rental: Rental }>(`/rentals/${endRental.id}`, {
        method: "PATCH",
        body: JSON.stringify({ final_odometer: value })
      });
      onUpdate?.(data.rental);
      setEndRental(null);
    } catch (err) {
      setEndingError(err instanceof Error ? err.message : "حدث خطأ أثناء التحديث");
    } finally {
      setEndingLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/20 bg-[#1e1e2a]/95 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.9)] backdrop-blur",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/20 px-5 py-4">
        <div>
          <div className="text-sm font-bold">جدول الإيجارات</div>
          <div className="mt-1 text-xs text-white/65">عرض آخر العقود المسجلة</div>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white/60">
          الإجمالي: {rentals.length}
        </div>
      </div>

      <div className="md:hidden">
        {rentals.length ? (
          <div className="space-y-3 p-4">
            {rentals.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/20 bg-[#181825]/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{r.name}</div>
                    <div className="mt-1 text-xs text-white/75 truncate">{carLabel.get(r.car_id) ?? "—"}</div>
                  </div>
                  <div className="text-base font-bold text-white" dir="ltr">
                    {Number(r.rent_amount).toFixed(2)}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                    <div className="text-[11px] font-semibold text-white/75">الهاتف</div>
                    <div className="mt-1 text-sm text-white/85" dir="ltr">
                      {r.telephone}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                    <div className="text-[11px] font-semibold text-white/75">بداية</div>
                    <div className="mt-1 text-sm text-white/85" dir="ltr">
                      {formatDateTimeShort(r.start_date, r.start_time)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                    <div className="text-[11px] font-semibold text-white/75">نهاية</div>
                    <div className="mt-1 text-sm text-white/85" dir="ltr">
                      {formatDateTimeShort(r.end_date, r.end_time)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                    <div className="text-[11px] font-semibold text-white/75">السيارة</div>
                    <div className="mt-1 text-sm text-white/85 truncate">{carLabel.get(r.car_id) ?? "—"}</div>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                    <div className="text-[11px] font-semibold text-white/75">عداد السيارة</div>
                    <div className="mt-1 text-sm text-white/85" dir="ltr">
                      {r.odometer}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  {canEndRental(r) ? (
                    <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => openEndRental(r)}>
                      <CheckCircle className="h-4 w-4" />
                      End
                    </Button>
                  ) : null}
                  <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => openPreview(r)}>
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-white/65">لا توجد عقود بعد.</div>
        )}
      </div>

      <div className="hidden overflow-auto md:block">
        <table className="w-full min-w-[860px] text-right text-sm">
          <thead className="bg-[#181825]/70 text-xs text-white/75">
            <tr>
              <th className="px-5 py-3 font-semibold">الاسم</th>
              <th className="px-5 py-3 font-semibold">الهاتف</th>
              <th className="px-5 py-3 font-semibold">السيارة</th>
              <th className="px-5 py-3 font-semibold">بداية (التاريخ/الوقت)</th>
              <th className="px-5 py-3 font-semibold">نهاية (التاريخ/الوقت)</th>
              <th className="px-5 py-3 font-semibold">عداد السيارة</th>
              <th className="px-5 py-3 font-semibold">الإجمالي</th>
              <th className="px-5 py-3 font-semibold">الصور</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rentals.length ? (
              rentals.map((r) => (
                <tr key={r.id} className="transition hover:bg-white/[0.08]">
                  <td className="px-5 py-4 font-semibold">{r.name}</td>
                  <td className="px-5 py-4 text-white/80" dir="ltr">
                    {r.telephone}
                  </td>
                  <td className="px-5 py-4 text-white/80">{carLabel.get(r.car_id) ?? "—"}</td>
                  <td className="px-5 py-4 text-white/80" dir="ltr">
                    {formatDateTimeShort(r.start_date, r.start_time)}
                  </td>
                  <td className="px-5 py-4 text-white/80" dir="ltr">
                    {formatDateTimeShort(r.end_date, r.end_time)}
                  </td>
                  <td className="px-5 py-4 text-white/80" dir="ltr">
                    {r.odometer}
                  </td>
                  <td className="px-5 py-4 font-bold text-white">{Number(r.rent_amount).toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {canEndRental(r) ? (
                        <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => openEndRental(r)}>
                          <CheckCircle className="h-4 w-4" />
                          End
                        </Button>
                      ) : null}
                      <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => openPreview(r)}>
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-white/65">
                  لا توجد عقود بعد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal open={Boolean(endRental)} title="إنهاء العقد" onClose={() => setEndRental(null)}>
        <div className="space-y-4">
          {endRental ? (
            <div className="rounded-2xl border border-white/20 bg-[#181825]/70 px-4 py-3 text-sm text-white/80">
              {endRental.name} - {carLabel.get(endRental.car_id) ?? "—"}
            </div>
          ) : null}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/80">عداد السيارة بعد التسليم</label>
            <input
              type="number"
              min={0}
              value={finalOdometer}
              onChange={(e) => setFinalOdometer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitEndRental();
              }}
              className="w-full rounded-xl border border-white/20 bg-[#181825]/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/30"
              placeholder="أدخل العداد النهائي"
            />
          </div>
          {endingError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-50">{endingError}</div>
          ) : null}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" disabled={endingLoading} onClick={() => setEndRental(null)}>
              إلغاء
            </Button>
            <Button loading={endingLoading} onClick={submitEndRental}>
              حفظ
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(previewRental)} title="صور العقد" onClose={() => setPreviewRental(null)} widthClassName="max-w-[900px]">
        <div className="space-y-4">
          {previewRental ? (
            <div className="rounded-2xl border border-white/20 bg-[#181825]/70 px-4 py-3 text-sm text-white/80">
              {previewRental.name} - {carLabel.get(previewRental.car_id) ?? "—"}
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
            <Button variant="secondary" onClick={() => setPreviewRental(null)}>
              إغلاق
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
