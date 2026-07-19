import { useState } from "react";
import { VARIETAS, VARIETAS_BENCHMARK } from "../data/constants.js";
import Icon from "./Icon.jsx";

export default function VarietyToggle({ activeVariety, setActiveVariety, className = "" }) {
  const [showBenchmark, setShowBenchmark] = useState(false);
  const item = VARIETAS[activeVariety];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toggle Buttons Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Variety Selection Pill */}
        <div className="inline-flex items-center gap-1 rounded-full border border-alpine-high bg-alpine-low/80 p-1 shadow-sm backdrop-blur">
          {Object.entries(VARIETAS).map(([key, v]) => {
            const active = activeVariety === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveVariety(key)}
                className={`relative rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 ${
                  active ? "shadow-md" : "hover:bg-alpine-container/50 text-ink-secondary hover:text-ink-primary"
                }`}
                style={active ? { backgroundColor: v.accent, color: "#fff" } : {}}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        {/* Benchmark Button */}
        <button
          type="button"
          onClick={() => setShowBenchmark((p) => !p)}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 border shadow-sm ${
            showBenchmark
              ? "bg-forest-midnight border-forest-midnight text-white dark:bg-teal-container dark:border-teal-container dark:text-ink-primary"
              : "bg-surface border-alpine-high text-ink-secondary hover:bg-alpine-container/50 hover:text-ink-primary"
          }`}
          title="Lihat perbandingan kedua varietas"
        >
          <Icon name="compare_arrows" className="text-[14px]" />
          Benchmark
        </button>
      </div>

      {/* Info Ringkas Varietas Aktif + Gambar */}
      <div
        className="rounded-xl border p-4 transition-all duration-500"
        style={{
          borderColor: `${item.accent}40`,
          background: `linear-gradient(135deg, ${item.accentSoft}20 0%, var(--surface) 100%)`,
        }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Gambar Merak */}
          {item.image && (
            <div className="shrink-0 overflow-hidden rounded-xl shadow-md" style={{ width: 160, height: 120 }}>
              <img
                src={item.image}
                alt={item.label}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                loading="lazy"
              />
            </div>
          )}
          {/* Info Teks */}
          <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left w-full">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Icon name="eco" className="text-[16px]" style={{ color: item.accent }} />
              <span className="font-display text-base font-bold text-ink-primary">{item.label}</span>
              <span className="font-body text-xs italic text-ink-secondary">({item.latin})</span>
              <span
                className="shrink-0 rounded-full px-3 py-1 font-body text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: item.accentSoft, color: item.chipText }}
              >
                {item.batch}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 font-body text-xs text-ink-secondary">
              <span className="flex items-center gap-1">
                <Icon name="location_on" className="text-[12px]" /> {item.asal}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="shield" className="text-[12px]" /> {item.statusKonservasi}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="straighten" className="text-[12px]" /> {item.ukuran}
              </span>
            </div>
            <p className="font-body text-xs leading-relaxed text-ink-secondary max-w-xl mx-auto sm:mx-0">{item.ciriFisik}</p>
          </div>
        </div>
      </div>

      {/* Tabel Benchmark */}
      {showBenchmark && (
        <div className="overflow-hidden rounded-xl border border-alpine-high bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-alpine-high bg-alpine-low px-4 py-2.5">
            <h3 className="font-display text-sm font-bold text-ink-primary">
              Perbandingan Varietas Merak
            </h3>
            <button
              type="button"
              onClick={() => setShowBenchmark(false)}
              className="text-ink-secondary hover:text-ink-primary"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-alpine-high bg-alpine-low/60">
                  <th className="px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                    Aspek
                  </th>
                  <th className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7fbf5] dark:bg-[#003d30] px-2.5 py-0.5 font-body text-xs font-bold text-[#006b58] dark:text-[#6cfad7]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#006b58] dark:bg-[#6cfad7]" />
                      Merak Hijau
                    </span>
                  </th>
                  <th className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d8fff6] dark:bg-[#002e3b] px-2.5 py-0.5 font-body text-xs font-bold text-[#0e7490] dark:text-[#7dd4e8]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#4addbb]" />
                      Merak Biru
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {VARIETAS_BENCHMARK.map((row, idx) => {
                  const isDiff = row.hijau !== row.biru;
                  return (
                    <tr
                      key={row.label}
                      className={`transition-colors ${
                        idx % 2 === 0 ? "bg-surface" : "bg-alpine-low/40"
                      } ${isDiff ? "border-l-2 border-l-teal-400" : ""}`}
                    >
                      <td className="px-4 py-2.5 font-body text-xs font-semibold text-ink-primary">
                        {row.label}
                        {isDiff && (
                          <span className="ml-1.5 inline-block rounded bg-teal-100 dark:bg-teal-900/40 px-1.5 py-0.5 font-mono text-[9px] font-bold text-teal-700 dark:text-teal-400">
                            BERBEDA
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-body text-xs text-ink-secondary">{row.hijau}</td>
                      <td className="px-4 py-2.5 font-body text-xs text-ink-secondary">{row.biru}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-alpine-high bg-alpine-low/60 px-4 py-2.5">
            <p className="font-body text-[10px] text-ink-secondary">
              Baris yang berlabel <span className="font-bold text-teal-600 dark:text-teal-400">BERBEDA</span> menunjukkan perbedaan antara kedua varietas. Parameter inkubasi (suhu, kelembaban, candling) saat ini menggunakan standar yang sama untuk kedua batch.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}