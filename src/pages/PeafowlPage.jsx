import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import FormField, { FormGrid } from "../components/FormField.jsx";
import StatusBadge, { getBirdStatusVariant } from "../components/StatusBadge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Icon from "../components/Icon.jsx";
import { ROLES, makeId } from "../data/constants.js";

export default function PeafowlPage({ role, peafowl, setPeafowl }) {
  const [formData, setFormData] = useState({
    nama: "",
    jenisKelamin: "Belum diketahui",
    varietas: "Merak Hijau",
    tanggalLahir: "",
    asal: "Tetas Inkubator",
    ayahId: "",
    ibuId: "",
    eggId: "",
    kandang: "",
    status: "Anakan",
    catatan: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const canEdit = ROLES[role].canManagePeafowl;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canEdit) return;

    if (editingId) {
      setPeafowl((curr) =>
        curr.map((bird) => (bird.id === editingId ? { ...bird, ...formData } : bird))
      );
      setEditingId(null);
    } else {
      setPeafowl((curr) => [{ id: makeId("MRK"), ...formData }, ...curr]);
    }

    setFormData({
      nama: "",
      jenisKelamin: "Belum diketahui",
      varietas: "Merak Hijau",
      tanggalLahir: "",
      asal: "Tetas Inkubator",
      ayahId: "",
      ibuId: "",
      eggId: "",
      kandang: "",
      status: "Anakan",
      catatan: "",
    });
  };

  const handleEdit = (bird) => {
    if (!canEdit) return;
    setFormData(bird);
    setEditingId(bird.id);
  };

  const handleDelete = () => {
    if (!canEdit || !deleteConfirm) return;
    setPeafowl((curr) => curr.filter((bird) => bird.id !== deleteConfirm));
    setDeleteConfirm(null);
  };

  if (!ROLES[role].allowed.includes("merak")) {
    return <AccessDenied role={role} feature="Data Merak & Silsilah" />;
  }

  return (
    <div className="page-content space-y-6">
      <PageHeader
        eyebrow="Manajemen Populasi"
        title="Data Merak & Silsilah"
        description="Kelola data indukan, anakan hasil tetas, posisi kandang, dan silsilah genetik populasi merak."
      />

      <RoleNotice role={role} />

      {canEdit && (
        <SectionCard title={editingId ? "Edit Data Merak" : "Pendaftaran Merak Baru"}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormGrid cols={3}>
              <FormField label="Nama / Panggilan" htmlFor="nama" required>
                <input
                  id="nama"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="km-input"
                />
              </FormField>
              <FormField label="Jenis Kelamin" htmlFor="jenisKelamin" required>
                <select
                  id="jenisKelamin"
                  required
                  value={formData.jenisKelamin}
                  onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                  className="km-input"
                >
                  <option value="Jantan">Jantan</option>
                  <option value="Betina">Betina</option>
                  <option value="Belum diketahui">Belum diketahui</option>
                </select>
              </FormField>
              <FormField label="Varietas" htmlFor="varietas" required>
                <select
                  id="varietas"
                  required
                  value={formData.varietas}
                  onChange={(e) => setFormData({ ...formData, varietas: e.target.value })}
                  className="km-input"
                >
                  <option value="Merak Hijau">Merak Hijau</option>
                  <option value="Merak Biru">Merak Biru</option>
                  <option value="Merak Putih">Merak Putih</option>
                </select>
              </FormField>
              <FormField label="Status" htmlFor="status" required>
                <select
                  id="status"
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="km-input"
                >
                  <option value="Indukan">Indukan</option>
                  <option value="Anakan">Anakan</option>
                  <option value="Remaja">Remaja</option>
                  <option value="Terjual">Terjual</option>
                  <option value="Mati">Mati</option>
                </select>
              </FormField>
              <FormField label="Asal" htmlFor="asal" required>
                <select
                  id="asal"
                  required
                  value={formData.asal}
                  onChange={(e) => setFormData({ ...formData, asal: e.target.value })}
                  className="km-input"
                >
                  <option value="Tetas Inkubator">Tetas Inkubator Internal</option>
                  <option value="Indukan">Bawaan Awal (Foundation)</option>
                  <option value="Pembelian">Pembelian Luar</option>
                </select>
              </FormField>
              <FormField label="Tanggal Lahir / Tetas" htmlFor="tanggalLahir" required>
                <input
                  id="tanggalLahir"
                  type="date"
                  required
                  value={formData.tanggalLahir}
                  onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                  className="km-input font-mono text-sm"
                />
              </FormField>
              
              <FormField label="ID Ayah" htmlFor="ayahId" hint="Biarkan kosong jika tidak tahu">
                <input
                  id="ayahId"
                  value={formData.ayahId}
                  onChange={(e) => setFormData({ ...formData, ayahId: e.target.value })}
                  className="km-input font-mono text-sm uppercase"
                />
              </FormField>
              <FormField label="ID Ibu" htmlFor="ibuId" hint="Biarkan kosong jika tidak tahu">
                <input
                  id="ibuId"
                  value={formData.ibuId}
                  onChange={(e) => setFormData({ ...formData, ibuId: e.target.value })}
                  className="km-input font-mono text-sm uppercase"
                />
              </FormField>
              <FormField label="ID Telur Asal" htmlFor="eggId" hint="Keterkaitan histori inkubator">
                <input
                  id="eggId"
                  value={formData.eggId}
                  onChange={(e) => setFormData({ ...formData, eggId: e.target.value })}
                  className="km-input font-mono text-sm uppercase"
                />
              </FormField>
            </FormGrid>

            <FormGrid cols={2}>
              <FormField label="Lokasi Kandang" htmlFor="kandang" required>
                <input
                  id="kandang"
                  required
                  value={formData.kandang}
                  onChange={(e) => setFormData({ ...formData, kandang: e.target.value })}
                  className="km-input font-mono uppercase"
                  placeholder="Misal: KDG-A"
                />
              </FormField>
              <FormField label="Catatan Tambahan" htmlFor="catatan">
                <input
                  id="catatan"
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="km-input"
                />
              </FormField>
            </FormGrid>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="km-btn km-btn-primary">
                {editingId ? "Simpan Perubahan" : "Daftarkan Merak"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      nama: "",
                      jenisKelamin: "Belum diketahui",
                      varietas: "Merak Hijau",
                      tanggalLahir: "",
                      asal: "Tetas Inkubator",
                      ayahId: "",
                      ibuId: "",
                      eggId: "",
                      kandang: "",
                      status: "Anakan",
                      catatan: "",
                    });
                  }}
                  className="km-btn km-btn-secondary"
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title="Direktori Populasi Merak" noPadding>
        {peafowl.length === 0 ? (
          <EmptyState title="Belum ada data merak terdaftar" />
        ) : (
          <div className="overflow-x-auto">
            <table className="km-table min-w-[900px]">
              <thead>
                <tr>
                  <th>IDENTITAS & NAMA</th>
                  <th>KLASIFIKASI</th>
                  <th>KANDANG</th>
                  <th>SILSILAH (AYAH & IBU)</th>
                  <th>STATUS</th>
                  {canEdit && <th className="text-right">AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {peafowl.map((bird) => (
                  <tr key={bird.id}>
                    <td>
                      <p className="font-body font-bold text-ink-primary">{bird.nama}</p>
                      <p className="font-mono text-[11px] text-ink-secondary mt-0.5">{bird.id}</p>
                    </td>
                    <td>
                      <p className="font-body text-sm">{bird.varietas}</p>
                      <p className="font-body text-xs text-ink-secondary mt-0.5">{bird.jenisKelamin}</p>
                    </td>
                    <td>
                      <span className="font-mono text-sm font-semibold text-ink-primary">{bird.kandang}</span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs text-ink-secondary">
                          A: {bird.ayahId || "-"}
                        </span>
                        <span className="font-mono text-xs text-ink-secondary">
                          I: {bird.ibuId || "-"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge
                        label={bird.status}
                        variant={getBirdStatusVariant(bird.status)}
                        showIcon={false}
                      />
                    </td>
                    {canEdit && (
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            title="Edit"
                            onClick={() => handleEdit(bird)}
                            className="km-btn km-btn-icon km-btn-secondary h-8 w-8 !min-w-0 !p-0"
                          >
                            <Icon name="edit" className="text-[16px]" />
                          </button>
                          <button
                            title="Hapus"
                            onClick={() => setDeleteConfirm(bird.id)}
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
        title="Hapus Data Merak"
        description={`Apakah Anda yakin ingin menghapus data merak ID ${deleteConfirm}?`}
        confirmLabel="Hapus Data"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
