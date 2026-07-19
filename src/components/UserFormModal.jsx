import { useState, useEffect } from "react";
import Icon from "./Icon.jsx";

export default function UserFormModal({ user, onClose, onSubmit }) {
  const isEdit = !!user;

  const [formData, setFormData] = useState({
    id: "",
    nama: "",
    email: "",
    password: "",
    role: "staff", // Default to operator/staff
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id || user.uid || "",
        nama: user.nama || "",
        email: user.email || "",
        password: "", // Don't show password
        role: user.role === "admin" ? "pemilik" : user.role === "pemilik" ? "pemilik" : "staff",
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        id: `USR-${Math.floor(Math.random() * 10000)}`,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat menyimpan pengguna.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-2xl border border-alpine-high bg-surface shadow-2xl animate-scale-in"
        style={{ color: "var(--ink-primary)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-alpine-high p-5 bg-alpine-low/30 rounded-t-2xl">
          <h2 className="font-display text-lg font-bold">
            {isEdit ? "Edit Pengguna" : "Tambah Pengguna Baru"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-secondary hover:bg-alpine-high hover:text-ink-primary transition-colors"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 flex items-start gap-2">
              <Icon name="error" className="text-[18px] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold block text-ink-primary">
              ID Pengguna
            </label>
            <input
              type="text"
              name="id"
              value={formData.id}
              disabled
              className="km-input w-full bg-alpine-low/50 opacity-70 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold block text-ink-primary">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              className="km-input w-full"
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold block text-ink-primary">
              Alamat Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required={!isEdit}
              className="km-input w-full"
              placeholder="Contoh: budi@kampungmerak.id"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold block text-ink-primary">
              Kata Sandi
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!isEdit}
              className="km-input w-full"
              placeholder={isEdit ? "(Kosongkan jika tidak diubah)" : "Minimal 6 karakter"}
            />
            {isEdit && (
              <p className="text-[10px] text-ink-outline">
                Biarkan kosong jika Anda tidak ingin mengubah kata sandi pengguna ini.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold block text-ink-primary">
              Role / Jabatan
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="km-select w-full"
            >
              <option value="staff">Operator (Staf Kandang)</option>
              <option value="pemilik">Admin (Pemilik)</option>
            </select>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="km-btn km-btn-secondary"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="km-btn km-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <Icon name="sync" className="animate-spin text-[18px]" />
              ) : (
                "Simpan Pengguna"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
