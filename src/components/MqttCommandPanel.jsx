import { useState } from "react";
import Icon from "./Icon.jsx";
import StatusBadge, { getDeviceVariant, getDeviceLabel } from "./StatusBadge.jsx";
import FormField from "./FormField.jsx";
import { ROLES, MQTT_TOPICS } from "../data/constants.js";

export default function MqttCommandPanel({ telemetry, publish, role }) {
  const [minHumidity, setMinHumidity] = useState("45");
  const [maxHumidity, setMaxHumidity] = useState("50");
  const [mistCooldown, setMistCooldown] = useState(false);

  const disabled = !ROLES[role].canControl;
  const configurationLocked = !ROLES[role].canConfigure;

  const validHumidity = (value) => {
    const number = Number(value);
    return Number.isFinite(number) && number >= 20 && number <= 90;
  };

  const publishHumidityThreshold = () => {
    if (!validHumidity(minHumidity) || !validHumidity(maxHumidity) || Number(minHumidity) >= Number(maxHumidity)) return;
    publish(MQTT_TOPICS.humidityThresholdLow, Number(minHumidity).toFixed(0));
    publish(MQTT_TOPICS.humidityThresholdHigh, Number(maxHumidity).toFixed(0));
  };

  const triggerMist = () => {
    if (disabled || mistCooldown) return;
    const ok = publish(MQTT_TOPICS.mistTrigger, "TRIGGER");
    if (ok) {
      setMistCooldown(true);
      window.setTimeout(() => setMistCooldown(false), 3000);
    }
  };

  return (
    <section className="km-card p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-teal-iridescence">
            Publish Command
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold text-ink-primary">
            Panel Kontrol MQTT ESP32
          </h2>
        </div>
        <span className="km-badge km-badge-neutral font-mono text-[10px]">PAYLOAD STRING</span>
      </div>

      <div className="space-y-5">
        {/* Kelembaban */}
        <div className="rounded-2xl border border-alpine-high p-5 bg-surface">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-body text-sm font-bold text-ink-primary">
                Ambang Batas Kelembaban
              </p>
              <p className="mt-1 font-body text-xs text-ink-secondary max-w-sm">
                Admin dan Operator dapat mengubah batas bawah dan atas kelembaban ideal.
              </p>
            </div>
            <StatusBadge
              label={`${telemetry.humidity ?? "--"}%`}
              variant={telemetry.humidity ? "teal" : "neutral"}
              showIcon={false}
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
            <FormField label="Batas bawah (%)" htmlFor="minHum">
              <input
                id="minHum"
                value={minHumidity}
                onChange={(e) => setMinHumidity(e.target.value)}
                disabled={configurationLocked}
                type="number"
                min="20"
                max="90"
                className="km-input font-mono"
              />
            </FormField>
            <FormField label="Batas atas (%)" htmlFor="maxHum">
              <input
                id="maxHum"
                value={maxHumidity}
                onChange={(e) => setMaxHumidity(e.target.value)}
                disabled={configurationLocked}
                type="number"
                min="20"
                max="90"
                className="km-input font-mono"
              />
            </FormField>
            <button
              disabled={
                configurationLocked ||
                !validHumidity(minHumidity) ||
                !validHumidity(maxHumidity) ||
                Number(minHumidity) >= Number(maxHumidity)
              }
              onClick={publishHumidityThreshold}
              className="km-btn km-btn-primary"
            >
              Kirim Ambang
            </button>
          </div>
        </div>

        {/* Mist Maker */}
        <div className="rounded-2xl border border-alpine-high p-5 bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-body text-sm font-bold text-ink-primary">
                Trigger Mist Maker
              </p>
              <p className="mt-1 font-body text-xs text-ink-secondary max-w-sm">
                Tombol dikunci 3 detik setelah ditekan agar sinkron dengan kerja ESP32.
              </p>
            </div>
            <button
              disabled={disabled || mistCooldown}
              onClick={triggerMist}
              className="km-btn km-btn-teal flex-shrink-0"
            >
              <Icon name="water_drop" className="text-[18px]" />
              {mistCooldown ? "Menunggu..." : "Hidupkan Mist Maker"}
            </button>
          </div>
        </div>

        {configurationLocked && (
          <div className="flex items-start gap-2 rounded-xl bg-alpine-low px-4 py-3">
            <Icon name="info" className="text-[18px] text-ink-outline mt-0.5" />
            <p className="font-body text-xs leading-5 text-ink-secondary">
              Mode Operator dapat mengoperasikan perangkat, tetapi tidak dapat mengubah
              threshold suhu/kelembaban atau frekuensi otomatis. Viewer terkunci total.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
