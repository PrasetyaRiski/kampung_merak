import { useState } from "react";
import Icon from "./Icon.jsx";
import { fetchApi } from "../utils/api.js";

export default function RoleLoginModal({ onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(false);

    try {
      const response = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Save token and user
      localStorage.setItem("jwt_token", JSON.stringify(response.access_token));
      localStorage.setItem("user_info", JSON.stringify(response.user));
      
      if (onLoginSuccess) {
        onLoginSuccess(response.user.role);
      }
      onClose();
    } catch (err) {
      console.error("Login failed:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-forest-midnight p-6 text-white text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 mb-4">
            <Icon name="lock" className="text-[32px] text-teal-container" />
          </div>
          <h2 className="font-display text-2xl font-extrabold">Login Sistem</h2>
          <p className="mt-2 font-body text-sm text-[#accdc5]">
            Masukkan email dan kata sandi Anda untuk mengakses fitur admin
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="p-6">
          <div className="mb-4">
            <label htmlFor="email" className="block font-body text-sm font-semibold text-ink-primary mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(false);
              }}
              className={`km-input w-full ${error ? "border-[#93000a] focus:ring-[#93000a]/20" : ""}`}
              autoComplete="email"
              autoFocus
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block font-body text-sm font-semibold text-ink-primary mb-2">
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              className={`km-input w-full ${error ? "border-[#93000a] focus:ring-[#93000a]/20" : ""}`}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            {error && (
              <p className="mt-2 flex items-center gap-1 font-body text-sm font-medium text-[#93000a]">
                <Icon name="error" className="text-[16px]" />
                Email atau kata sandi salah.
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="km-btn km-btn-secondary w-full sm:w-auto" disabled={loading}>
              Batal
            </button>
            <button type="submit" className="km-btn km-btn-primary w-full sm:w-auto" disabled={!email || !password || loading}>
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}