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
  const [activeTab, setActiveTab] = useState("telemetri");
  const [historyData, setHistoryData] = useState([]);
  const [rotationData, setRotationData] = useState([]);
  const [avgTemp, setAvgTemp] = useState(0);
  const [avgHum, setAvgHum] = useState(0);
  const [loadingTelemetri, setLoadingTelemetri] = useState(true);
  const [loadingRotasi, setLoadingRotasi] = useState(true);

  if (!ROLES[role].allowed.includes("histori")) {
    return <AccessDenied role={role} feature="Histori Sensor" />;
  }

  useEffect(() => {
    const loadHistory = async () => {
      setLoadingTelemetri(true);
      try {
        const data = await fetchApi('/api/incubator/telemetry-logs');
        const reversed = [...data].reverse();
        setHistoryData(reversed);

        if (data.length > 0) {
          const sumTemp = data.reduce((acc, curr) => acc + curr.temperature, 0);
          const sumHum = data.reduce((acc, curr) => acc + curr.humidity, 0);
          setAvgTemp(sumTemp / data.length);
          setAvgHum(sumHum / data.length);
        }
      } catch (err) {
        console.error("Gagal memuat histori sensor:", err);
      } finally {
        setLoadingTelemetri(false);
      }
    };
    loadHistory();
  }, []);

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

  const tabs = [
    { id: "telemetri", label: "Telemetri Sensor", icon: "analytics" },
    { id: "rotasi", label: "Log Pembalikan Telur", icon: "rotate_right" },
  ];

  return (
    <div className="page-content space-y-6">
      <PageHeader
        eyebrow="Analitik Data"
        title="Histori Sensor & Telemetri"
        description="Rekaman riwayat pembacaan sensor DHT22 dan log pembalikan telur secara periodik."
      />

      <RoleNotice role={role} />

      {/* Stats cards (telemetri only) */}
      {activeTab === "telemetri" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="km-card p-5 bg-surface border-l-4 border-l-teal-iridescence">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-teal-iridescence">Rata-rata Suhu</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink-primary">{avgTemp > 0 ? avgTemp.toFixed(1) : "—"} °C</p>
            <p className="mt-0.5 font-body text-xs text-ink-secondary">Berdasarkan {historyData.length} rekaman tersimpan</p>
          </div>
          <div className="km-card p-5 bg-surface border-l-4 border-l-status-success">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-status-success">Rata-rata Kelembaban</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink-primary">{avgHum > 0 ? avgHum.toFixed(0) : "—"} %</p>
            <p className="mt-0.5 font-body text-xs text-ink-secondary">Berdasarkan {historyData.length} rekaman tersimpan</p>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-2xl border border-alpine-high bg-alpine-low p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 flex-1 justify-center rounded-xl px-4 py-2.5 font-body text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-teal-iridescence text-white shadow-sm"
                : "text-ink-secondary hover:text-ink-primary hover:bg-alpine-high"
            }`}
          >
            <Icon name={tab.icon} className="text-[18px]" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Telemetri Tab */}
      {activeTab === "telemetri" && (
        <SectionCard title={`Riwayat Telemetri Sensor (${historyData.length} Rekaman)`} noPadding>
          {loadingTelemetri ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-ink-secondary">
                <Icon name="hourglass_top" className="text-[20px] animate-spin" />
                <span className="font-body text-sm">Memuat data telemetri...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="km-table min-w-[700px]">
                <thead>
                  <tr>
                    <th>TIMESTAMP</th>
                    <th>SUHU (°C)</th>
                    <th>KELEMBABAN (%)</th>
                    <th>STATUS SUHU</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8">
                        <EmptyState
                          icon="analytics"
                          title="Data Kosong"
                          desc="Belum ada riwayat telemetri yang tercatat. Data akan muncul saat sensor MQTT mengirim bacaan."
                        />
                      </td>
                    </tr>
                  ) : (
                    historyData.map((row) => {
                      const tempOk = row.temperature >= 37.0 && row.temperature <= 38.5;
                      return (
                        <tr key={row.id}>
                          <td>
                            <span className="font-mono text-sm font-semibold">
                              {new Date(row.timestamp).toLocaleString("id-ID")}
                            </span>
                          </td>
                          <td>
                            <span className={`font-mono text-sm font-bold ${tempOk ? "text-status-success" : "text-status-dangerText"}`}>
                              {row.temperature.toFixed(1)}
                            </span>
                          </td>
                          <td>
                            <span className="font-mono text-sm">{row.humidity.toFixed(0)}</span>
                          </td>
                          <td>
                            <StatusBadge
                              label={tempOk ? "Normal" : "Di Luar Batas"}
                              variant={tempOk ? "success" : "danger"}
                              showIcon={false}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-4 bg-alpine-low border-t border-alpine-high text-center">
            <p className="font-body text-xs text-ink-secondary">
              Data telemetri disinkronisasi setiap 1 menit dari bacaan real-time sensor MQTT.
            </p>
          </div>
        </SectionCard>
      )}

      {/* Rotasi Tab */}
      {activeTab === "rotasi" && (
        <SectionCard title={`Log Pembalikan Telur (${rotationData.length} Entri)`} noPadding>
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
      )}
    </div>
  );
}
