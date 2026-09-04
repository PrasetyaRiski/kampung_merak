import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RoleNotice from "../components/RoleNotice.jsx";
import StatCard from "../components/StatCard.jsx";
import IncubationTrendChart from "../components/IncubationTrendChart.jsx";
import HatcheryPerformanceChart from "../components/HatcheryPerformanceChart.jsx";
import IncubationProfile from "../components/IncubationProfile.jsx";
import AlertPanel from "../components/AlertPanel.jsx";
import EggTray from "../components/EggTray.jsx";
import EmergencyControlPanel from "../components/EmergencyControlPanel.jsx";
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
  activeVariety,
  setActiveVariety,
  publish,
  eggs,
  logs
}) {
  const [summary, setSummary] = useState(null);
  const [financeSummary, setFinanceSummary] = useState(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await fetchApi('/api/dashboard/summary');
        setSummary(data);
      } catch (err) {
        console.error("Gagal memuat dashboard summary", err);
      }
    };
    const loadFinanceSummary = async () => {
      try {
        const data = await fetchApi('/api/finance/summary');
        setFinanceSummary(data);
      } catch (err) {
        // Finance summary may require login, silently fail
        console.warn("Finance summary tidak tersedia (login diperlukan?):", err.message);
      }
    };
    loadSummary();
    loadFinanceSummary();
  }, []);

  const isTempIdeal = telemetry.temperature >= 37.5 && telemetry.temperature <= 38.0;
  const isHumIdeal = telemetry.humidity >= 45 && telemetry.humidity <= 50;

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
          value={formatNumber(telemetry.temperature)}
          unit="°C"
          target="Ideal: 37.5 - 38.0 °C"
          note="Topik: iot/telemetry/temperature"
          state={isTempIdeal ? "ideal" : "danger"}
          updatedAt={connection.lastTelemetryAt ? new Date(connection.lastTelemetryAt).toLocaleTimeString("id-ID") : null}
        />
        <StatCard
          icon="water_drop"
          title="Kelembaban"
          value={formatNumber(telemetry.humidity, 0)}
          unit="%"
          target="Ideal: 45 - 50 %"
          note="Topik: iot/telemetry/humidity"
          state={isHumIdeal ? "ideal" : "warning"}
          updatedAt={connection.lastTelemetryAt ? new Date(connection.lastTelemetryAt).toLocaleTimeString("id-ID") : null}
        />
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="km-card p-5 bg-surface border-l-4 border-l-teal-iridescence">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-teal-iridescence">Total Telur Aktif</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink-primary">{summary.total_telur_aktif}</p>
            <p className="mt-0.5 font-body text-xs text-ink-secondary">Dalam Mesin Inkubator</p>
          </div>
          <div className="km-card p-5 bg-surface border-l-4 border-l-status-success">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-status-success">Total Anakan Bulan Ini</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink-primary">{summary.total_anakan_bulan_ini}</p>
            <p className="mt-0.5 font-body text-xs text-ink-secondary">Menetas Sukses</p>
          </div>
        </div>
      )}

      {financeSummary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="km-card p-5 bg-surface border-l-4 border-l-teal-iridescence">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-teal-iridescence">Total Pemasukan</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink-primary">
              Rp {(financeSummary.total_pemasukan ?? 0).toLocaleString("id-ID")}
            </p>
            <p className="mt-0.5 font-body text-xs text-ink-secondary">Dari semua penjualan</p>
          </div>
          <div className="km-card p-5 bg-surface border-l-4 border-l-status-dangerText">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-status-dangerText">Total Pengeluaran</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink-primary">
              Rp {(financeSummary.total_pengeluaran ?? 0).toLocaleString("id-ID")}
            </p>
            <p className="mt-0.5 font-body text-xs text-ink-secondary">Total biaya operasional</p>
          </div>
          <div className={`km-card p-5 bg-surface border-l-4 ${
            (financeSummary.laba_bersih ?? 0) >= 0
              ? "border-l-status-success"
              : "border-l-status-dangerText"
          }`}>
            <p className={`font-mono text-[11px] font-bold uppercase tracking-[0.14em] ${
              (financeSummary.laba_bersih ?? 0) >= 0 ? "text-status-success" : "text-status-dangerText"
            }`}>Laba Bersih</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink-primary">
              Rp {Math.abs(financeSummary.laba_bersih ?? 0).toLocaleString("id-ID")}
            </p>
            <p className="mt-0.5 font-body text-xs text-ink-secondary">
              {(financeSummary.laba_bersih ?? 0) >= 0 ? "Surplus" : "Defisit"}
            </p>
          </div>
        </div>
      )}

      <IncubationTrendChart trend={temperatureTrend} />
      
      {role === "admin" && <HatcheryPerformanceChart eggs={eggs} />}
      
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <IncubationProfile variety={activeVariety} />
          <AlertPanel
            role={role}
            publish={publish}
          />
          <EggTray eggs={eggs} />
        </div>
        <div className="space-y-6">
          <EmergencyControlPanel telemetry={telemetry} publish={publish} role={role} />
          <SystemLogs logs={logs} />
        </div>
      </div>
    </div>
  );
}
