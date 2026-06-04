-- Add oil target columns to cars table
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS oil_normal_target BIGINT,
  ADD COLUMN IF NOT EXISTS oil_transmission_target BIGINT;

-- Maintenance records table (one per maintenance session)
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  oil_normal_current BIGINT,
  oil_transmission_current BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS maintenance_records_car_id_idx ON public.maintenance_records(car_id);

-- Maintenance items (type + price per record)
CREATE TABLE IF NOT EXISTS public.maintenance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_record_id UUID NOT NULL REFERENCES public.maintenance_records(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS maintenance_items_record_id_idx ON public.maintenance_items(maintenance_record_id);
