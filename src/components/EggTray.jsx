import { useState, useEffect } from "react";
import EmptyState from "./EmptyState.jsx";
import { fetchApi } from "../utils/api.js";

function getSlotStyle(egg) {
  if (!egg) return "bg-alpine-low text-ink-outline border-alpine-high hover:border-ink-outline-variant";

  // Normalize: lowercase + ganti underscore ke spasi, agar cocok nilai DB ("Gagal Tetas", bukan "gagal_tetas")
  const akhir = String(egg.akhir || "").toLowerCase().replace(/_/g, " ").trim();
  const fertilitas = String(egg.fertilitas || "").toLowerCase().trim();

  // Prioritas 1: sudah menetas → hijau
  if (akhir === "menetas") return "bg-status-successBg text-status-successText border-status-success";
  // Prioritas 2: gagal atau infertil → merah
  if (akhir === "gagal tetas" || akhir === "dibuang" || fertilitas === "infertil")
    return "bg-status-dangerBg text-status-dangerText border-status-danger";
  // Prioritas 3: terkonfirmasi fertil dan masih proses → teal
  if (fertilitas === "fertil") return "bg-teal-container text-teal-containerText border-teal-container";
  // Prioritas 4: belum dicek / status tidak jelas → kuning
  return "bg-status-warningBg text-status-warningText border-status-warning";
}

const LEGEND = [
  { cls: "bg-teal-container border-teal-container", label: "Fertil / proses" },
  { cls: "bg-status-successBg border-status-success", label: "Menetas" },
  { cls: "bg-status-warningBg border-status-warning", label: "Belum dicek" },
  { cls: "bg-status-dangerBg border-status-danger", label: "Gagal / infertil" },
  { cls: "bg-alpine-low border-alpine-high", label: "Kosong" },
];

export default function EggTray() {
  const [eggs, setEggs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchApi("/api/eggs");
        if (mounted) setEggs(Array.isArray(data) ? data : []);
      } catch {
        // Gagal fetch, tampilkan kosong
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    // Refresh setiap 15 detik agar sinkron dengan EggPage
    const interval = setInterval(load, 15000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const bySlot = new Map(eggs.map((egg) => [Number(egg.slot), egg]));

  return (
    <section className="km-card p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-teal-iridescence">
            Visual Nampan
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold text-ink-primary">
            Nampan 50 Slot Telur
          </h2>
        </div>
        <span className="km-badge km-badge-neutral font-mono text-[10px]">50 SLOT</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-ink-secondary">
          <span className="material-symbols-outlined animate-spin mr-2 text-[18px]">autorenew</span>
          <span className="font-body text-sm">Memuat data telur...</span>
        </div>
      ) : (
        <>
          {/* Tray grid */}
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}
            role="grid"
            aria-label="Visual nampan 50 slot telur"
          >
            {Array.from({ length: 50 }, (_, i) => {
              const slot = i + 1;
              const egg = bySlot.get(slot);
              return (
                <div
                  key={slot}
                  title={
                    egg
                      ? `Slot ${slot}: ${egg.id} | ${egg.fertilitas} | ${egg.akhir}`
                      : `Slot ${slot} kosong`
                  }
                  role="gridcell"
                  aria-label={egg ? `Slot ${slot}: ${egg.fertilitas}` : `Slot ${slot} kosong`}
                  className={`flex aspect-square items-center justify-center rounded-lg border font-mono text-[9px] sm:text-[10px] font-bold transition-transform duration-100 hover:scale-110 cursor-default ${getSlotStyle(egg)}`}
                >
                  {slot}
                </div>
              );
            })}
          </div>

          {eggs.length === 0 && (
            <EmptyState
              icon="egg_alt"
              title="Belum ada telur"
              desc="Tambahkan telur melalui halaman Data Telur untuk mengisi nampan."
            />
          )}
        </>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {LEGEND.map(({ cls, label }) => (
          <span key={label} className="flex items-center gap-1.5 font-body text-xs text-ink-secondary">
            <span className={`h-3 w-3 rounded border ${cls}`} />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
