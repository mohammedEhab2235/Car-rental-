INSERT INTO public.cars (car_name, model, color, daily_price)
VALUES
  ('تويوتا كورولا', '2022', 'أسود', 900),
  ('هيونداي إلنترا', '2023', 'أحمر', 1100),
  ('كيا سبورتاج', '2021', 'أسود', 1400)
ON CONFLICT DO NOTHING;

-- To create an admin user, generate a bcrypt hash then uncomment and edit the line below:
-- node -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash('YOUR_PASSWORD', 10));"
-- INSERT INTO public.users (username, password_hash)
-- VALUES ('admin', '$2a$10$replace_with_your_bcrypt_hash')
-- ON CONFLICT (username) DO NOTHING;
