import type { RequestHandler } from "express";

export const requireSession: RequestHandler = (req, res, next) => {
  if (!req.session.user) {
    res.status(401).json({ message: "غير مسموح. الرجاء تسجيل الدخول." });
    return;
  }
  next();
};

