import PageHeader from "../components/PageHeader.jsx";
import RoleNotice from "../components/RoleNotice.jsx";
import Icon from "../components/Icon.jsx";
import { ROLES, formatCurrency } from "../data/constants.js";

export default function KatalogPage({ role, onPageChange }) {
  // Pre-defined egg packages ready for sale with high-quality peafowl assets images
  const EGG_PACKAGES = [
    {
      id: "EG-HIJAU-009",
      name: "Paket 5 Telur Merak Hijau (Premium)",
      price: 4500000,
      priceLabel: "IDR 4.5M",
      description: "Paket telur fertil indukan F1 Javanese Green. Garansi silsilah genetik murni terverifikasi.",
      generation: "F1 GENERATION",
      status: "TERSEDIA",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGSrMpNfVPtQJEhcyCmCQ1zVnVQHBTzQKhFXbEOKt1TCWYofnXzRejvvzmM0DNzvcHE-hi4Ms1n7C3d2lMK95SR8UeiBem943AJs2l45borYHvQowXqgwDYVMRqO9XsdI5DwZnX9IHpNhFfbTK2JaEdJ5JGkWdJLqdLFzYoCn38Uj7CQicjogDH0n0Hd_GZVMSVD_YaIJsi8s4rZy_fXH3eSLAQMYD0DH3mFKG_jWp0w9yFXOIgl0Qj4k29HsqzaLyb3rSx0Pf7DQ",
    },
    {
      id: "EG-HIJAU-104",
      name: "Paket 3 Telur Merak Hijau",
      price: 2800000,
      priceLabel: "IDR 2.8M",
      description: "Telur fertil indukan pilihan F2. Tingkat fertilisasi kandang tinggi, DNA sexing tersedia.",
      generation: "F2 GENERATION",
      status: "TERSEDIA",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP4YzUuDoB10IszzavrKrB9H4d2-D4q_VZsr_WlnexxX6-rcXKoWcX7jt8wS-9BH9LtvSPmC8SIr8Qtz58xTXaxdoAfhQnn85jjlLhwpAi-KbSu1YozciNzYUqxdODpf3dL7YXZsqAU6vtsJoQwArGrXTgStoBjdkTnFkA5CofhKeViYlymjFGZ4p5x5ECh-cvPklq4CdTZALFxmOupv8-1L7WiXPQ65hp0QT64IGX1wMTuGpm2WQ9Da-GaHMtVQG-4Zk_NwgXJx4",
    },
    {
      id: "EG-BIRU-012",
      name: "Paket 5 Telur Merak Biru (Premium)",
      price: 3500000,
      priceLabel: "IDR 3.5M",
      description: "Paket telur fertil indukan biru grade impor (Indian Blue). Karakter jinak dan berbulu lebat.",
      generation: "F1 GENERATION",
      status: "RESERVED",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3r-Ef8ZCHZ6_Zn9FiiT1vBkjSJvCcovg-1OkAG_WMqsunEVGos-e8Bt-NmqSGHnqIepDPWhNRKRN0g03LtApDzBsSmHT5h5A9uvzqCUx4J_D9PXiFdYp-Ttg5exCYZSQghlg_Xu78zq-9tXAlWdB-XJ1I8VmvU1ccubgq4IQmHVnqZNXnKKdHorPG4hqfW2ViM7gZh3UQ4NwAHGZn9PecxQja2ZCMG3kEjnMSCfcHq4g_0feWpfNe-VZRdXeoZXwjPHqKg3ayVgE",
    },
    {
      id: "EG-SATUAN-B",
      name: "Telur Satuan (Merak Hijau/Biru)",
      price: 1000000,
      priceLabel: "IDR 1.0M/ea",
      description: "Telur fertil satuan segar langsung dari kandang observasi Kampung Merak.",
      generation: "F3 GENERATION",
      status: "TERSEDIA",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3-5Qc_pzO1CWKCxn2mm-wZ21Ttmf6PHJK5D_HKwwnxCegxTBqQ-Ge_rkggPU6pp6-j1su4dIO7NlBrRjP-VFeUfLSEc0JjcmqSKhtScIQ3P2GafctobM9ppnxKRN1z_6oXSU5bsIPfS7lvSKPm2oLnCP6cX5z2f6FCS3yk8FDIz4Ny9tlMgtOrtjdfrhqHbpQItFm5h750GDIbQYGWLE6q2BCj0iiEMzD897OqJHI7x2Wksbt6niSddJS5aK0vEPwWhM4pfJuxPo",
    },
  ];

  const canManageSales = ROLES[role].canManageSales;

  return (
    <div className="page-content space-y-8 select-none">
      <PageHeader
        eyebrow="Katalog Publik"
        title="Katalog Paket Telur Siap Adopsi"
        description="Daftar paket telur merak fertil unggulan dari penangkaran Kampung Merak yang siap dipesan."
      />

      <RoleNotice role={role} />

      {/* Egg Packages Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {EGG_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className="km-card overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group border border-alpine-high bg-surface flex flex-col justify-between"
          >
            {/* Image Header with floating tags */}
            <div className="h-44 relative overflow-hidden bg-zinc-900 border-b border-alpine-high/60 shrink-0">
              <img
                src={pkg.image}
                alt={pkg.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-forest-midnight/80 dark:bg-forest-midnight/90 text-white font-mono text-[9px] font-bold rounded shadow-sm backdrop-blur-sm">
                {pkg.generation}
              </div>
              <div
                className={`absolute top-3 right-3 px-2 py-0.5 font-mono text-[9px] font-bold rounded shadow-sm backdrop-blur-sm ${
                  pkg.status === "TERSEDIA"
                    ? "bg-teal-iridescence text-white"
                    : "bg-status-warningBg text-status-warningText"
                }`}
              >
                {pkg.status}
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-3 mb-2.5">
                  <span className="font-mono text-xs font-bold text-teal-iridescence">{pkg.id}</span>
                  <span className="font-mono text-sm font-extrabold text-ink-primary">{pkg.priceLabel}</span>
                </div>
                <h4 className="font-display text-sm font-extrabold text-ink-primary leading-snug group-hover:text-teal-iridescence transition-colors">
                  {pkg.name}
                </h4>
                <p className="font-body text-xs text-ink-secondary leading-relaxed mt-2.5">
                  {pkg.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-alpine-high/50">
                {canManageSales ? (
                  <button
                    onClick={() => onPageChange("penjualan")}
                    className="w-full py-2 bg-alpine-low group-hover:bg-teal-iridescence group-hover:text-white text-ink-primary font-body text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-alpine-high group-hover:border-teal-iridescence shadow-sm"
                  >
                    <Icon name="add_shopping_cart" className="text-[14px]" />
                    Catat Penjualan
                  </button>
                ) : (
                  <div className="w-full py-2 bg-alpine-low/50 text-ink-secondary text-center font-body text-[11px] rounded-xl border border-alpine-high/30">
                    Hubungi Admin untuk Pemesanan
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Authenticity Certificate Notice */}
      <div className="rounded-2xl border border-teal-iridescence/20 bg-teal-iridescence/[0.02] dark:bg-forest-midnight/[0.1] p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h3 className="font-display text-base font-bold text-teal-iridescence flex items-center gap-2">
            <Icon name="verified_user" className="text-[20px]" />
            Jaminan Keaslian Silsilah Telur Merak (DCA)
          </h3>
          <p className="font-body text-xs leading-relaxed text-ink-secondary">
            Setiap telur merak yang diadopsi dari Kampung Merak dilengkapi dengan **Digital Certificate of Authenticity (DCA)**. DCA mencatat riwayat silsilah indukan (Sire & Dam), tanggal bertelur, serta riwayat kesehatan berkala untuk memastikan integritas genetik dan kelayakan tetas maksimal.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-ink-secondary bg-surface p-4 rounded-xl border border-alpine-high shadow-sm shrink-0">
          <span className="flex items-center gap-1.5"><Icon name="qr_code_2" className="text-[18px] text-teal-iridescence" /> QR Code Verified</span>
          <span className="h-4 w-[1px] bg-alpine-high" />
          <span className="flex items-center gap-1.5"><Icon name="biotech" className="text-[18px] text-teal-iridescence" /> Health Screened</span>
        </div>
      </div>
    </div>
  );
}
