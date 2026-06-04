import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = {
  car_id: string;
  rent_amount: number;
};

export function analyticsRouter(supabase: SupabaseClient) {
  const router = Router();

  router.get("/", async (_req, res) => {
    const { data: rentals, error: rErr } = await supabase
      .from("rentals")
      .select("car_id,rent_amount");

    if (rErr) {
      res.status(500).json({ message: "تعذر تحميل بيانات التحليلات.", details: rErr.message });
      return;
    }

    const rows = (rentals ?? []) as Row[];
    const byCarCount = new Map<string, number>();
    const byCarSum = new Map<string, number>();

    for (const r of rows) {
      byCarCount.set(r.car_id, (byCarCount.get(r.car_id) ?? 0) + 1);
      byCarSum.set(r.car_id, (byCarSum.get(r.car_id) ?? 0) + Number(r.rent_amount ?? 0));
    }

    const carIds = Array.from(new Set(rows.map((r) => r.car_id)));
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

    const mostRented = Array.from(byCarCount.entries()).sort((a, b) => b[1] - a[1])[0];
    const mostProfit = Array.from(byCarSum.entries()).sort((a, b) => b[1] - a[1])[0];

    const mostRentedCar = mostRented
      ? {
          car_id: mostRented[0],
          label: nameById.get(mostRented[0]) ?? mostRented[0],
          count: mostRented[1]
        }
      : null;

    const mostProfitableCar = mostProfit
      ? {
          car_id: mostProfit[0],
          label: nameById.get(mostProfit[0]) ?? mostProfit[0],
          total: Number(mostProfit[1].toFixed(2))
        }
      : null;

    const chartMostRented = Array.from(byCarCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([carId, count]) => ({ label: nameById.get(carId) ?? carId, value: count }));

    const chartMostProfit = Array.from(byCarSum.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([carId, total]) => ({ label: nameById.get(carId) ?? carId, value: Number(total.toFixed(2)) }));

    // Maintenance costs per car
    const { data: maintRecords, error: mRecErr } = await supabase
      .from("maintenance_records")
      .select("id,car_id");

    let chartMaintenanceCost: { label: string; value: number }[] = [];
    if (!mRecErr && maintRecords && maintRecords.length > 0) {
      const mRecordIds = maintRecords.map((r) => r.id);
      const { data: maintItems } = await supabase
        .from("maintenance_items")
        .select("maintenance_record_id,price")
        .in("maintenance_record_id", mRecordIds);

      const recordToCar = new Map<string, string>();
      for (const r of maintRecords) {
        recordToCar.set(r.id, r.car_id);
      }

      const byCarMaint = new Map<string, number>();
      for (const item of maintItems ?? []) {
        const carId = recordToCar.get(item.maintenance_record_id);
        if (!carId) continue;
        byCarMaint.set(carId, (byCarMaint.get(carId) ?? 0) + Number(item.price ?? 0));
      }

      const maintCarIds = Array.from(byCarMaint.keys());
      if (maintCarIds.length > 0) {
        const { data: maintCars } = await supabase
          .from("cars")
          .select("id,car_name,model")
          .in("id", maintCarIds);

        const mNameById = new Map<string, string>();
        for (const c of maintCars ?? []) {
          mNameById.set(c.id, `${c.car_name} — ${c.model}`);
        }

        chartMaintenanceCost = Array.from(byCarMaint.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([carId, total]) => ({ label: mNameById.get(carId) ?? carId, value: Number(total.toFixed(2)) }));
      }
    }

    res.json({ mostRentedCar, mostProfitableCar, chartMostRented, chartMostProfit, chartMaintenanceCost });
  });

  return router;
}
