import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import ConnectionPanel from "../components/ConnectionPanel.jsx";
import { ROLES, VARIETAS } from "../data/constants.js";

export default function SettingsPage({ role, activeVariety, setActiveVariety, mqttUrl, clientId, connection, cctvUrl, setCctvUrl }) {
  if (!ROLES[role].allowed.includes("pengaturan")) {
    return <AccessDenied role={role} feature="Pengaturan Sistem" />;
  }

  const configurationLocked = !ROLES[role].canConfigure;

  return (
    <div className="page-content space-y-6">
      <PageHeader
        eyebrow="Konfigurasi"
        title="Pengaturan Sistem"
        description="Pilih profil inkubasi aktif dan atur parameter dasar aplikasi."
      />

      <RoleNotice role={role} />

      <SectionCard title="Profil Inkubasi Aktif">
        <div className="mb-4">
          <p className="font-body text-sm text-ink-secondary mb-3">
            Pilih varietas merak yang sedang diinkubasi. Mengubah profil akan menyesuaikan
            warna dashboard dan parameter referensi.
          </p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(VARIETAS).map(([key, item]) => {
              const active = activeVariety === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={configurationLocked}
                  onClick={() => setActiveVariety(key)}
                  className={`relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 hover:shadow-sm disabled:cursor-not-allowed ${
                    active
                      ? "border-teal-iridescence bg-surface shadow-sm ring-1 ring-teal-iridescence/20"
                      : "border-alpine-high bg-surface hover:border-teal-iridescence/40 opacity-80 disabled:opacity-50"
                  }`}
                  style={{ minWidth: "240px" }}
                >
                  <div className="relative z-10 flex flex-col gap-1">
                    <span
                      className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: active ? item.accent : "var(--ink-secondary)" }}
                    >
                      {item.batch}
                    </span>
                    <span className="font-display text-lg font-bold text-ink-primary">
                      {item.label}
                    </span>
                  </div>
                  {active && (
                    <div
                      className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20"
                      style={{ backgroundColor: item.accent }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          {configurationLocked && (
            <p className="mt-3 font-body text-xs text-status-dangerText">
              * Hanya Admin yang dapat mengubah profil inkubasi.
            </p>
          )}
        </div>
      </SectionCard>

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
          <div className="mt-4 p-4 rounded-xl border border-alpine-high bg-surface space-y-2">
             <p className="font-bold text-xs uppercase text-ink-primary tracking-widest">Cara Mengaktifkan Gateway Python:</p>
             <div className="font-mono text-xs text-ink-secondary space-y-1">
               <div>1. Buka terminal di folder <span className="text-ink-primary">server/</span></div>
               <div>2. Jalankan <span className="text-ink-primary bg-alpine-low px-1 rounded">pip install -r requirements.txt</span></div>
               <div>3. Jalankan <span className="text-ink-primary bg-alpine-low px-1 rounded">python rtsp_gateway_example.py</span></div>
             </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
