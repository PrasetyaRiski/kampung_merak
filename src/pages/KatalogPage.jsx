import PageHeader from "../components/PageHeader.jsx";
import RoleNotice from "../components/RoleNotice.jsx";
import Icon from "../components/Icon.jsx";
import { ROLES } from "../data/constants.js";

export default function KatalogPage({ role, onPageChange }) {
  const canManageSales = ROLES[role]?.canManageSales;
  const adminPhone = "+62 812-5952-084";
  const adminName = "Edy";
  const waUrl = "https://wa.me/628125952084?text=Halo%20Pak%20Edy,%20saya%20tertarik%20dengan%20Paket%20Telur%20Merak%20Fertil%20di%20Kampung%20Merak.%20Bisa%20info%20detail%20pilihan%20paket%20dan%20ketersediaannya%3F";

  // Katalog menampilkan 1 item paket unggulan utama sesuai permintaan
  const FEATURED_PACKAGE = {
    id: "EG-MERAK-UNGGULAN",
    name: "Paket Telur Merak Fertil (Unggulan Penangkaran)",
    status: "TERSEDIA",
    generation: "F1 / F2 GENERATION",
    description:
      "Telur fertil segar hasil pembiakan terkontrol dari indukan merak pilihan (Merak Hijau Jawa & Merak Biru India) di penangkaran Kampung Merak. Setiap butir telur diseleksi dengan standar fertilitas tinggi, pengawasan suhu inkubasi terstandarisasi, dan dilengkapi jaminan integritas silsilah genetik.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDGSrMpNfVPtQJEhcyCmCQ1zVnVQHBTzQKhFXbEOKt1TCWYofnXzRejvvzmM0DNzvcHE-hi4Ms1n7C3d2lMK95SR8UeiBem943AJs2l45borYHvQowXqgwDYVMRqO9XsdI5DwZnX9IHpNhFfbTK2JaEdJ5JGkWdJLqdLFzYoCn38Uj7CQicjogDH0n0Hd_GZVMSVD_YaIJsi8s4rZy_fXH3eSLAQMYD0DH3mFKG_jWp0w9yFXOIgl0Qj4k29HsqzaLyb3rSx0Pf7DQ",
    features: [
      "Indukan Terverifikasi (Merak Hijau Jawa & Merak Biru)",
      "Digital Certificate of Authenticity (DCA) resmi",
      "Garansi Telur Fertil & Seleksi Ketat Nampan Inkubator",
      "Kemasan Khusus Anti-Guncangan Berstandar Ekspedisi",
      "Panduan Lengkap & Pendampingan Inkubasi sampai Menetas",
    ],
  };

  return (
    <div className="page-content space-y-8 select-none">
      <PageHeader
        eyebrow="Katalog Publik"
        title="Katalog Paket Telur Siap Adopsi"
        description="Informasi ketersediaan dan pemesanan paket telur fertil indukan unggulan penangkaran Kampung Merak."
      />

      <RoleNotice role={role} />

      {/* Featured Egg Package Bento Card */}
      <div className="max-w-5xl mx-auto">
        <div className="km-card overflow-hidden border border-alpine-high bg-surface shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Image & Visual Column */}
            <div className="lg:col-span-5 relative bg-zinc-950 overflow-hidden min-h-[280px] lg:min-h-full flex flex-col justify-between p-6">
              <img
                src={FEATURED_PACKAGE.image}
                alt={FEATURED_PACKAGE.name}
                className="absolute inset-0 w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/50 pointer-events-none" />

              {/* Top Floating Badges */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="px-3 py-1 bg-forest-midnight/90 text-white font-mono text-[10px] font-bold rounded-lg backdrop-blur-md border border-white/10 shadow-sm">
                  {FEATURED_PACKAGE.generation}
                </span>
                <span className="px-3 py-1 bg-teal-iridescence text-white font-mono text-[10px] font-bold rounded-lg backdrop-blur-md shadow-sm flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                  {FEATURED_PACKAGE.status}
                </span>
              </div>

              {/* Bottom Overlay Info on Image */}
              <div className="relative z-10 mt-auto pt-24 text-white space-y-1">
                <span className="font-mono text-xs text-teal-300 font-bold tracking-wider uppercase">
                  {FEATURED_PACKAGE.id}
                </span>
                <h4 className="font-display text-lg font-bold leading-snug drop-shadow-md">
                  Grade A Peafowl Hatching Eggs
                </h4>
                <p className="text-xs text-zinc-300 font-body">
                  Penangkaran resmi berizin & terdaftar
                </p>
              </div>
            </div>

            {/* Content & Details Column */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-teal-iridescence bg-teal-iridescence/10 dark:bg-teal-iridescence/20 px-3 py-1 rounded-lg">
                    <Icon name="verified" className="text-[16px]" />
                    Paket Unggulan Terverifikasi
                  </span>
                  <span className="font-mono text-xs text-ink-outline">
                    ID: {FEATURED_PACKAGE.id}
                  </span>
                </div>

                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-ink-primary leading-tight">
                  {FEATURED_PACKAGE.name}
                </h3>

                <p className="font-body text-xs sm:text-sm text-ink-secondary leading-relaxed mt-3">
                  {FEATURED_PACKAGE.description}
                </p>

                {/* Key Benefits */}
                <div className="mt-5 space-y-2.5">
                  <h5 className="font-display text-xs font-bold text-ink-primary uppercase tracking-wider">
                    Keunggulan Paket:
                  </h5>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-ink-secondary font-body">
                    {FEATURED_PACKAGE.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Icon name="check_circle" className="text-[16px] text-teal-iridescence shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Detail Paket & Konsultasi Notice Box */}
                <div className="mt-6 p-4 rounded-2xl bg-alpine-low border border-alpine-high flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-teal-iridescence/10 text-teal-iridescence shrink-0">
                    <Icon name="info" className="text-[20px]" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <h5 className="font-bold text-ink-primary">
                      Ingin Tahu Lebih Detail Pilihan Paket?
                    </h5>
                    <p className="text-ink-secondary leading-relaxed">
                      Tersedia berbagai pilihan paket (satuan, paket 3 butir, paket 5 butir, maupun pesanan khusus varian tertentu). Untuk informasi harga paket terkini, ketersediaan slot, dan konsultasi penetasan, silakan langsung hubungi admin kami.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-alpine-high flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Tombol Hubungi Admin via WhatsApp */}
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-display text-sm font-bold rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2.5 group"
                >
                  <svg
                    className="w-5 h-5 fill-current shrink-0 group-hover:scale-110 transition-transform"
                    viewBox="0 0 24 24"
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  <span>Hubungi Admin ({adminName})</span>
                  <span className="text-[11px] bg-emerald-700/80 px-2 py-0.5 rounded-full font-mono font-normal">
                    {adminPhone}
                  </span>
                </a>

                {/* Tombol Catat Penjualan (Khusus Admin / Operator) */}
                {canManageSales && (
                  <button
                    onClick={() => onPageChange("penjualan")}
                    className="px-4 py-3.5 bg-alpine-low hover:bg-teal-iridescence hover:text-white text-ink-primary font-display text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 border border-alpine-high hover:border-teal-iridescence shadow-sm shrink-0"
                  >
                    <Icon name="add_shopping_cart" className="text-[16px]" />
                    <span>Catat Penjualan</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Trust & Guarantees 3-Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-alpine-high shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-teal-iridescence/10 text-teal-iridescence">
            <Icon name="verified_user" className="text-[22px]" />
          </div>
          <div>
            <h5 className="font-display text-xs font-bold text-ink-primary">Silsilah Resmi Terverifikasi</h5>
            <p className="text-[11px] text-ink-secondary font-body">Dilengkapi sertifikat digital DCA</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-alpine-high shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-teal-iridescence/10 text-teal-iridescence">
            <Icon name="biotech" className="text-[22px]" />
          </div>
          <div>
            <h5 className="font-display text-xs font-bold text-ink-primary">Pengawasan Inkubator Standar</h5>
            <p className="text-[11px] text-ink-secondary font-body">Monitoring suhu & kelembaban IoT</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-alpine-high shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-teal-iridescence/10 text-teal-iridescence">
            <Icon name="support_agent" className="text-[22px]" />
          </div>
          <div>
            <h5 className="font-display text-xs font-bold text-ink-primary">Konsultasi Pak Edy Langsung</h5>
            <p className="text-[11px] text-ink-secondary font-body">Pendampingan teknis penetasan</p>
          </div>
        </div>
      </div>

      {/* Authenticity Certificate Notice */}
      <div className="max-w-5xl mx-auto rounded-3xl border border-teal-iridescence/20 bg-teal-iridescence/[0.02] dark:bg-forest-midnight/[0.1] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h3 className="font-display text-base font-bold text-teal-iridescence flex items-center gap-2">
            <Icon name="verified_user" className="text-[20px]" />
            Jaminan Keaslian Silsilah Telur Merak (DCA)
          </h3>
          <p className="font-body text-xs leading-relaxed text-ink-secondary">
            Setiap telur merak yang diadopsi dari Kampung Merak dilengkapi dengan **Digital Certificate of Authenticity (DCA)**. DCA mencatat riwayat silsilah indukan (Sire & Dam), tanggal bertelur, serta riwayat kesehatan berkala untuk memastikan integritas genetik dan kelayakan tetas maksimal.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-ink-secondary bg-surface p-4 rounded-2xl border border-alpine-high shadow-sm shrink-0">
          <span className="flex items-center gap-1.5"><Icon name="qr_code_2" className="text-[18px] text-teal-iridescence" /> QR Code Verified</span>
          <span className="h-4 w-[1px] bg-alpine-high" />
          <span className="flex items-center gap-1.5"><Icon name="biotech" className="text-[18px] text-teal-iridescence" /> Health Screened</span>
        </div>
      </div>
    </div>
  );
}
