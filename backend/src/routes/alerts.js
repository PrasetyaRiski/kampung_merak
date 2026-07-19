import { Router } from "express";
import { getDb } from "../db.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/alerts — semua alert
router.get("/", verifyToken, (req, res) => {
  const db = getDb();
  const alerts = db.prepare("SELECT * FROM alerts ORDER BY created_at_dt DESC").all();
  res.json({ data: alerts });
});

// GET /api/alerts/open — alert yang masih open
router.get("/open", verifyToken, (req, res) => {
  const db = getDb();
  const alerts = db.prepare("SELECT * FROM alerts WHERE status = 'open' ORDER BY created_at_dt DESC").all();
  res.json({ data: alerts });
});

// POST /api/alerts — tambah alert
router.post("/", verifyToken, requireRole("admin", "operator"), (req, res) => {
  const { id, level, title, source, detail } = req.body;
  if (!id || !level || !title) {
    return res.status(400).json({ error: "Data tidak lengkap (id, level, title diperlukan)" });
  }
  const db = getDb();
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  db.prepare(`
    INSERT INTO alerts (id, level, title, source, created_at, status, detail)
    VALUES (?, ?, ?, ?, ?, 'open', ?)
  `).run(id, level, title, source || null, now, detail || "");
  const alert = db.prepare("SELECT * FROM alerts WHERE id = ?").get(id);
  res.status(201).json({ data: alert });
});

// PUT /api/alerts/:id/acknowledge — acknowledge alert
router.put("/:id/acknowledge", verifyToken, requireRole("admin", "operator"), (req, res) => {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM alerts WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Alert tidak ditemukan" });

  db.prepare("UPDATE alerts SET status = 'acknowledged', acknowledged_by = ? WHERE id = ?").run(req.user.nama, req.params.id);
  const updated = db.prepare("SELECT * FROM alerts WHERE id = ?").get(req.params.id);
  res.json({ data: updated });
});

// DELETE /api/alerts/:id — hapus alert
router.delete("/:id", verifyToken, requireRole("admin"), (req, res) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM alerts WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Alert tidak ditemukan" });
  res.json({ message: "Berhasil dihapus" });
});

export default router;