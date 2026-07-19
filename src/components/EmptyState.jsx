import Icon from "./Icon.jsx";

/**
 * EmptyState – displayed when no data is available
 * @param {string} icon - Material Symbol name
 * @param {string} title - heading
 * @param {string} [desc] - description text
 * @param {React.ReactNode} [action] - optional action button/element
 */
export default function EmptyState({ icon = "inbox", title = "Belum ada data", desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-alpine-low">
        <Icon name={icon} className="text-[32px] text-ink-outline" />
      </div>
      <div>
        <p className="font-display text-base font-bold text-ink-primary">{title}</p>
        {desc && (
          <p className="mt-1.5 max-w-sm font-body text-sm leading-6 text-ink-secondary">{desc}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/**
 * ErrorState – shown on error conditions
 */
export function ErrorState({ title = "Terjadi kesalahan", desc, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-status-dangerBg">
        <Icon name="error" className="text-[32px] text-status-dangerText" />
      </div>
      <div>
        <p className="font-display text-base font-bold text-ink-primary">{title}</p>
        {desc && (
          <p className="mt-1.5 max-w-sm font-body text-sm leading-6 text-ink-secondary">{desc}</p>
        )}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="km-btn km-btn-secondary km-btn-sm"
        >
          <Icon name="refresh" className="text-[16px]" />
          Coba Lagi
        </button>
      )}
    </div>
  );
}

/**
 * LoadingState – skeleton placeholder
 */
export function LoadingState({ rows = 3, className = "" }) {
  return (
    <div className={`space-y-3 p-6 ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3">
          <div className="skeleton h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
