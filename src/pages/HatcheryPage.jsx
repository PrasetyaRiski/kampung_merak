import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import Icon from "../components/Icon.jsx";
import { ROLES } from "../data/constants.js";

const hatchlings = [
  {
    id: "CK-0992",
    lineage: "Indigo Spark × Opal Mist",
    weight: "108.5g",
    score: "98",
    action: "Transfer ke Brooder",
    tone: "bg-teal-container/20 text-teal-iridescence",
  },
  {
    id: "CK-0991",
    lineage: "White Knight × Pearl Dawn",
    weight: "96.2g",
    score: "85",
    action: "Transfer ke Brooder",
    tone: "bg-amber-100 text-amber-700",
  },
  {
    id: "CK-0990",
    lineage: "Blue Titan × Emerald Queen",
    weight: "102.1g",
    score: "72",
    action: "Perhatian Kritis",
    tone: "bg-rose-100 text-rose-700",
  },
];

export default function HatcheryPage({ role }) {
  if (!ROLES[role].allowed.includes("penetasan")) {
    return <AccessDenied role={role} feature="Manajemen Penetasan" />;
  }

  return (
    <div className="page-content space-y-6">
      <PageHeader
        eyebrow="Pusat Penetasan"
        title="Penetasan & Bayi Merak"
        description="Pantau tahap penetasan, kualitas anakan, dan alur pemindahan ke area brooder dengan tampilan yang lebih terarah."
      />

      <RoleNotice role={role} />

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard className="p-5" title="Anakan Hari Ini">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-display text-3xl font-extrabold text-ink-primary">24</p>
              <p className="mt-1 text-sm text-ink-secondary">Siap evaluasi kualitas</p>
            </div>
            <span className="rounded-2xl bg-teal-container/20 p-3 text-teal-iridescence">
              <Icon name="child_care" className="text-[22px]" />
            </span>
          </div>
        </SectionCard>

        <SectionCard className="p-5" title="Rata-rata Berat">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-display text-3xl font-extrabold text-ink-primary">103g</p>
              <p className="mt-1 text-sm text-ink-secondary">Sesuai target usia</p>
            </div>
            <span className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <Icon name="monitor_weight" className="text-[22px]" />
            </span>
          </div>
        </SectionCard>

        <SectionCard className="p-5" title="Tindakan Prioritas">
          <button className="km-btn km-btn-primary w-full">
            <Icon name="add" className="text-[18px]" />
            Atur Brooder
          </button>
        </SectionCard>
      </div>

      <SectionCard title="Daftar Anakan" noPadding>
        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
          {hatchlings.map((item) => (
            <article key={item.id} className="rounded-2xl border border-alpine-high bg-alpine-low/70 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-ink-primary">{item.id}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ink-secondary">{item.lineage}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${item.tone}`}>
                  {item.score}/100
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/70 p-3 dark:bg-surface">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-ink-secondary">Berat</p>
                  <p className="mt-1 font-display text-lg font-bold text-ink-primary">{item.weight}</p>
                </div>
                <div className="rounded-xl bg-white/70 p-3 dark:bg-surface">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-ink-secondary">Aksi</p>
                  <p className="mt-1 font-body text-sm font-semibold text-ink-primary">{item.action}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
