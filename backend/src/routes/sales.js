import { Router } from "express";
import { getDb } from "../db.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/sales — semua penjualan
router.get("/", verifyToken, (req, res) => {
  const db = getDb();
  const sales = db.prepare("SELECT * FROM sales ORDER BY created_at DESC").all();
  res.json({ data: sales });
});

// GET /api/sales/:id — detail penjualan
router.get("/:id", verifyToken, (req, res) => {
  const db = getDb();
  const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(req.params.id);
  if (!sale) return res.status(404).json({ error: "Penjualan tidak ditemukan" });
  res.json({ data: sale });
});

// POST /api/sales — tambah penjualan
router.post("/", verifyToken, requireRole("admin", "operator"), (req, res) => {
  const { id, tanggal, item, referensi_id, pembeli, qty, harga_satuan, status, catatan } = req.body;
  if (!id || !tanggal || !item || !pembeli) {
    return res.status(400).json({ error: "Data tidak lengkap (id, tanggal, item, pembeli diperlukan)" });
  }
  const db = getDb();
  db.prepare(`
    INSERT INTO sales (id, tanggal, item, referensi_id, pembeli, qty, harga_satuan, status, catatan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, tanggal, item, referensi_id || null, pembeli, qty || 1, harga_satuan || 0, status || "Booking", catatan || "");
  const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(id);
  res.status(201).json({ data: sale });
});

// PUT /api/sales/:id — update penjualan
router.put("/:id", verifyToken, requireRole("admin", "operator"), (req, res) => {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM sales WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Penjualan tidak ditemukan" });

  const { tanggal, item, referensi_id, pembeli, qty, harga_satuan, status, catatan } = req.body;
  db.prepare(`
    UPDATE sales SET tanggal=?, item=?, referensi_id=?, pembeli=?, qty=?, harga_satuan=?, status=?, catatan=?
    WHERE id=?
  `).run(
    tanggal ?? existing.tanggal,
    item ?? existing.item,
    referensi_id ?? existing.referensi_id,
    pembeli ?? existing.pembeli,
    qty ?? existing.qty,
    harga_satuan ?? existing.harga_satuan,
    status ?? existing.status,
    catatan ?? existing.catatan,
    req.params.id
  );
  const updated = db.prepare("SELECT * FROM sales WHERE id = ?").get(req.params.id);
  res.json({ data: updated });
});

// DELETE /api/sales/:id — hapus penjualan
router.delete("/:id", verifyToken, requireRole("admin"), (req, res) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM sales WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Penjualan tidak ditemukan" });
  res.json({ message: "Berhasil dihapus" });
});

export default router;