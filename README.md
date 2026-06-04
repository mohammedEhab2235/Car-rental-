# Bilay's Car Rent

Premium car rental admin dashboard with an Arabic (RTL) UI, session-based login, rentals management, image uploads (max 5 per rental), and Chart.js analytics.

## Tech Stack
- Backend: Node.js + Express (TypeScript)
- Database: Supabase (PostgreSQL)
- File storage: Supabase Storage
- Frontend: React (Vite) + TailwindCSS (Arabic RTL, mobile responsive)
- Charts: Chart.js

## Features
- Login page (simple session-based auth)
- Main dashboard
  - Rentals table (mobile cards + desktop table)
  - “New Car” modal
  - “Car Rent” modal (live image preview, max 5 images)
  - “Dashboard” analytics page (most rented + most profitable)
- Validations on both frontend and backend
- Prevents overlapping rentals for the same car (database constraint + API check)

## Project Structure
- `client/` Frontend app
- `server/` Express REST API
- `database/` SQL schema (and optional seed)
- `supabase/migrations/` Supabase migration file

## Prerequisites
- Node.js 18+
- A Supabase project (Postgres + Storage enabled)

## 1) Database Setup (Supabase)
1. Open Supabase Dashboard → **SQL Editor**
2. Run: `database/schema.sql`
3. Optional demo data: `database/seed.sql` (if present)

Notes:
- The schema enables `pgcrypto` and `btree_gist` extensions.
- The overlap rule is enforced via a Postgres `EXCLUDE` constraint.

## 2) Storage Setup (Images)
- Default bucket name: `rental-images`
- The server attempts to create the bucket as **public** on first upload.

If you prefer creating it manually:
1. Supabase Dashboard → Storage → Create bucket
2. Bucket name: `rental-images`
3. Public: enabled

## 3) Backend Setup (`/server`)
1. Copy env file:
   - Copy `server/.env.example` → `server/.env`
2. Fill in:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD_HASH`

Generate `ADMIN_PASSWORD_HASH` (bcrypt):
```bash
cd server
node -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash(process.argv[1], 10));" "YOUR_PASSWORD"
```

Install and run:
```bash
cd server
npm install
npm run dev
```

Server runs on: `http://localhost:3001`

## 4) Frontend Setup (`/client`)
Install and run:
```bash
cd client
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

The frontend uses a dev proxy that forwards `/api/*` to `http://localhost:3001`.

## REST API
Available both with and without `/api` prefix:
- `POST /login`
- `GET /cars`
- `POST /cars`
- `GET /rentals`
- `POST /rentals` (multipart upload: `images[]`, max 5)
- `GET /analytics`

## Important Notes
- Image uploads are limited to 5 per rental (enforced in API and Postgres via `CHECK`).
- Rental date overlap per car is blocked by a Postgres constraint and validated in the server.
- UI language is Arabic (RTL) and is optimized for mobile browsers (Android/iOS).
