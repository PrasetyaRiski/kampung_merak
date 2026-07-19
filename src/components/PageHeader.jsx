/**
 * PageHeader – top section of each page
 */
export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-5">
      <div className="min-w-0">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-teal-iridescence">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-extrabold text-ink-primary sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl font-body text-sm leading-7 text-ink-secondary">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </header>
  );
}
