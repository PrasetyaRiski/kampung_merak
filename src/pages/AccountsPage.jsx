import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import UserFormModal from "../components/UserFormModal.jsx";
import Icon from "../components/Icon.jsx";
import { fetchApi } from "../utils/api.js";
import { ROLES } from "../data/constants.js";

export default function AccountsPage({ role }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Delete states
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = ROLES[role].canManageUsers;

  useEffect(() => {
    if (!ROLES[role].allowed.includes("akun")) return;
    loadUsers();
  }, [role]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchApi("/api/users");
      setUsers(data);
      setError(null);
    } catch (err) {
      setError("Gagal memuat data pengguna: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!ROLES[role].allowed.includes("akun")) {
    return <AccessDenied role={role} feature="Manajemen Akun" />;
  }

  const getRoleBadge = (userRole) => {
    if (userRole === "pemilik" || userRole === "admin") return <StatusBadge label="Admin" variant="success" showIcon={false} />;
    if (userRole === "staff" || userRole === "operator") return <StatusBadge label="Operator" variant="warning" showIcon={false} />;
    return <StatusBadge label="Viewer" variant="neutral" showIcon={false} />;
  };

  const handleAddClick = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDeleteClick = (user) => {
    setDeleteConfirm(user);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await fetchApi(`/api/users/${deleteConfirm.id}`, { method: "DELETE" });
      setUsers(users.filter(u => u.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      alert("Gagal menghapus pengguna: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    if (editingUser) {
      // Update
      const payload = {
        nama: formData.nama,
        email: formData.email,
        role: formData.role,
      };
      // Only include password if it was changed
      if (formData.password) {
        payload.password = formData.password;
      }

      const updatedUser = await fetchApi(`/api/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
    } else {
      // Create
      const payload = {
        id: formData.id,
        nama: formData.nama,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      const newUser = await fetchApi(`/auth/register`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setUsers([newUser, ...users]);
    }
  };

  return (
    <div className="page-content space-y-6">
      <PageHeader
        eyebrow="Manajemen Akses"
        title="Daftar Pengguna Sistem"
        description="Daftar pengguna dan hak akses aplikasi. Hanya Admin yang dapat mengelola."
      />

      <RoleNotice role={role} />

      <SectionCard
        title="Pengguna Aktif"
        noPadding
        action={
          canManage && (
            <button className="km-btn km-btn-primary km-btn-sm" onClick={handleAddClick}>
              <Icon name="person_add" className="text-[18px]" />
              Tambah Pengguna
            </button>
          )
        }
      >
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-ink-outline">Memuat data pengguna...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-ink-outline">Belum ada data pengguna.</div>
          ) : (
            <table className="km-table min-w-[700px]">
              <thead>
                <tr>
                  <th>USER ID</th>
                  <th>NAMA LENGKAP</th>
                  <th>EMAIL</th>
                  <th>ROLE / AKSES</th>
                  {canManage && <th className="text-right">AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="font-mono text-sm font-bold text-ink-primary">{user.id}</span>
                    </td>
                    <td>
                      <span className="font-body text-sm font-medium">{user.nama}</span>
                    </td>
                    <td>
                      <span className="font-body text-sm text-ink-secondary">{user.email}</span>
                    </td>
                    <td>{getRoleBadge(user.role)}</td>
                    {canManage && (
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="km-btn km-btn-secondary km-btn-sm !px-2"
                            onClick={() => handleEditClick(user)}
                            title="Edit Pengguna"
                          >
                            <Icon name="edit" className="text-[16px]" />
                          </button>
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/30 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                            onClick={() => handleDeleteClick(user)}
                            title="Hapus Pengguna"
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

      {/* Modal Form */}
      {showForm && (
        <UserFormModal
          user={editingUser}
          onClose={() => setShowForm(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Hapus Pengguna"
          message={`Apakah Anda yakin ingin menghapus pengguna ${deleteConfirm.nama}? Aksi ini tidak dapat dibatalkan.`}
          confirmText={isDeleting ? "Menghapus..." : "Hapus Pengguna"}
          cancelText="Batal"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          isDestructive={true}
        />
      )}
    </div>
  );
}
