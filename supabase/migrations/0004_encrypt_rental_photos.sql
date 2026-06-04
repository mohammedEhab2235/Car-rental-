DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rentals'
      AND column_name = 'images'
  ) THEN
    ALTER TABLE public.rentals DROP COLUMN images;
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.rental_photos') IS NOT NULL THEN
    DELETE FROM public.rental_photos;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rental_photos'
      AND column_name = 'url'
  ) THEN
    ALTER TABLE public.rental_photos DROP COLUMN url;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rental_photos'
      AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE public.rental_photos DROP COLUMN storage_path;
  END IF;
END
$$;

ALTER TABLE public.rental_photos
  ADD COLUMN IF NOT EXISTS url_enc BYTEA,
  ADD COLUMN IF NOT EXISTS storage_path_enc BYTEA;

ALTER TABLE public.rental_photos
  ALTER COLUMN url_enc SET NOT NULL;

DROP INDEX IF EXISTS public.rental_photos_unique_url_per_rental;
CREATE UNIQUE INDEX IF NOT EXISTS rental_photos_unique_sort_per_rental ON public.rental_photos(rental_id, sort_order);

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
