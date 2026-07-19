import { Router } from "express";
import { getDb } from "../db.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/eggs — semua telur
router.get("/", verifyToken, (req, res) => {
  const db = getDb();
  const eggs = db.prepare("SELECT * FROM eggs ORDER BY created_at DESC").all();
  res.json({ data: eggs });
});

// GET /api/eggs/:id — detail telur
router.get("/:id", verifyToken, (req, res) => {
  const db = getDb();
  const egg = db.prepare("SELECT * FROM eggs WHERE id = ?").get(req.params.id);
  if (!egg) return res.status(404).json({ error: "Telur tidak ditemukan" });
  res.json({ data: egg });
});

// POST /api/eggs — tambah telur
router.post("/", verifyToken, requireRole("admin", "operator"), (req, res) => {
  const { id, incubator_id, slot, tanggal_masuk, estimasi_menetas, fertilitas, varietas, induk_jantan_id, induk_betina_id, catatan } = req.body;
  if (!id || !slot || !tanggal_masuk || !varietas) {
    return res.status(400).json({ error: "Data tidak lengkap (id, slot, tanggal_masuk, varietas diperlukan)" });
  }
  const db = getDb();
  db.prepare(`
    INSERT INTO eggs (id, incubator_id, slot, tanggal_masuk, estimasi_menetas, fertilitas, varietas, induk_jantan_id, induk_betina_id, catatan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, incubator_id || "INK-A", slot, tanggal_masuk, estimasi_menetas || null, fertilitas || "belum dicek", varietas, induk_jantan_id || null, induk_betina_id || null, catatan || "");
  const egg = db.prepare("SELECT * FROM eggs WHERE id = ?").get(id);
  res.status(201).json({ data: egg });
});

// PUT /api/eggs/:id — update telur
router.put("/:id", verifyToken, requireRole("admin", "operator"), (req, res) => {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM eggs WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Telur tidak ditemukan" });

  const { incubator_id, slot, tanggal_bertelur, tanggal_masuk, estimasi_menetas, fertilitas, akhir, varietas, induk_jantan_id, induk_betina_id, anak_id, catatan } = req.body;
  db.prepare(`
    UPDATE eggs SET incubator_id=?, slot=?, tanggal_bertelur=?, tanggal_masuk=?, estimasi_menetas=?, fertilitas=?, akhir=?, varietas=?, induk_jantan_id=?, induk_betina_id=?, anak_id=?, catatan=?
    WHERE id=?
  `).run(
    incubator_id ?? existing.incubator_id,
    slot ?? existing.slot,
    tanggal_bertelur ?? existing.tanggal_bertelur,
    tanggal_masuk ?? existing.tanggal_masuk,
    estimasi_menetas ?? existing.estimasi_menetas,
    fertilitas ?? existing.fertilitas,
    akhir ?? existing.akhir,
    varietas ?? existing.varietas,
    induk_jantan_id ?? existing.induk_jantan_id,
    induk_betina_id ?? existing.induk_betina_id,
    anak_id ?? existing.anak_id,
    catatan ?? existing.catatan,
    req.params.id
  );
  const updated = db.prepare("SELECT * FROM eggs WHERE id = ?").get(req.params.id);
  res.json({ data: updated });
});

// DELETE /api/eggs/:id — hapus telur
router.delete("/:id", verifyToken, requireRole("admin"), (req, res) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM eggs WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Telur tidak ditemukan" });
  res.json({ message: "Berhasil dihapus" });
});

export default router;