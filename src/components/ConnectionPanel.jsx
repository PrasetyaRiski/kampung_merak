import Icon from "./Icon.jsx";
import StatusBadge, { getConnectionVariant } from "./StatusBadge.jsx";
import { statusText } from "../data/constants.js";

const STATUS_ICON = {
  connected: "wifi",
  connecting: "wifi_find",
  reconnecting: "wifi_find",
  offline: "wifi_off",
  error: "wifi_off",
  idle: "wifi_off",
};

export default function ConnectionPanel({ mqttUrl, clientId, connection }) {
  const variant = getConnectionVariant(connection.status);
  const icon = STATUS_ICON[connection.status] || "wifi_off";

  return (
    <section className="km-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              connection.status === "connected"
                ? "bg-status-successBg"
                : connection.status === "connecting" || connection.status === "reconnecting"
                ? "bg-status-warningBg"
                : "bg-status-dangerBg"
            }`}
          >
            <Icon name={icon} className={`text-[20px] ${
              connection.status === "connected"
                ? "text-teal-iridescence"
                : connection.status === "connecting" || connection.status === "reconnecting"
                ? "text-status-warningText"
                : "text-status-dangerText"
            }`} />
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-teal-iridescence">
              MQTT Bridge
            </p>
            <h2 className="font-display text-base font-extrabold text-ink-primary leading-tight">
              Koneksi Broker WebSocket
            </h2>
          </div>
        </div>
        <StatusBadge
          label={statusText(connection.status)}
          variant={variant}
          icon={icon}
        />
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        <div className="rounded-xl bg-alpine-low px-3 py-2.5">
          <p className="font-body text-[10px] text-ink-secondary uppercase tracking-wide">
            Broker WebSocket
          </p>
          <p className="mt-1 break-all font-mono text-xs font-semibold text-ink-primary">
            {mqttUrl}
          </p>
        </div>
        <div className="rounded-xl bg-alpine-low px-3 py-2.5">
          <p className="font-body text-[10px] text-ink-secondary uppercase tracking-wide">
            Client ID
          </p>
          <p className="mt-1 font-mono text-xs font-semibold text-ink-primary truncate">
            {clientId}
          </p>
        </div>
        <div className="rounded-xl bg-alpine-low px-3 py-2.5">
          <p className="font-body text-[10px] text-ink-secondary uppercase tracking-wide">
            Telemetri Terakhir
          </p>
          <p className="mt-1 font-mono text-xs font-semibold text-ink-primary">
            {connection.lastTelemetryAt
              ? new Date(connection.lastTelemetryAt).toLocaleTimeString("id-ID")
              : "Belum ada data"}
          </p>
        </div>
      </div>

      {connection.error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-status-dangerBg px-3 py-2.5">
          <Icon name="error" className="text-[16px] text-status-dangerText flex-shrink-0 mt-0.5" />
          <p className="font-body text-xs text-status-dangerText">{connection.error}</p>
        </div>
      )}
    </section>
  );
}
