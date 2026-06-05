import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Env } from "../env.js";
import sql from "../db.js";

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export function authRouter(env: Env) {
  const router = Router();

  router.get("/session", (req, res) => {
    res.json({ user: req.session.user ?? null });
  });

  router.get("/debug/auth", async (_req, res) => {
    try {
      let users: string[] = [];
      if (sql) {
        const rows = await sql<{ username: string }[]>`SELECT username FROM public.users WHERE is_active = true`;
        users = rows.map((r) => r.username);
      }
      res.json({
        databaseUrlSet: !!process.env.DATABASE_URL,
        sqlClientAvailable: !!sql,
        envFallbackAvailable: !!(env.ADMIN_USERNAME && env.ADMIN_PASSWORD_HASH),
        envUsername: env.ADMIN_USERNAME ?? null,
        userCount: users.length,
        users
      });
    } catch (err) {
      console.error("Debug auth error:", err);
      res.status(500).json({ message: err instanceof Error ? err.message : "debug error" });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: "بيانات تسجيل الدخول غير صحيحة." });
        return;
      }

      const { username, password } = parsed.data;
      console.log("[login attempt] received username:", JSON.stringify(username));
      console.log("[login attempt] DATABASE_URL present:", !!process.env.DATABASE_URL);
      console.log("[login attempt] sql client available:", !!sql);
      console.log("[login attempt] env fallback available:", !!(env.ADMIN_USERNAME && env.ADMIN_PASSWORD_HASH));

      let authenticated = false;
      let sessionUsername = username;

      if (sql) {
        try {
          const rows = await sql<
            { id: string; username: string; password_hash: string }[]
          >
          `SELECT id, username, password_hash
           FROM public.users
           WHERE username = ${username} AND is_active = true
           LIMIT 1`;

          console.log("[login attempt] users table rows found:", rows.length);

          if (rows.length > 0) {
            const user = rows[0];
            const ok = await bcrypt.compare(password, user.password_hash);
            if (ok) {
              authenticated = true;
              sessionUsername = user.username;
              console.log("[login attempt] authenticated via users table:", user.username);
            } else {
              console.log("[login attempt] password mismatch for users table user:", user.username);
            }
          } else {
            console.log("[login attempt] no active user found in users table for:", username);
          }
        } catch (dbErr) {
          console.error("[login attempt] database query error:", dbErr);
        }
      } else {
        console.log("[login attempt] skipping users table lookup: DATABASE_URL not set");
      }

      if (!authenticated && env.ADMIN_USERNAME && env.ADMIN_PASSWORD_HASH) {
        console.log("[login attempt] trying env fallback. expected username:", JSON.stringify(env.ADMIN_USERNAME));
        if (username === env.ADMIN_USERNAME) {
          const ok = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
          if (ok) {
            authenticated = true;
            console.log("[login attempt] authenticated via env fallback:", username);
          } else {
            console.log("[login attempt] password mismatch for env fallback user:", username);
          }
        } else {
          console.log("[login attempt] username mismatch for env fallback");
        }
      }

      if (!authenticated) {
        res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة." });
        return;
      }

      req.session.user = { username: sessionUsername, loggedInAt: Date.now() };
      res.json({ ok: true });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: err instanceof Error ? err.message : "خطأ في تسجيل الدخول" });
    }
  });

  router.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("sid");
      res.json({ ok: true });
    });
  });

  return router;
}
