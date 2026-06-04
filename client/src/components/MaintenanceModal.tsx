import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Wrench } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import type { Car, MaintenanceRecord } from "@/types";
import { api } from "@/utils/api";
import { formatDate } from "@/utils/dates";

type ItemRow = { id: string; item_type: string; price: string };

export default function MaintenanceModal({
  car,
  onClose,
  onSaved
}: {
  car: Car;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New maintenance form state
  const [items, setItems] = useState<ItemRow[]>([{ id: "1", item_type: "", price: "" }]);
  const [oilNormalCurrent, setOilNormalCurrent] = useState("");
  const [oilTransmissionCurrent, setOilTransmissionCurrent] = useState("");

  const oilNormalTarget = car.oil_normal_target ?? 0;
  const oilTransmissionTarget = car.oil_transmission_target ?? 0;

  const oilNormalStatus = useMemo(() => {
    const current = Number(oilNormalCurrent);
    if (!oilNormalTarget || !current) return null;
    if (current >= oilNormalTarget) return { ok: false, text: "يجب تغيير زيت المحرك الآن!" };
    const remaining = oilNormalTarget - current;
    return { ok: true, text: `متبقي ${remaining.toLocaleString()} كم قبل تغيير زيت المحرك` };
  }, [oilNormalCurrent, oilNormalTarget]);

  const oilTransmissionStatus = useMemo(() => {
    const current = Number(oilTransmissionCurrent);
    if (!oilTransmissionTarget || !current) return null;
    if (current >= oilTransmissionTarget) return { ok: false, text: "يجب تغيير زيت الفتيس الآن!" };
    const remaining = oilTransmissionTarget - current;
    return { ok: true, text: `متبقي ${remaining.toLocaleString()} كم قبل تغيير زيت الفتيس` };
  }, [oilTransmissionCurrent, oilTransmissionTarget]);

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await api<{ records: MaintenanceRecord[] }>(`/maintenance?car_id=${encodeURIComponent(car.id)}`);
      setRecords(data.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل سجلات الصيانة");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [car.id]);

  function addItemRow() {
    setItems((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, item_type: "", price: "" }
    ]);
  }

  function removeItemRow(id: string) {
    setItems((prev) => prev.filter((r) => r.id !== id));
  }

  function updateItemRow(id: string, field: keyof ItemRow, value: string) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function submit() {
    setError(null);
    const validItems = items
      .filter((i) => i.item_type.trim() && i.price.trim())
      .map((i) => ({ item_type: i.item_type.trim(), price: Number(i.price) }));

    if (validItems.length === 0) {
      setError("أضف نوع صيانة واحد على الأقل مع السعر.");
      return;
    }

    if (validItems.some((i) => !Number.isFinite(i.price) || i.price < 0)) {
      setError("السعر يجب أن يكون رقمًا موجبًا.");
      return;
    }

    const body: Record<string, unknown> = {
      car_id: car.id,
      items: validItems
    };
    if (oilNormalCurrent.trim()) body.oil_normal_current = Number(oilNormalCurrent);
    if (oilTransmissionCurrent.trim()) body.oil_transmission_current = Number(oilTransmissionCurrent);

    setSaving(true);
    try {
      await api("/maintenance", { method: "POST", body: JSON.stringify(body) });
      setItems([{ id: "1", item_type: "", price: "" }]);
      setOilNormalCurrent("");
      setOilTransmissionCurrent("");
      await loadRecords();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Oil tracking */}
      <div className="rounded-2xl border border-white/20 bg-[#181825]/70 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white/90">
          <Wrench className="h-4 w-4 text-[#D10F1A]" />
          تتبع الزيت
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-semibold text-white/80">زيت المحرك — العداد الحالي (كم)</div>
            <Input
              type="number"
              value={oilNormalCurrent}
              onChange={(e) => setOilNormalCurrent(e.target.value)}
              placeholder="مثال: 125000"
              dir="ltr"
            />
            {oilNormalTarget > 0 ? (
              <div className="mt-1 text-xs text-white/60">الهدف: كل {oilNormalTarget.toLocaleString()} كم</div>
            ) : null}
            {oilNormalStatus ? (
              <div className={`mt-1 text-xs font-semibold ${oilNormalStatus.ok ? "text-emerald-400" : "text-amber-400"}`}>
                {oilNormalStatus.text}
              </div>
            ) : null}
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold text-white/80">زيت الفتيس — العداد الحالي (كم)</div>
            <Input
              type="number"
              value={oilTransmissionCurrent}
              onChange={(e) => setOilTransmissionCurrent(e.target.value)}
              placeholder="مثال: 125000"
              dir="ltr"
            />
            {oilTransmissionTarget > 0 ? (
              <div className="mt-1 text-xs text-white/60">الهدف: كل {oilTransmissionTarget.toLocaleString()} كم</div>
            ) : null}
            {oilTransmissionStatus ? (
              <div className={`mt-1 text-xs font-semibold ${oilTransmissionStatus.ok ? "text-emerald-400" : "text-amber-400"}`}>
                {oilTransmissionStatus.text}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Maintenance items form */}
      <div className="rounded-2xl border border-white/20 bg-[#181825]/70 p-4">
        <div className="text-sm font-bold text-white/90">نوع الصيانة</div>
        <div className="mt-3 space-y-3">
          {items.map((row, idx) => (
            <div key={row.id} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  placeholder="نوع الصيانة"
                  value={row.item_type}
                  onChange={(e) => updateItemRow(row.id, "item_type", e.target.value)}
                />
              </div>
              <div className="w-32">
                <Input
                  placeholder="السعر"
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.price}
                  onChange={(e) => updateItemRow(row.id, "price", e.target.value)}
                  dir="ltr"
                />
              </div>
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeItemRow(row.id)}
                  className="mt-2 text-white/40 transition hover:text-red-400"
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <div className="w-5" />
              )}
            </div>
          ))}
        </div>
        <Button variant="secondary" className="mt-3 px-3 py-2 text-xs" onClick={addItemRow}>
          <Plus className="h-4 w-4" />
          إضافة بند
        </Button>
      </div>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-50">{error}</div> : null}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          إلغاء
        </Button>
        <Button loading={saving} onClick={submit}>
          حفظ الصيانة
        </Button>
      </div>

      {/* Past records */}
      <div className="rounded-2xl border border-white/20 bg-[#181825]/70 p-4">
        <div className="text-sm font-bold text-white/90">سجل الصيانة السابق</div>
        {loading ? (
          <div className="mt-3 text-xs text-white/60">جاري التحميل...</div>
        ) : records.length === 0 ? (
          <div className="mt-3 text-xs text-white/60">لا توجد سجلات صيانة.</div>
        ) : (
          <div className="mt-3 space-y-3">
            {records.map((rec) => (
              <div key={rec.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
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
  );
}
