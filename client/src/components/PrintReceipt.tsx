import { useRef } from "react";
import { Printer, X } from "lucide-react";
import Button from "@/components/Button";
import type { Car, Rental } from "@/types";
import { diffDaysInclusive, formatDate, formatDateTimeShort } from "@/utils/dates";

export default function PrintReceipt({
  rental,
  car,
  onClose,
  onPrint
}: {
  rental: Rental;
  car: Car | null;
  onClose: () => void;
  onPrint?: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const days = diffDaysInclusive(rental.start_date, rental.end_date);
  const dailyPrice = days > 0 ? Number(rental.rent_amount) / days : 0;

  function handlePrint() {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  }

  return (
    <div className="space-y-5">
      {/* Receipt content — this is what gets printed */}
      <div
        ref={receiptRef}
        className="receipt-paper mx-auto rounded-xl border border-black/10 bg-white p-6 text-black shadow-sm"
        style={{ maxWidth: "380px" }}
      >
        {/* Header */}
        <div className="border-b-2 border-black pb-3 text-center">
          <div className="text-lg font-bold tracking-wide">Bilay's Car Rent</div>
          <div className="mt-1 text-base font-bold text-[#D10F1A]">إيصال تأجير سيارة</div>
          <div className="mt-1 text-[11px] text-gray-600">{formatDate(rental.created_at)}</div>
        </div>

        {/* Body */}
        <div className="mt-4 space-y-3 text-sm">
          <Row label="اسم المستأجر" value={rental.name} />
          <Row label="رقم الهاتف" value={rental.telephone} />
          <Row label="السيارة المؤجرة" value={car ? `${car.car_name} — ${car.model}` : "—"} />
          <Row label="عداد السيارة" value={`${rental.odometer} كم`} />
          <Row
            label="فترة الإيجار"
            value={`${formatDateTimeShort(rental.start_date, rental.start_time)} → ${formatDateTimeShort(rental.end_date, rental.end_time)}`}
          />
          <Row label="عدد الأيام" value={`${days} يوم`} />
          <Row label="السعر لليوم" value={`${dailyPrice.toFixed(2)} ج.م`} />

          {/* Divider */}
          <div className="my-2 border-t-2 border-dashed border-black/20" />

          {/* Total */}
          <div className="flex items-center justify-between text-base font-bold">
            <span>السعر الإجمالي</span>
            <span dir="ltr">{Number(rental.rent_amount).toFixed(2)} ج.م</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 border-t border-black/10 pt-3 text-center text-[11px] text-gray-500">
          شكراً لتعاملكم معنا — السلامة للجميع
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 print:hidden">
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          طباعة
        </Button>
        <Button variant="secondary" onClick={onClose}>
          <X className="h-4 w-4" />
          إغلاق
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="font-semibold text-gray-700">{label}</span>
      <span className="text-right text-gray-900">{value}</span>
    </div>
  );
}
