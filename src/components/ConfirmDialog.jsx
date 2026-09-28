import { useEffect, useRef } from "react";
import Icon from "./Icon.jsx";

/**
 * ConfirmDialog – accessible confirmation modal
 */
export default function ConfirmDialog({
  open = true,
  title = "Konfirmasi Tindakan",
  description,
  message,
  desc,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant = "danger",
  onConfirm,
  onCancel,
  loading = false,
  isDestructive = true,
}) {
  const confirmBtnRef = useRef(null);
  const textDesc = description || message || desc;
  const textConfirm = confirmLabel || confirmText || "Konfirmasi";
  const textCancel = cancelLabel || cancelText || "Batal";

  useEffect(() => {
    if (open && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open && !loading) onCancel?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const variantConfig = {
    danger: {
      iconBg: "bg-status-dangerBg",
      icon: "warning",
      iconColor: "text-status-dangerText",
      confirmCls: "km-btn km-btn-danger",
    },
    warning: {
      iconBg: "bg-status-warningBg",
      icon: "help",
      iconColor: "text-status-warningText",
      confirmCls: "km-btn km-btn-primary",
    },
  };
  const vc = variantConfig[variant] || variantConfig.danger;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => e.target === e.currentTarget && !loading && onCancel?.()}
    >
      <div className="modal-content p-6">
        <div className="mb-5 flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${vc.iconBg}`}>
            <Icon name={vc.icon} className={`text-[24px] ${vc.iconColor}`} />
          </div>
          <div>
            <h2
              id="confirm-dialog-title"
              className="font-display text-lg font-extrabold text-ink-primary"
            >
              {title}
            </h2>
            {textDesc && (
              <p className="mt-1.5 font-body text-sm leading-6 text-ink-secondary">
                {textDesc}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="km-btn km-btn-secondary"
          >
            {textCancel}
          </button>
          <button
            type="button"
            ref={confirmBtnRef}
            disabled={loading}
            onClick={onConfirm}
            className={vc.confirmCls}
          >
            {loading ? "Menghapus..." : textConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
