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
  nama: "",
  jenis_kelamin: "Jantan",
  generasi: "F0",
  varian_warna: "Hijau",
  asal: "Tangkaran sendiri",
  status: "breeding",
  tanggal_lahir: "",
  parent_jantan_id: "",
  parent_betina_id: "",
  foto_url: "",
};

function formatTimeAgo(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} jam lalu`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function getStatusVariant(status) {
  if (status === "breeding") return "success";
  if (status === "retired") return "warning";
  if (status === "sold") return "info";
  if (status === "deceased") return "danger";
  return "neutral";
}

function generateBreederId(generasi, parentJantanId, existingBreeders) {
  const prefix = `MRK-${generasi}`;
  // Count existing breeders with same generasi to get next number
  const sameGen = existingBreeders.filter((b) => b.id.startsWith(prefix));
  const nextNum = String(sameGen.length + 1).padStart(3, "0");
  const baseId = `${prefix}-${nextNum}`;
  // Append parent jantan ID for lineage if provided
  if (parentJantanId) {
    return `${baseId}-${parentJantanId}`;
  }
  return baseId;
}

export default function BreedersPage({ role }) {
  const [breeders, setBreeders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lineageData, setLineageData] = useState(null);
  const [isLoadingLineage, setIsLoadingLineage] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);

  const canEdit = ROLES[role]?.canManagePeafowl;

  if (!ROLES[role]?.allowed.includes("indukan")) {
    return <AccessDenied role={role} feature="Data Indukan" />;
  }

  useEffect(() => {
    loadBreeders();
  }, []);

  const loadBreeders = async () => {
    try {
      setLoading(true);
      const data = await fetchApi("/api/breeders");
      setBreeders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError("Gagal memuat data indukan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const jantanList = breeders.filter((b) => b.jenis_kelamin === "Jantan" || b.jenis_kelamin === "jantan");
  const betinaList = breeders.filter((b) => b.jenis_kelamin === "Betina" || b.jenis_kelamin === "betina");

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    setIsSaving(true);

    try {
      if (editingId) {
        // Update
        const payload = { ...formData, id: editingId };
        if (!payload.parent_jantan_id) payload.parent_jantan_id = null;
        if (!payload.parent_betina_id) payload.parent_betina_id = null;
        if (!payload.tanggal_lahir) payload.tanggal_lahir = null;
        if (!payload.foto_url) payload.foto_url = null;

        const updated = await fetchApi(`/api/breeders/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setBreeders((curr) => curr.map((b) => (b.id === editingId ? updated : b)));
        setEditingId(null);
      } else {
        // Create
        const newId = generateBreederId(formData.generasi, formData.parent_jantan_id, breeders);
        const payload = { ...formData, id: newId };
        if (!payload.parent_jantan_id) payload.parent_jantan_id = null;
        if (!payload.parent_betina_id) payload.parent_betina_id = null;
        if (!payload.tanggal_lahir) payload.tanggal_lahir = null;
        if (!payload.foto_url) payload.foto_url = null;

        const created = await fetchApi("/api/breeders", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setBreeders((curr) => [created, ...curr]);
      }
      setFormData({ ...EMPTY_FORM });
    } catch (err) {
      alert("Gagal menyimpan data: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (breeder) => {
    if (!canEdit) return;
    setFormData({
      nama: breeder.nama || "",
      jenis_kelamin: breeder.jenis_kelamin || "Jantan",
      generasi: breeder.generasi || "F0",
      varian_warna: breeder.varian_warna || "Hijau",
      asal: breeder.asal || "Tangkaran sendiri",
      status: breeder.status || "breeding",
      tanggal_lahir: breeder.tanggal_lahir || "",
      parent_jantan_id: breeder.parent_jantan_id || "",
      parent_betina_id: breeder.parent_betina_id || "",
      foto_url: breeder.foto_url || "",
    });
    setEditingId(breeder.id);
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
      await fetchApi(`/api/breeders/${deleteConfirm.id}`, { method: "DELETE" });
      setBreeders((curr) => curr.filter((b) => b.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      alert("Gagal menghapus data: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewLineage = async (breederId) => {
    setIsLoadingLineage(true);
    try {
      const data = await fetchApi(`/api/breeders/${breederId}/lineage`);
      setLineageData(data);
    } catch (err) {
      alert("Gagal memuat data silsilah: " + err.message);
    } finally {
      setIsLoadingLineage(false);
    }
  };

  const toggleCompareId = (id) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCompare = async () => {
    if (compareIds.length < 2) {
      alert("Pilih minimal 2 indukan untuk dibandingkan.");
      return;
    }
    setIsLoadingCompare(true);
    try {
      const data = await fetchApi(`/api/breeders/compare?ids=${compareIds.join(",")}`);
      setCompareData(data);
    } catch (err) {
      alert("Gagal memuat data perbandingan: " + err.message);
    } finally {
      setIsLoadingCompare(false);
    }
  };

  return (
    <div className="page-content space-y-6">
      <PageHeader
        eyebrow="Manajemen Populasi"
        title="Data Indukan & Silsilah"
        description="Kelola data indukan merak, generasi, varian warna, dan silsilah genetik. Terhubung langsung ke database."
      />

      <RoleNotice role={role} />

      {/* ── Form Input ── */}
      {canEdit && (
        <SectionCard title={editingId ? `Edit Indukan: ${editingId}` : "Pendaftaran Indukan Baru"}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormGrid cols={3}>
              <FormField label="Nama / Panggilan" htmlFor="b-nama">
                <input
                  id="b-nama"
                  value={formData.nama}
                  onChange={(e) => handleChange("nama", e.target.value)}
                  className="km-input"
                  placeholder="Contoh: Arjuna"
                />
              </FormField>
              <FormField label="Jenis Kelamin" htmlFor="b-jk" required>
                <select id="b-jk" required value={formData.jenis_kelamin} onChange={(e) => handleChange("jenis_kelamin", e.target.value)} className="km-input">
                  <option value="Jantan">Jantan</option>
                  <option value="Betina">Betina</option>
                </select>
              </FormField>
              <FormField label="Generasi" htmlFor="b-gen" required>
                <select id="b-gen" required value={formData.generasi} onChange={(e) => handleChange("generasi", e.target.value)} className="km-input">
                  <option value="F0">F0 (Foundation)</option>
                  <option value="F1">F1</option>
                  <option value="F2">F2</option>
                  <option value="F3">F3</option>
                </select>
              </FormField>
              <FormField label="Varian Warna" htmlFor="b-warna" required>
                <select id="b-warna" required value={formData.varian_warna} onChange={(e) => handleChange("varian_warna", e.target.value)} className="km-input">
                  <option value="Hijau">Merak Hijau</option>
                  <option value="Biru">Merak Biru</option>
                  <option value="Putih">Merak Putih</option>
                </select>
              </FormField>
              <FormField label="Asal" htmlFor="b-asal" required>
                <select id="b-asal" required value={formData.asal} onChange={(e) => handleChange("asal", e.target.value)} className="km-input">
                  <option value="Tangkaran sendiri">Tangkaran Sendiri</option>
                  <option value="Pembelian">Pembelian</option>
                  <option value="Hibah">Hibah</option>
                </select>
              </FormField>
              <FormField label="Status" htmlFor="b-status" required>
                <select id="b-status" required value={formData.status} onChange={(e) => handleChange("status", e.target.value)} className="km-input">
                  <option value="breeding">Breeding (Aktif)</option>
                  <option value="retired">Retired</option>
                  <option value="sold">Terjual</option>
                  <option value="deceased">Mati</option>
                </select>
              </FormField>
              <FormField label="Tanggal Lahir" htmlFor="b-tgl">
                <input id="b-tgl" type="date" value={formData.tanggal_lahir} onChange={(e) => handleChange("tanggal_lahir", e.target.value)} className="km-input font-mono text-sm" />
              </FormField>
              <FormField label="Parent Jantan" htmlFor="b-pj">
                <select id="b-pj" value={formData.parent_jantan_id} onChange={(e) => handleChange("parent_jantan_id", e.target.value)} className="km-input">
                  <option value="">— Tidak ada —</option>
                  {jantanList.map((j) => (
                    <option key={j.id} value={j.id}>{j.id} — {j.nama || "Tanpa nama"}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Parent Betina" htmlFor="b-pb">
                <select id="b-pb" value={formData.parent_betina_id} onChange={(e) => handleChange("parent_betina_id", e.target.value)} className="km-input">
                  <option value="">— Tidak ada —</option>
                  {betinaList.map((b) => (
                    <option key={b.id} value={b.id}>{b.id} — {b.nama || "Tanpa nama"}</option>
                  ))}
                </select>
              </FormField>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <FormField label="Foto URL" htmlFor="b-foto">
                  <input
                    id="b-foto"
                    type="url"
                    value={formData.foto_url}
                    onChange={(e) => handleChange("foto_url", e.target.value)}
                    className="km-input"
                    placeholder="Contoh: https://domain-anda.com/foto-merak.jpg"
                  />
                </FormField>
              </div>
            </FormGrid>

            {/* Preview generated ID */}
            {!editingId && (
              <div className="rounded-lg border border-dashed border-alpine-high bg-alpine-low/30 px-4 py-2.5 text-sm text-ink-secondary flex items-center gap-2">
                <Icon name="fingerprint" className="text-[18px] text-teal-600" />
                <span>ID akan di-generate: <strong className="font-mono text-ink-primary">{generateBreederId(formData.generasi, formData.parent_jantan_id, breeders)}</strong></span>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="km-btn km-btn-secondary">Batal Edit</button>
              )}
              <button type="submit" className="km-btn km-btn-primary" disabled={isSaving}>
                {isSaving ? <Icon name="sync" className="animate-spin text-[18px]" /> : editingId ? "Simpan Perubahan" : "Daftarkan Indukan"}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* ── Tabel Data ── */}
      <SectionCard
        title={`Daftar Indukan (${breeders.length})`}
        noPadding
        action={
          compareIds.length >= 2 ? (
            <button
              onClick={handleCompare}
              disabled={isLoadingCompare}
              className="km-btn km-btn-primary km-btn-sm gap-1.5"
            >
              <Icon name="compare" className="text-[16px]" />
              {isLoadingCompare ? "Memuat..." : `Bandingkan (${compareIds.length})`}
            </button>
          ) : compareIds.length === 1 ? (
            <span className="font-body text-xs text-ink-secondary">Pilih 1 lagi untuk membandingkan</span>
          ) : (
            <span className="font-body text-xs text-ink-secondary">Centang indukan untuk membandingkan</span>
          )
        }
      >
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-ink-outline">Memuat data indukan...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : breeders.length === 0 ? (
            <EmptyState icon="pets" title="Belum Ada Data Indukan" description="Tambahkan data indukan merak pertama Anda menggunakan form di atas." />
          ) : (
            <table className="km-table min-w-[950px]">
              <thead>
                <tr>
                  <th className="w-8"><Icon name="check_box" className="text-[16px] text-ink-outline" /></th>
                  <th className="w-12">FOTO</th>
                  <th>ID SILSILAH</th>
                  <th>NAMA</th>
                  <th>JK</th>
                  <th>GENERASI</th>
                  <th>VARIAN</th>
                  <th>STATUS</th>
                  <th>TERAKHIR UPDATE</th>
                  <th className="text-right">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {breeders.map((b) => (
                  <tr key={b.id} className={compareIds.includes(b.id) ? "bg-teal-iridescence/5" : ""}>
                    <td className="py-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-teal-600 cursor-pointer"
                        checked={compareIds.includes(b.id)}
                        onChange={() => toggleCompareId(b.id)}
                        title="Pilih untuk perbandingan"
                      />
                    </td>
                    <td className="py-2">
                      {b.foto_url ? (
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-alpine-high bg-alpine-low shadow-sm">
                          <img src={b.foto_url} alt={b.nama || b.id} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-alpine-high bg-alpine-low text-ink-outline">
                          <Icon name="pets" className="text-[18px]" />
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-sm font-bold text-ink-primary">{b.id}</span>
                      {(b.parent_jantan_id || b.parent_betina_id) && (
                        <div className="text-[10px] text-ink-outline mt-0.5">
                          {b.parent_jantan_id && <span>♂ {b.parent_jantan_id}</span>}
                          {b.parent_jantan_id && b.parent_betina_id && <span> × </span>}
                          {b.parent_betina_id && <span>♀ {b.parent_betina_id}</span>}
                        </div>
                      )}
                    </td>
                    <td><span className="font-body text-sm font-medium">{b.nama || "—"}</span></td>
                    <td><span className="text-sm">{b.jenis_kelamin === "Jantan" ? "♂ Jantan" : "♀ Betina"}</span></td>
                    <td><StatusBadge label={b.generasi} variant="teal" showIcon={false} /></td>
                    <td><span className="text-sm">{b.varian_warna}</span></td>
                    <td><StatusBadge label={b.status} variant={getStatusVariant(b.status)} showIcon={false} /></td>
                    <td><span className="text-xs text-ink-outline">{formatTimeAgo(b.created_at)}</span></td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="km-btn km-btn-secondary km-btn-sm !px-2"
                          onClick={() => handleViewLineage(b.id)}
                          title="Lihat Silsilah"
                        >
                          <Icon name="account_tree" className="text-[16px]" />
                        </button>
                        {canEdit && (
                          <>
                            <button className="km-btn km-btn-secondary km-btn-sm !px-2" onClick={() => handleEdit(b)} title="Edit">
                              <Icon name="edit" className="text-[16px]" />
                            </button>
                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/30 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                              onClick={() => setDeleteConfirm(b)}
                              title="Hapus"
                            >
                              <Icon name="delete" className="text-[16px]" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
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
          title="Hapus Indukan"
          message={`Apakah Anda yakin ingin menghapus data indukan ${deleteConfirm.nama || deleteConfirm.id}? Aksi ini tidak dapat dibatalkan.`}
          confirmText={isDeleting ? "Menghapus..." : "Hapus"}
          cancelText="Batal"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          isDestructive={true}
        />
      )}

      {/* Lineage Modal */}
      {(lineageData || isLoadingLineage) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-surface border border-alpine-high shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-alpine-high px-6 py-4">
              <h3 className="font-display text-lg font-bold text-ink-primary flex items-center gap-2">
                <Icon name="account_tree" /> Pohon Silsilah
              </h3>
              <button
                onClick={() => setLineageData(null)}
                className="text-ink-outline hover:text-ink-primary transition-colors"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 bg-alpine-low custom-scrollbar min-h-[400px] flex items-center justify-center">
              {isLoadingLineage ? (
                <div className="flex flex-col items-center gap-4 text-ink-secondary">
                  <Icon name="sync" className="animate-spin text-4xl" />
                  <p>Memuat data silsilah genetik...</p>
                </div>
              ) : lineageData ? (
                <div className="flex flex-col items-center gap-12 w-full max-w-2xl py-8">
                  {/* Parents Layer */}
                  <div className="flex justify-between w-full relative">
                    {/* Connecting lines for parents */}
                    <div className="absolute top-1/2 left-[25%] right-[25%] h-1/2 border-t-2 border-l-2 border-r-2 border-alpine-high rounded-t-xl -z-10 mt-16"></div>
                    <div className="absolute top-full left-1/2 w-0.5 h-12 bg-alpine-high -z-10 mt-4"></div>

                    {/* Jantan */}
                    <div className="km-card p-4 bg-surface shadow-md border border-alpine-high w-[45%] flex flex-col items-center text-center relative z-10">
                      <StatusBadge label="Induk Jantan" variant="info" icon="male" className="mb-3 w-full justify-center" />
                      {lineageData.parent_jantan ? (
                        <>
                          <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-4 border-surface shadow-sm">
                            <img 
                              src={lineageData.parent_jantan.foto_url || "/assets/placeholder-peacock.jpg"} 
                              className="w-full h-full object-cover" 
                              alt="Jantan" 
                              onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%2364748b">?</text></svg>' }}
                            />
                          </div>
                          <p className="font-display font-bold text-ink-primary">{lineageData.parent_jantan.nama || lineageData.parent_jantan.id}</p>
                          <p className="font-mono text-[10px] text-ink-secondary mt-1">{lineageData.parent_jantan.id}</p>
                          <p className="font-body text-xs text-ink-secondary mt-1">{lineageData.parent_jantan.generasi} • {lineageData.parent_jantan.varian_warna}</p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center py-6 text-ink-outline">
                          <Icon name="help_outline" className="text-3xl mb-2" />
                          <p className="text-sm">Tidak Tercatat</p>
                        </div>
                      )}
                    </div>

                    {/* Betina */}
                    <div className="km-card p-4 bg-surface shadow-md border border-alpine-high w-[45%] flex flex-col items-center text-center relative z-10">
                      <StatusBadge label="Induk Betina" variant="danger" icon="female" className="mb-3 w-full justify-center" />
                      {lineageData.parent_betina ? (
                        <>
                          <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-4 border-surface shadow-sm">
                            <img 
                              src={lineageData.parent_betina.foto_url || "/assets/placeholder-peacock.jpg"} 
                              className="w-full h-full object-cover" 
                              alt="Betina" 
                              onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%2364748b">?</text></svg>' }}
                            />
                          </div>
                          <p className="font-display font-bold text-ink-primary">{lineageData.parent_betina.nama || lineageData.parent_betina.id}</p>
                          <p className="font-mono text-[10px] text-ink-secondary mt-1">{lineageData.parent_betina.id}</p>
                          <p className="font-body text-xs text-ink-secondary mt-1">{lineageData.parent_betina.generasi} • {lineageData.parent_betina.varian_warna}</p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center py-6 text-ink-outline">
                          <Icon name="help_outline" className="text-3xl mb-2" />
                          <p className="text-sm">Tidak Tercatat</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Child Layer */}
                  <div className="km-card p-5 bg-surface shadow-lg border-2 border-teal-iridescence w-[55%] flex flex-col items-center text-center mt-4 relative z-10">
                    <StatusBadge label="Subjek Profil" variant="success" icon="pets" className="mb-4 w-full justify-center" />
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-surface shadow-sm ring-2 ring-teal-iridescence">
                      <img 
                        src={lineageData.breeder.foto_url || "/assets/placeholder-peacock.jpg"} 
                        className="w-full h-full object-cover" 
                        alt="Subjek" 
                        onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%2364748b">?</text></svg>' }}
                      />
                    </div>
                    <p className="font-display text-xl font-bold text-ink-primary">{lineageData.breeder.nama || lineageData.breeder.id}</p>
                    <p className="font-mono text-xs text-ink-secondary mt-1">{lineageData.breeder.id}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <StatusBadge label={lineageData.breeder.jenis_kelamin} variant={lineageData.breeder.jenis_kelamin === "Jantan" ? "info" : "danger"} showIcon={false} />
                      <StatusBadge label={lineageData.breeder.generasi} variant="neutral" showIcon={false} />
                      <StatusBadge label={lineageData.breeder.varian_warna} variant="neutral" showIcon={false} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {compareData && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-12 bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={() => setCompareData(null)}>
          <div className="w-full max-w-4xl km-card bg-surface border border-alpine-high shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-alpine-high flex items-center justify-between">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-teal-iridescence">Komparasi Performa</p>
                <h3 className="font-display text-xl font-bold text-ink-primary">Perbandingan Indukan</h3>
              </div>
              <button onClick={() => { setCompareData(null); setCompareIds([]); }} className="text-ink-secondary hover:text-ink-primary transition-colors">
                <Icon name="close" className="text-[22px]" />
              </button>
            </div>
            <div className="p-5 overflow-x-auto">
              <table className="km-table min-w-[600px]">
                <thead>
                  <tr>
                    <th>METRIK</th>
                    {compareData.breeders?.map((b) => (
                      <th key={b.id} className="text-center">
                        <p className="font-mono text-xs font-bold text-ink-primary">{b.id}</p>
                        <p className="font-body text-[10px] text-ink-secondary mt-0.5">{b.nama || "—"}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-body text-sm font-semibold text-ink-secondary">Jenis Kelamin</td>
                    {compareData.breeders?.map((b) => (
                      <td key={b.id} className="text-center">
                        <StatusBadge label={b.jenis_kelamin} variant={b.jenis_kelamin?.toLowerCase() === "jantan" ? "info" : "danger"} showIcon={false} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-body text-sm font-semibold text-ink-secondary">Generasi</td>
                    {compareData.breeders?.map((b) => (
                      <td key={b.id} className="text-center font-mono text-sm">{b.generasi}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-body text-sm font-semibold text-ink-secondary">Varian Warna</td>
                    {compareData.breeders?.map((b) => (
                      <td key={b.id} className="text-center font-body text-sm">{b.varian_warna}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-body text-sm font-semibold text-ink-secondary">Status</td>
                    {compareData.breeders?.map((b) => (
                      <td key={b.id} className="text-center">
                        <StatusBadge label={b.status} variant={getStatusVariant(b.status)} showIcon={false} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-body text-sm font-semibold text-ink-secondary">Total Telur</td>
                    {compareData.breeders?.map((b) => (
                      <td key={b.id} className="text-center font-mono text-lg font-bold text-teal-iridescence">{b.total_telur ?? "—"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-body text-sm font-semibold text-ink-secondary">% Telur Fertil</td>
                    {compareData.breeders?.map((b) => (
                      <td key={b.id} className="text-center font-mono text-lg font-bold text-status-success">
                        {b.persentase_fertil != null ? `${parseFloat(b.persentase_fertil).toFixed(1)}%` : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-body text-sm font-semibold text-ink-secondary">Jumlah Anakan</td>
                    {compareData.breeders?.map((b) => (
                      <td key={b.id} className="text-center font-mono text-lg font-bold text-ink-primary">{b.jumlah_anakan ?? "—"}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
