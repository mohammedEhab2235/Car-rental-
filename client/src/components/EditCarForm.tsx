import { useMemo, useState } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { api } from "@/utils/api";
import type { Car } from "@/types";

export default function EditCarForm({
  car,
  onSaved
}: {
  car: Car;
  onSaved: (car: Car) => void;
}) {
  const initialDaily = useMemo(() => String(Number(car.daily_price ?? 0)), [car.daily_price]);
  const initialOdometer = useMemo(() => String(Number(car.odometer ?? 0)), [car.odometer]);

  const [carName, setCarName] = useState(car.car_name);
  const [model, setModel] = useState(car.model);
  const [color, setColor] = useState(car.color);
  const [dailyPrice, setDailyPrice] = useState(initialDaily);
  const [odometer, setOdometer] = useState(initialOdometer);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!carName.trim() || !model.trim() || !color.trim()) {
      setError("الرجاء تعبئة جميع الحقول.");
      return;
    }

    setLoading(true);
    try {
      const data = await api<{ car: Car }>(`/cars/${car.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          car_name: carName.trim(),
          model: model.trim(),
          color: color.trim(),
          daily_price: Number(dailyPrice || 0),
          odometer: Number(odometer || 0)
        })
      });
      onSaved(data.car);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="اسم السيارة" value={carName} onChange={(e) => setCarName(e.target.value)} placeholder="مثال: كورولا" />
      <Input label="الموديل" value={model} onChange={(e) => setModel(e.target.value)} placeholder="مثال: 2023" />
      <Input label="اللون" value={color} onChange={(e) => setColor(e.target.value)} placeholder="أسود / أحمر" />
      <Input label="السعر اليومي" value={dailyPrice} onChange={(e) => setDailyPrice(e.target.value)} inputMode="decimal" dir="ltr" />
      <Input label="العداد الحالي" value={odometer} onChange={(e) => setOdometer(e.target.value)} type="number" dir="ltr" />
      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-50">{error}</div> : null}
      <div className="flex justify-end gap-2">
        <Button type="submit" loading={loading}>
          حفظ التعديلات
        </Button>
      </div>
    </form>
  );
}

