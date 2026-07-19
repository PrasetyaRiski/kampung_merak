import { useState, useRef, useEffect } from "react";
import Icon from "./Icon.jsx";

export default function RoleVerificationModal({ role, expectedCode, onSuccess, onCancel }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code === expectedCode) {
      onSuccess();
    } else {
      setError(true);
      setCode("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content overflow-hidden">
        <div className="bg-forest-midnight p-6 text-white text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 mb-4">
            <Icon name="admin_panel_settings" className="text-[32px] text-teal-container" />
          </div>
          <h2 className="font-display text-2xl font-extrabold">Otorisasi Dibutuhkan</h2>
          <p className="mt-2 font-body text-sm text-[#accdc5]">
            Masukkan kode akses untuk role <span className="font-bold text-white uppercase">{role}</span>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="accessCode" className="block font-body text-sm font-semibold text-ink-primary mb-2">
              Kode Akses Rahasia
            </label>
            <input
              ref={inputRef}
              id="accessCode"
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError(false);
              }}
              className={`km-input font-mono text-center text-lg tracking-widest ${
                error ? "border-[#93000a] focus:ring-[#93000a]/20" : ""
              }`}
              placeholder="••••••••"
              autoComplete="off"
            />
            {error && (
              <p className="mt-2 flex items-center justify-center gap-1 font-body text-sm font-medium text-[#93000a]">
                <Icon name="error" className="text-[16px]" />
                Kode akses salah. Silakan coba lagi.
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="km-btn km-btn-secondary w-full sm:w-auto">
              Batal
            </button>
            <button type="submit" className="km-btn km-btn-primary w-full sm:w-auto" disabled={!code}>
              Verifikasi Akses
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
