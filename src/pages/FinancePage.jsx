import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import FormField, { FormGrid } from "../components/FormField.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Icon from "../components/Icon.jsx";
import { ROLES, makeId, formatCurrency } from "../data/constants.js";
import { fetchApi } from "../utils/api.js";

export default function FinancePage({ role, finance, setFinance }) {
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    tipe: "Pemasukan",
    kategori: "Penjualan Telur",
    jumlah: 0,
    catatan: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFinanceDetail, setSelectedFinanceDetail] = useState(null);
  const [isLoadingFinanceDetail, setIsLoadingFinanceDetail] = useState(false);

  const canEdit = ROLES[role].canManageSales;

  if (!ROLES[role].allowed.includes("finance")) {
    return <AccessDenied role={role} feature="Pencatatan Keuangan" />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canEdit) return;

    if (editingId) {
      setFinance((curr) =>
        curr.map((fin) => (fin.id === editingId ? { ...fin, ...formData } : fin))
      );
      setEditingId(null);
    } else {
      const newId = makeId("FIN");
      setFinance((curr) => [{ id: newId, ...formData }, ...curr]);
    }

    setFormData({
      tanggal: new Date().toISOString().split("T")[0],
      tipe: "Pemasukan",
      kategori: "Penjualan Telur",
      jumlah: 0,
      catatan: "",
    });
    setShowAddModal(false);
  };

  const handleEdit = (fin) => {
    if (!canEdit) return;
    setFormData(fin);
    setEditingId(fin.id);
    setShowAddModal(true);
  };

  const handleDelete = () => {
    if (!canEdit || !deleteConfirm) return;
    setFinance((curr) => curr.filter((fin) => fin.id !== deleteConfirm));
    setDeleteConfirm(null);
  };

  const handleViewFinanceDetail = async (financeId) => {
    setIsLoadingFinanceDetail(true);
    try {
      const data = await fetchApi(`/api/finance/${financeId}`);
      setSelectedFinanceDetail(data);
    } catch (err) {
      alert("Gagal memuat detail transaksi: " + err.message);
    } finally {
      setIsLoadingFinanceDetail(false);
    }
  };

  const totalPemasukan = finance
    .filter((f) => f.tipe === "Pemasukan")
    .reduce((sum, f) => sum + Number(f.jumlah), 0);

  const totalPengeluaran = finance
    .filter((f) => f.tipe === "Pengeluaran")
    .reduce((sum, f) => sum + Number(f.jumlah), 0);

  const saldoBersih = totalPemasukan - totalPengeluaran;

  return (
    <div className="page-content space-y-8 select-none">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          eyebrow="Manajemen Bisnis"
          title="Arus Kas & Keuangan"
          description="Kelola data transaksi pemasukan dan pengeluaran operasional inkubator merak."
        />
        {canEdit && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                tanggal: new Date().toISOString().split("T")[0],
                tipe: "Pemasukan",
                kategori: "Penjualan Telur",
                jumlah: 0,
                catatan: "",
              });
              setShowAddModal(true);
            }}
            className="km-btn km-btn-primary flex items-center gap-2"
          >
            <Icon name="add" className="text-[18px]" />
            Catat Transaksi Baru
          </button>
        )}
      </div>

      <RoleNotice role={role} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="km-card p-5 bg-surface border-l-4 border-l-status-success">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-status-success">Total Pemasukan</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-ink-primary">{formatCurrency(totalPemasukan)}</p>
          <p className="mt-0.5 font-body text-xs text-ink-secondary">Akumulasi seluruh pemasukan</p>
        </div>
        <div className="km-card p-5 bg-surface border-l-4 border-l-status-danger">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-status-danger">Total Pengeluaran</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-ink-primary">{formatCurrency(totalPengeluaran)}</p>
          <p className="mt-0.5 font-body text-xs text-ink-secondary">Akumulasi seluruh pengeluaran</p>
        </div>
        <div className="km-card p-5 bg-surface border-l-4 border-l-teal-iridescence">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-teal-iridescence">Saldo Bersih</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-ink-primary">{formatCurrency(saldoBersih)}</p>
          <p className="mt-0.5 font-body text-xs text-ink-secondary">Pemasukan dikurangi pengeluaran</p>
        </div>
      </div>

      <SectionCard title="Daftar Transaksi Keuangan" noPadding>
        <div className="overflow-x-auto">
          <table className="km-table min-w-[900px]">
            <thead>
              <tr>
                <th>TANGGAL</th>
                <th>TIPE</th>
                <th>KATEGORI</th>
                <th>JUMLAH</th>
                <th>CATATAN</th>
                <th className="text-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {finance.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12">
                    <EmptyState
                      icon="account_balance_wallet"
                      title="Belum ada transaksi"
                      desc="Catatan keuangan masih kosong."
                    />
                  </td>
                </tr>
              ) : (
                finance.map((fin) => (
                  <tr key={fin.id} className="hover:bg-alpine-low/30 transition-colors">
                    <td>
                      <span className="font-mono text-sm font-semibold text-ink-primary">
                        {fin.tanggal}
                      </span>
                    </td>
                    <td>
                      <StatusBadge
                        label={fin.tipe}
                        variant={fin.tipe === "Pemasukan" ? "success" : "danger"}
                        icon={fin.tipe === "Pemasukan" ? "arrow_downward" : "arrow_upward"}
                      />
                    </td>
                    <td>
                      <span className="font-body text-sm font-medium">{fin.kategori}</span>
                    </td>
                    <td>
                      <span className="font-mono text-sm font-semibold">{formatCurrency(fin.jumlah)}</span>
                    </td>
                    <td>
                      <span className="font-body text-sm text-ink-secondary max-w-[200px] truncate block" title={fin.catatan}>
                        {fin.catatan || "-"}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewFinanceDetail(fin.id)}
                          className="p-1.5 rounded-lg text-ink-outline hover:text-teal-iridescence hover:bg-teal-iridescence/10 transition-colors"
                          title="Lihat Detail Transaksi"
                        >
                          <Icon name="visibility" className="text-[18px]" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleEdit(fin)}
                              className="p-1.5 rounded-lg text-ink-outline hover:text-teal-iridescence hover:bg-teal-iridescence/10 transition-colors"
                              title="Edit Transaksi"
                            >
                              <Icon name="edit" className="text-[18px]" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(fin.id)}
                              className="p-1.5 rounded-lg text-ink-outline hover:text-status-danger hover:bg-status-danger/10 transition-colors"
                              title="Hapus Transaksi"
                            >
                              <Icon name="delete" className="text-[18px]" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-surface border border-alpine-high shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-alpine-high px-6 py-4">
              <h3 className="font-display text-lg font-bold text-ink-primary">
                {editingId ? "Edit Transaksi" : "Catat Transaksi Baru"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-ink-outline hover:text-ink-primary transition-colors"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 custom-scrollbar">
              <form id="finance-form" onSubmit={handleSubmit} className="space-y-6">
                <FormGrid>
                  <FormField label="Tanggal Transaksi">
                    <input
                      type="date"
                      required
                      className="km-input"
                      value={formData.tanggal}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Tipe Transaksi">
                    <select
                      className="km-input"
                      value={formData.tipe}
                      onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
                    >
                      <option value="Pemasukan">Pemasukan</option>
                      <option value="Pengeluaran">Pengeluaran</option>
                    </select>
                  </FormField>
                </FormGrid>

                <FormGrid>
                  <FormField label="Kategori">
                    <select
                      className="km-input"
                      value={formData.kategori}
                      onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    >
                      {formData.tipe === "Pemasukan" ? (
                        <>
                          <option value="Penjualan Telur">Penjualan Telur</option>
                          <option value="Penjualan Anakan">Penjualan Anakan</option>
                          <option value="Lainnya">Lainnya</option>
                        </>
                      ) : (
                        <>
                          <option value="Pakan Burung">Pakan Burung</option>
                          <option value="Operasional Inkubator">Operasional Inkubator</option>
                          <option value="Perawatan">Perawatan</option>
                          <option value="Lainnya">Lainnya</option>
                        </>
                      )}
                    </select>
                  </FormField>
                  <FormField label="Jumlah (Rp)">
                    <input
                      type="number"
                      required
                      min="0"
                      className="km-input font-mono"
                      value={formData.jumlah}
                      onChange={(e) => setFormData({ ...formData, jumlah: Number(e.target.value) })}
                    />
                  </FormField>
                </FormGrid>

                <FormField label="Catatan (Opsional)">
                  <textarea
                    className="km-input custom-scrollbar resize-none"
                    rows="2"
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    placeholder="Contoh: Pembelian pakan merk A"
                  />
                </FormField>
              </form>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-alpine-high bg-alpine-low p-6">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="km-btn bg-alpine-high text-ink-primary hover:bg-alpine-high/80"
              >
                Batal
              </button>
              <button type="submit" form="finance-form" className="km-btn km-btn-primary">
                Simpan Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Hapus Transaksi?"
          desc="Apakah Anda yakin ingin menghapus data transaksi ini? Data yang dihapus tidak dapat dikembalikan."
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          confirmText="Ya, Hapus"
          cancelText="Batal"
        />
      )}

      {/* Modal Detail Transaksi Keuangan (GET /api/finance/{finance_id}) */}
      {selectedFinanceDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedFinanceDetail(null)}>
          <div className="w-full max-w-md km-card bg-surface border border-alpine-high shadow-2xl p-6 relative select-text" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-alpine-high pb-4 mb-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-teal-iridescence">Detail Pembukuan Kas</span>
                <h3 className="font-display text-xl font-bold text-ink-primary mt-0.5">{selectedFinanceDetail.id}</h3>
              </div>
              <button onClick={() => setSelectedFinanceDetail(null)} className="p-1 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-alpine-low transition-colors">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <div className={`p-4 rounded-xl border text-center mb-4 ${
              selectedFinanceDetail.tipe === "Pemasukan"
                ? "bg-status-success/5 border-status-success/30 text-status-success"
                : "bg-status-danger/5 border-status-danger/30 text-status-danger"
            }`}>
              <p className="font-mono text-[10px] uppercase font-bold tracking-widest">{selectedFinanceDetail.tipe}</p>
              <p className="font-display text-3xl font-extrabold mt-1">
                {formatCurrency(selectedFinanceDetail.jumlah)}
              </p>
            </div>

            <div className="space-y-2.5 text-xs font-body divide-y divide-alpine-high">
              <div className="flex justify-between pt-2">
                <span className="text-ink-secondary">Kategori:</span>
                <span className="font-semibold text-ink-primary">{selectedFinanceDetail.kategori}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-ink-secondary">Tanggal:</span>
                <span className="font-mono font-semibold text-ink-primary">{selectedFinanceDetail.tanggal}</span>
              </div>
              {selectedFinanceDetail.created_by && (
                <div className="flex justify-between pt-2">
                  <span className="text-ink-secondary">Dicatat Oleh:</span>
                  <span className="font-mono font-semibold text-ink-primary">{selectedFinanceDetail.created_by}</span>
                </div>
              )}
              {selectedFinanceDetail.catatan && (
                <div className="flex flex-col gap-1 pt-2">
                  <span className="text-ink-secondary">Catatan:</span>
                  <p className="font-body text-ink-primary bg-alpine-low p-2.5 rounded-lg border border-alpine-high leading-relaxed">{selectedFinanceDetail.catatan}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button className="km-btn km-btn-secondary km-btn-sm" onClick={() => setSelectedFinanceDetail(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
