import { Router } from "express";
import { getDb } from "../db.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/users — semua user
router.get("/", verifyToken, requireRole("admin"), (req, res) => {
  const db = getDb();
  const users = db.prepare("SELECT uid, nama, role, created_at FROM users ORDER BY created_at ASC").all();
  res.json({ data: users });
});

// POST /api/users — tambah user
router.post("/", verifyToken, requireRole("admin"), (req, res) => {
  const { uid, nama, role } = req.body;
  if (!uid || !nama) {
    return res.status(400).json({ error: "UID dan nama diperlukan" });
  }
  const db = getDb();
  db.prepare("INSERT INTO users (uid, nama, role) VALUES (?, ?, ?)").run(uid, nama, role || "viewer");
  const user = db.prepare("SELECT uid, nama, role, created_at FROM users WHERE uid = ?").get(uid);
  res.status(201).json({ data: user });
});

// PUT /api/users/:uid — update user
router.put("/:uid", verifyToken, requireRole("admin"), (req, res) => {
  const { nama, role } = req.body;
  const db = getDb();
  const existing = db.prepare("SELECT * FROM users WHERE uid = ?").get(req.params.uid);
  if (!existing) return res.status(404).json({ error: "User tidak ditemukan" });

  db.prepare("UPDATE users SET nama=?, role=? WHERE uid=?").run(
    nama ?? existing.nama,
    role ?? existing.role,
    req.params.uid
  );
  const updated = db.prepare("SELECT uid, nama, role, created_at FROM users WHERE uid = ?").get(req.params.uid);
  res.json({ data: updated });
});

// DELETE /api/users/:uid — hapus user
router.delete("/:uid", verifyToken, requireRole("admin"), (req, res) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM users WHERE uid = ?").run(req.params.uid);
  if (result.changes === 0) return res.status(404).json({ error: "User tidak ditemukan" });
  res.json({ message: "Berhasil dihapus" });
});

export default router;