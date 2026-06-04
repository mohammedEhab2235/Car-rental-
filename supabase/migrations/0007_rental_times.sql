-- Add start_time and end_time to rentals for pickup/return time tracking
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS start_time TEXT,
  ADD COLUMN IF NOT EXISTS end_time TEXT;
