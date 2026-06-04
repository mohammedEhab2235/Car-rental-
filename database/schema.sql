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
  odometer BIGINT NOT NULL DEFAULT 0,
  final_odometer BIGINT,
  rent_amount NUMERIC(10,2) NOT NULL,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
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

CREATE TABLE IF NOT EXISTS public.rental_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  url_enc BYTEA NOT NULL,
  storage_path_enc BYTEA,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rental_photos_rental_id_idx ON public.rental_photos(rental_id);
CREATE INDEX IF NOT EXISTS rental_photos_created_at_idx ON public.rental_photos(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS rental_photos_unique_sort_per_rental ON public.rental_photos(rental_id, sort_order);

CREATE OR REPLACE FUNCTION public.enforce_rental_photos_max_5()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT count(*) FROM public.rental_photos WHERE rental_id = NEW.rental_id) >= 5 THEN
    RAISE EXCEPTION 'max 5 photos per rental';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS rental_photos_max_5 ON public.rental_photos;
CREATE TRIGGER rental_photos_max_5
BEFORE INSERT ON public.rental_photos
FOR EACH ROW
EXECUTE FUNCTION public.enforce_rental_photos_max_5();

CREATE OR REPLACE FUNCTION public.rental_photos_insert(
  p_rental_id UUID,
  p_url TEXT,
  p_storage_path TEXT,
  p_sort_order INT,
  p_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.rental_photos (rental_id, url_enc, storage_path_enc, sort_order)
  VALUES (
    p_rental_id,
    pgp_sym_encrypt(p_url, p_key, 'cipher-algo=aes256,compress-algo=1'),
    CASE
      WHEN p_storage_path IS NULL THEN NULL
      ELSE pgp_sym_encrypt(p_storage_path, p_key, 'cipher-algo=aes256,compress-algo=1')
    END,
    COALESCE(p_sort_order, 0)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END
$$;

CREATE TABLE IF NOT EXISTS public.rental_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE RESTRICT,
  action TEXT NOT NULL DEFAULT 'rental_created',
  actor_username TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rental_logs_rental_id_idx ON public.rental_logs(rental_id);
CREATE INDEX IF NOT EXISTS rental_logs_car_id_idx ON public.rental_logs(car_id);
CREATE INDEX IF NOT EXISTS rental_logs_created_at_idx ON public.rental_logs(created_at);
