import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import FormField, { FormGrid } from "../components/FormField.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Icon from "../components/Icon.jsx";
import { fetchApi } from "../utils/api.js";
import { ROLES } from "../data/constants.js";

const EMPTY_FORM = {
  egg_id: "",
  tanggal_menetas: "",
  berat_awal: "",
  skor_kesehatan: "Baik",
  status: "newborn",
  foto_url: "",
  catatan: "",
};

function getChickStatusVariant(status) {
  if (status === "healthy" || status === "growing") return "success";
  if (status === "newborn") return "info";
  if (status === "deceased") return "danger";
  return "neutral";
}

export default function ChicksPage({ role }) {
  const [chicks, setChicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = ROLES[role]?.canManageChicks;

  if (!ROLES[role]?.allowed.includes("anakan")) {
    return <AccessDenied role={role} feature="Data Anakan" />;
  }

  useEffect(() => {
    loadChicks();
  }, []);

  const loadChicks = async () => {
    try {
      setLoading(true);
      const data = await fetchApi("/api/chicks");
      setChicks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError("Gagal memuat data anakan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    setIsSaving(true);

    try {
      if (editingId) {
        const payload = { ...formData, id: editingId, berat_awal: Number(formData.berat_awal) };
        if (!payload.foto_url) payload.foto_url = null;
        if (!payload.catatan) payload.catatan = null;

        const updated = await fetchApi(`/api/chicks/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setChicks((curr) => curr.map((c) => (c.id === editingId ? updated : c)));
        setEditingId(null);
      } else {
        const nextNum = String(chicks.length + 1).padStart(3, "0");
        const newId = `CHK-${nextNum}`;
        const payload = { ...formData, id: newId, berat_awal: Number(formData.berat_awal) };
        if (!payload.foto_url) payload.foto_url = null;
        if (!payload.catatan) payload.catatan = null;

        const created = await fetchApi("/api/chicks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setChicks((curr) => [created, ...curr]);
      }
      setFormData({ ...EMPTY_FORM });
    } catch (err) {
      alert("Gagal menyimpan data: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (chick) => {
    if (!canEdit) return;
    setFormData({
      egg_id: chick.egg_id || "",
      tanggal_menetas: chick.tanggal_menetas || "",
      berat_awal: chick.berat_awal || "",
      skor_kesehatan: chick.skor_kesehatan || "Baik",
      status: chick.status || "newborn",
      foto_url: chick.foto_url || "",
      catatan: chick.catatan || "",
    });
    setEditingId(chick.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await fetchApi(`/api/chicks/${deleteConfirm.id}`, { method: "DELETE" });
      setChicks((curr) => curr.filter((c) => c.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      alert("Gagal menghapus data: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-content space-y-6">
      <PageHeader
        eyebrow="Manajemen Populasi"
        title="Data Anakan Merak"
        description="Kelola data anakan hasil penetasan inkubator. Terhubung langsung ke database."
      />

      <RoleNotice role={role} />

      {/* ── Form Input ── */}
      {canEdit && (
        <SectionCard title={editingId ? `Edit Anakan: ${editingId}` : "Pendaftaran Anakan Baru"}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormGrid cols={3}>
              <FormField label="Egg ID (Telur Sumber)" htmlFor="c-egg" required>
                <input
                  id="c-egg"
                  required
                  value={formData.egg_id}
                  onChange={(e) => handleChange("egg_id", e.target.value)}
                  className="km-input font-mono"
                  placeholder="Contoh: EGG-2026-001"
                />
              </FormField>
              <FormField label="Tanggal Menetas" htmlFor="c-tgl" required>
                <input id="c-tgl" type="date" required value={formData.tanggal_menetas} onChange={(e) => handleChange("tanggal_menetas", e.target.value)} className="km-input font-mono text-sm" />
              </FormField>
              <FormField label="Berat Awal (gram)" htmlFor="c-berat" required>
                <input
                  id="c-berat"
                  type="number"
                  step="0.1"
                  required
                  value={formData.berat_awal}
                  onChange={(e) => handleChange("berat_awal", e.target.value)}
                  className="km-input font-mono"
                  placeholder="Contoh: 85.5"
                />
              </FormField>
              <FormField label="Skor Kesehatan" htmlFor="c-skor" required>
                <select id="c-skor" required value={formData.skor_kesehatan} onChange={(e) => handleChange("skor_kesehatan", e.target.value)} className="km-input">
                  <option value="Baik">Baik</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Lemah">Lemah</option>
                </select>
              </FormField>
              <FormField label="Status" htmlFor="c-status" required>
                <select id="c-status" required value={formData.status} onChange={(e) => handleChange("status", e.target.value)} className="km-input">
                  <option value="newborn">Newborn</option>
                  <option value="growing">Growing</option>
                  <option value="healthy">Healthy</option>
                  <option value="deceased">Deceased</option>
                </select>
              </FormField>
              <FormField label="Catatan" htmlFor="c-catatan">
                <input id="c-catatan" value={formData.catatan} onChange={(e) => handleChange("catatan", e.target.value)} className="km-input" placeholder="Opsional" />
              </FormField>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <FormField label="Foto URL" htmlFor="c-foto">
                  <input
                    id="c-foto"
                    type="url"
                    value={formData.foto_url}
                    onChange={(e) => handleChange("foto_url", e.target.value)}
                    className="km-input"
                    placeholder="Contoh: https://domain-anda.com/foto-anakan.jpg"
                  />
                </FormField>
              </div>
            </FormGrid>

            <div className="flex gap-3 justify-end">
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="km-btn km-btn-secondary">Batal Edit</button>
              )}
              <button type="submit" className="km-btn km-btn-primary" disabled={isSaving}>
                {isSaving ? <Icon name="sync" className="animate-spin text-[18px]" /> : editingId ? "Simpan Perubahan" : "Daftarkan Anakan"}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* ── Tabel Data ── */}
      <SectionCard title={`Daftar Anakan (${chicks.length})`} noPadding>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-ink-outline">Memuat data anakan...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : chicks.length === 0 ? (
            <EmptyState icon="child_care" title="Belum Ada Data Anakan" description="Tambahkan data anakan merak hasil penetasan menggunakan form di atas." />
          ) : (
            <table className="km-table min-w-[800px]">
              <thead>
                <tr>
                  <th className="w-12">FOTO</th>
                  <th>ID</th>
                  <th>EGG ID</th>
                  <th>INDUK ♂</th>
                  <th>INDUK ♀</th>
                  <th>TGL MENETAS</th>
                  <th>BERAT</th>
                  <th>SKOR</th>
                  <th>STATUS</th>
                  {canEdit && <th className="text-right">AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {chicks.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2">
                      {c.foto_url ? (
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-alpine-high bg-alpine-low shadow-sm">
                          <img src={c.foto_url} alt={c.id} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-alpine-high bg-alpine-low text-ink-outline">
                          <Icon name="child_care" className="text-[18px]" />
                        </div>
                      )}
                    </td>
                    <td><span className="font-mono text-sm font-bold text-ink-primary">{c.id}</span></td>
                    <td><span className="font-mono text-xs text-ink-secondary">{c.egg_id}</span></td>
                    <td><span className="text-xs text-ink-secondary">{c.induk_jantan_id || "—"}</span></td>
                    <td><span className="text-xs text-ink-secondary">{c.induk_betina_id || "—"}</span></td>
                    <td><span className="font-mono text-sm">{c.tanggal_menetas}</span></td>
                    <td><span className="font-mono text-sm">{c.berat_awal}g</span></td>
                    <td>
                      <StatusBadge
                        label={c.skor_kesehatan}
                        variant={c.skor_kesehatan === "Baik" ? "success" : c.skor_kesehatan === "Sedang" ? "warning" : "danger"}
                        showIcon={false}
                      />
                    </td>
                    <td><StatusBadge label={c.status} variant={getChickStatusVariant(c.status)} showIcon={false} /></td>
                    {canEdit && (
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button className="km-btn km-btn-secondary km-btn-sm !px-2" onClick={() => handleEdit(c)} title="Edit">
                            <Icon name="edit" className="text-[16px]" />
                          </button>
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/30 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                            onClick={() => setDeleteConfirm(c)}
                            title="Hapus"
                          >
                            <Icon name="delete" className="text-[16px]" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SectionCard>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Hapus Anakan"
          message={`Apakah Anda yakin ingin menghapus data anakan ${deleteConfirm.id}? Aksi ini tidak dapat dibatalkan.`}
          confirmText={isDeleting ? "Menghapus..." : "Hapus"}
          cancelText="Batal"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          isDestructive={true}
        />
      )}
    </div>
  );
}
