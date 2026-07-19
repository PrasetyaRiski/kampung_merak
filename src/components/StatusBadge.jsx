import Icon from "./Icon.jsx";

const VARIANT_MAP = {
  success: {
    cls: "km-badge km-badge-success",
    icon: "check_circle",
  },
  warning: {
    cls: "km-badge km-badge-warning",
    icon: "warning",
  },
  danger: {
    cls: "km-badge km-badge-danger",
    icon: "error",
  },
  info: {
    cls: "km-badge km-badge-info",
    icon: "info",
  },
  neutral: {
    cls: "km-badge km-badge-neutral",
    icon: null,
  },
  teal: {
    cls: "km-badge km-badge-teal",
    icon: null,
  },
  dark: {
    cls: "km-badge km-badge-dark",
    icon: null,
  },
};

/**
 * StatusBadge – consistent status chip with optional icon
 * @param {string} label - text label
 * @param {string} variant - success | warning | danger | info | neutral | teal | dark
 * @param {string} [icon] - Material Symbol name override
 * @param {boolean} [showIcon] - whether to show icon (default true for semantic variants)
 */
export default function StatusBadge({ label, variant = "neutral", icon, showIcon }) {
  const config = VARIANT_MAP[variant] || VARIANT_MAP.neutral;
  const iconName = icon ?? config.icon;
  const shouldShow = showIcon !== undefined ? showIcon : !!iconName;

  return (
    <span className={config.cls}>
      {shouldShow && iconName && (
        <Icon name={iconName} className="text-[14px]" />
      )}
      {label}
    </span>
  );
}

/**
 * Get badge variant for MQTT connection status
 */
export function getConnectionVariant(status) {
  if (status === "connected") return "success";
  if (status === "connecting" || status === "reconnecting") return "warning";
  if (status === "offline" || status === "error") return "danger";
  return "neutral";
}

/**
 * Get badge variant for device status ON/OFF/UNKNOWN
 */
export function getDeviceVariant(status) {
  if (status === "ON") return "success";
  if (status === "OFF") return "neutral";
  return "warning";
}

/**
 * Get badge variant for alert level
 */
export function getAlertVariant(level) {
  if (level === "Kritis") return "danger";
  if (level === "Peringatan") return "warning";
  return "info";
}

/**
 * Get badge variant for fertilitas
 */
export function getFertilitasVariant(fertilitas) {
  if (fertilitas === "fertil") return "teal";
  if (fertilitas === "infertil") return "danger";
  return "neutral";
}

/**
 * Get badge variant for egg akhir status
 */
export function getEggStatusVariant(akhir) {
  if (akhir === "menetas") return "success";
  if (akhir === "gagal_tetas" || akhir === "dibuang") return "danger";
  if (akhir === "proses") return "info";
  return "neutral";
}

/**
 * Get label for device status
 */
export function getDeviceLabel(status) {
  if (status === "ON") return "Aktif";
  if (status === "OFF") return "Nonaktif";
  return "Menunggu";
}

/**
 * Get badge variant for sale status
 */
export function getSaleVariant(status) {
  if (status === "Lunas") return "success";
  if (status === "Booking" || status === "DP") return "warning";
  if (status === "Batal") return "danger";
  return "neutral";
}

/**
 * Get badge variant for bird status
 */
export function getBirdStatusVariant(status) {
  if (status === "Indukan") return "teal";
  if (status === "Anakan") return "info";
  if (status === "Terjual") return "neutral";
  return "warning";
}
