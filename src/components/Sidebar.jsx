import { useEffect } from "react";
import Icon from "./Icon.jsx";
import { ROLES } from "../data/constants.js";
import { statusText } from "../data/constants.js";

const menuGroups = [
  {
    label: "Operasional Inkubator",
    items: [
      { id: "dashboard", label: "Dashboard", subtitle: "Monitoring & performa", icon: "dashboard" },
      { id: "kamera", label: "Kamera CCTV", subtitle: "Live stream Bardi", icon: "videocam" },
      { id: "telur", label: "Data Telur", subtitle: "Slot dan status", icon: "egg_alt" },
      { id: "indukan", label: "Data Indukan", subtitle: "Silsilah & breeding", icon: "pets" },
      { id: "anakan", label: "Data Anakan", subtitle: "Hasil penetasan", icon: "child_care" },
      { id: "katalog", label: "Katalog Telur", subtitle: "Paket siap adopsi", icon: "shopping_bag" },
    ],
  },
  {
    label: "Sistem & Akses",
    items: [
      { id: "penjualan", label: "Penjualan Telur", subtitle: "Transaksi penjualan", icon: "shopping_cart" },
      { id: "finance", label: "Arus Kas Keuangan", subtitle: "Pemasukan & pengeluaran", icon: "account_balance_wallet" },
      { id: "pengaturan", label: "Pengaturan", subtitle: "MQTT, threshold", icon: "settings" },
      { id: "akun", label: "Akun Pengguna", subtitle: "Admin saja", icon: "manage_accounts" },
    ],
  },
];

export default function Sidebar({
  connection,
  activePage,
  onPageChange,
  role,
  onRoleRequest,
  verifiedRoles,
  isOpen = false,
  onClose = () => {},
  onToggle = () => {},
}) {
  const permissions = ROLES[role];
  const connected = connection.status === "connected";
  const connecting = connection.status === "connecting" || connection.status === "reconnecting";

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const dotColor = connected
    ? "bg-green-400"
    : connecting
    ? "bg-yellow-400"
    : "bg-red-400";

  const sidebarSurfaceStyle = {
    backgroundColor: "var(--surface)",
    color: "var(--ink-primary)",
    transform: isOpen ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease, color 0.5s ease",
  };
  const panelBorder = "var(--alpine-high)";
  const panelBg = "var(--alpine-low)";
  const mutedText = "var(--ink-secondary)";
  const softText = "var(--ink-outline)";
  const accentText = "var(--teal-iridescence)";

  return (
    <aside
      className={`fixed left-0 top-16 z-[70] flex h-[calc(100vh-64px)] w-[280px] flex-col overflow-hidden transition-all duration-300 mobile-sidebar ${
        isOpen ? "open" : ""
      }`}
      style={sidebarSurfaceStyle}
      aria-label="Navigasi utama"
    >
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onPageChange("dashboard")}
            className="flex items-center gap-3 text-left min-w-0 flex-1"
            aria-label="Kembali ke Dashboard"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white shadow-sm border border-alpine-high">
              <img src="/logo.png" alt="Logo Kampung Merak" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[21px] font-extrabold leading-tight truncate" style={{ color: accentText }}>
                Kampung Merak
              </h1>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: softText }}>
                INKUBATOR & KANDANG
              </p>
            </div>
          </button>
          {/* Close button — shown on mobile only */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-alpine-low hover:text-ink-primary lg:hidden"
            style={{ color: mutedText }}
            aria-label="Tutup sidebar"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>
      </div>

      {/* ── Minimalist User Profile Row ── */}
      {(() => {
        const roleConfig = {
          admin: { icon: "admin_panel_settings", bg: "bg-teal-container text-teal-container-text" },
          operator: { icon: "engineering", bg: "bg-status-warningBg text-status-warningText" },
          viewer: { icon: "visibility", bg: "bg-alpine-container text-ink-secondary" },
        };
        const activeRoleConfig = roleConfig[role] || roleConfig.viewer;
        return (
          <div className="px-5 pb-4 pt-1">
            <div className="flex items-center justify-between rounded-xl border p-2 bg-alpine-low/40" style={{ borderColor: panelBorder }}>
              <div className="flex items-center gap-2.5 min-w-0">
                {/* User Avatar Chip */}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activeRoleConfig.bg}`}>
                  <Icon name={activeRoleConfig.icon} className="text-[16px]" />
                </div>
                <div className="min-w-0">
                  <span className="block truncate font-body text-xs font-bold text-ink-primary">
                    {ROLES[role].short}
                  </span>
                  <span className="block truncate font-body text-[10px] text-ink-outline">
                    {role === "viewer" ? "Mode Baca" : "Akses Penuh"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRoleRequest(role === "viewer" ? "login" : "viewer")}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-alpine-container hover:text-teal-iridescence transition-colors text-ink-secondary"
                title={role === "viewer" ? "Masuk" : "Keluar"}
              >
                <Icon name={role === "viewer" ? "vpn_key" : "logout"} className="text-[16px]" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Navigation ── */}
      <nav
        className="min-h-0 flex-1 overflow-y-auto px-5 no-scrollbar"
        aria-label="Navigasi halaman"
      >
        <div className="space-y-5 pb-2">
          {menuGroups.map((group) => {
            // Filter items: only show items that are in the role's allowed list
            const visibleItems = group.items.filter((menu) => permissions.allowed.includes(menu.id));
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="mb-2 px-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: softText }}>
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((menu) => {
                    const active = activePage === menu.id;
                    return (
                      <button
                        key={menu.id}
                        type="button"
                        onClick={() => onPageChange(menu.id)}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                          active
                            ? "bg-[var(--teal-container)]/20 text-[var(--teal-iridescence)]"
                            : "text-[var(--ink-secondary)] hover:bg-[var(--alpine-low)] hover:text-[var(--ink-primary)]"
                        }`}
                      >
                        {/* Active indicator bar */}
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-teal-container" />
                        )}
                        <Icon
                          name={menu.icon}
                          className={`text-[20px] flex-shrink-0 ${
                            active ? accentText : softText
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate font-body text-sm leading-tight ${
                              active ? "font-bold" : "font-semibold"
                            }`}
                          >
                            {menu.label}
                          </span>
                          <span className="block truncate font-body text-[10px] leading-4" style={{ color: softText }}>
                            {menu.subtitle}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* ── Connection Status ── */}
      <div className="flex-shrink-0 px-5 pb-3">
        <div className="rounded-2xl border p-3.5" style={{ borderColor: panelBorder, backgroundColor: panelBg }}>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="font-body text-[11px] font-semibold" style={{ color: mutedText }}>
              Status Koneksi
            </span>
            <span className={`flex h-2 w-2 rounded-full flex-shrink-0 ${dotColor} ${connected ? "animate-pulse-soft" : ""}`} />
          </div>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: accentText }}>
            MQTT: {statusText(connection.status)}
          </div>
          <p className="mt-1 font-body text-[10px] leading-4" style={{ color: softText }}>
            Viewer: read-only. Operator: tanpa akun & penjualan.
          </p>
        </div>
      </div>
    </aside>
  );
}