import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RoleNotice, { AccessDenied } from "../components/RoleNotice.jsx";
import SectionCard from "../components/SectionCard.jsx";
import { ROLES } from "../data/constants.js";

export default function CctvPage({ role, cctvUrl }) {
  if (!ROLES[role].allowed.includes("kamera")) {
    return <AccessDenied role={role} feature="Kamera CCTV" />;
  }

  const mjpegIncubatorBase = import.meta.env.VITE_RTSP_MJPEG_URL || "/video_feed";

  // Extract IP from cctvUrl for display
  const extractIp = (url) => {
    try {
      if (!url) return "Unknown IP";
      const match = url.match(/@([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/);
      if (match) return match[1];
      const match2 = url.match(/:\/\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/);
      if (match2) return match2[1];
      return "Unknown IP";
    } catch {
      return "Unknown IP";
    }
  };
  const dynamicIp = extractIp(cctvUrl);

  // State untuk melacak error pemuatan stream & melakukan cache-busting reload
  const [incError, setIncError] = useState(false);
  const [incKey, setIncKey] = useState(Date.now());
  const [isReachable, setIsReachable] = useState(null); // null: checking, true: live, false: offline

  useEffect(() => {
    let mounted = true;
    const checkCctvHealth = async () => {
      try {
        const res = await fetch("/cctv_health");
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setIsReachable(Boolean(data.incubator_reachable));
          }
        }
      } catch {
        // Abaikan jika network error
      }
    };

    checkCctvHealth();
    const timer = setInterval(checkCctvHealth, 8000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [incKey]);

  const handleReloadIncubator = () => {
    setIncError(false);
    setIsReachable(null);
    setIncKey(Date.now());
  };

  const isOffline = incError || isReachable === false;
  const isChecking = isReachable === null && !incError;

  return (
    <div className="page-content space-y-6">
      <PageHeader
        eyebrow="Operasional Inkubator"
        title="Kamera CCTV & Live Stream"
        description="Pantau kondisi fisik telur di dalam inkubator secara real-time."
      />

      <RoleNotice role={role} />

      <div className="max-w-4xl mx-auto">
        {/* CCTV Kamera 1: Inkubator */}
        <div className="km-card overflow-hidden bg-surface flex flex-col">
          <div className="p-4 border-b border-alpine-high flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-teal-iridescence">nest_cam_wired_stand</span>
              <span className="font-display font-bold text-ink-primary text-sm">CCTV - Inkubator Internal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                isOffline 
                  ? 'bg-status-danger-bg text-status-danger-text' 
                  : isChecking
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-status-success-bg text-status-success-text'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  isOffline 
                    ? 'bg-status-danger' 
                    : isChecking
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-status-success animate-pulse'
                }`} />
                {isOffline ? 'OFFLINE' : isChecking ? 'MENYAMBUNG' : 'LIVE'}
              </span>
              <button
                onClick={handleReloadIncubator}
                className="p-1.5 hover:bg-alpine-low rounded-lg text-ink-secondary hover:text-ink-primary transition-colors"
                title="Muat ulang kamera"
              >
                <span className="material-symbols-outlined text-[18px]">sync</span>
              </button>
            </div>
          </div>

          <div className="relative aspect-video bg-black flex items-center justify-center min-h-[200px] sm:min-h-[300px]">
            {incError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-900 text-zinc-100 z-10">
                <span className="material-symbols-outlined text-[48px] text-red-500 mb-3 animate-pulse">videocam_off</span>
                <p className="font-display font-semibold text-sm">Koneksi RTSP Terputus.</p>
                <p className="text-xs text-zinc-400 max-w-xs mt-1">Periksa koneksi kamera Bardi atau server lokal Anda.</p>
                <button
                  onClick={handleReloadIncubator}
                  className="mt-4 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-100 text-xs font-semibold rounded-lg border border-zinc-700 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">sync</span> Hubungkan Ulang
                </button>
              </div>
            ) : (
              <img
                src={`${mjpegIncubatorBase}?url=${encodeURIComponent(cctvUrl || "")}&t=${incKey}`}
                onError={() => setIncError(true)}
                alt="CCTV Inkubator Internal"
                className="w-full h-full object-cover select-none"
              />
            )}
            
            {/* Overlay Grid Line Aesthetic */}
            <div className="absolute inset-0 pointer-events-none bg-cctv-grid opacity-10" />
            <div className="absolute bottom-3 left-4 text-[10px] font-mono text-white bg-black/40 px-2 py-0.5 rounded backdrop-blur-[2px] tracking-wider select-none">
              INC-CAM-01 | AUTO OVERLAY ON
            </div>
          </div>

          <div className="p-4 bg-alpine-low border-t border-alpine-high flex-1 flex flex-col justify-between">
            <p className="text-xs text-ink-secondary leading-relaxed">
              Kamera Bardi yang menatap langsung ke nampan pengeraman telur. Pemicu OpenCV berjalan otomatis untuk mendeteksi perubahan kontur atau gerakan.
            </p>
            <div className="mt-3 pt-3 border-t border-alpine-high/60 flex items-center justify-between text-[10px] font-mono text-ink-outline">
              <span>IP: {dynamicIp}</span>
              <span>REST: /video_feed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
