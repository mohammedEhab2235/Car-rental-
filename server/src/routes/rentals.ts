import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { diffDaysInclusive, isRangeValid, isOverlapping } from "../utils/dates.js";
import { compressImage } from "../utils/images.js";
import crypto from "node:crypto";
import { getSql } from "../db.js";

const RentalCreateSchema = z
  .object({
    name: z.string().trim().min(1),
    telephone: z.string().regex(/^\d{11}$/),
    national_id: z.string().regex(/^\d{14}$/),
    start_date: z.string().min(10),
    end_date: z.string().min(10),
    start_time: z.string().min(1).optional(),
    end_time: z.string().min(1).optional(),
    odometer: z.coerce.number().int().nonnegative(),
    car_id: z.string().uuid(),
    price_mode: z.enum(["saved", "custom"]).default("saved"),
    custom_daily_price: z.preprocess((value) => {
      if (value === "" || value === undefined || value === null) return undefined;
      return value;
    }, z.coerce.number().nonnegative().optional())
  })
  .superRefine((value, ctx) => {
    if (value.price_mode === "custom" && value.custom_daily_price === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "السعر اليومي المخصص مطلوب.",
        path: ["custom_daily_price"]
      });
    }
  });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 5, fileSize: 5 * 1024 * 1024 }
});

async function ensureBucket(supabase: SupabaseClient, bucket: string) {
  const { data, error } = await supabase.storage.getBucket(bucket);
  if (data && !error) return;
  await supabase.storage.createBucket(bucket, { public: true });
}

export function rentalsRouter(supabase: SupabaseClient, bucket: string, photosEncKey: string) {
  const router = Router();

  router.get("/", async (_req, res) => {
    let result: any = await supabase
      .from("rentals")
      .select("id,name,telephone,national_id,start_date,end_date,start_time,end_time,odometer,final_odometer,rent_amount,car_id,created_at")
      .order("created_at", { ascending: false });

    // Fallback if odometer column is missing (migration not applied yet)
    if (result.error && result.error.message?.includes("odometer")) {
      result = await supabase
        .from("rentals")
        .select("id,name,telephone,national_id,start_date,end_date,start_time,end_time,rent_amount,car_id,created_at")
        .order("created_at", { ascending: false });
    }

    if (result.error) {
      res.status(500).json({ message: "تعذر تحميل العقود.", details: result.error.message });
      return;
    }

    const rentals = (result.data ?? []).map((r: any) => ({ ...r, odometer: r.odometer ?? 0, final_odometer: r.final_odometer ?? null }));
    res.json({ rentals });
  });

  router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    if (typeof body.final_odometer !== "number" || body.final_odometer < 0 || !Number.isFinite(body.final_odometer)) {
      res.status(400).json({ message: "عداد السيارة بعد التسليم غير صحيح." });
      return;
    }

    const { data: rental, error: fetchErr } = await supabase
      .from("rentals")
      .select("id,car_id,name")
      .eq("id", id)
      .single();

    if (fetchErr || !rental) {
      res.status(404).json({ message: "العقد غير موجود." });
      return;
    }

    const { data: updated, error: updErr } = await supabase
      .from("rentals")
      .update({ final_odometer: Math.round(body.final_odometer) })
      .eq("id", id)
      .select("id,name,telephone,national_id,start_date,end_date,start_time,end_time,odometer,final_odometer,rent_amount,car_id,created_at")
      .single();

    if (updErr) {
      res.status(500).json({ message: "تعذر تحديث العقد.", details: updErr.message });
      return;
    }

    // Update car's current odometer
    await supabase
      .from("cars")
      .update({ odometer: Math.round(body.final_odometer) })
      .eq("id", rental.car_id);

    const actor = req.session.user?.username ?? null;
    await supabase.from("rental_logs").insert({
      rental_id: rental.id,
      car_id: rental.car_id,
      action: "rental_ended",
      actor_username: actor,
      payload: { rental_id: rental.id, final_odometer: body.final_odometer }
    });

    res.json({ rental: updated });
  });

  router.get("/:id/photos", async (req, res) => {
    const { id } = req.params;

    try {
      const sql = getSql();
      const rows = await sql<{ id: string; url: string; sort_order: number }[]>`
        select
          id,
          pgp_sym_decrypt(url_enc, ${photosEncKey}) as url,
          sort_order
        from public.rental_photos
        where rental_id = ${id}
        order by sort_order asc, created_at asc
      `;

      res.json({ photos: rows });
      return;
    } catch {
      // Fallback: list files directly from Supabase Storage when DATABASE_URL is not configured or DB is unreachable
    }

    try {
      const username = req.session.user?.username ?? "user";
      const folder = `${username}/rentals/${id}/`;
      const { data: files, error: listErr } = await supabase.storage.from(bucket).list(folder);

      if (listErr) {
        res.status(500).json({ message: "تعذر تحميل صور العقد.", details: listErr.message });
        return;
      }

      const photos = (files ?? [])
        .filter((f) => f.id) // ignore folder placeholders
        .map((f, i) => {
          const path = `${folder}${f.name}`;
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
          return { id: `${id}-${i}`, url: pub?.publicUrl ?? "", sort_order: i };
        });

      res.json({ photos });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "تعذر تحميل صور العقد.", details: message });
    }
  });

  router.post("/", upload.array("images", 5), async (req, res) => {
    const parsed = RentalCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "بيانات الإيجار غير صحيحة." });
      return;
    }

    const files = (req.files ?? []) as Express.Multer.File[];
    if (files.length > 5) {
      res.status(400).json({ message: "الحد الأقصى للصور هو 5." });
      return;
    }

    const payload = parsed.data;
    if (!isRangeValid(payload.start_date, payload.end_date)) {
      res.status(400).json({ message: "نطاق التاريخ غير صحيح." });
      return;
    }

    const { data: car, error: carErr } = await supabase
      .from("cars")
      .select("id,daily_price")
      .eq("id", payload.car_id)
      .single();

    if (carErr || !car) {
      res.status(400).json({ message: "السيارة غير موجودة." });
      return;
    }

    const { data: existing, error: exErr } = await supabase
      .from("rentals")
      .select("start_date,end_date")
      .eq("car_id", payload.car_id);

    if (exErr) {
      res.status(500).json({ message: "تعذر التحقق من التداخل.", details: exErr.message });
      return;
    }

    const overlaps = (existing ?? []).some((r) =>
      isOverlapping(payload.start_date, payload.end_date, r.start_date, r.end_date)
    );

    if (overlaps) {
      res.status(409).json({ message: "يوجد عقد متداخل لنفس السيارة ضمن هذه الفترة." });
      return;
    }

    const days = diffDaysInclusive(payload.start_date, payload.end_date);
    const dailyPrice =
      payload.price_mode === "custom" ? Number(payload.custom_daily_price ?? 0) : Number(car.daily_price ?? 0);
    const rentAmount = Number((days * dailyPrice).toFixed(2));

    let insertResult: any = await supabase
      .from("rentals")
      .insert({
        name: payload.name,
        telephone: payload.telephone,
        national_id: payload.national_id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        start_time: payload.start_time ?? null,
        end_time: payload.end_time ?? null,
        odometer: payload.odometer,
        car_id: payload.car_id,
        rent_amount: rentAmount
      })
      .select("id,name,telephone,national_id,start_date,end_date,start_time,end_time,odometer,final_odometer,rent_amount,car_id,created_at")
      .single();

    // Fallback if odometer column is missing (migration not applied yet)
    if (insertResult.error && insertResult.error.message?.includes("odometer")) {
      insertResult = await supabase
        .from("rentals")
        .insert({
          name: payload.name,
          telephone: payload.telephone,
          national_id: payload.national_id,
          start_date: payload.start_date,
          end_date: payload.end_date,
          start_time: payload.start_time ?? null,
          end_time: payload.end_time ?? null,
          car_id: payload.car_id,
          rent_amount: rentAmount
        })
        .select("id,name,telephone,national_id,start_date,end_date,start_time,end_time,rent_amount,car_id,created_at")
        .single();
    }

    const rental = insertResult.data;
    const rentalErr = insertResult.error;

    if (rentalErr || !rental) {
      const msg = rentalErr?.message ?? "";
      const isConflict = msg.includes("rentals_no_overlap_per_car") || msg.includes("exclude") || msg.includes("overlap");
      if (isConflict) {
        res.status(409).json({ message: "يوجد عقد متداخل لنفس السيارة ضمن هذه الفترة." });
        return;
      }
      res.status(500).json({ message: "تعذر إنشاء العقد.", details: rentalErr?.message });
      return;
    }

    try {
      await ensureBucket(supabase, bucket);
    } catch {
      await supabase.from("rentals").delete().eq("id", rental.id);
      res.status(500).json({ message: "فشل تجهيز التخزين للصور وتم التراجع عن إنشاء العقد." });
      return;
    }

    const username = req.session.user?.username ?? "user";
    const uploadedUrls: string[] = [];
    const uploadedPaths: string[] = [];

    for (const file of files) {
      const compressed = await compressImage(file.buffer, file.mimetype);
      const fileName = `${crypto.randomUUID()}.${compressed.ext}`;
      const path = `${username}/rentals/${rental.id}/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, compressed.buffer, { contentType: compressed.mimetype, upsert: false });

      if (upErr) {
        if (uploadedPaths.length) {
          await supabase.storage.from(bucket).remove(uploadedPaths);
        }
        await supabase.from("rentals").delete().eq("id", rental.id);
        res.status(500).json({ message: "فشل رفع صور العقد وتم التراجع عن إنشاء العقد.", details: upErr.message });
        return;
      }

      uploadedPaths.push(path);

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      if (pub?.publicUrl) uploadedUrls.push(pub.publicUrl);
    }

    if (uploadedUrls.length) {
      for (let i = 0; i < uploadedUrls.length; i++) {
        const url = uploadedUrls[i]!;
        const storagePath = uploadedPaths[i] ?? null;
        const { error: photosErr } = await supabase.rpc("rental_photos_insert", {
          p_rental_id: rental.id,
          p_url: url,
          p_storage_path: storagePath,
          p_sort_order: i,
          p_key: photosEncKey
        });

        if (photosErr) {
          if (uploadedPaths.length) {
            await supabase.storage.from(bucket).remove(uploadedPaths);
          }
          await supabase.from("rentals").delete().eq("id", rental.id);
          res.status(500).json({ message: "فشل حفظ صور العقد وتم التراجع عن إنشاء العقد.", details: photosErr.message });
          return;
        }
      }
    }

    const actor = req.session.user?.username ?? null;
    const { error: logErr } = await supabase.from("rental_logs").insert({
      rental_id: rental.id,
      car_id: rental.car_id,
      action: "rental_created",
      actor_username: actor,
      payload: { rental }
    });

    if (logErr) {
      if (uploadedPaths.length) {
        await supabase.storage.from(bucket).remove(uploadedPaths);
      }
      await supabase.from("rentals").delete().eq("id", rental.id);
      res.status(500).json({ message: "فشل حفظ سجل العقد وتم التراجع عن إنشاء العقد.", details: logErr.message });
      return;
    }

    res.status(201).json({ rental });
  });

  return router;
}
