-- Add per-oil-type km-since-change counters on cars
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS km_since_oil_normal_change BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS km_since_oil_transmission_change BIGINT NOT NULL DEFAULT 0;

-- Seed counters from existing maintenance records (latest per oil type)
UPDATE public.cars c
SET km_since_oil_normal_change = GREATEST(0, c.odometer - m.oil_normal_current)
FROM (
  SELECT DISTINCT ON (car_id) car_id, oil_normal_current
  FROM public.maintenance_records
  WHERE oil_normal_current IS NOT NULL
  ORDER BY car_id, created_at DESC
) m
WHERE m.car_id = c.id;

UPDATE public.cars c
SET km_since_oil_transmission_change = GREATEST(0, c.odometer - m.oil_transmission_current)
FROM (
  SELECT DISTINCT ON (car_id) car_id, oil_transmission_current
  FROM public.maintenance_records
  WHERE oil_transmission_current IS NOT NULL
  ORDER BY car_id, created_at DESC
) m
WHERE m.car_id = c.id;
