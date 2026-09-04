import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import ConnectionPanel from "../components/ConnectionPanel.jsx";
import { fetchApi } from "../utils/api.js";
import { ROLES, VARIETAS } from "../data/constants.js";

export default function SettingsPage({ role, activeVariety, setActiveVariety, mqttUrl, clientId, connection, cctvUrl, setCctvUrl }) {
  if (!ROLES[role].allowed.includes("pengaturan")) {
    return <AccessDenied role={role} feature="Pengaturan Sistem" />;
  }

  const configurationLocked = !ROLES[role].canConfigure;
  
  const [apiSettings, setApiSettings] = useState(null);
  const [incubatorForm, setIncubatorForm] = useState({
    suhu_min: 37.0,
    suhu_max: 38.0,
    kelembapan_min: 55.0,
    kelembapan_max: 65.0,
    interval_rotasi_menit: 240,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    fetchApi("/api/incubator/settings").then(data => {
      setApiSettings(data);
      setIncubatorForm({
        suhu_min: data.suhu_min ?? 37.0,
        suhu_max: data.suhu_max ?? 38.0,
        kelembapan_min: data.kelembapan_min ?? 55.0,
        kelembapan_max: data.kelembapan_max ?? 65.0,
        interval_rotasi_menit: data.interval_rotasi_menit ?? 240,
      });
    }).catch(err => console.error("Gagal memuat pengaturan inkubator:", err));
  }, []);

  const handleSaveIncubatorSettings = async () => {
    if (configurationLocked) return;
    setIsSavingSettings(true);
    try {
      const payload = {
        suhu_min: parseFloat(incubatorForm.suhu_min),
        suhu_max: parseFloat(incubatorForm.suhu_max),
        kelembapan_min: parseFloat(incubatorForm.kelembapan_min),
        kelembapan_max: parseFloat(incubatorForm.kelembapan_max),
        interval_rotasi_menit: parseInt(incubatorForm.interval_rotasi_menit, 10),
      };
      const saved = await fetchApi("/api/incubator/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setApiSettings(saved);
      alert("Pengaturan inkubator berhasil disimpan!");
    } catch (err) {
      alert("Gagal menyimpan pengaturan: " + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="page-content space-y-6">
      <PageHeader
        eyebrow="Konfigurasi"
        title="Pengaturan Sistem"
        description="Pilih profil inkubasi aktif dan atur parameter dasar aplikasi."
      />

      <RoleNotice role={role} />



      <SectionCard title="Informasi Aplikasi">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-alpine-high p-4 bg-alpine-low">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-outline">Versi Aplikasi</p>
            <p className="mt-1 font-mono text-sm font-semibold text-ink-primary">v1.2.0-stable</p>
          </div>
          <div className="rounded-xl border border-alpine-high p-4 bg-alpine-low">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-outline">Framework</p>
            <p className="mt-1 font-mono text-sm font-semibold text-ink-primary">React 19 + Vite</p>
          </div>
          <div className="rounded-xl border border-alpine-high p-4 bg-alpine-low">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-outline">Koneksi</p>
            <p className="mt-1 font-mono text-sm font-semibold text-ink-primary">MQTT via WebSocket (EMQX)</p>
          </div>
        </div>
      </SectionCard>

      <ConnectionPanel mqttUrl={mqttUrl} clientId={clientId} connection={connection} />

      {/* Parameter Inkubator */}
      <SectionCard title="Parameter Mesin Inkubator">
        <div className="space-y-4">
          <p className="font-body text-sm text-ink-secondary leading-relaxed">
            Atur batas suhu dan kelembaban ideal untuk inkubasi telur merak. Nilai ini digunakan sebagai referensi alarm dan monitoring.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-ink-primary uppercase tracking-widest mb-1.5">Suhu Minimum (°C)</label>
              <input
                type="number"
                step="0.1"
                min="30" max="45"
                value={incubatorForm.suhu_min}
                onChange={(e) => setIncubatorForm({ ...incubatorForm, suhu_min: e.target.value })}
                disabled={configurationLocked}
                className="w-full rounded-xl border border-alpine-high bg-alpine-low px-4 py-2.5 text-sm font-mono text-ink-primary shadow-inner outline-none transition-all placeholder:text-ink-outline focus:border-teal-iridescence focus:ring-1 focus:ring-teal-iridescence disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-primary uppercase tracking-widest mb-1.5">Suhu Maksimum (°C)</label>
              <input
                type="number"
                step="0.1"
                min="30" max="45"
                value={incubatorForm.suhu_max}
                onChange={(e) => setIncubatorForm({ ...incubatorForm, suhu_max: e.target.value })}
                disabled={configurationLocked}
                className="w-full rounded-xl border border-alpine-high bg-alpine-low px-4 py-2.5 text-sm font-mono text-ink-primary shadow-inner outline-none transition-all placeholder:text-ink-outline focus:border-teal-iridescence focus:ring-1 focus:ring-teal-iridescence disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-primary uppercase tracking-widest mb-1.5">Kelembaban Minimum (%)</label>
              <input
                type="number"
                step="0.5"
                min="20" max="100"
                value={incubatorForm.kelembapan_min}
                onChange={(e) => setIncubatorForm({ ...incubatorForm, kelembapan_min: e.target.value })}
                disabled={configurationLocked}
                className="w-full rounded-xl border border-alpine-high bg-alpine-low px-4 py-2.5 text-sm font-mono text-ink-primary shadow-inner outline-none transition-all placeholder:text-ink-outline focus:border-teal-iridescence focus:ring-1 focus:ring-teal-iridescence disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-primary uppercase tracking-widest mb-1.5">Kelembaban Maksimum (%)</label>
              <input
                type="number"
                step="0.5"
                min="20" max="100"
                value={incubatorForm.kelembapan_max}
                onChange={(e) => setIncubatorForm({ ...incubatorForm, kelembapan_max: e.target.value })}
                disabled={configurationLocked}
                className="w-full rounded-xl border border-alpine-high bg-alpine-low px-4 py-2.5 text-sm font-mono text-ink-primary shadow-inner outline-none transition-all placeholder:text-ink-outline focus:border-teal-iridescence focus:ring-1 focus:ring-teal-iridescence disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-primary uppercase tracking-widest mb-1.5">Interval Rotasi (menit)</label>
              <input
                type="number"
                step="1"
                min="30" max="720"
                value={incubatorForm.interval_rotasi_menit}
                onChange={(e) => setIncubatorForm({ ...incubatorForm, interval_rotasi_menit: e.target.value })}
                disabled={configurationLocked}
                className="w-full rounded-xl border border-alpine-high bg-alpine-low px-4 py-2.5 text-sm font-mono text-ink-primary shadow-inner outline-none transition-all placeholder:text-ink-outline focus:border-teal-iridescence focus:ring-1 focus:ring-teal-iridescence disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            {apiSettings && (
              <div className="flex items-end pb-0.5">
                <div className="rounded-xl border border-alpine-high bg-alpine-low px-4 py-2.5 text-xs font-mono text-ink-secondary w-full">
                  <span className="font-bold text-ink-outline">Terakhir diubah oleh:</span><br />
                  <span className="text-ink-primary">{apiSettings.updated_by || "—"}</span>
                </div>
              </div>
            )}
          </div>
          {configurationLocked ? (
            <p className="font-body text-xs text-status-dangerText">* Hanya Admin yang dapat mengubah parameter inkubator.</p>
          ) : (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={isSavingSettings}
                onClick={handleSaveIncubatorSettings}
                className="km-btn km-btn-primary px-6"
              >
                {isSavingSettings ? "Menyimpan..." : "Simpan Parameter Inkubator"}
              </button>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Konfigurasi Kamera CCTV & Gateway RTSP">
        <div className="space-y-4">
          <p className="font-body text-sm text-ink-secondary leading-relaxed">
            Atur alamat RTSP kamera Bardi Anda. Gateway Python (yang berjalan di localhost:5000) akan secara dinamis menyambung ke alamat ini ketika halaman CCTV dibuka.
          </p>
          <div>
            <label className="block text-xs font-bold text-ink-primary uppercase tracking-widest mb-1.5">URL RTSP Kamera Inkubator</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={cctvUrl || ""}
                onChange={(e) => setCctvUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur();
                  }
                }}
                disabled={configurationLocked}
                placeholder="rtsp://admin:Admin123@192.168.110.227:554/V_ENC_000"
                className="w-full rounded-xl border border-alpine-high bg-alpine-low px-4 py-2.5 text-sm font-mono text-ink-primary shadow-inner outline-none transition-all placeholder:text-ink-outline focus:border-teal-iridescence focus:ring-1 focus:ring-teal-iridescence disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="button"
                disabled={configurationLocked}
                onClick={() => {
                  const el = document.activeElement;
                  if (el) el.blur();
                }}
                className="px-6 py-2.5 rounded-xl bg-teal-iridescence text-white font-bold text-sm hover:bg-teal-iridescence/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">keyboard_return</span>
                Enter
              </button>
            </div>
          </div>
          {configurationLocked && (
            <p className="font-body text-xs text-status-dangerText">
              * Hanya Admin yang dapat mengubah alamat kamera.
            </p>
          )}

        </div>
      </SectionCard>
    </div>
  );
}
