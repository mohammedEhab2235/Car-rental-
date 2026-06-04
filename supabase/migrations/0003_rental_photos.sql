CREATE TABLE IF NOT EXISTS public.rental_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rental_photos_rental_id_idx ON public.rental_photos(rental_id);
CREATE INDEX IF NOT EXISTS rental_photos_created_at_idx ON public.rental_photos(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS rental_photos_unique_url_per_rental ON public.rental_photos(rental_id, url);

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

INSERT INTO public.rental_photos (rental_id, url, sort_order)
SELECT r.id, u.url, (u.ord - 1)
FROM public.rentals r
CROSS JOIN LATERAL unnest(r.images) WITH ORDINALITY AS u(url, ord)
WHERE coalesce(array_length(r.images, 1), 0) > 0
ON CONFLICT DO NOTHING;

