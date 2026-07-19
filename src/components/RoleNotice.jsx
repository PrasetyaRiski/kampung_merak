import Icon from "./Icon.jsx";
import { ROLES } from "../data/constants.js";

const ROLE_CONFIG = {
  admin: { icon: "admin_panel_settings", color: "text-teal-iridescence", bg: "bg-status-successBg" },
  operator: { icon: "engineering", color: "text-status-warningText", bg: "bg-status-warningBg" },
  viewer: { icon: "visibility", color: "text-ink-secondary", bg: "bg-alpine-container" },
};

/**
 * RoleNotice – subtle banner showing current access mode
 */
export default function RoleNotice({ role }) {
  const item = ROLES[role];
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.viewer;

  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-alpine-high bg-surface px-4 py-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
        <Icon name={config.icon} className={`text-[18px] ${config.color}`} />
      </div>
      <div className="min-w-0">
        <p className="font-body text-sm font-semibold text-ink-primary">
          Mode aktif:{" "}
          <span className="font-bold">{item.label}</span>
        </p>
        <p className="mt-0.5 font-body text-xs leading-5 text-ink-secondary line-clamp-2">
          {item.desc}
        </p>
      </div>
    </div>
  );
}

/**
 * AccessDenied – shown when role doesn't have permission for a page
 */
export function AccessDenied({ role, feature }) {
  return (
    <section className="km-card p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-status-successBg">
        <Icon name="lock" className="text-[32px] text-teal-iridescence" />
      </div>
      <h2 className="mt-5 font-display text-2xl font-extrabold text-ink-primary">
        Akses Dibatasi
      </h2>
      <p className="mx-auto mt-2 max-w-md font-body text-sm leading-6 text-ink-secondary">
        Fitur{" "}
        <span className="font-semibold text-ink-primary">{feature}</span> hanya tersedia untuk
        peran yang memiliki otorisasi. Mode saat ini adalah{" "}
        <span className="font-semibold text-ink-primary">{ROLES[role].label}</span>.
      </p>
    </section>
  );
}
