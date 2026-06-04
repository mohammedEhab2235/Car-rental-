import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(10)
});

export function rentalLogsRouter(supabase: SupabaseClient) {
  const router = Router();

  router.get("/", async (req, res) => {
    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "معاملات الصفحات غير صحيحة." });
      return;
    }

    const { page, per_page } = parsed.data;
    const offset = (page - 1) * per_page;

    const { data: logs, error: logsErr } = await supabase
      .from("rental_logs")
      .select(
        `id,rental_id,car_id,action,actor_username,payload,created_at,
        cars:car_id(car_name,model),
        rentals:rental_id(name)`
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + per_page - 1);

    if (logsErr) {
      res.status(500).json({ message: "تعذر تحميل سجلات الإيجارات.", details: logsErr.message });
      return;
    }

    const { count: total, error: countErr } = await supabase
      .from("rental_logs")
      .select("id", { count: "exact", head: true });

    if (countErr) {
      res.status(500).json({ message: "تعذر حساب عدد السجلات.", details: countErr.message });
      return;
    }

    res.json({
      logs: logs ?? [],
      total: total ?? 0,
      page,
      per_page
    });
  });

  return router;
}
