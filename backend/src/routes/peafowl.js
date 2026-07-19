import { Router } from "express";
import { getDb } from "../db.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/peafowl — semua burung
router.get("/", verifyToken, (req, res) => {
  const db = getDb();
  const birds = db.prepare("SELECT * FROM peafowl ORDER BY created_at DESC").all();
  res.json({ data: birds });
});

// GET /api/peafowl/:id — detail burung
router.get("/:id", verifyToken, (req, res) => {
  const db = getDb();
  const bird = db.prepare("SELECT * FROM peafowl WHERE id = ?").get(req.params.id);
  if (!bird) return res.status(404).json({ error: "Burung tidak ditemukan" });
  res.json({ data: bird });
});

// POST /api/peafowl — tambah burung
router.post("/", verifyToken, requireRole("admin", "operator"), (req, res) => {
  const { id, nama, jenis_kelamin, varietas, tanggal_lahir, asal, ayah_id, ibu_id, egg_id, kandang, status, catatan } = req.body;
  if (!id || !nama || !varietas) {
    return res.status(400).json({ error: "Data tidak lengkap (id, nama, varietas diperlukan)" });
  }
  const db = getDb();
  db.prepare(`
    INSERT INTO peafowl (id, nama, jenis_kelamin, varietas, tanggal_lahir, asal, ayah_id, ibu_id, egg_id, kandang, status, catatan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, nama, jenis_kelamin || "Belum diketahui", varietas, tanggal_lahir || null, asal || null, ayah_id || null, ibu_id || null, egg_id || null, kandang || null, status || "Anakan", catatan || "");
  const bird = db.prepare("SELECT * FROM peafowl WHERE id = ?").get(id);
  res.status(201).json({ data: bird });
});

// PUT /api/peafowl/:id — update burung
router.put("/:id", verifyToken, requireRole("admin", "operator"), (req, res) => {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM peafowl WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Burung tidak ditemukan" });

  const { nama, jenis_kelamin, varietas, tanggal_lahir, asal, ayah_id, ibu_id, egg_id, kandang, status, catatan } = req.body;
  db.prepare(`
    UPDATE peafowl SET nama=?, jenis_kelamin=?, varietas=?, tanggal_lahir=?, asal=?, ayah_id=?, ibu_id=?, egg_id=?, kandang=?, status=?, catatan=?
    WHERE id=?
  `).run(
    nama ?? existing.nama,
    jenis_kelamin ?? existing.jenis_kelamin,
    varietas ?? existing.varietas,
    tanggal_lahir ?? existing.tanggal_lahir,
    asal ?? existing.asal,
    ayah_id ?? existing.ayah_id,
    ibu_id ?? existing.ibu_id,
    egg_id ?? existing.egg_id,
    kandang ?? existing.kandang,
    status ?? existing.status,
    catatan ?? existing.catatan,
    req.params.id
  );
  const updated = db.prepare("SELECT * FROM peafowl WHERE id = ?").get(req.params.id);
  res.json({ data: updated });
});

// DELETE /api/peafowl/:id — hapus burung
router.delete("/:id", verifyToken, requireRole("admin"), (req, res) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM peafowl WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Burung tidak ditemukan" });
  res.json({ message: "Berhasil dihapus" });
});

export default router;