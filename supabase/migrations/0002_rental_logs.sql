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

