import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import { getEnv } from "./env.js";
import { createSupabaseAdmin } from "./supabase.js";
import { requireSession } from "./middleware/requireSession.js";
import { authRouter } from "./routes/auth.js";
import { carsRouter } from "./routes/cars.js";
import { rentalsRouter } from "./routes/rentals.js";
import { analyticsRouter } from "./routes/analytics.js";
import { rentalLogsRouter } from "./routes/rentalLogs.js";
import { maintenanceRouter } from "./routes/maintenance.js";


const env = getEnv();
const supabase = createSupabaseAdmin(env);

export const app = express();

const origin = env.CORS_ORIGIN?.split(",").map((s: string) => s.trim()).filter(Boolean);

app.set("trust proxy", 1);
app.use(
  cors({
    origin: origin && origin.length ? origin : true,
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

const sessionConfig: session.SessionOptions = {
  name: "sid",
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 15
  }
};

// NOTE: connect-pg-simple is disabled because the PostgreSQL server is unreachable.
// Sessions use express-session's default memory store. This means sessions will NOT
// persist across server restarts, but login will work. Re-enable connect-pg-simple
// once DATABASE_URL points to a reachable PostgreSQL server.
/*
if (env.DATABASE_URL) {
  try {
    const require = createRequire(import.meta.url);
    const connectPgSimple = require("connect-pg-simple") as unknown as (session: { Store: typeof session.Store }) => typeof session.Store;
    const PgStore = connectPgSimple(session);
    sessionConfig.store = new PgStore({
      conString: env.DATABASE_URL,
      createTableIfMissing: true
    });
  } catch {
    // Fallback to default memory store if connect-pg-simple fails to initialize
  }
}
*/

app.use(session(sessionConfig));

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bilay's Car Rent API</title>
  </head>
  <body style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 24px; line-height: 1.6;">
    <h1 style="margin: 0 0 8px;">Bilay's Car Rent API</h1>
    <p style="margin: 0 0 16px; color: #444;">This is the backend server. The web UI is served from the same domain.</p>
    <ul style="margin: 0; padding-left: 18px;">
      <li>Web UI (frontend): <a href="/">/</a></li>
      <li>Health check: <a href="/health">/health</a></li>
      <li>API base (used by frontend): <code>/api</code></li>
    </ul>
    <hr style="margin: 18px 0;" />
    <p style="margin: 0; color: #444;" dir="rtl" lang="ar">ده سيرفر الـ API. افتح الواجهة من <b>/</b>.</p>
  </body>
</html>`);
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(authRouter(env));
app.use("/cars", requireSession, carsRouter(supabase));
app.use("/rentals", requireSession, rentalsRouter(supabase, env.SUPABASE_STORAGE_BUCKET, env.PHOTOS_ENC_KEY));
app.use("/analytics", requireSession, analyticsRouter(supabase));

app.use("/api", authRouter(env));
app.use("/api/cars", requireSession, carsRouter(supabase));
app.use("/api/rentals", requireSession, rentalsRouter(supabase, env.SUPABASE_STORAGE_BUCKET, env.PHOTOS_ENC_KEY));
app.use("/maintenance", requireSession, maintenanceRouter(supabase));
app.use("/api/maintenance", requireSession, maintenanceRouter(supabase));

app.use("/rental-logs", requireSession, rentalLogsRouter(supabase));
app.use("/api/rental-logs", requireSession, rentalLogsRouter(supabase));

app.use("/api/analytics", requireSession, analyticsRouter(supabase));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) {
    return;
  }
  const message = err instanceof Error ? err.message : "خطأ غير معروف";
  res.status(500).json({ message });
});
