import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import TimeInput12H from "@/components/TimeInput12H";
import { api } from "@/utils/api";
import type { Car, Rental } from "@/types";
import { diffDaysInclusive } from "@/utils/dates";

type Preview = { id: string; url: string; file: File };
type PriceMode = "saved" | "custom";

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function normalizePriceInput(value: string) {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const [whole = "", ...rest] = normalized.split(".");
  return rest.length ? `${whole}.${rest.join("")}` : whole;
}

function parsePrice(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function NewRentalForm({
  cars,
  rentals,
  onCreated
}: {
  cars: Car[];
  rentals: Rental[];
  onCreated: (rental: Rental) => void;
}) {
  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [odometer, setOdometer] = useState("");
  const [carId, setCarId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priceMode, setPriceMode] = useState<PriceMode>("saved");
  const [customDailyPrice, setCustomDailyPrice] = useState("");
  const [hasEditedCustomPrice, setHasEditedCustomPrice] = useState(false);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  const days = useMemo(() => (startDate && endDate ? diffDaysInclusive(startDate, endDate) : 0), [startDate, endDate]);
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const availableCars = useMemo(() => {
    if (!startDate || !endDate || days <= 0) {
      // No dates selected yet: hide only cars rented TODAY
      const today = new Date(`${todayIso}T00:00:00.000Z`).getTime();
      return cars.filter((car) => {
        const hasActiveRental = rentals.some((rental) => {
          if (rental.car_id !== car.id) return false;
          const rentalStart = new Date(`${rental.start_date}T00:00:00.000Z`).getTime();
          const rentalEnd = new Date(`${rental.end_date}T00:00:00.000Z`).getTime();
          return today >= rentalStart && today <= rentalEnd;
        });
        return !hasActiveRental;
      });
    }

    // Dates selected: check overlap with selected dates only
    const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
    const end = new Date(`${endDate}T00:00:00.000Z`).getTime();

    return cars.filter((car) => {
      const hasOverlap = rentals.some((rental) => {
        if (rental.car_id !== car.id) return false;
        const rentalStart = new Date(`${rental.start_date}T00:00:00.000Z`).getTime();
        const rentalEnd = new Date(`${rental.end_date}T00:00:00.000Z`).getTime();
        return start <= rentalEnd && end >= rentalStart;
      });
      return !hasOverlap;
    });
  }, [cars, days, endDate, rentals, startDate, todayIso]);
  const selectedCar = useMemo(() => availableCars.find((c) => c.id === carId) ?? cars.find((c) => c.id === carId) ?? null, [availableCars, carId, cars]);
  const effectiveDailyPrice = useMemo(() => {
    if (priceMode === "custom") return parsePrice(customDailyPrice);
    return Number(selectedCar?.daily_price ?? 0);
  }, [customDailyPrice, priceMode, selectedCar]);
  const total = useMemo(() => Number(((days || 0) * effectiveDailyPrice).toFixed(2)), [days, effectiveDailyPrice]);

  useEffect(() => {
    if (priceMode !== "custom") return;
    if (!selectedCar) return;
    if (hasEditedCustomPrice) return;
    setCustomDailyPrice(Number(selectedCar.daily_price ?? 0).toFixed(2));
  }, [hasEditedCustomPrice, priceMode, selectedCar]);

  useEffect(() => {
    if (!carId) return;
    const stillAvailable = availableCars.some((car) => car.id === carId);
    if (!stillAvailable) {
      setCarId("");
    }
  }, [availableCars, carId]);

  useEffect(() => {
    return () => {
      for (const p of previews) URL.revokeObjectURL(p.url);
    };
  }, [previews]);

  function onFile(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    if (previews.length >= 5) {
      setError("الحد الأقصى للصور هو 5.");
      return;
    }

    const next: Preview = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file
    };
    setPreviews((p) => [...p, next]);
  }

  function removePreview(id: string) {
    setPreviews((p) => {
      const found = p.find((x) => x.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return p.filter((x) => x.id !== id);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !telephone.trim() || !nationalId.trim() || !odometer.trim() || !carId) {
      setError("الرجاء تعبئة جميع الحقول الأساسية.");
      return;
    }
    if (telephone.length !== 11) {
      setError("رقم الهاتف يجب أن يكون 11 رقمًا.");
      return;
    }
    if (nationalId.length !== 14) {
      setError("الرقم القومي يجب أن يكون 14 رقمًا.");
      return;
    }
    if (!startDate || !endDate || days <= 0) {
      setError("الرجاء اختيار نطاق تاريخ صحيح.");
      return;
    }
    if (!/^\d+$/.test(odometer.trim())) {
      setError("عداد السيارة يجب أن يكون أرقامًا فقط.");
      return;
    }
    if (priceMode === "custom" && parsePrice(customDailyPrice) < 0) {
      setError("السعر اليومي المخصص غير صحيح.");
      return;
    }
    if (priceMode === "custom" && !customDailyPrice.trim()) {
      setError("أدخل السعر اليومي المخصص.");
      return;
    }
    if (previews.length > 5) {
      setError("الحد الأقصى للصور هو 5.");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.set("name", name.trim());
      form.set("telephone", telephone.trim());
      form.set("national_id", nationalId.trim());
      form.set("odometer", odometer.trim());
      form.set("start_date", startDate);
      form.set("end_date", endDate);
      form.set("start_time", startTime || "12:00");
      form.set("end_time", endTime || "12:00");
      form.set("car_id", carId);
      form.set("price_mode", priceMode);
      if (priceMode === "custom") {
        form.set("custom_daily_price", String(parsePrice(customDailyPrice)));
      }

      for (const p of previews) form.append("images", p.file, p.file.name);

      const data = await api<{ rental: Rental }>("/rentals", {
        method: "POST",
        body: form
      });
      onCreated(data.rental);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="اسم العميل" value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" />
        <Input
          label="رقم الهاتف"
          value={telephone}
          onChange={(e) => setTelephone(digitsOnly(e.target.value, 11))}
          placeholder="010..."
          dir="ltr"
          inputMode="tel"
          maxLength={11}
          hint="11 digits only"
        />
        <Input
          label="الرقم القومي"
          value={nationalId}
          onChange={(e) => setNationalId(digitsOnly(e.target.value, 14))}
          placeholder="298..."
          dir="ltr"
          inputMode="numeric"
          maxLength={14}
          hint="14 digits only"
        />
        <Input
          label="عداد السيارة"
          value={odometer}
          onChange={(e) => setOdometer(digitsOnly(e.target.value, 12))}
          placeholder="مثال: 125000"
          dir="ltr"
          inputMode="numeric"
          maxLength={12}
          hint="Digits only"
        />
        <label className="block">
          <div className="mb-2 text-xs font-semibold text-white/80">اختيار السيارة</div>
          <select
            className="h-11 w-full rounded-xl border border-white/20 bg-white/5 px-4 text-base text-white outline-none transition focus:border-white/20 focus:ring-4 focus:ring-[#D10F1A]/15 sm:text-sm"
            value={carId}
            onChange={(e) => setCarId(e.target.value)}
          >
            <option value="">اختر سيارة...</option>
            {availableCars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.car_name} — {c.model}
              </option>
            ))}
          </select>
          <div className="mt-2 text-xs text-white/65">
            السعر اليومي: {Number(selectedCar?.daily_price ?? 0).toFixed(2)}
            {startDate && endDate ? ` - المتاح: ${availableCars.length}` : ""}
          </div>
          {startDate && endDate && availableCars.length === 0 ? (
            <div className="mt-2 text-xs text-amber-200/90">لا توجد سيارات متاحة خلال الفترة المحددة.</div>
          ) : null}
        </label>
      </div>

      <div className="rounded-2xl border border-white/20 bg-[#181825]/70 p-4">
        <div className="text-xs font-semibold text-white/80">طريقة التسعير</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/20 bg-white/5 p-3">
            <input
              type="radio"
              name="priceMode"
              value="saved"
              checked={priceMode === "saved"}
              onChange={() => {
                setPriceMode("saved");
                setHasEditedCustomPrice(false);
              }}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-semibold text-white">استخدم السعر المحفوظ</div>
              <div className="mt-1 text-xs text-white/65">يعتمد على السعر اليومي المسجل للسيارة.</div>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/20 bg-white/5 p-3">
            <input
              type="radio"
              name="priceMode"
              value="custom"
              checked={priceMode === "custom"}
              onChange={() => {
                setPriceMode("custom");
                setHasEditedCustomPrice(false);
                if (selectedCar) {
                  setCustomDailyPrice(Number(selectedCar.daily_price ?? 0).toFixed(2));
                }
              }}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-semibold text-white">أدخل سعرًا جديدًا</div>
              <div className="mt-1 text-xs text-white/65">يُستخدم لهذا العقد فقط ولا يغيّر سعر السيارة الأساسي.</div>
            </div>
          </label>
        </div>

        <div className="mt-4">
          <Input
            label="السعر اليومي المستخدم"
            value={priceMode === "custom" ? customDailyPrice : Number(selectedCar?.daily_price ?? 0).toFixed(2)}
            onChange={(e) => {
              setHasEditedCustomPrice(true);
              setCustomDailyPrice(normalizePriceInput(e.target.value));
            }}
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            dir="ltr"
            disabled={priceMode !== "custom"}
            hint={priceMode === "custom" ? "هذا السعر مخصص لهذا العقد فقط." : "لتعديله اختر: أدخل سعرًا جديدًا"}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="تاريخ البداية" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} dir="ltr" />
        <TimeInput12H label="وقت البداية" value={startTime} onChange={setStartTime} />
        <Input label="تاريخ النهاية" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} dir="ltr" />
        <TimeInput12H label="وقت النهاية" value={endTime} onChange={setEndTime} />
      </div>

      <div className="rounded-2xl border border-white/20 bg-[#181825]/70 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-white/70">الإجمالي (يُحسب تلقائيًا)</div>
            <div className="mt-2 text-2xl font-bold" dir="ltr">
              {Number.isFinite(total) ? total.toFixed(2) : "0.00"}
            </div>
          </div>
          <div className="text-xs text-white/50" dir="ltr">
            أيام: {days}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold text-white/80">رفع الصور واحدة تلو الأخرى (حد أقصى 5)</div>
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setError(null);
              onFile(e.target.files?.[0] ?? null);
              e.currentTarget.value = "";
            }}
            className="block w-full text-base text-white/70 file:mr-3 file:rounded-xl file:border-0 file:bg-[#D10F1A]/15 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#D10F1A]/25 sm:text-sm"
          />
          <div className="mt-3 text-xs text-white/65">{previews.length}/5</div>
          {previews.length ? (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {previews.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => removePreview(p.id)}
                  className="group relative overflow-hidden rounded-xl border border-white/20 bg-black/30"
                  title="اضغط للحذف"
                >
                  <img src={p.url} className="h-16 w-full object-cover transition group-hover:scale-[1.03]" alt="preview" />
                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/35" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-50">{error}</div> : null}

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          حفظ العقد
        </Button>
      </div>
    </form>
  );
}
