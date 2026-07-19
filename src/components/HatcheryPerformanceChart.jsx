import { useMemo } from "react";
import Icon from "./Icon.jsx";

export default function HatcheryPerformanceChart({ eggs }) {
  // Hitung statistik performa penangkaran secara real-time
  const stats = useMemo(() => {
    const total = eggs.length;
    const menetas = eggs.filter((e) => e.akhir === "menetas").length;
    const gagal = eggs.filter((e) => e.akhir === "gagal_tetas" || e.fertilitas === "infertil").length;
    const proses = eggs.filter((e) => e.akhir === "proses" && e.fertilitas !== "infertil").length;
    
    // Hitung persentase keberhasilan (Hatch Rate) dari telur yang sudah selesai diinkubasi
    const selesai = menetas + gagal;
    const successRate = selesai > 0 ? (menetas / selesai) * 100 : 0;

    return { total, menetas, gagal, proses, successRate };
  }, [eggs]);

  // Donut chart calculations (circumference for radius 50 is ~314.16)
  const radius = 50;
  const strokeWidth = 14;
  const circ = 2 * Math.PI * radius; // 314.159
  
  // Hitung panjang busur segmen donut
  const menetasShare = stats.total > 0 ? (stats.menetas / stats.total) * circ : 0;
  const gagalShare = stats.total > 0 ? (stats.gagal / stats.total) * circ : 0;
  const prosesShare = stats.total > 0 ? (stats.proses / stats.total) * circ : 0;
  const emptyShare = stats.total === 0 ? circ : 0;

  // Offsets
  const menetasOffset = 0;
  const gagalOffset = -menetasShare;
  const prosesOffset = -(menetasShare + gagalShare);

  return (
    <section className="km-card p-6 bg-surface">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-alpine-high/60 pb-4">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-teal-iridescence">
            Kontrol Diagram
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold text-ink-primary">
            Performa Penangkaran Total
          </h2>
          <p className="mt-0.5 font-body text-xs text-ink-secondary">
            Statistik keberhasilan penetasan telur berdasarkan batch aktif inkubator.
          </p>
        </div>
        <span className="km-badge km-badge-teal font-mono text-[10px]">ADMIN ONLY</span>
      </div>

      <div className="grid gap-6 md:grid-cols-[200px_1fr] items-center">
        {/* Left side: Premium SVG Donut Chart */}
        <div className="relative flex justify-center items-center">
          <svg width="180" height="180" viewBox="0 0 140 140" className="transform -rotate-90 select-none">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="var(--alpine-low)"
              strokeWidth={strokeWidth}
            />
            {stats.total > 0 ? (
              <>
                {/* Segmen Menetas (Green) */}
                {menetasShare > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#00725e"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${menetasShare} ${circ - menetasShare}`}
                    strokeDashoffset={menetasOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                )}
                {/* Segmen Gagal/Infertil (Red) */}
                {gagalShare > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#93000a"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${gagalShare} ${circ - gagalShare}`}
                    strokeDashoffset={gagalOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                )}
                {/* Segmen Dalam Proses (Yellow) */}
                {prosesShare > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#ffdea5"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${prosesShare} ${circ - prosesShare}`}
                    strokeDashoffset={prosesOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                )}
              </>
            ) : (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="var(--alpine-high)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circ} 0`}
                className="transition-all duration-500 ease-out"
              />
            )}
          </svg>
          
          {/* Donut Center Info */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="font-display text-2xl font-extrabold text-ink-primary">
              {stats.successRate.toFixed(0)}%
            </span>
            <span className="font-mono text-[9px] font-bold text-ink-outline uppercase tracking-wider">
              Hatch Rate
            </span>
          </div>
        </div>

        {/* Right side: Key Metric Stats */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Card Total */}
          <div className="p-4 rounded-xl border border-alpine-high bg-alpine-low/60 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-alpine-container flex items-center justify-center text-ink-secondary">
              <span className="material-symbols-outlined text-[18px]">egg</span>
            </div>
            <div>
              <p className="font-body text-[10px] text-ink-outline uppercase tracking-wider">Total Telur</p>
              <p className="font-display text-lg font-bold text-ink-primary">{stats.total} Butir</p>
            </div>
          </div>

          {/* Card Menetas */}
          <div className="p-4 rounded-xl border border-alpine-high bg-status-success-bg/30 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-status-success-bg flex items-center justify-center text-status-success-text">
              <span className="material-symbols-outlined text-[18px]">egg_alt</span>
            </div>
            <div>
              <p className="font-body text-[10px] text-status-success-text uppercase tracking-wider">Menetas (Sukses)</p>
              <p className="font-display text-lg font-bold text-status-success-text">{stats.menetas} Butir</p>
            </div>
          </div>

          {/* Card Gagal */}
          <div className="p-4 rounded-xl border border-alpine-high bg-status-danger-bg/30 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-status-danger-bg flex items-center justify-center text-status-danger-text">
              <span className="material-symbols-outlined text-[18px]">gavel</span>
            </div>
            <div>
              <p className="font-body text-[10px] text-status-danger-text uppercase tracking-wider">Gagal / Infertil</p>
              <p className="font-display text-lg font-bold text-status-danger-text">{stats.gagal} Butir</p>
            </div>
          </div>

          {/* Card Proses */}
          <div className="p-4 rounded-xl border border-alpine-high bg-amber-500/10 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
            </div>
            <div>
              <p className="font-body text-[10px] text-amber-600 uppercase tracking-wider">Masih Proses</p>
              <p className="font-display text-lg font-bold text-amber-700">{stats.proses} Butir</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
