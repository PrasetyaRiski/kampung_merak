import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import FormField, { FormGrid } from "../components/FormField.jsx";
import StatusBadge, { getFertilitasVariant, getEggStatusVariant } from "../components/StatusBadge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Icon from "../components/Icon.jsx";
import { ROLES, makeId } from "../data/constants.js";

export default function EggPage({ role, eggs, setEggs }) {
  const [formData, setFormData] = useState({
    slot: "",
    tanggalBertelur: "",
    tanggalMasuk: "",
    estimasiMenetas: "",
    fertilitas: "belum dicek",
    akhir: "proses",
    varietas: "Merak Hijau",
    indukJantanId: "",
    indukBetinaId: "",
    catatan: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const canEdit = ROLES[role].canEditEggs;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canEdit) return;

    if (editingId) {
      setEggs((curr) => curr.map((egg) => (egg.id === editingId ? { ...egg, ...formData } : egg)));
      setEditingId(null);
    } else {
      setEggs((curr) => [{ id: makeId("EGG"), ...formData }, ...curr]);
    }

    setFormData({
      slot: "",
      tanggalBertelur: "",
      tanggalMasuk: "",
      estimasiMenetas: "",
      fertilitas: "belum dicek",
      akhir: "proses",
      varietas: "Merak Hijau",
      indukJantanId: "",
      indukBetinaId: "",
      catatan: "",
    });
  };

  const handleEdit = (egg) => {
    if (!canEdit) return;
    setFormData(egg);
    setEditingId(egg.id);
  };

  const handleDelete = () => {
    if (!canEdit || !deleteConfirm) return;
    setEggs((curr) => curr.filter((egg) => egg.id !== deleteConfirm));
    setDeleteConfirm(null);
  };

  if (!ROLES[role].allowed.includes("telur")) {
    return <AccessDenied role={role} feature="Manajemen Data Telur" />;
  }

  return (
    <div className="page-content space-y-6">
      <PageHeader
        eyebrow="Manajemen Data"
        title="Data Telur Inkubator"
        description="Kelola slot nampan, status fertilitas hasil candling, dan status akhir penetasan."
      />

      <RoleNotice role={role} />

      {canEdit && (
        <SectionCard title={editingId ? "Edit Data Telur" : "Tambah Data Telur"}>
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
                  onChange={(e) => setFormData({ ...formData, slot: e.target.value })}
                  className="km-input font-mono"
                />
              </FormField>
              <FormField label="Varietas" htmlFor="varietas" required>
                <select
                  id="varietas"
                  required
                  value={formData.varietas}
                  onChange={(e) => setFormData({ ...formData, varietas: e.target.value })}
                  className="km-input"
                >
                  <option value="Merak Hijau">Merak Hijau (Pavo muticus)</option>
                  <option value="Merak Biru">Merak Biru (Pavo cristatus)</option>
                </select>
              </FormField>
              <FormField label="Fertilitas" htmlFor="fertilitas" required>
                <select
                  id="fertilitas"
                  required
                  value={formData.fertilitas}
                  onChange={(e) => setFormData({ ...formData, fertilitas: e.target.value })}
                  className="km-input"
                >
                  <option value="belum dicek">Belum Dicek</option>
                  <option value="fertil">Fertil</option>
                  <option value="infertil">Infertil / Kosong</option>
                </select>
              </FormField>
              
              <FormField label="Tgl Bertelur" htmlFor="tanggalBertelur" required>
                <input
                  id="tanggalBertelur"
                  type="date"
                  required
                  value={formData.tanggalBertelur}
                  onChange={(e) => setFormData({ ...formData, tanggalBertelur: e.target.value })}
                  className="km-input font-mono text-sm"
                />
              </FormField>
              <FormField label="Tgl Masuk Inkubator" htmlFor="tanggalMasuk" required>
                <input
                  id="tanggalMasuk"
                  type="date"
                  required
                  value={formData.tanggalMasuk}
                  onChange={(e) => setFormData({ ...formData, tanggalMasuk: e.target.value })}
                  className="km-input font-mono text-sm"
                />
              </FormField>
              <FormField label="Estimasi Menetas" htmlFor="estimasiMenetas">
                <input
                  id="estimasiMenetas"
                  type="date"
                  value={formData.estimasiMenetas}
                  onChange={(e) => setFormData({ ...formData, estimasiMenetas: e.target.value })}
                  className="km-input font-mono text-sm"
                />
              </FormField>
              
              <FormField label="ID Induk Jantan" htmlFor="indukJantanId">
                <input
                  id="indukJantanId"
                  value={formData.indukJantanId}
                  onChange={(e) => setFormData({ ...formData, indukJantanId: e.target.value })}
                  className="km-input font-mono text-sm uppercase"
                  placeholder="Opsional"
                />
              </FormField>
              <FormField label="ID Induk Betina" htmlFor="indukBetinaId">
                <input
                  id="indukBetinaId"
                  value={formData.indukBetinaId}
                  onChange={(e) => setFormData({ ...formData, indukBetinaId: e.target.value })}
                  className="km-input font-mono text-sm uppercase"
                  placeholder="Opsional"
                />
              </FormField>
              <FormField label="Status Akhir" htmlFor="akhir" required>
                <select
                  id="akhir"
                  required
                  value={formData.akhir}
                  onChange={(e) => setFormData({ ...formData, akhir: e.target.value })}
                  className="km-input"
                >
                  <option value="proses">Dalam Proses</option>
                  <option value="menetas">Berhasil Menetas</option>
                  <option value="gagal_tetas">Gagal Menetas</option>
                  <option value="dibuang">Dibuang (Infertil)</option>
                </select>
              </FormField>
            </FormGrid>

            <FormField label="Catatan Tambahan" htmlFor="catatan">
              <input
                id="catatan"
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                className="km-input"
                placeholder="Misal: Posisi retak sedikit, dll"
              />
            </FormField>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="km-btn km-btn-primary">
                {editingId ? "Simpan Perubahan" : "Tambah Data"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      slot: "",
                      tanggalBertelur: "",
                      tanggalMasuk: "",
                      estimasiMenetas: "",
                      fertilitas: "belum dicek",
                      akhir: "proses",
                      varietas: "Merak Hijau",
                      indukJantanId: "",
                      indukBetinaId: "",
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

      <SectionCard title="Daftar Telur Terdaftar" noPadding>
        {eggs.length === 0 ? (
          <EmptyState title="Belum ada data telur" />
        ) : (
          <div className="overflow-x-auto">
            <table className="km-table min-w-[800px]">
              <thead>
                <tr>
                  <th>ID TELUR / SLOT</th>
                  <th>VARIETAS</th>
                  <th>TIMELINE</th>
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
                    <td className="font-body font-medium">{egg.varietas}</td>
                    <td>
                      <p className="font-mono text-xs">Masuk: {egg.tanggalMasuk}</p>
                      <p className="font-mono text-xs text-ink-secondary mt-0.5">
                        Menetas: {egg.estimasiMenetas || "-"}
                      </p>
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
                        label={egg.akhir.replace("_", " ")}
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
                            onClick={() => setDeleteConfirm(egg.id)}
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
        description={`Apakah Anda yakin ingin menghapus data telur ID ${deleteConfirm}? Data yang dihapus tidak dapat dikembalikan.`}
        confirmLabel="Hapus Data"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
