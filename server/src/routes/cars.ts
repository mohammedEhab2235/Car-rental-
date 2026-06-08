import { Router } from "express";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

const CarCreateSchema = z.object({
  car_name: z.string().min(1),
  model: z.string().min(1),
  color: z.string().min(1),
  daily_price: z.coerce.number().nonnegative().default(0),
  odometer: z.coerce.number().int().nonnegative().default(0)
});

const CarUpdateSchema = z
  .object({
    car_name: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
    daily_price: z.coerce.number().nonnegative().optional(),
    odometer: z.coerce.number().int().nonnegative().optional(),
    oil_normal_target: z.coerce.number().int().nonnegative().optional(),
    oil_transmission_target: z.coerce.number().int().nonnegative().optional(),
    km_since_oil_normal_change: z.coerce.number().int().nonnegative().optional(),
    km_since_oil_transmission_change: z.coerce.number().int().nonnegative().optional()
  })
  .refine((v) => Object.keys(v).length > 0, { message: "لا توجد حقول للتحديث." });

export function carsRouter(supabase: SupabaseClient) {
  const router = Router();

  const QuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    per_page: z.coerce.number().int().min(1).max(100).optional()
  });

  router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("cars")
      .select("id,car_name,model,color,daily_price,odometer,oil_normal_target,oil_transmission_target,km_since_oil_normal_change,km_since_oil_transmission_change,created_at")
      .eq("id", id)
      .single();

    if (error) {
      res.status(500).json({ message: "تعذر تحميل بيانات السيارة.", details: error.message });
      return;
    }

    res.json({ car: data });
  });

  router.get("/", async (req, res) => {
    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "معاملات الصفحات غير صحيحة." });
      return;
    }

    const { page, per_page } = parsed.data;
    const isPaginated = page !== undefined && per_page !== undefined;
    const offset = isPaginated ? (page - 1) * per_page : 0;

    let query = supabase
      .from("cars")
      .select("id,car_name,model,color,daily_price,odometer,oil_normal_target,oil_transmission_target,km_since_oil_normal_change,km_since_oil_transmission_change,created_at")
      .order("created_at", { ascending: false });

    if (isPaginated) {
      query = query.range(offset, offset + per_page - 1);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ message: "تعذر تحميل السيارات.", details: error.message });
      return;
    }

    if (!isPaginated) {
      res.json({ cars: data ?? [] });
      return;
    }

    const { count: total, error: countErr } = await supabase
      .from("cars")
      .select("id", { count: "exact", head: true });

    if (countErr) {
      res.status(500).json({ message: "تعذر حساب عدد السيارات.", details: countErr.message });
      return;
    }

    res.json({
      cars: data ?? [],
      total: total ?? 0,
      page,
      per_page
    });
  });

  router.post("/", async (req, res) => {
    const parsed = CarCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "بيانات السيارة غير صحيحة." });
      return;
    }

    const payload = parsed.data;
    const { data, error } = await supabase
      .from("cars")
      .insert(payload)
      .select("id,car_name,model,color,daily_price,odometer,oil_normal_target,oil_transmission_target,km_since_oil_normal_change,km_since_oil_transmission_change,created_at")
      .single();

    if (error) {
      res.status(500).json({ message: "تعذر إضافة السيارة.", details: error.message });
      return;
    }

    res.status(201).json({ car: data });
  });

  router.patch("/:id", async (req, res) => {
    const parsed = CarUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "بيانات السيارة غير صحيحة." });
      return;
    }

    const { id } = req.params;
    const payload = parsed.data;

    const { data, error } = await supabase
      .from("cars")
      .update(payload)
      .eq("id", id)
      .select("id,car_name,model,color,daily_price,odometer,oil_normal_target,oil_transmission_target,km_since_oil_normal_change,km_since_oil_transmission_change,created_at")
      .single();

    if (error) {
      res.status(500).json({ message: "تعذر تعديل السيارة.", details: error.message });
      return;
    }

    res.json({ car: data });
  });

  router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const { count, error: rentalsError } = await supabase
      .from("rentals")
      .select("id", { count: "exact", head: true })
      .eq("car_id", id);

    if (rentalsError) {
      res.status(500).json({ message: "تعذر التحقق من العقود المرتبطة بالسيارة.", details: rentalsError.message });
      return;
    }

    if ((count ?? 0) > 0) {
      res.status(409).json({ message: "لا يمكن حذف السيارة لوجود عقود إيجار مرتبطة بها." });
      return;
    }

    const { error } = await supabase.from("cars").delete().eq("id", id);

    if (error) {
      res.status(500).json({ message: "تعذر حذف السيارة.", details: error.message });
      return;
    }

    res.status(204).send();
  });

  return router;
}
