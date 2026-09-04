import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import FormField, { FormGrid } from "../components/FormField.jsx";
import StatusBadge, { getFertilitasVariant, getEggStatusVariant } from "../components/StatusBadge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Icon from "../components/Icon.jsx";
import { ROLES, makeId } from "../data/constants.js";
import { fetchApi } from "../utils/api.js";

const EMPTY_FORM = {
  slot: "",
  tanggalMasuk: "",
  fertilitas: "Belum dicek",
  akhir: "Proses",
  induk_jantan_id: "",
  induk_betina_id: "",
  catatan: "",
};

export default function EggPage({ role }) {
  const [eggs, setEggs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = ROLES[role].canEditEggs;

  if (!ROLES[role].allowed.includes("telur")) {
    return <AccessDenied role={role} feature="Manajemen Data Telur" />;
  }

  useEffect(() => {
    loadEggs();
  }, []);

  const loadEggs = async () => {
    try {
      setLoading(true);
      const data = await fetchApi("/api/eggs");
      setEggs(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError("Gagal memuat data telur: " + err.message);
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
        const payload = {
          ...formData,
          id: editingId,
          slot: parseInt(formData.slot, 10),
          induk_jantan_id: formData.induk_jantan_id || null,
          induk_betina_id: formData.induk_betina_id || null,
          catatan: formData.catatan || null,
        };
        const updated = await fetchApi(`/api/eggs/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setEggs((curr) => curr.map((egg) => (egg.id === editingId ? updated : egg)));
        setEditingId(null);
      } else {
        const newId = makeId("EGG");
        const payload = {
          ...formData,
          id: newId,
          slot: parseInt(formData.slot, 10),
          induk_jantan_id: formData.induk_jantan_id || null,
          induk_betina_id: formData.induk_betina_id || null,
          catatan: formData.catatan || null,
        };
        const created = await fetchApi("/api/eggs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setEggs((curr) => [created, ...curr]);
      }
      setFormData({ ...EMPTY_FORM });
    } catch (err) {
      alert("Gagal menyimpan data: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (egg) => {
    if (!canEdit) return;
    setFormData({
      slot: egg.slot?.toString() || "",
      tanggalMasuk: egg.tanggalMasuk || "",
      fertilitas: egg.fertilitas || "Belum dicek",
      akhir: egg.akhir || "Proses",
      induk_jantan_id: egg.induk_jantan_id || "",
      induk_betina_id: egg.induk_betina_id || "",
      catatan: egg.catatan || "",
    });
    setEditingId(egg.id);
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
      await fetchApi(`/api/eggs/${deleteConfirm.id}`, { method: "DELETE" });
      setEggs((curr) => curr.filter((egg) => egg.id !== deleteConfirm.id));
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
        eyebrow="Manajemen Data"
        title="Data Telur Inkubator"
        description="Kelola slot nampan, status fertilitas hasil candling, dan status akhir penetasan. Terhubung langsung ke database."
      />

      <RoleNotice role={role} />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-status-dangerText/30 bg-status-dangerBg px-4 py-3">
          <Icon name="error" className="text-[18px] text-status-dangerText shrink-0" />
          <p className="font-body text-sm text-status-dangerText">{error}</p>
          <button onClick={loadEggs} className="ml-auto km-btn km-btn-sm km-btn-secondary">Coba Lagi</button>
        </div>
      )}

      {canEdit && (
        <SectionCard title={editingId ? `Edit Data Telur: ${editingId}` : "Tambah Data Telur"}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormGrid cols={3}>
              <FormField label="Slot Nampan (1-50)" htmlFor="slot" required>
                <input
                  id="slot"
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={formData.slot}
                  onChange={(e) => handleChange("slot", e.target.value)}
                  className="km-input font-mono"
                />
              </FormField>
              <FormField label="Tgl Masuk Inkubator" htmlFor="tanggalMasuk" required>
                <input
                  id="tanggalMasuk"
                  type="date"
                  required
                  value={formData.tanggalMasuk}
                  onChange={(e) => handleChange("tanggalMasuk", e.target.value)}
                  className="km-input font-mono text-sm"
                />
              </FormField>
              <FormField label="Fertilitas" htmlFor="fertilitas" required>
                <select
                  id="fertilitas"
                  required
                  value={formData.fertilitas}
                  onChange={(e) => handleChange("fertilitas", e.target.value)}
                  className="km-input"
                >
                  <option value="Belum dicek">Belum Dicek</option>
                  <option value="Fertil">Fertil</option>
                  <option value="Infertil">Infertil / Kosong</option>
                </select>
              </FormField>

              <FormField label="ID Induk Jantan" htmlFor="induk_jantan_id">
                <input
                  id="induk_jantan_id"
                  value={formData.induk_jantan_id}
                  onChange={(e) => handleChange("induk_jantan_id", e.target.value)}
                  className="km-input font-mono text-sm uppercase"
                  placeholder="Contoh: MALE-01"
                />
              </FormField>
              <FormField label="ID Induk Betina" htmlFor="induk_betina_id">
                <input
                  id="induk_betina_id"
                  value={formData.induk_betina_id}
                  onChange={(e) => handleChange("induk_betina_id", e.target.value)}
                  className="km-input font-mono text-sm uppercase"
                  placeholder="Contoh: FEMALE-01"
                />
              </FormField>
              <FormField label="Status Akhir" htmlFor="akhir" required>
                <select
                  id="akhir"
                  required
                  value={formData.akhir}
                  onChange={(e) => handleChange("akhir", e.target.value)}
                  className="km-input"
                >
                  <option value="Proses">Dalam Proses</option>
                  <option value="Menetas">Berhasil Menetas</option>
                  <option value="Gagal Tetas">Gagal Menetas</option>
                  <option value="Dibuang">Dibuang (Infertil)</option>
                </select>
              </FormField>
            </FormGrid>

            <FormField label="Catatan Tambahan" htmlFor="catatan">
              <input
                id="catatan"
                value={formData.catatan}
                onChange={(e) => handleChange("catatan", e.target.value)}
                className="km-input"
                placeholder="Misal: Posisi retak sedikit, dll"
              />
            </FormField>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSaving} className="km-btn km-btn-primary">
                {isSaving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Data"}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="km-btn km-btn-secondary">
                  Batal Edit
                </button>
              )}
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title={`Daftar Telur Terdaftar ${eggs.length > 0 ? `(${eggs.length})` : ""}`} noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-ink-secondary">
              <Icon name="hourglass_top" className="text-[20px] animate-spin" />
              <span className="font-body text-sm">Memuat data dari server...</span>
            </div>
          </div>
        ) : eggs.length === 0 ? (
          <EmptyState
            icon="egg_alt"
            title="Belum ada data telur"
            desc="Tambahkan data telur menggunakan form di atas."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="km-table min-w-[800px]">
              <thead>
                <tr>
                  <th>ID TELUR / SLOT</th>
                  <th>INDUK</th>
                  <th>TGL MASUK</th>
                  <th>FERTILITAS</th>
                  <th>STATUS AKHIR</th>
                  {canEdit && <th className="text-right">AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {eggs.map((egg) => (
                  <tr key={egg.id}>
                    <td>
                      <p className="font-mono text-sm font-bold text-ink-primary">{egg.id}</p>
                      <p className="font-mono text-xs text-ink-secondary">Slot: {egg.slot}</p>
                    </td>
                    <td>
                      <p className="font-mono text-xs text-ink-primary">♂ {egg.induk_jantan_id || "—"}</p>
                      <p className="font-mono text-xs text-ink-secondary mt-0.5">♀ {egg.induk_betina_id || "—"}</p>
                    </td>
                    <td>
                      <p className="font-mono text-xs">{egg.tanggalMasuk || "—"}</p>
                    </td>
                    <td>
                      <StatusBadge
                        label={egg.fertilitas}
                        variant={getFertilitasVariant(egg.fertilitas)}
                        showIcon={false}
                      />
                    </td>
                    <td>
                      <StatusBadge
                        label={egg.akhir?.replace(/_/g, " ")}
                        variant={getEggStatusVariant(egg.akhir)}
                        showIcon={false}
                        className="capitalize"
                      />
                    </td>
                    {canEdit && (
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            title="Edit"
                            onClick={() => handleEdit(egg)}
                            className="km-btn km-btn-icon km-btn-secondary h-8 w-8 !min-w-0 !p-0"
                          >
                            <Icon name="edit" className="text-[16px]" />
                          </button>
                          <button
                            title="Hapus"
                            onClick={() => setDeleteConfirm(egg)}
                            className="km-btn km-btn-icon km-btn-danger h-8 w-8 !min-w-0 !p-0"
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
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Hapus Data Telur"
        description={`Apakah Anda yakin ingin menghapus data telur ID ${deleteConfirm?.id}? Data yang dihapus tidak dapat dikembalikan.`}
        confirmLabel="Hapus Data"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={isDeleting}
      />
    </div>
  );
}
