import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import ConnectionPanel from "../components/ConnectionPanel.jsx";
import { fetchApi } from "../utils/api.js";
import { ROLES } from "../data/constants.js";
import Icon from "../components/Icon.jsx";

export default function SettingsPage({ role, activeVariety, setActiveVariety, mqttUrl, clientId, connection, cctvUrl, setCctvUrl }) {
  if (!ROLES[role].allowed.includes("pengaturan")) {
    return <AccessDenied role={role} feature="Pengaturan Sistem" />;
  }

  const canConfigureCctv = Boolean(ROLES[role]?.canConfigureCctv ?? (role === "admin" || role === "operator"));
  const cctvLocked = !canConfigureCctv;
  const [cctvSavedToast, setCctvSavedToast] = useState(false);

  const handleSaveCctv = () => {
    setCctvSavedToast(true);
    setTimeout(() => setCctvSavedToast(false), 2500);
    const el = document.activeElement;
    if (el) el.blur();
  };
  
  const [apiStatus, setApiStatus] = useState(null);
  const [isCheckingApi, setIsCheckingApi] = useState(false);

  const checkApiHealth = async () => {
    setIsCheckingApi(true);
    try {
      const startTime = performance.now();
      await fetchApi("/api/incubator/settings");
      const latency = Math.round(performance.now() - startTime);
      setApiStatus({
        status: "online",
        host: "api-merak.abdulrosyid.my.id",
        latency
      });
    } catch (err) {
      setApiStatus({
        status: "offline",
        host: "api-merak.abdulrosyid.my.id",
        error: err.message
      });
    } finally {
      setIsCheckingApi(false);
    }
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  return (
    <div className="page-content space-y-6">
      <PageHeader
        eyebrow="Konfigurasi"
        title="Pengaturan Sistem"
        description="Pilih profil inkubasi aktif dan atur parameter dasar aplikasi."
      />

      <RoleNotice role={role} />

      <SectionCard title="Informasi Aplikasi">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-alpine-high p-4 bg-alpine-low">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-outline">Versi Aplikasi</p>
            <p className="mt-1 font-mono text-sm font-semibold text-ink-primary">v1.2.0-stable</p>
          </div>
          <div className="rounded-xl border border-alpine-high p-4 bg-alpine-low">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-outline">Framework</p>
            <p className="mt-1 font-mono text-sm font-semibold text-ink-primary">React 19 + Vite</p>
          </div>
          <div className="rounded-xl border border-alpine-high p-4 bg-alpine-low">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-outline">Koneksi IoT</p>
            <p className="mt-1 font-mono text-sm font-semibold text-ink-primary">MQTT (EMQX Cloud)</p>
          </div>
          <div className="rounded-xl border border-alpine-high p-4 bg-alpine-low flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-outline">Backend REST API</p>
                <button
                  onClick={checkApiHealth}
                  disabled={isCheckingApi}
                  className="p-1 rounded text-ink-outline hover:text-teal-iridescence hover:bg-alpine-high/50 transition-colors"
                  title="Ping Server REST API"
                >
                  <Icon name="sync" className={`text-[14px] ${isCheckingApi ? "animate-spin text-teal-iridescence" : ""}`} />
                </button>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${apiStatus?.status === "online" ? "bg-status-success animate-pulse" : apiStatus ? "bg-status-dangerText" : "bg-ink-outline"}`} />
                <span className="font-mono text-sm font-semibold text-ink-primary">
                  {apiStatus?.status === "online" ? "Online & Siap" : apiStatus ? "Offline" : "Memeriksa..."}
                </span>
                {apiStatus?.latency != null && (
                  <span className="font-mono text-[10px] font-bold text-teal-iridescence px-1.5 py-0.5 rounded bg-teal-iridescence/10 border border-teal-iridescence/20 ml-auto">
                    {apiStatus.latency} ms
                  </span>
                )}
              </div>
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-ink-outline truncate" title={apiStatus?.host || "api-merak.abdulrosyid.my.id"}>
              {apiStatus?.host || "api-merak.abdulrosyid.my.id"}
            </p>
          </div>
        </div>
      </SectionCard>

      <ConnectionPanel mqttUrl={mqttUrl} clientId={clientId} connection={connection} />

      <SectionCard title="Konfigurasi Kamera CCTV & Gateway RTSP">
        <div className="space-y-4">
          <p className="font-body text-sm text-ink-secondary leading-relaxed">
            Atur alamat RTSP kamera Bardi Anda. Gateway Python (yang berjalan di localhost:5000 atau PC Kandang) akan secara dinamis menyambung ke alamat ini ketika halaman CCTV dibuka.
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
                    handleSaveCctv();
                  }
                }}
                disabled={cctvLocked}
                placeholder="rtsp://admin:Admin123@192.168.110.227:554/V_ENC_000"
                className="w-full rounded-xl border border-alpine-high bg-alpine-low px-4 py-2.5 text-sm font-mono text-ink-primary shadow-inner outline-none transition-all placeholder:text-ink-outline focus:border-teal-iridescence focus:ring-1 focus:ring-teal-iridescence disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="button"
                disabled={cctvLocked}
                onClick={handleSaveCctv}
                className="px-6 py-2.5 rounded-xl bg-teal-iridescence text-white font-bold text-sm hover:bg-teal-iridescence/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
              >
                <Icon name="check" className="text-[18px]" />
                Simpan
              </button>
            </div>
            {cctvSavedToast && (
              <p className="font-body text-xs text-status-success flex items-center gap-1 mt-2">
                <Icon name="check_circle" className="text-[14px]" />
                Alamat RTSP CCTV berhasil disimpan dan langsung aktif untuk gateway!
              </p>
            )}
          </div>
          {cctvLocked ? (
            <p className="font-body text-xs text-status-dangerText">
              * Hanya Admin dan Operator yang dapat mengubah alamat kamera.
            </p>
          ) : (
            <p className="font-body text-xs text-teal-iridescence flex items-center gap-1.5">
              <Icon name="verified_user" className="text-[14px]" />
              Akses Diberikan: Admin dan Operator berwenang memperbarui alamat RTSP ini.
            </p>
          )}

        </div>
      </SectionCard>
    </div>
  );
}
