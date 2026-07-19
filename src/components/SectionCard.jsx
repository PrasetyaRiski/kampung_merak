/**
 * SectionCard – standard card wrapper with optional header
 * @param {string} [eyebrow] - small uppercase label above title
 * @param {string} [title] - card title
 * @param {React.ReactNode} [action] - right-side action (badge, button, etc.)
 * @param {React.ReactNode} children - card body content
 * @param {string} [className] - additional classes on card wrapper
 * @param {boolean} [noPadding] - remove default padding
 */
export default function SectionCard({
  eyebrow,
  title,
  action,
  children,
  className = "",
  noPadding = false,
}) {
  const hasHeader = eyebrow || title || action;
  const padding = noPadding ? "" : "p-4 sm:p-6";

  return (
    <section className={`km-card ${padding} animate-fade-in ${className}`}>
      {hasHeader && (
        <div className={`flex flex-wrap items-start justify-between gap-3 ${!noPadding ? "mb-5" : "p-4 sm:p-6 pb-0"}`}>
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-teal-iridescence">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2
                className={`font-display font-extrabold text-ink-primary ${eyebrow ? "mt-1 text-xl" : "text-xl"}`}
              >
                {title}
              </h2>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
