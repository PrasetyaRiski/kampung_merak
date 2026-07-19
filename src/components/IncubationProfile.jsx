import { VARIETAS } from "../data/constants.js";

export default function IncubationProfile({ variety }) {
  const item = VARIETAS[variety];

  const infoItems = [
    { label: "Masa inkubasi", value: item.masa },
    { label: "Candling pertama", value: item.candling },
    { label: "Target suhu", value: item.suhuIdeal },
    { label: "Target kelembaban", value: item.kelembabanIdeal },
  ];

  return (
    <section
      className="km-card p-4 sm:p-6 transition-all duration-500"
      style={{ borderColor: `${item.accent}40` }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ color: item.accent }}
          >
            Profil Inkubasi Aktif
          </p>
          <h2 className="mt-1.5 font-display text-xl font-extrabold text-ink-primary">
            {item.label}{" "}
            <span className="font-body text-base font-normal italic text-ink-secondary">
              ({item.latin})
            </span>
          </h2>
          <p className="mt-1 font-body text-sm text-ink-secondary">
            Batch aktif{" "}
            <span className="font-mono font-bold text-ink-primary">{item.batch}</span>
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-3.5 py-1.5 font-body text-xs font-bold"
          style={{ backgroundColor: item.accentSoft, color: item.chipText }}
        >
          Profil batch aktif
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {infoItems.map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-alpine-low px-3.5 py-3">
            <p className="font-body text-[10px] text-ink-secondary uppercase tracking-wide">
              {label}
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-ink-primary">{value}</p>
          </div>
        ))}
      </div>

      <div
        className="mt-4 rounded-xl p-4 transition-colors duration-500"
        style={{ backgroundColor: variety === "hijau" ? "#e7fbf5" : "#0b2b26" }}
      >
        <p
          className="font-body text-sm leading-6 transition-colors duration-500"
          style={{ color: variety === "hijau" ? "#005142" : "#d8fff6" }}
        >
          {item.ringkasan}
        </p>
      </div>
    </section>
  );
}
