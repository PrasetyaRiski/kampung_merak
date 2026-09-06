import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Icon from "../components/Icon.jsx";
import { ROLES } from "../data/constants.js";
import { fetchApi } from "../utils/api.js";

export default function SensorHistoryPage({ role }) {
  const [rotationData, setRotationData] = useState([]);
  const [loadingRotasi, setLoadingRotasi] = useState(true);
  const [isCreatingRotation, setIsCreatingRotation] = useState(false);
  const [showAddRotationModal, setShowAddRotationModal] = useState(false);
  const [rotationNote, setRotationNote] = useState("");

  if (!ROLES[role].allowed.includes("histori")) {
    return <AccessDenied role={role} feature="Histori Sensor" />;
  }

  useEffect(() => {
    const loadRotation = async () => {
      setLoadingRotasi(true);
      try {
        const data = await fetchApi('/api/incubator/rotation-logs');
        setRotationData([...data].reverse());
      } catch (err) {
        console.error("Gagal memuat log rotasi:", err);
      } finally {
        setLoadingRotasi(false);
      }
    };
    loadRotation();
  }, []);

  const handleCreateRotation = async (e) => {
    e?.preventDefault();
    setIsCreatingRotation(true);
    try {
      const payload = {
        timestamp: new Date().toISOString().slice(0, 19),
        status: "sukses",
        catatan: rotationNote.trim() || "Pembalikan manual dari panel kontrol"
      };
      const created = await fetchApi('/api/incubator/rotation-logs', {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setRotationData((prev) => [created, ...prev]);
      setShowAddRotationModal(false);
      setRotationNote("");
      alert("Log pembalikan telur berhasil dicatat!");
    } catch (err) {
      alert("Gagal mencatat rotasi: " + err.message);
    } finally {
      setIsCreatingRotation(false);
    }
  };

  return (
    <div className="page-content space-y-6">
      <PageHeader
        eyebrow="Analitik Data"
        title="Histori Sensor & Pembalikan Telur"
        description="Rekaman riwayat log pembalikan telur secara periodik."
      />

      <RoleNotice role={role} />

      <SectionCard title={`Log Pembalikan Telur (${rotationData.length} Entri)`} noPadding>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-alpine-low border-b border-alpine-high">
            <p className="font-body text-xs text-ink-secondary">
              Pembalikan telur otomatis diatur via interval mesin, atau catat aktivitas pembalikan manual ke database.
            </p>
            <button
              onClick={() => setShowAddRotationModal(true)}
              className="km-btn km-btn-primary km-btn-sm"
            >
              <Icon name="rotate_right" className="text-[16px]" />
              Catat Rotasi Manual
            </button>
          </div>

          {loadingRotasi ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-ink-secondary">
                <Icon name="hourglass_top" className="text-[20px] animate-spin" />
                <span className="font-body text-sm">Memuat log rotasi...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="km-table min-w-[600px]">
                <thead>
                  <tr>
                    <th>TIMESTAMP</th>
                    <th>STATUS ROTASI</th>
                    <th>CATATAN</th>
                  </tr>
                </thead>
                <tbody>
                  {rotationData.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-8">
                        <EmptyState
                          icon="rotate_right"
                          title="Belum Ada Log Rotasi"
                          desc="Log pembalikan telur akan muncul saat motor servo diaktifkan secara otomatis atau manual."
                        />
                      </td>
                    </tr>
                  ) : (
                    rotationData.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <span className="font-mono text-sm font-semibold">
                            {new Date(row.timestamp).toLocaleString("id-ID")}
                          </span>
                        </td>
                        <td>
                          <StatusBadge
                            label={row.status}
                            variant={row.status === "sukses" || row.status === "OK" ? "success" : "warning"}
                            showIcon={false}
                          />
                        </td>
                        <td className="font-body text-sm text-ink-secondary">
                          {row.catatan || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-4 bg-alpine-low border-t border-alpine-high text-center">
            <p className="font-body text-xs text-ink-secondary">
              Log pembalikan direkam secara otomatis oleh kontroler servo setiap interval yang dikonfigurasi.
            </p>
          </div>
        </SectionCard>

      {/* Modal Catat Rotasi Manual (POST /api/incubator/rotation-logs) */}
      {showAddRotationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddRotationModal(false)}>
          <div className="w-full max-w-md km-card bg-surface border border-alpine-high shadow-2xl p-6 relative select-text" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-alpine-high pb-4 mb-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-teal-iridescence">Inkubator Actuator</span>
                <h3 className="font-display text-xl font-bold text-ink-primary mt-0.5">Catat Pembalikan Telur</h3>
              </div>
              <button onClick={() => setShowAddRotationModal(false)} className="p-1 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-alpine-low transition-colors">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <form onSubmit={handleCreateRotation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-primary uppercase tracking-widest mb-1.5">Status Rotasi</label>
                <div className="flex items-center gap-2 p-3 rounded-xl border border-alpine-high bg-alpine-low">
                  <span className="h-2.5 w-2.5 rounded-full bg-status-success animate-pulse" />
                  <span className="font-mono text-sm font-bold text-ink-primary">sukses</span>
                  <span className="text-xs text-ink-secondary ml-auto">(Motor Pembalik Berputar)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-primary uppercase tracking-widest mb-1.5">Catatan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Pembalikan manual rak tengah"
                  value={rotationNote}
                  onChange={(e) => setRotationNote(e.target.value)}
                  className="w-full rounded-xl border border-alpine-high bg-alpine-low px-4 py-2.5 text-sm font-body text-ink-primary shadow-inner outline-none transition-all placeholder:text-ink-outline focus:border-teal-iridescence focus:ring-1 focus:ring-teal-iridescence"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-alpine-high">
                <button
                  type="button"
                  className="km-btn km-btn-secondary km-btn-sm"
                  onClick={() => setShowAddRotationModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRotation}
                  className="km-btn km-btn-primary km-btn-sm"
                >
                  {isCreatingRotation ? "Menyimpan..." : "Simpan Log Rotasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
