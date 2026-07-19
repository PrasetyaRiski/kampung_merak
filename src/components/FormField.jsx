/**
 * FormField – wraps a form input with consistent label and error message
 * @param {string} label - field label text
 * @param {string} htmlFor - id of the input element
 * @param {string} [error] - validation error message
 * @param {string} [hint] - helper text below the input
 * @param {boolean} [required] - show required asterisk
 * @param {React.ReactNode} children - the input/select element
 */
export default function FormField({ label, htmlFor, error, hint, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="font-body text-sm font-semibold text-ink-primary leading-none"
      >
        {label}
        {required && (
          <span className="ml-1 text-[#93000a]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 font-body text-xs font-medium text-[#93000a]">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="font-body text-xs text-ink-outline leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

/**
 * FormGrid – responsive 2-column grid for form fields
 */
export function FormGrid({ children, cols = 2 }) {
  const gridClass = {
    1: "grid gap-4",
    2: "grid gap-4 sm:grid-cols-2",
    3: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
  }[cols] || "grid gap-4 sm:grid-cols-2";

  return <div className={gridClass}>{children}</div>;
}
