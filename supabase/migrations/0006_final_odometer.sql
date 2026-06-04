ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS final_odometer BIGINT;
