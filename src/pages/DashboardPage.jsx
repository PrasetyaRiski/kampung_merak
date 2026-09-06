import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RoleNotice from "../components/RoleNotice.jsx";
import StatCard from "../components/StatCard.jsx";
import IncubationTrendChart from "../components/IncubationTrendChart.jsx";
import HatcheryPerformanceChart from "../components/HatcheryPerformanceChart.jsx";
import IncubationProfile from "../components/IncubationProfile.jsx";
import AlertPanel from "../components/AlertPanel.jsx";
import EggTray from "../components/EggTray.jsx";
import SystemLogs from "../components/SystemLogs.jsx";
import VarietyToggle from "../components/VarietyToggle.jsx";
import { formatNumber, VARIETAS } from "../data/constants.js";
import { fetchApi } from "../utils/api.js";

export default function DashboardPage({
  role,
  telemetry,
  connection,
  mqttUrl,
  clientId,
  temperatureTrend,
  humidityTrend,
  activeVariety,
  setActiveVariety,
  publish,
  eggs,
  logs
}) {
  const [summary, setSummary] = useState(null);
  const [incubatorStatus, setIncubatorStatus] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await fetchApi('/api/dashboard/summary');
        setSummary(data);
      } catch (err) {
        console.warn("Dashboard summary belum login atau error:", err.message);
      }
      try {
        const statusData = await fetchApi('/api/incubator/status');
        setIncubatorStatus(statusData);
      } catch (err) {
        console.warn("Status inkubator API gagal:", err.message);
      }
    };
    loadDashboard();
  }, []);

  const financeSummary = summary?.finance_summary;

  const isMqttConnected = connection.status === "connected" && telemetry.temperature != null;
  const currentTemp = telemetry.temperature ?? (incubatorStatus?.suhu_sekarang != null ? Number(incubatorStatus.suhu_sekarang) : null);
  const currentHum = telemetry.humidity ?? (incubatorStatus?.kelembapan_sekarang != null ? Number(incubatorStatus.kelembapan_sekarang) : null);

  const isTempIdeal = currentTemp != null && currentTemp >= 37.5 && currentTemp <= 38.0;
  const isHumIdeal = currentHum != null && currentHum >= 45 && currentHum <= 50;

  const tempState = currentTemp == null
    ? "waiting"
    : isTempIdeal
      ? "ideal"
      : (currentTemp < 36.5 || currentTemp > 39.0) ? "danger" : "warning";

  const humState = currentHum == null
    ? "waiting"
    : isHumIdeal
      ? "ideal"
      : (currentHum < 40 || currentHum > 60) ? "danger" : "warning";

  const tempNote = telemetry.temperature != null
    ? "Topik: iot/telemetry/temperature (Live MQTT)"
    : incubatorStatus?.suhu_sekarang != null
      ? "Data Terakhir Database (REST API)"
      : "Menunggu data sensor MQTT...";

  const humNote = telemetry.humidity != null
    ? "Topik: iot/telemetry/humidity (Live MQTT)"
    : incubatorStatus?.kelembapan_sekarang != null
      ? "Data Terakhir Database (REST API)"
      : "Menunggu data sensor MQTT...";

  const tempUpdatedAt = connection.lastTelemetryAt
    ? new Date(connection.lastTelemetryAt).toLocaleTimeString("id-ID")
    : incubatorStatus?.terakhir_rotasi
      ? "DB: " + new Date(incubatorStatus.terakhir_rotasi).toLocaleTimeString("id-ID")
      : null;

  return (
    <div className="page-content space-y-6">
      <PageHeader
        eyebrow="Dashboard Utama"
        title="Monitoring Inkubator"
        description="Ringkasan metrik real-time, status aktuator, dan visualisasi kondisi inkubator secara keseluruhan."
      />

      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-alpine-high bg-surface px-5 py-4 shadow-sm transition-all duration-500"
        style={{
          borderColor: `${VARIETAS[activeVariety]?.accent ?? "#0f766e"}33`,
          borderLeftWidth: "6px",
          borderLeftColor: VARIETAS[activeVariety]?.accent ?? "#0f766e",
        }}
      >
        <div className="pl-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-secondary">Profil aktif</p>
          <p className="font-display text-lg font-semibold text-ink-primary">{VARIETAS[activeVariety]?.label ?? "Merak Hijau"}</p>
          <p className="text-sm text-ink-secondary">Batch {VARIETAS[activeVariety]?.batch ?? "MRK-2026-H1"}</p>
        </div>
        <VarietyToggle activeVariety={activeVariety} setActiveVariety={setActiveVariety} />
      </div>
      
      <RoleNotice role={role} />
      
      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon="thermostat"
          title="Suhu Inkubator"
          value={formatNumber(currentTemp)}
          unit="°C"
          target="Ideal: 37.5 - 38.0 °C"
          note={tempNote}
          state={tempState}
          updatedAt={tempUpdatedAt}
        />
        <StatCard
          icon="water_drop"
          title="Kelembaban"
          value={formatNumber(currentHum, currentHum != null && currentHum % 1 !== 0 ? 1 : 0)}
          unit="%"
          target="Ideal: 45 - 50 %"
          note={humNote}
          state={humState}
          updatedAt={tempUpdatedAt}
        />
      </div>

      {(() => {
        const activeEggsCount = Array.isArray(eggs)
          ? eggs.filter(e => e.akhir !== "Gagal" && e.akhir !== "Menetas").length
          : 0;
        const hatchedChicksCount = Array.isArray(eggs)
          ? eggs.filter(e => e.akhir === "Menetas").length
          : 0;
        const totalAktif = summary?.total_telur_aktif ?? activeEggsCount;
        const totalAnakan = summary?.total_anakan_bulan_ini ?? hatchedChicksCount;

        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="km-card p-5 bg-surface border-l-4 border-l-teal-iridescence">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-teal-iridescence">Total Telur Aktif</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-ink-primary">{totalAktif}</p>
              <p className="mt-0.5 font-body text-xs text-ink-secondary">Dalam Mesin Inkubator</p>
            </div>
            <div className="km-card p-5 bg-surface border-l-4 border-l-status-success">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-status-success">Total Anakan Bulan Ini</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-ink-primary">{totalAnakan}</p>
              <p className="mt-0.5 font-body text-xs text-ink-secondary">Menetas Sukses</p>
            </div>
          </div>
        );
      })()}

      {financeSummary && (() => {
        const totalPemasukan = financeSummary.total_pemasukan ?? 0;
        const totalPengeluaran = financeSummary.total_pengeluaran ?? 0;
        const labaBersih = (financeSummary.laba_bersih != null && financeSummary.laba_bersih !== 0)
          ? financeSummary.laba_bersih
          : (totalPemasukan - totalPengeluaran);
        const isSurplus = labaBersih >= 0;

        return (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="km-card p-5 bg-surface border-l-4 border-l-teal-iridescence">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-teal-iridescence">Total Pemasukan</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-ink-primary">
                Rp {totalPemasukan.toLocaleString("id-ID")}
              </p>
              <p className="mt-0.5 font-body text-xs text-ink-secondary">Dari semua penjualan</p>
            </div>
            <div className="km-card p-5 bg-surface border-l-4 border-l-status-dangerText">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-status-dangerText">Total Pengeluaran</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-ink-primary">
                Rp {totalPengeluaran.toLocaleString("id-ID")}
              </p>
              <p className="mt-0.5 font-body text-xs text-ink-secondary">Total biaya operasional</p>
            </div>
            <div className={`km-card p-5 bg-surface border-l-4 ${
              isSurplus ? "border-l-status-success" : "border-l-status-dangerText"
            }`}>
              <p className={`font-mono text-[11px] font-bold uppercase tracking-[0.14em] ${
                isSurplus ? "text-status-success" : "text-status-dangerText"
              }`}>Laba Bersih</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-ink-primary">
                Rp {Math.abs(labaBersih).toLocaleString("id-ID")}
              </p>
              <p className="mt-0.5 font-body text-xs text-ink-secondary">
                {isSurplus ? "Surplus" : "Defisit"}
              </p>
            </div>
          </div>
        );
      })()}

      <IncubationTrendChart
        trend={temperatureTrend}
        humidityTrend={humidityTrend}
        isConnected={isMqttConnected}
        currentTemp={currentTemp}
        currentHum={currentHum}
      />
      
      {role === "admin" && <HatcheryPerformanceChart eggs={eggs} />}
      
      {/* Baris atas: Profil Inkubasi + Log Sistem */}
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <IncubationProfile variety={activeVariety} />
        <div>
          <SystemLogs logs={logs} />
        </div>
      </div>

      {/* Baris bawah: Alert Operasional + Nampan Telur (sejajar) */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <AlertPanel
          role={role}
          publish={publish}
        />
        <EggTray eggs={eggs} />
      </div>
    </div>
  );
}
