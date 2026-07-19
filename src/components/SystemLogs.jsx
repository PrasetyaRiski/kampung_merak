import { useEffect, useRef } from "react";
import Icon from "./Icon.jsx";

export default function SystemLogs({ logs }) {
  const logContainerRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive (since they are prepended, we might not need this if we reverse them, but currently they are prepended so newest is at the top).
  // Wait, the original code prepends logs: `[{ id: makeId("LOG"), time: nowTime(), type, text }, ...current].slice(0, 32)`
  // So the newest is at the top. We don't need auto-scroll to bottom.

  return (
    <section className="km-card overflow-hidden bg-forest-midnight">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-teal-fixed">
            Log Sistem
          </p>
          <h2 className="mt-1 font-display text-lg font-extrabold text-white">
            Telemetri & Perintah MQTT
          </h2>
        </div>
        <span className="km-badge km-badge-dark font-mono text-[10px]">
          {logs.length} BARIS
        </span>
      </div>
      
      <div 
        ref={logContainerRef}
        className="max-h-[350px] overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-2.5 font-mono text-[11px] leading-relaxed text-[#accdc5]"
      >
        {logs.map((log) => {
          let typeColor = "text-white";
          if (log.type === "ERROR") typeColor = "text-[#ffb4ab]";
          if (log.type === "TX") typeColor = "text-teal-fixed";
          if (log.type === "RX") typeColor = "text-[#7dd4e8]";
 
          return (
            <div key={log.id} className="flex items-start gap-3 hover:bg-white/[0.04] p-1 -mx-1 rounded transition-colors">
              <span className="flex-shrink-0 text-[#74948d]">{log.time}</span>
              <span className="flex-shrink-0 text-white/20">|</span>
              <span className={`flex-shrink-0 w-12 font-bold ${typeColor}`}>
                {log.type}
              </span>
              <span className="flex-shrink-0 text-white/20">|</span>
              <span className="break-all flex-1 min-w-0">{log.text}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
