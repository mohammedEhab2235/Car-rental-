import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Env } from "../env.js";

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export function authRouter(env: Env) {
  const router = Router();

  router.get("/session", (req, res) => {
    res.json({ user: req.session.user ?? null });
  });

  router.post("/login", async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "بيانات تسجيل الدخول غير صحيحة." });
      return;
    }

    const { username, password } = parsed.data;
    if (username !== env.ADMIN_USERNAME) {
      res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة." });
      return;
    }

    const ok = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
    if (!ok) {
      res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة." });
      return;
    }

    req.session.user = { username, loggedInAt: Date.now() };
    res.json({ ok: true });
  });

  router.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("sid");
      res.json({ ok: true });
    });
  });

  return router;
}
