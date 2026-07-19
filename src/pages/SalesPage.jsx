import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import FormField, { FormGrid } from "../components/FormField.jsx";
import StatusBadge, { getSaleVariant } from "../components/StatusBadge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Icon from "../components/Icon.jsx";
import { ROLES, makeId, formatCurrency } from "../data/constants.js";

export default function SalesPage({ role, sales, setSales }) {
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    item: "",
    referensiId: "",
    pembeli: "",
    qty: 1,
    hargaSatuan: 0,
    status: "Booking",
    catatan: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCertificateId, setSelectedCertificateId] = useState(sales[0]?.id || "SALE-2026-001");

  const canEdit = ROLES[role].canManageSales;

  if (!ROLES[role].allowed.includes("penjualan")) {
    return <AccessDenied role={role} feature="Pencatatan Penjualan" />;
  }



  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canEdit) return;

    if (editingId) {
      setSales((curr) =>
        curr.map((sale) => (sale.id === editingId ? { ...sale, ...formData } : sale))
      );
      setEditingId(null);
    } else {
      const newId = makeId("SALE");
      setSales((curr) => [{ id: newId, ...formData }, ...curr]);
      setSelectedCertificateId(newId);
    }

    setFormData({
      tanggal: new Date().toISOString().split("T")[0],
      item: "",
      referensiId: "",
      pembeli: "",
      qty: 1,
      hargaSatuan: 0,
      status: "Booking",
      catatan: "",
    });
    setShowAddModal(false);
  };

  const handleEdit = (sale) => {
    if (!canEdit) return;
    setFormData(sale);
    setEditingId(sale.id);
    setShowAddModal(true);
  };

  const handleDelete = () => {
    if (!canEdit || !deleteConfirm) return;
    setSales((curr) => curr.filter((sale) => sale.id !== deleteConfirm));
    if (selectedCertificateId === deleteConfirm) {
      setSelectedCertificateId(sales.find((s) => s.id !== deleteConfirm)?.id || "");
    }
    setDeleteConfirm(null);
  };

  const totalRevenue = sales
    .filter((s) => s.status === "Lunas")
    .reduce((sum, s) => sum + s.hargaSatuan * s.qty, 0);

  const potentialRevenue = sales
    .filter((s) => s.status === "Booking" || s.status === "DP")
    .reduce((sum, s) => sum + s.hargaSatuan * s.qty, 0);

  // Dynamic calculations for Inventory Mix
  const hijausCount = sales
    .filter((s) => s.item.toLowerCase().includes("hijau"))
    .reduce((sum, s) => sum + Number(s.qty), 0);

  const birusCount = sales
    .filter((s) => s.item.toLowerCase().includes("biru"))
    .reduce((sum, s) => sum + Number(s.qty), 0);

  const totalValuation = sales.reduce((sum, s) => sum + s.hargaSatuan * s.qty, 0);

  // Find selected sale for certificate display
  const certificateSale = sales.find((s) => s.id === selectedCertificateId) || sales[0];

  return (
    <div className="page-content space-y-8 select-none">
      {/* Top Header Row with Action Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          eyebrow="Manajemen Bisnis"
          title="Sales Center Telur Merak"
          description="Kelola data transaksi penjualan telur merak, omset pendapatan, dan sertifikasi lineage digital."
        />
        {canEdit && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                tanggal: new Date().toISOString().split("T")[0],
                item: "",
                referensiId: "",
                pembeli: "",
                qty: 1,
                hargaSatuan: 0,
                status: "Booking",
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

      {/* Summary Stats & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Performance Simplified Bar Chart */}
        <div className="lg:col-span-2 km-card p-4 sm:p-6 flex flex-col justify-between bg-surface border border-alpine-high">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-display text-base font-bold text-ink-primary">Revenue Performance</h3>
              <p className="font-body text-xs text-ink-secondary">Akumulasi pertumbuhan bulanan penjualan telur merak</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-teal-iridescence">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-iridescence" /> Lunas: {formatCurrency(totalRevenue)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-status-warning" /> Potensi: {formatCurrency(potentialRevenue)}
              </span>
            </div>
          </div>

          {/* Simplified bar chart representation */}
          <div className="h-44 relative flex items-end justify-between px-2 gap-1 sm:gap-3.5 border border-alpine-high/50 bg-alpine-low/30 rounded-xl pt-4">
            <div className="flex-1 flex flex-col justify-end items-center h-full group">
              <div className="w-full bg-alpine-high/70 dark:bg-alpine-high/20 rounded-t-lg transition-all h-[30%]" title="Jan: Rp 2.500.000" />
              <span className="mt-2 font-mono text-[9px] text-ink-outline">JAN</span>
            </div>
            <div className="flex-1 flex flex-col justify-end items-center h-full group">
              <div className="w-full bg-alpine-high/70 dark:bg-alpine-high/20 rounded-t-lg transition-all h-[45%]" title="Feb: Rp 4.000.000" />
              <span className="mt-2 font-mono text-[9px] text-ink-outline">FEB</span>
            </div>
            <div className="flex-1 flex flex-col justify-end items-center h-full group">
              <div className="w-full bg-alpine-high/70 dark:bg-alpine-high/20 rounded-t-lg transition-all h-[35%]" title="Mar: Rp 3.200.000" />
              <span className="mt-2 font-mono text-[9px] text-ink-outline">MAR</span>
            </div>
            <div className="flex-1 flex flex-col justify-end items-center h-full group">
              <div className="w-full bg-alpine-high/70 dark:bg-alpine-high/20 rounded-t-lg transition-all h-[60%]" title="Apr: Rp 6.000.000" />
              <span className="mt-2 font-mono text-[9px] text-ink-outline">APR</span>
            </div>
            <div className="flex-1 flex flex-col justify-end items-center h-full group">
              <div className="w-full bg-alpine-high/70 dark:bg-alpine-high/20 rounded-t-lg transition-all h-[50%]" title="Mei: Rp 5.000.000" />
              <span className="mt-2 font-mono text-[9px] text-ink-outline">MEI</span>
            </div>
            <div className="flex-1 flex flex-col justify-end items-center h-full group">
              <div className="w-full bg-alpine-high/70 dark:bg-alpine-high/20 rounded-t-lg transition-all h-[75%]" title="Jun: Rp 7.500.000" />
              <span className="mt-2 font-mono text-[9px] text-ink-outline">JUN</span>
            </div>
            <div className="flex-1 flex flex-col justify-end items-center h-full group">
              {/* Dynamic current month visualization */}
              <div
                className="w-full bg-teal-iridescence rounded-t-lg transition-all"
                style={{ height: `${Math.min(100, Math.max(10, (totalValuation / 10000000) * 100))}%` }}
                title={`Jul: ${formatCurrency(totalValuation)}`}
              />
              <span className="mt-2 font-mono text-[9px] font-bold text-teal-iridescence">JUL (SKRG)</span>
            </div>
          </div>
        </div>

        {/* Sales Categories & Valuation */}
        <div className="km-card p-4 sm:p-6 flex flex-col justify-between bg-surface border border-alpine-high">
          <div>
            <h3 className="font-display text-base font-bold text-ink-primary mb-4">Metrik Varian Telur</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-alpine-low/60 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-iridescence" />
                  <span className="font-body text-xs font-semibold text-ink-primary">Telur Merak Hijau</span>
                </div>
                <span className="font-mono text-xs font-bold text-ink-primary">{hijausCount} Butir</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-alpine-low/60 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-containerText" />
                  <span className="font-body text-xs font-semibold text-ink-primary">Telur Merak Biru</span>
                </div>
                <span className="font-mono text-xs font-bold text-ink-primary">{birusCount} Butir</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-alpine-high flex flex-col justify-end">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-outline">TOTAL NILAI TRANSAKSI</span>
            <div className="text-2xl font-display font-extrabold text-ink-primary mt-1">{formatCurrency(totalValuation)}</div>
            <div className="text-teal-iridescence font-semibold text-xs flex items-center gap-1 mt-1">
              <Icon name="trending_up" className="text-[14px]" />
              +12.4% vs bulan lalu
            </div>
          </div>
        </div>
      </div>



      {/* Transaction History & Certificate Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Transaction History Table */}
        <div className="lg:col-span-2 km-card shadow-sm overflow-hidden border border-alpine-high bg-surface">
          <div className="p-5 border-b border-alpine-high flex justify-between items-center bg-alpine-low/30">
            <h3 className="font-display text-base font-bold text-ink-primary">Riwayat Transaksi Penjualan</h3>
          </div>
          {sales.length === 0 ? (
            <div className="p-8">
              <EmptyState title="Belum ada data transaksi" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="km-table min-w-[600px]">
                <thead>
                  <tr>
                    <th>ID & TANGGAL</th>
                    <th>ITEM / PAKET</th>
                    <th>PEMBELI</th>
                    <th>TOTAL</th>
                    <th>STATUS</th>
                    <th className="text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className={`cursor-pointer hover:bg-alpine-low/40 transition-colors ${
                        selectedCertificateId === sale.id ? "bg-teal-iridescence/[0.04] border-l-2 border-l-teal-500" : ""
                      }`}
                      onClick={() => setSelectedCertificateId(sale.id)}
                    >
                      <td>
                        <span className="block font-mono text-xs font-bold text-ink-primary">{sale.id}</span>
                        <span className="block font-mono text-[10px] text-ink-outline mt-0.5">{sale.tanggal}</span>
                      </td>
                      <td>
                        <span className="block font-body text-xs font-medium text-ink-primary">{sale.item}</span>
                        <span className="block font-mono text-[9px] text-ink-outline mt-0.5">{sale.referensiId}</span>
                      </td>
                      <td>
                        <span className="block font-body text-xs text-ink-primary">{sale.pembeli}</span>
                      </td>
                      <td>
                        <span className="font-mono text-xs font-extrabold text-ink-primary">
                          {formatCurrency(sale.hargaSatuan * sale.qty)}
                        </span>
                      </td>
                      <td>
                        <StatusBadge label={sale.status} variant={getSaleVariant(sale.status)} showIcon={false} />
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCertificateId(sale.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              selectedCertificateId === sale.id
                                ? "bg-teal-container text-teal-container-text"
                                : "hover:bg-alpine-low text-ink-secondary"
                            }`}
                            title="Tampilkan Sertifikat Silsilah"
                          >
                            <Icon name="workspace_premium" className="text-[16px]" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleEdit(sale)}
                                className="p-1.5 hover:bg-alpine-low rounded-lg text-ink-secondary hover:text-ink-primary transition-colors"
                                title="Edit Transaksi"
                              >
                                <Icon name="edit" className="text-[16px]" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(sale.id)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-ink-secondary hover:text-red-500 transition-colors"
                                title="Hapus Transaksi"
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
            </div>
          )}
        </div>

        {/* Certificate Display Area */}
        <div className="km-card p-4 sm:p-6 border border-alpine-high bg-teal-iridescence/[0.03] dark:bg-forest-midnight/[0.2] flex flex-col justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-ink-primary mb-1">Lineage & Authenticity</h3>
            <p className="font-body text-[11px] text-ink-secondary mb-5">Setiap paket telur adopsi yang terdaftar diterbitkan DCA (Digital Certificate of Authenticity) silsilah.</p>

            {certificateSale ? (
              <div className="rounded-xl border border-teal-iridescence/20 bg-surface shadow-md p-5 flex flex-col justify-between relative overflow-hidden select-text">
                <div className="absolute -right-8 -top-8 text-teal-iridescence/5 text-[110px] select-none pointer-events-none material-symbols-outlined">
                  workspace_premium
                </div>
                <div className="border border-dashed border-teal-iridescence/30 p-4 rounded-lg">
                  <div className="text-center mb-5">
                    <span className="font-display font-bold italic text-sm text-teal-iridescence uppercase tracking-wider">
                      Egg Lineage Certificate
                    </span>
                    <div className="h-[1px] w-16 bg-teal-iridescence/40 mx-auto mt-1.5" />
                  </div>
                  <div className="space-y-2.5 font-mono text-[11px] text-ink-secondary">
                    <div className="flex justify-between border-b border-alpine-high/50 pb-1.5">
                      <span>ORDER ID</span>
                      <span className="text-ink-primary font-bold">{certificateSale.id}</span>
                    </div>
                    <div className="flex justify-between border-b border-alpine-high/50 pb-1.5">
                      <span>VARIETAS</span>
                      <span className="text-ink-primary font-bold">
                        {certificateSale.item.includes("Biru") ? "MERAK BIRU" : "MERAK HIJAU"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-alpine-high/50 pb-1.5">
                      <span>HATCH BATCH</span>
                      <span className="text-ink-primary font-bold">{certificateSale.referensiId}</span>
                    </div>
                    <div className="flex justify-between border-b border-alpine-high/50 pb-1.5 border-dashed">
                      <span>STATUS TELUR</span>
                      <span className="text-teal-iridescence font-bold">FERTILE CERTIFIED</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span>ADOPTER</span>
                      <span className="text-ink-primary font-bold truncate max-w-[130px]" title={certificateSale.pembeli}>
                        {certificateSale.pembeli}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-alpine-high rounded-xl text-center bg-surface text-ink-outline">
                <Icon name="workspace_premium" className="text-[32px] mb-2 text-ink-outline" />
                <p className="text-xs">Pilih transaksi untuk menampilkan sertifikat silsilah digital</p>
              </div>
            )}
          </div>

          <div className="mt-5 text-center select-text">
            <span className="font-body text-[10px] text-ink-outline">
              Kampung Merak biological assets tracking system.
            </span>
          </div>
        </div>
      </div>

      {/* Entry Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg km-card bg-surface border border-alpine-high shadow-xl p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-alpine-high pb-3">
              <h3 className="font-display text-lg font-bold text-ink-primary">
                {editingId ? "Edit Catatan Penjualan" : "Catat Transaksi Baru"}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-ink-secondary hover:text-ink-primary transition-colors">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormGrid cols={2}>
                <FormField label="Tanggal Transaksi" htmlFor="tanggal" required>
                  <input
                    id="tanggal"
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tanggal: e.target.value }))}
                    className="km-input font-mono"
                  />
                </FormField>
                <FormField label="ID Batch/Referensi" htmlFor="referensiId" required>
                  <input
                    id="referensiId"
                    type="text"
                    required
                    placeholder="BATCH-EG-001"
                    value={formData.referensiId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, referensiId: e.target.value }))}
                    className="km-input font-mono"
                  />
                </FormField>
              </FormGrid>

              <FormField label="Item / Paket Penjualan" htmlFor="item" required>
                <input
                  id="item"
                  type="text"
                  required
                  placeholder="Contoh: Paket 5 Telur Merak Hijau"
                  value={formData.item}
                  onChange={(e) => setFormData((prev) => ({ ...prev, item: e.target.value }))}
                  className="km-input font-body"
                />
              </FormField>

              <FormField label="Nama Adopter / Pembeli" htmlFor="pembeli" required>
                <input
                  id="pembeli"
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Aditya Santoso"
                  value={formData.pembeli}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pembeli: e.target.value }))}
                  className="km-input font-body"
                />
              </FormField>

              <FormGrid cols={3}>
                <FormField label="Kuantitas (Qty)" htmlFor="qty" required>
                  <input
                    id="qty"
                    type="number"
                    required
                    min="1"
                    value={formData.qty}
                    onChange={(e) => setFormData((prev) => ({ ...prev, qty: e.target.value }))}
                    className="km-input font-mono"
                  />
                </FormField>
                <FormField label="Harga Satuan (Rp)" htmlFor="hargaSatuan" required>
                  <input
                    id="hargaSatuan"
                    type="number"
                    required
                    min="0"
                    placeholder="Harga Paket/Unit"
                    value={formData.hargaSatuan}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hargaSatuan: Number(e.target.value) }))}
                    className="km-input font-mono"
                  />
                </FormField>
                <FormField label="Status" htmlFor="status" required>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="km-input font-body"
                  >
                    <option value="Booking">Booking</option>
                    <option value="DP">DP</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </FormField>
              </FormGrid>

              <FormField label="Catatan Transaksi" htmlFor="catatan">
                <textarea
                  id="catatan"
                  placeholder="Keterangan opsional seperti DP diterima dll."
                  value={formData.catatan}
                  onChange={(e) => setFormData((prev) => ({ ...prev, catatan: e.target.value }))}
                  className="km-input font-body h-16 resize-none"
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-3 border-t border-alpine-high">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="km-btn km-btn-secondary"
                >
                  Batal
                </button>
                <button type="submit" className="km-btn km-btn-primary">
                  {editingId ? "Simpan Perubahan" : "Catat Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Hapus Catatan Penjualan"
          message={`Apakah Anda yakin ingin menghapus data penjualan dengan ID ${deleteConfirm}? Transaksi akan dihapus permanen dari sistem keuangan.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
