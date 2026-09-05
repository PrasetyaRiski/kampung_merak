import Icon from "./Icon.jsx";

const NAV_OPERASIONAL = [
  { id: "dashboard", label: "Dashboard Inkubator", icon: "dashboard" },
  { id: "kamera", label: "Kamera CCTV Bardi", icon: "videocam" },
  { id: "telur", label: "Data Telur & Slot", icon: "egg_alt" },
  { id: "indukan", label: "Data Indukan Merak", icon: "pets" },
  { id: "anakan", label: "Data Anakan Menetas", icon: "child_care" },
  { id: "katalog", label: "Katalog Siap Adopsi", icon: "shopping_bag" },
];

const NAV_SISTEM = [
  { id: "penjualan", label: "Penjualan Telur", icon: "shopping_cart" },
  { id: "finance", label: "Arus Kas Keuangan", icon: "account_balance_wallet" },
  { id: "histori", label: "Histori Telemetri Sensor", icon: "monitoring" },
  { id: "pengaturan", label: "Pengaturan Sistem", icon: "settings" },
];

export default function Footer({ onPageChange }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-auto border-t transition-colors duration-500"
      style={{
        borderColor: "var(--alpine-high)",
        backgroundColor: "var(--surface)",
        color: "var(--ink-secondary)",
      }}
    >
      {/* ── Banner Visi & Konsep Ndalem Kerto ── */}
      <div
        className="border-b px-4 sm:px-6 lg:px-8 py-6"
        style={{
          borderColor: "var(--alpine-high)",
          backgroundColor: "var(--alpine-low)",
        }}
      >
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-iridescence text-white shadow-sm">
              <Icon name="nature_people" className="text-[22px]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-teal-iridescence">
                  Visi Eduwisata Ndalem Kerto
                </p>
                <span className="rounded-md bg-teal-container/40 px-2 py-0.5 font-mono text-[9px] font-bold text-teal-containerText">
                  Bermain & Belajar di Alam
                </span>
              </div>
              <p className="mt-1 font-display text-base sm:text-lg font-bold text-ink-primary italic">
                &ldquo;Menjadi tempat belajar dan berwisata untuk mengenal alam dan kebesaran-Nya.&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <a
              href="https://ndalemkerto.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all hover:scale-105 shadow-sm"
              style={{
                backgroundColor: "var(--teal-iridescence)",
                color: "#ffffff",
              }}
              title="Kunjungi website resmi Ndalem Kerto"
            >
              <Icon name="public" className="text-[16px]" />
              <span>Kunjungi ndalemkerto.com</span>
              <Icon name="open_in_new" className="text-[13px]" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Konten Utama 3 Kolom ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {/* Kolom 1: Tentang Eduwisata Ndalem Kerto */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white shadow-sm border border-alpine-high">
                <img
                  src="/logo.png"
                  alt="Logo Ndalem Kerto"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p
                  className="font-display text-[17px] font-extrabold leading-tight"
                  style={{ color: "var(--teal-iridescence)" }}
                >
                  Ndalem Kerto
                </p>
                <p
                  className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "var(--ink-outline)" }}
                >
                  Eduwisata & Penangkaran Merak
                </p>
              </div>
            </div>

            <p className="font-body text-xs leading-relaxed mb-3 text-justify" style={{ color: "var(--ink-secondary)" }}>
              Perpaduan agrowisata jambu kristal (Tono Farm sejak 2017), penangkaran merak, dan
              Pusat Pelatihan Pertanian Perdesaan Swadaya (P4S) Karya Makmur di area seluas 1.700 m².
            </p>
            <p className="font-body text-xs leading-relaxed mb-4 text-justify" style={{ color: "var(--ink-secondary)" }}>
              Satu-satunya tempat edukasi dan penangkaran <b>Merak Hijau (<i>Pavo muticus</i>)</b> di Ponorogo yang
              berperan penting mendukung keberlanjutan dan kelestarian kesenian <b>Reog Ponorogo</b>.
            </p>

            <div className="flex flex-col gap-1.5 font-mono text-[11px]" style={{ color: "var(--ink-outline)" }}>
              <span className="flex items-center gap-1.5">
                <Icon name="verified" className="text-[14px] text-teal-iridescence" />
                P4S Karya Makmur Kementan
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="forest" className="text-[14px] text-status-success" />
                Area Terpadu 1.700 m²
              </span>
            </div>
          </div>

          {/* Kolom 2: 4 Pilar Misi Ndalem Kerto */}
          <div>
            <p
              className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] mb-4"
              style={{ color: "var(--teal-iridescence)" }}
            >
              4 Pilar Misi Eduwisata
            </p>
            <ul className="space-y-3 font-body text-xs">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-alpine-low text-teal-iridescence mt-0.5">
                  <Icon name="school" className="text-[13px]" />
                </span>
                <div>
                  <strong className="text-ink-primary block">Fasilitas Pembelajaran</strong>
                  <span className="text-ink-secondary text-[11px] leading-tight block">
                    PAUD s.d. Perguruan Tinggi (Kurikulum Merdeka, Magang, KKN, &amp; PKL).
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-alpine-low text-teal-iridescence mt-0.5">
                  <Icon name="eco" className="text-[13px]" />
                </span>
                <div>
                  <strong className="text-ink-primary block">Produk Unggulan Desa</strong>
                  <span className="text-ink-secondary text-[11px] leading-tight block">
                    Agrowisata Jambu Kristal Tono Farm, olahan buah, dan UMKM desa.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-alpine-low text-teal-iridescence mt-0.5">
                  <Icon name="theater_comedy" className="text-[13px]" />
                </span>
                <div>
                  <strong className="text-ink-primary block">Konservasi Reog Ponorogo</strong>
                  <span className="text-ink-secondary text-[11px] leading-tight block">
                    Pelestarian budaya Reog lewat penangkaran merak hijau legal &amp; mandiri.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-alpine-low text-teal-iridescence mt-0.5">
                  <Icon name="diversity_3" className="text-[13px]" />
                </span>
                <div>
                  <strong className="text-ink-primary block">Sustainable Tourism</strong>
                  <span className="text-ink-secondary text-[11px] leading-tight block">
                    Pemberdayaan mitra peternak (sapi &amp; kambing) serta pelestarian lingkungan.
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Lokasi, Fasilitas & Navigasi */}
          <div>
            <p
              className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] mb-4"
              style={{ color: "var(--teal-iridescence)" }}
            >
              Lokasi &amp; Fasilitas
            </p>

            {/* Kotak Alamat */}
            <div
              className="rounded-xl p-3 mb-4"
              style={{
                backgroundColor: "var(--alpine-low)",
                border: "1px solid var(--alpine-high)",
              }}
            >
              <div className="flex items-start gap-2">
                <Icon name="location_on" className="text-[16px] text-teal-iridescence mt-0.5 shrink-0" />
                <div className="font-body text-xs">
                  <p className="font-bold text-ink-primary">Dusun Gentan, Desa Ngrupit</p>
                  <p className="text-ink-secondary text-[11px] mt-0.5">
                    Kecamatan Jenangan, Kabupaten Ponorogo, Jawa Timur, Indonesia.
                  </p>
                </div>
              </div>
            </div>

            <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink-outline mb-2">
              Navigasi Cepat Sistem:
            </p>
            <div className="grid grid-cols-2 gap-1.5 font-body text-xs">
              {NAV_OPERASIONAL.slice(0, 4).map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onPageChange?.(id)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-ink-secondary hover:text-teal-iridescence hover:bg-alpine-low transition-colors"
                >
                  <Icon name={icon} className="text-[14px] shrink-0 opacity-70" />
                  <span className="truncate text-[11px]">{label}</span>
                </button>
              ))}
              {NAV_SISTEM.slice(0, 2).map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onPageChange?.(id)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-ink-secondary hover:text-teal-iridescence hover:bg-alpine-low transition-colors"
                >
                  <Icon name={icon} className="text-[14px] shrink-0 opacity-70" />
                  <span className="truncate text-[11px]">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar: Copyright & Attribution ── */}
      <div
        className="border-t"
        style={{ borderColor: "var(--alpine-high)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-center text-xs">
          <p className="font-body text-ink-outline">
            &copy; {year} <b>Eduwisata Ndalem Kerto &amp; Kampung Merak</b>. Hak cipta dilindungi.
            <span className="hidden sm:inline"> | Dusun Gentan, Ngrupit, Jenangan, Ponorogo.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
