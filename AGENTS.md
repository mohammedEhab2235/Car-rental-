# Bilay's Car Rent — Agent Guide

## Project Overview

Bilay's Car Rent is a premium car rental admin dashboard with an Arabic (RTL) user interface. It supports session-based authentication, car and rental management, image uploads (max 5 per rental), and analytics via Chart.js. The UI is optimized for mobile browsers and uses a dark glassmorphism theme with red/black accents.

The project is a monorepo with two main packages:
- `client/` — React 18 frontend (Vite + TailwindCSS)
- `server/` — Express REST API (TypeScript, ES modules)

## Tech Stack

- **Backend**: Node.js + Express (TypeScript, ESM)
- **Database**: Supabase (PostgreSQL) with `pgcrypto` and `btree_gist` extensions
- **Direct SQL driver**: `postgres` (used for encrypted photo queries)
- **File storage**: Supabase Storage (public bucket `rental-images`)
- **Frontend**: React 18 + Vite + TailwindCSS v3 + TypeScript
- **Charts**: Chart.js + react-chartjs-2
- **State management**: Zustand
- **Routing**: react-router-dom
- **Icons**: lucide-react
- **Validation**: Zod (backend only)
- **Testing**: Vitest (server only)

## Project Structure

```
├── client/               # Frontend React app
│   ├── src/
│   │   ├── pages/        # Route pages (Login, Dashboard, Analytics)
│   │   ├── components/   # Reusable UI components and forms
│   │   ├── stores/       # Zustand stores (auth, toast)
│   │   ├── utils/        # API client, date helpers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── types.ts      # Shared frontend types
│   │   └── index.css     # Global styles (dark radial-gradient theme)
│   ├── vite.config.ts    # Vite config with dev proxy and manual chunks
│   ├── tailwind.config.js
│   └── tsconfig.json     # strict: false
├── server/               # Express REST API
│   ├── src/
│   │   ├── routes/       # auth, cars, rentals, analytics
│   │   ├── middleware/   # requireSession
│   │   ├── utils/        # date helpers (+ vitest tests)
│   │   ├── db.ts         # postgres.js client wrapper
│   │   ├── supabase.ts   # Supabase admin client factory
│   │   ├── env.ts        # Zod-based env validation
│   │   ├── types.ts      # Shared backend types
│   │   └── index.ts      # App entrypoint
│   ├── .env              # Environment variables (copy from .env.example)
│   └── tsconfig.json     # strict: true
├── database/
│   ├── schema.sql        # Full DB schema (cars, rentals, rental_photos, rental_logs, users)
│   └── seed.sql          # Optional demo data
│   └── scripts/          # Helper scripts (create-admin)
└── supabase/migrations/  # Incremental migration files
```

## Build and Development Commands

### Backend (`/server`)
```bash
cd server
npm install
npm run dev        # tsx watch src/index.ts  →  http://localhost:3001
npm run build      # tsc -p tsconfig.json
npm run start      # node dist/index.js
npm run check      # tsc --noEmit
npm run test       # vitest run
```

### Frontend (`/client`)
```bash
cd client
npm install
npm run dev        # vite  →  http://localhost:5173
npm run build      # tsc -b && vite build
npm run check      # tsc -b --noEmit
npm run lint       # eslint .
```

The Vite dev server proxies `/api/*` to `http://localhost:3001`.

## Vercel Deployment

The project is configured for fullstack deployment on Vercel:
- **Frontend** (`client/`) is built as a static site
- **Backend** (`server/`) runs as serverless functions via `api/index.ts`

### Deployment setup

1. Install the new server dependencies locally (or let Vercel install them):
   ```bash
   cd server && npm install
   ```

2. Push the repo to GitHub and import it on [vercel.com](https://vercel.com).

3. In the Vercel project settings, set the **Root Directory** to `/` (repo root).

4. Add all environment variables from `server/.env.example` in the Vercel dashboard (**Settings → Environment Variables**):
   - `NODE_ENV=production`
   - `SESSION_SECRET` (min 16 chars)
   - `ADMIN_USERNAME` (optional; legacy fallback)
   - `ADMIN_PASSWORD_HASH` (optional; legacy fallback)
   - `DATABASE_URL` (Postgres connection with `sslmode=require`)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET` (default: `rental-images`)
   - `PHOTOS_ENC_KEY` (min 32 chars)
   - `CORS_ORIGIN` (optional; leave empty for same-domain)

5. Deploy. Vercel will:
   - Build the client to `client/dist`
   - Bundle the API function from `api/index.ts`
   - Route `/api/*` to the serverless function
   - Serve everything else from the static frontend

### Important Vercel limitations

- **Image uploads**: Vercel serverless functions have a **4.5 MB request body limit**. Uploading 5 images × 5 MB each **will not work** on Vercel. If you need full image upload support, host the backend on a platform like [Render](https://render.com), [Railway](https://railway.app), or [Fly.io](https://fly.io) instead, and point the frontend `VITE_API_URL` to that external backend.
- **Sessions**: The app uses `connect-pg-simple` with `DATABASE_URL` to store sessions in PostgreSQL. If `DATABASE_URL` is missing, sessions fall back to memory (unreliable across serverless invocations).
- **Cold starts**: The first request after idle may take a few seconds while the serverless function initializes.

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `SESSION_SECRET` | Min 16 chars |
| `ADMIN_USERNAME` | Optional legacy fallback username |
| `ADMIN_PASSWORD_HASH` | Optional legacy fallback bcrypt hash |

Credentials are now stored in the `public.users` table. To create the first admin:
```bash
cd server
npx tsx scripts/create-admin.ts <username> <password>
```
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (not publishable/anon key) |
| `SUPABASE_STORAGE_BUCKET` | Defaults to `rental-images` |
| `PHOTOS_ENC_KEY` | Min 32 chars; used for `pgp_sym_encrypt` of photo URLs |
| `DATABASE_URL` | Direct Postgres connection string (with `sslmode=require`) |
| `CORS_ORIGIN` | Comma-separated allowed origins (optional) |

Generate a bcrypt hash:
```bash
cd server
node -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash(process.argv[1], 10));" "YOUR_PASSWORD"
```

## Code Style Guidelines

- Both packages use **ES modules** (`"type": "module"`).
- **Client TypeScript**: `strict: false` in `tsconfig.json`. Be lenient with types.
- **Server TypeScript**: `strict: true`. Be precise with types.
- All UI text is in **Arabic** and the layout is implicitly RTL (no `dir="rtl"` on `<html>`, but text aligns naturally).
- Tailwind classes favor: `rounded-2xl`, `border-white/10`, `bg-[#13131A]/60`, `backdrop-blur`, `shadow-[0_24px_70px_-55px_rgba(0,0,0,0.9)]`.
- Prefer `min-h-[100dvh]` over `min-h-screen` for mobile viewport stability.
- The accent color is `#D10F1A` (red).

## API Architecture

Routes are mounted **twice** — once at root and once under `/api` — so both `/cars` and `/api/cars` work.

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /session` | No | Check current session |
| `POST /login` | No | Login with username/password |
| `POST /logout` | No | Destroy session |
| `GET /cars` | Yes | List cars |
| `POST /cars` | Yes | Create car |
| `PATCH /cars/:id` | Yes | Update car |
| `DELETE /cars/:id` | Yes | Delete car (blocked if rentals exist) |
| `GET /rentals` | Yes | List rentals |
| `POST /rentals` | Yes | Create rental + upload images (multipart, max 5) |
| `GET /rentals/:id/photos` | Yes | List decrypted photo URLs for a rental |
| `GET /analytics` | Yes | Most rented / most profitable + chart data |

## Database Notes

- **Cars** cannot be deleted if they have linked rentals (`ON DELETE RESTRICT`).
- **Rental overlap** is blocked by a Postgres `EXCLUDE` constraint (`rentals_no_overlap_per_car`) and also checked in the API.
- **Photos** are limited to 5 per rental via a Postgres trigger (`rental_photos_max_5`) and API validation.
- **Photo URLs** are stored encrypted with `pgp_sym_encrypt` / `pgp_sym_decrypt` using `PHOTOS_ENC_KEY`.
- **Rental logs** track creation events in `rental_logs` for audit purposes.
- **Odometer** is stored on the rental record (not the car).
- **Users** are stored in `public.users` with bcrypt password hashes. The legacy env-based credentials still work as a fallback if the user is not found in the table.

## Testing Instructions

- Server tests run with **Vitest**.
- Only one test suite exists: `server/src/utils/dates.test.ts`.
- There are no frontend tests.

Run tests:
```bash
cd server
npm run test
```

## Security Considerations

- Session cookies are `httpOnly`, `sameSite: lax`, and `secure` only in production.
- Admin credentials are stored in the `public.users` table; there is no public registration endpoint.
- Supabase service-role key is validated to reject publishable keys.
- Photo storage paths include the username to avoid collisions.
- Upload failures trigger full rollback: stored files are removed and the rental record is deleted.
- CORS is configurable via `CORS_ORIGIN`.

## Important Implementation Details

- **Image uploads**: handled with `multer` (memory storage), max 5 files, 5 MB each. The server auto-creates the Supabase Storage bucket on first upload.
- **Date handling**: rentals use `DATE` columns (not timestamps). `diffDaysInclusive` counts both start and end dates (e.g., Jan 1–Jan 1 = 1 day).
- **Pricing**: rentals support two modes: `saved` (uses `cars.daily_price`) or `custom` (one-off price). The total is computed server-side as `days × daily_price`.
- **Frontend state**: `auth` store checks `/session` on mount. `Protected` components redirect unauthenticated users to `/login`.
- **Toasts**: managed by `toast` store (max 4 visible, auto-dismiss after 3.2s).
