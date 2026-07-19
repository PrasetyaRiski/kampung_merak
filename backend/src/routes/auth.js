import { Router } from "express";
import jwt from "jsonwebtoken";
import { getDb } from "../db.js";
import { generateToken } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "kampung-merak-secret-key-2026";

// POST /api/auth/login — login sederhana (tanpa password untuk demo)
router.post("/login", (req, res) => {
  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ error: "UID diperlukan" });
  }
  const db = getDb();
  const user = db.prepare("SELECT uid, nama, role FROM users WHERE uid = ?").get(uid);
  if (!user) {
    return res.status(404).json({ error: "User tidak ditemukan" });
  }
  const token = generateToken(user);
  res.json({ token, user });
});

// GET /api/auth/me — cek token saat ini
router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token tidak ditemukan" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = db.prepare("SELECT uid, nama, role FROM users WHERE uid = ?").get(decoded.uid);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
    res.json({ user });
  } catch {
    return res.status(401).json({ error: "Token tidak valid" });
  }
});

export default router;