import { useState } from "react";
import Icon from "./Icon.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { ROLES, MQTT_TOPICS } from "../data/constants.js";

function ToggleSwitch({ label, description, icon, active, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all duration-200 ${
        active ? "border-teal-iridescence/40 bg-surface shadow-sm" : "border-alpine-high bg-surface hover:border-teal-iridescence/30"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3.5 pr-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${
            active ? "bg-status-successBg" : "bg-alpine-low"
          }`}
        >
          <Icon
            name={icon}
            className={`text-[22px] transition-colors duration-200 ${
              active ? "text-teal-iridescence" : "text-ink-outline"
            }`}
          />
        </div>
        <div>
          <p className="font-body text-sm font-bold text-ink-primary">{label}</p>
          <p className="mt-1 font-body text-xs text-ink-secondary leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>
      <span
        className={`relative flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
          active ? "bg-teal-iridescence" : "bg-ink-outlineVariant"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
            active ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

export default function EmergencyControlPanel({ telemetry, publish, role }) {
  const disabled = !ROLES[role].canControl;
  // This state would ideally come from telemetry, but following original logic:
  const [candlingOn, setCandlingOn] = useState(false);

  return (
    <section className="km-card p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-ink-primary">
            Kendali Darurat Inkubator
          </h2>
          <p className="mt-1 font-body text-sm text-ink-secondary">
            Remote override untuk aktuator inkubator telur merak.
          </p>
        </div>
        <StatusBadge
          label={disabled ? "READ ONLY" : "MODE MANUAL"}
          variant={disabled ? "danger" : "warning"}
          icon={disabled ? "lock" : "engineering"}
        />
      </div>

      <div className="space-y-3">
        <ToggleSwitch
          label="Sakelar Lampu Peneropongan"
          description="LED candling grid untuk inspeksi embrio."
          icon="flashlight_on"
          active={candlingOn}
          disabled={disabled}
          onClick={() => {
            const next = !candlingOn;
            setCandlingOn(next);
            publish(MQTT_TOPICS.candlingMode, next ? "ON" : "OFF");
          }}
        />
      </div>

      {disabled && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-alpine-low px-4 py-3">
          <Icon name="info" className="text-[18px] text-ink-outline mt-0.5" />
          <p className="font-body text-xs leading-5 text-ink-secondary">
            Mode viewer hanya dapat memantau. Tombol kontrol tidak dapat digunakan.
          </p>
        </div>
      )}
    </section>
  );
}
