import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { ROLES, getMonthKey } from "../data/constants.js";

// Mock history data since there is no real DB
const mockHistoryData = [
  { time: "2026-07-09 10:00:00", temp: 37.5, hum: 45, lamp: "OFF", motor: "OFF" },
  { time: "2026-07-09 10:15:00", temp: 37.4, hum: 46, lamp: "ON", motor: "OFF" },
  { time: "2026-07-09 10:30:00", temp: 37.8, hum: 44, lamp: "OFF", motor: "OFF" },
  { time: "2026-07-09 10:45:00", temp: 37.7, hum: 45, lamp: "OFF", motor: "ON" },
  { time: "2026-07-09 11:00:00", temp: 37.6, hum: 45, lamp: "ON", motor: "OFF" },
];

export default function SensorHistoryPage({ role }) {
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
        <div className="km-card p-5 bg-surface">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-teal-iridescence">Rata-rata Suhu</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-ink-primary">37.6 °C</p>
          <p className="mt-0.5 font-body text-xs text-ink-secondary">Bulan ini</p>
        </div>
        <div className="km-card p-5 bg-surface">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-teal-iridescence">Rata-rata Kelembaban</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-ink-primary">45 %</p>
          <p className="mt-0.5 font-body text-xs text-ink-secondary">Bulan ini</p>
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
              {mockHistoryData.map((row, i) => (
                <tr key={i}>
                  <td>
                    <span className="font-mono text-sm font-semibold">{row.time}</span>
                  </td>
                  <td>
                    <span className="font-mono text-sm">{row.temp.toFixed(1)}</span>
                  </td>
                  <td>
                    <span className="font-mono text-sm">{row.hum}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-alpine-low border-t border-alpine-high text-center">
          <p className="font-body text-xs text-ink-secondary">
            Catatan: Karena keterbatasan implementasi tanpa backend database, data histori ini bersifat simulasi statis.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
