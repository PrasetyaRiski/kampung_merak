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
  const [mqttConfig, setMqttConfig] = useState({ url: "", username: "", password: "" });
  const [isSavingMqtt, setIsSavingMqtt] = useState(false);

  useEffect(() => {
    fetchApi("/api/incubator/settings").then(data => {
      setApiSettings(data);
      setMqttConfig({
        url: data.mqtt_url || "",
        username: data.mqtt_username || "",
        password: data.mqtt_password || "",
      });
    }).catch(err => console.error("Gagal memuat pengaturan:", err));
  }, []);

  const handleSaveMqtt = async () => {
    if (!apiSettings) return;
    setIsSavingMqtt(true);
    try {
      const payload = {
        ...apiSettings,
        mqtt_url: mqttConfig.url || null,
        mqtt_username: mqttConfig.username || null,
        mqtt_password: mqttConfig.password || null
      };
      delete payload.id;
      delete payload.updated_by;
      delete payload.updated_at;
      
      await fetchApi("/api/incubator/settings", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      alert("Konfigurasi MQTT berhasil disimpan. Harap refresh halaman untuk menerapkan jika berubah.");
    } catch (err) {
      alert("Gagal menyimpan konfigurasi MQTT (Mungkin backend belum update?): " + err.message);
    } finally {
      setIsSavingMqtt(false);
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

      {/* Konfigurasi MQTT API Dinamis */}
      <SectionCard title="Konfigurasi Broker MQTT">
        <div className="space-y-4">
          <p className="font-body text-sm text-ink-secondary leading-relaxed mb-4">
            Pengaturan server MQTT secara dinamis tanpa harus mengubah <code className="bg-alpine-low px-1 rounded text-ink-primary">.env</code>.
            (Pastikan developer backend sudah menambahkan kolom <code className="bg-alpine-low px-1 rounded text-ink-primary">mqtt_url</code>, dll di database).
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-ink-primary uppercase tracking-widest mb-1.5">WebSocket URL</label>
              <input
                type="text"
                value={mqttConfig.url}
                onChange={(e) => setMqttConfig({ ...mqttConfig, url: e.target.value })}
                disabled={configurationLocked}
                placeholder="wss://broker.emqx.io:8084/mqtt"
                className="w-full rounded-xl border border-alpine-high bg-alpine-low px-4 py-2.5 text-sm font-mono text-ink-primary shadow-inner outline-none transition-all placeholder:text-ink-outline focus:border-teal-iridescence focus:ring-1 focus:ring-teal-iridescence disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-primary uppercase tracking-widest mb-1.5">Username</label>
              <input
                type="text"
                value={mqttConfig.username}
                onChange={(e) => setMqttConfig({ ...mqttConfig, username: e.target.value })}
                disabled={configurationLocked}
                placeholder="(Opsional)"
                className="w-full rounded-xl border border-alpine-high bg-alpine-low px-4 py-2.5 text-sm font-mono text-ink-primary shadow-inner outline-none transition-all placeholder:text-ink-outline focus:border-teal-iridescence focus:ring-1 focus:ring-teal-iridescence disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-primary uppercase tracking-widest mb-1.5">Password</label>
              <input
                type="password"
                value={mqttConfig.password}
                onChange={(e) => setMqttConfig({ ...mqttConfig, password: e.target.value })}
                disabled={configurationLocked}
                placeholder="(Opsional)"
                className="w-full rounded-xl border border-alpine-high bg-alpine-low px-4 py-2.5 text-sm font-mono text-ink-primary shadow-inner outline-none transition-all placeholder:text-ink-outline focus:border-teal-iridescence focus:ring-1 focus:ring-teal-iridescence disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={configurationLocked || isSavingMqtt}
              onClick={handleSaveMqtt}
              className="km-btn km-btn-primary px-6"
            >
              {isSavingMqtt ? "Menyimpan..." : "Simpan Pengaturan MQTT"}
            </button>
          </div>
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
