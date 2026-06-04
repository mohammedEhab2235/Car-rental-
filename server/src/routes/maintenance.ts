import { Router } from "express";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

const MaintenanceItemSchema = z.object({
  item_type: z.string().min(1),
  price: z.coerce.number().nonnegative()
});

const MaintenanceCreateSchema = z.object({
  car_id: z.string().uuid(),
  oil_normal_current: z.coerce.number().int().nonnegative().optional(),
  oil_transmission_current: z.coerce.number().int().nonnegative().optional(),
  items: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(MaintenanceItemSchema).min(1))
});

export function maintenanceRouter(supabase: SupabaseClient) {
  const router = Router();

  router.get("/summary", async (_req, res) => {
    const { data: records, error: recErr } = await supabase
      .from("maintenance_records")
      .select("id,car_id");

    if (recErr) {
      res.status(500).json({ message: "تعذر تحميل ملخص الصيانة.", details: recErr.message });
      return;
    }

    const recordIds = (records ?? []).map((r) => r.id);
    const { data: items, error: itemsErr } = await supabase
      .from("maintenance_items")
      .select("maintenance_record_id,price")
      .in("maintenance_record_id", recordIds.length ? recordIds : ["00000000-0000-0000-0000-000000000000"]);

    if (itemsErr) {
      res.status(500).json({ message: "تعذر تحميل تفاصيل الصيانة.", details: itemsErr.message });
      return;
    }

    const recordToCar = new Map<string, string>();
    for (const r of records ?? []) {
      recordToCar.set(r.id, r.car_id);
    }

    const byCar = new Map<string, number>();
    for (const item of items ?? []) {
      const carId = recordToCar.get(item.maintenance_record_id);
      if (!carId) continue;
      byCar.set(carId, (byCar.get(carId) ?? 0) + Number(item.price ?? 0));
    }

    const carIds = Array.from(byCar.keys());
    const { data: cars, error: cErr } = await supabase
      .from("cars")
      .select("id,car_name,model")
      .in("id", carIds.length ? carIds : ["00000000-0000-0000-0000-000000000000"]);

    if (cErr) {
      res.status(500).json({ message: "تعذر تحميل أسماء السيارات.", details: cErr.message });
      return;
    }

    const nameById = new Map<string, string>();
    for (const c of cars ?? []) {
      nameById.set(c.id, `${c.car_name} — ${c.model}`);
    }

    const summary = Array.from(byCar.entries()).map(([carId, total]) => ({
      car_id: carId,
      label: nameById.get(carId) ?? carId,
      total: Number(total.toFixed(2))
    }));

    res.json({ summary });
  });

  router.get("/", async (req, res) => {
    const carId = req.query.car_id as string | undefined;
    if (!carId) {
      res.status(400).json({ message: "car_id مطلوب." });
      return;
    }

    const { data: records, error: recErr } = await supabase
      .from("maintenance_records")
      .select("id,car_id,oil_normal_current,oil_transmission_current,created_at")
      .eq("car_id", carId)
      .order("created_at", { ascending: false });

    if (recErr) {
      res.status(500).json({ message: "تعذر تحميل سجلات الصيانة.", details: recErr.message });
      return;
    }

    const recordIds = (records ?? []).map((r) => r.id);
    const { data: items, error: itemsErr } = await supabase
      .from("maintenance_items")
      .select("id,maintenance_record_id,item_type,price,created_at")
      .in("maintenance_record_id", recordIds.length ? recordIds : ["00000000-0000-0000-0000-000000000000"]);

    if (itemsErr) {
      res.status(500).json({ message: "تعذر تحميل تفاصيل الصيانة.", details: itemsErr.message });
      return;
    }

    const itemsByRecord = new Map<string, typeof items>();
    for (const item of items ?? []) {
      const list = itemsByRecord.get(item.maintenance_record_id) ?? [];
      list.push(item);
      itemsByRecord.set(item.maintenance_record_id, list);
    }

    const recordsWithItems = (records ?? []).map((r) => ({
      ...r,
      items: itemsByRecord.get(r.id) ?? [],
      total_price: (itemsByRecord.get(r.id) ?? []).reduce((sum, it) => sum + Number(it.price ?? 0), 0)
    }));

    res.json({ records: recordsWithItems });
  });

  router.post("/", async (req, res) => {
    const parsed = MaintenanceCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "بيانات الصيانة غير صحيحة." });
      return;
    }

    const payload = parsed.data;

    const { data: record, error: recErr } = await supabase
      .from("maintenance_records")
      .insert({
        car_id: payload.car_id,
        oil_normal_current: payload.oil_normal_current ?? null,
        oil_transmission_current: payload.oil_transmission_current ?? null
      })
      .select("id,car_id,oil_normal_current,oil_transmission_current,created_at")
      .single();

    if (recErr || !record) {
      res.status(500).json({ message: "تعذر إنشاء سجل الصيانة.", details: recErr?.message });
      return;
    }

    const itemsToInsert = payload.items.map((it) => ({
      maintenance_record_id: record.id,
      item_type: it.item_type,
      price: it.price
    }));

    const { data: insertedItems, error: itemsErr } = await supabase
      .from("maintenance_items")
      .insert(itemsToInsert)
      .select("id,maintenance_record_id,item_type,price,created_at");

    if (itemsErr) {
      await supabase.from("maintenance_records").delete().eq("id", record.id);
      res.status(500).json({ message: "تعذر حفظ تفاصيل الصيانة وتم التراجع.", details: itemsErr.message });
      return;
    }

    const totalPrice = payload.items.reduce((sum, it) => sum + Number(it.price ?? 0), 0);

    res.status(201).json({
      record: {
        ...record,
        items: insertedItems ?? [],
        total_price: totalPrice
      }
    });
  });

  return router;
}
