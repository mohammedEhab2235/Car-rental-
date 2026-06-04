CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_name TEXT NOT NULL,
  model TEXT NOT NULL,
  color TEXT NOT NULL,
  daily_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  telephone TEXT NOT NULL,
  national_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount NUMERIC(10,2) NOT NULL,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE RESTRICT,
  images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rentals_images_max_5 CHECK (coalesce(array_length(images, 1), 0) <= 5),
  CONSTRAINT rentals_date_range CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS rentals_car_id_idx ON public.rentals(car_id);
CREATE INDEX IF NOT EXISTS rentals_start_date_idx ON public.rentals(start_date);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rentals_no_overlap_per_car'
  ) THEN
    ALTER TABLE public.rentals
      ADD CONSTRAINT rentals_no_overlap_per_car
      EXCLUDE USING gist (
        car_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
      );
  END IF;
END
$$;

