import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { ROLES, getMonthKey } from "../data/constants.js";
import { fetchApi } from "../utils/api.js";

export default function SensorHistoryPage({ role }) {
  const [historyData, setHistoryData] = useState([]);
  const [avgTemp, setAvgTemp] = useState(0);
  const [avgHum, setAvgHum] = useState(0);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchApi('/api/incubator/telemetry-logs');
        setHistoryData(data.reverse()); // latest first or based on API order
        
        if (data.length > 0) {
          const sumTemp = data.reduce((acc, curr) => acc + curr.temperature, 0);
          const sumHum = data.reduce((acc, curr) => acc + curr.humidity, 0);
          setAvgTemp(sumTemp / data.length);
          setAvgHum(sumHum / data.length);
        }
      } catch (err) {
        console.error("Gagal memuat histori sensor:", err);
      }
    };
    loadHistory();
  }, []);

  if (!ROLES[role].allowed.includes("histori")) {
    return <AccessDenied role={role} feature="Histori Sensor" />;
  }

  return (
    <div className="page-content space-y-6">
      <PageHeader
        eyebrow="Analitik Data"
        title="Histori Sensor & Telemetri"
        description="Rekaman riwayat pembacaan sensor DHT22 dan status aktuator setiap 15 menit."
      />

      <RoleNotice role={role} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="km-card p-5 bg-surface border-l-4 border-l-teal-iridescence">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-teal-iridescence">Rata-rata Suhu</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-ink-primary">{avgTemp > 0 ? avgTemp.toFixed(1) : "-"} °C</p>
          <p className="mt-0.5 font-body text-xs text-ink-secondary">Berdasarkan data tersimpan</p>
        </div>
        <div className="km-card p-5 bg-surface border-l-4 border-l-status-success">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-status-success">Rata-rata Kelembaban</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-ink-primary">{avgHum > 0 ? avgHum.toFixed(0) : "-"} %</p>
          <p className="mt-0.5 font-body text-xs text-ink-secondary">Berdasarkan data tersimpan</p>
        </div>
      </div>

      <SectionCard title="Tabel Riwayat Telemetri" noPadding>
        <div className="overflow-x-auto">
          <table className="km-table min-w-[700px]">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>SUHU (°C)</th>
                <th>KELEMBABAN (%)</th>
              </tr>
            </thead>
            <tbody>
              {historyData.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-8">
                    <EmptyState
                      icon="analytics"
                      title="Data Kosong"
                      desc="Belum ada riwayat telemetri yang tercatat."
                    />
                  </td>
                </tr>
              ) : (
                historyData.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="font-mono text-sm font-semibold">{new Date(row.timestamp).toLocaleString("id-ID")}</span>
                    </td>
                    <td>
                      <span className="font-mono text-sm">{row.temperature.toFixed(1)}</span>
                    </td>
                    <td>
                      <span className="font-mono text-sm">{row.humidity.toFixed(0)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-alpine-low border-t border-alpine-high text-center">
          <p className="font-body text-xs text-ink-secondary">
            Data telemetri disinkronisasi setiap 1 menit dari bacaan real-time.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
