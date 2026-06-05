import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ReceiptText } from "lucide-react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import NewCarForm from "@/components/NewCarForm";
import NewRentalForm from "@/components/NewRentalForm";
import PrintReceipt from "@/components/PrintReceipt";

import RentalsTable from "@/components/RentalsTable";

import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import type { Car, Rental } from "@/types";
import { api } from "@/utils/api";

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);

  const [cars, setCars] = useState<Car[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCar, setOpenCar] = useState(false);
  const [openRental, setOpenRental] = useState(false);
  const [lastRental, setLastRental] = useState<Rental | null>(null);


  const carsCount = cars.length;
  const totalIncome = useMemo(
    () => rentals.reduce((sum, r) => sum + Number(r.rent_amount ?? 0), 0),
    [rentals]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, r] = await Promise.all([
        api<{ cars: Car[] }>("/cars"),
        api<{ rentals: Rental[] }>("/rentals")
      ]);
      setCars(c.cars);
      setRentals(r.rentals);
    } catch (err) {
      push({ kind: "error", title: "تعذر تحميل البيانات", message: err instanceof Error ? err.message : "" });
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="min-h-screen min-h-[100dvh]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl border border-white/20 bg-[#1e1e2a]/90 px-5 py-4 shadow-[0_24px_70px_-55px_rgba(0,0,0,0.9)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white/75">لوحة التحكم</div>
              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <div className="text-xl font-bold">Bilay's Car Rent</div>
                <div className="text-xs text-white/65">مرحبًا {user?.username}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => setOpenCar(true)}>
                <Plus className="h-4 w-4" />
                سيارة جديدة
              </Button>
              <Button variant="secondary" onClick={() => setOpenRental(true)}>
                <ReceiptText className="h-4 w-4" />
                تأجير سيارة
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatCard label="عدد السيارات" value={`${carsCount}`} />
            <StatCard label="عدد العقود" value={`${rentals.length}`} />
            <StatCard label="إجمالي الإيراد" value={totalIncome.toFixed(2)} dir="ltr" />
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-2xl border border-white/20 bg-white/5 p-8 text-center text-sm text-white/60">
              جاري التحميل...
            </div>
          ) : (
            <RentalsTable
              rentals={rentals}
              cars={cars}
              onUpdate={(updated) =>
                setRentals((list) => list.map((r) => (r.id === updated.id ? updated : r)))
              }
            />
          )}
        </div>
      </div>

      <Modal open={openCar} title="إضافة سيارة" onClose={() => setOpenCar(false)}>
        <NewCarForm
          onCreated={(car) => {
            setCars((c) => [car, ...c]);
            push({ kind: "success", title: "تمت إضافة السيارة" });
            setOpenCar(false);
          }}
        />
      </Modal>

      <Modal open={openRental} title="تأجير سيارة" onClose={() => setOpenRental(false)} widthClassName="max-w-[760px]">
        <NewRentalForm
          cars={cars}
          rentals={rentals}
          onCreated={(rental) => {
            setRentals((r) => [rental, ...r]);
            push({ kind: "success", title: "تم حفظ العقد" });
            setOpenRental(false);
            setLastRental(rental);
          }}
        />
      </Modal>

      <Modal
        open={!!lastRental}
        title="إيصال العقد"
        onClose={() => setLastRental(null)}
        widthClassName="max-w-[460px]"
      >
        {lastRental ? (
          <PrintReceipt
            rental={lastRental}
            car={cars.find((c) => c.id === lastRental.car_id) ?? null}
            onClose={() => setLastRental(null)}
          />
        ) : null}
      </Modal>

    </div>
  );
}

function StatCard({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-[#181825]/70 p-4">
      <div className="text-xs font-semibold text-white/75">{label}</div>
      <div className="mt-2 text-2xl font-bold" dir={dir}>
        {value}
      </div>
    </div>
  );
}
