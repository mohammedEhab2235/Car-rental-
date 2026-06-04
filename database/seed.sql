INSERT INTO public.cars (car_name, model, color, daily_price)
VALUES
  ('تويوتا كورولا', '2022', 'أسود', 900),
  ('هيونداي إلنترا', '2023', 'أحمر', 1100),
  ('كيا سبورتاج', '2021', 'أسود', 1400)
ON CONFLICT DO NOTHING;

