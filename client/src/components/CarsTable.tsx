import { cn } from "@/lib/utils";
import type { Car } from "@/types";
import Button from "@/components/Button";
import { Pencil, Trash2 } from "lucide-react";
import { formatDateTime } from "@/utils/dates";

export default function CarsTable({
  cars,
  className,
  onEdit,
  onDelete
}: {
  cars: Car[];
  className?: string;
  onEdit: (car: Car) => void;
  onDelete: (car: Car) => void;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/20 bg-[#1e1e2a]/95 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.9)] backdrop-blur",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/20 px-5 py-4">
        <div>
          <div className="text-sm font-bold">السيارات المتوفر</div>
          <div className="mt-1 text-xs text-white/65">كل السيارات المسجلة لديك</div>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white/60">الإجمالي: {cars.length}</div>
      </div>

      <div className="md:hidden">
        {cars.length ? (
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

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                    <div className="text-[11px] font-semibold text-white/75">اللون</div>
                    <div className="mt-1 text-sm text-white/85">{c.color}</div>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                    <div className="text-[11px] font-semibold text-white/75">الموديل</div>
                    <div className="mt-1 text-sm text-white/85">{c.model}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => onEdit(c)}>
                    <Pencil className="h-4 w-4" />
                    تعديل
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-3 py-2 text-xs text-red-50 hover:bg-red-500/15"
                    onClick={() => onDelete(c)}
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
              <th className="px-5 py-3 font-semibold">تاريخ الإضافة</th>
              <th className="px-5 py-3 font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {cars.length ? (
              cars.map((c) => (
                <tr key={c.id} className="transition hover:bg-white/[0.08]">
                  <td className="px-5 py-4 font-semibold">{c.car_name}</td>
                  <td className="px-5 py-4 text-white/80">{c.model}</td>
                  <td className="px-5 py-4 text-white/80">{c.color}</td>
                  <td className="px-5 py-4 font-bold text-white" dir="ltr">
                    {Number(c.daily_price ?? 0).toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-white/80" dir="ltr">
                    {formatDateTime(c.created_at)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => onEdit(c)}>
                        <Pencil className="h-4 w-4" />
                        تعديل
                      </Button>
                      <Button
                        variant="ghost"
                        className="px-3 py-2 text-xs text-red-50 hover:bg-red-500/15"
                        onClick={() => onDelete(c)}
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
    </div>
  );
}
