import { useState } from "react";
import Icon from "./Icon.jsx";
import StatusBadge, { getDeviceVariant, getDeviceLabel } from "./StatusBadge.jsx";
import FormField from "./FormField.jsx";
import { ROLES, MQTT_TOPICS } from "../data/constants.js";

export default function MqttCommandPanel({ telemetry, publish, role }) {
  // Threshold States
  const [minHumidity, setMinHumidity] = useState("40");
  const [maxHumidity, setMaxHumidity] = useState("70");
  const [tempOn, setTempOn] = useState("37.5");
  const [tempOff, setTempOff] = useState("38.0");
  const [activeLampMode, setActiveLampMode] = useState("AUTO");

  // Operational Timers / Cooldowns
  const [mistRunning, setMistRunning] = useState(false);
  const [motorRunning, setMotorRunning] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState("");

  const disabled = !ROLES[role]?.canControl;
  const configurationLocked = !ROLES[role]?.canConfigure;

  const showToast = (msg) => {
    setFeedbackToast(msg);
    window.setTimeout(() => setFeedbackToast(""), 3500);
  };

  const validHumidity = (value) => {
    const number = Number(value);
    return Number.isFinite(number) && number >= 20 && number <= 95;
  };

  const validTemp = (value) => {
    const number = Number(value);
    return Number.isFinite(number) && number >= 30 && number <= 45;
  };

  const publishHumidityThreshold = () => {
    if (!validHumidity(minHumidity) || !validHumidity(maxHumidity) || Number(minHumidity) >= Number(maxHumidity)) return;
    const okLow = publish(MQTT_TOPICS.humidityThresholdLow, Number(minHumidity).toFixed(1));
    const okHigh = publish(MQTT_TOPICS.humidityThresholdHigh, Number(maxHumidity).toFixed(1));
    if (okLow && okHigh) {
      showToast(`Ambang kelembaban dikirim: ${minHumidity}% - ${maxHumidity}%`);
    }
  };

  const publishTempThreshold = () => {
    if (!validTemp(tempOn) || !validTemp(tempOff) || Number(tempOn) >= Number(tempOff)) return;
    const okOn = publish(MQTT_TOPICS.lampThresholdOn, Number(tempOn).toFixed(1));
    const okOff = publish(MQTT_TOPICS.lampThresholdOff, Number(tempOff).toFixed(1));
    if (okOn && okOff) {
      showToast(`Ambang suhu pemanas dikirim: ON <= ${tempOn}°C, OFF >= ${tempOff}°C`);
    }
  };

  const setLampMode = (mode) => {
    if (disabled) return;
    let payload = "AUTO";
    if (mode === "MANUAL_ON") payload = "ON";
    else if (mode === "MANUAL_OFF") payload = "OFF";

    const ok = publish(MQTT_TOPICS.lampMode, payload);
    if (ok) {
      setActiveLampMode(mode);
      showToast(`Mode pemanas diatur ke ${mode}`);
    }
  };

  const triggerMist = () => {
    if (disabled || mistRunning) return;
    const ok = publish(MQTT_TOPICS.mistTrigger, "TRIGGER");
    if (ok) {
      setMistRunning(true);
      showToast("Perintah Mist Maker (10s) dikirim ke ESP32!");
      window.setTimeout(() => setMistRunning(false), 15000); // 10s run + 5s cooldown
    }
  };

  const triggerMotor = () => {
    if (disabled || motorRunning) return;
    const ok = publish(MQTT_TOPICS.motorTrigger, "TRIGGER");
    if (ok) {
      setMotorRunning(true);
      showToast("Perintah Putar Rak Motor (30s) dikirim ke ESP32!");
      window.setTimeout(() => setMotorRunning(false), 30000); // 30s run
    }
  };

  return (
    <section className="km-card p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-teal-iridescence">
            ESP32 IoT Aktuator & Kontrol
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold text-ink-primary">
            Panel Kontrol Perangkat Inkubator
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {telemetry.statusSensor && (
            <span className={`km-badge ${telemetry.statusSensor === "OK" ? "km-badge-success" : telemetry.statusSensor === "ERROR" ? "km-badge-danger" : "km-badge-neutral"} font-mono text-[10px]`}>
              SHT30: {telemetry.statusSensor}
            </span>
          )}
          <span className="km-badge km-badge-neutral font-mono text-[10px]">MQTT LIVE</span>
        </div>
      </div>

      {feedbackToast && (
        <div className="rounded-xl border border-teal-iridescence/30 bg-teal-iridescence/10 px-4 py-2.5 text-xs font-semibold text-teal-iridescence flex items-center gap-2 animate-fadeIn">
          <Icon name="check_circle" className="text-[16px]" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Grid 3 Aktuator: Lampu, Mist, Motor */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* 1. Lampu Pemanas */}
        <div className="rounded-2xl border border-alpine-high p-4 sm:p-5 bg-surface flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${telemetry.statusLamp === "ON" ? "bg-amber-100 text-amber-600 animate-pulse" : "bg-alpine-low text-ink-outline"}`}>
                  <Icon name="lightbulb" className="text-[20px]" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-ink-primary">Lampu Pemanas</h3>
                  <p className="font-mono text-[10px] text-ink-secondary">Relay PIN 25</p>
                </div>
              </div>
              <StatusBadge
                label={getDeviceLabel(telemetry.statusLamp)}
                variant={getDeviceVariant(telemetry.statusLamp)}
                showIcon={false}
              />
            </div>

            <div className="mt-4 pt-3 border-t border-alpine-high">
              <p className="font-mono text-[10px] uppercase font-bold text-ink-secondary tracking-wider mb-2">Mode Kontrol</p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setLampMode("AUTO")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    activeLampMode === "AUTO"
                      ? "bg-teal-iridescence text-white shadow-sm"
                      : "bg-alpine-low text-ink-secondary hover:bg-alpine-high/50"
                  }`}
                >
                  AUTO
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setLampMode("MANUAL_ON")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    activeLampMode === "MANUAL_ON"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-alpine-low text-ink-secondary hover:bg-alpine-high/50"
                  }`}
                >
                  ON
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setLampMode("MANUAL_OFF")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    activeLampMode === "MANUAL_OFF"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "bg-alpine-low text-ink-secondary hover:bg-alpine-high/50"
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>
          </div>

          <p className="mt-3 font-body text-[11px] text-ink-outline">
            {activeLampMode === "AUTO" ? "Menjaga suhu otomatis berdasarkan sensor SHT30." : "Kontrol manual aktif menimpa sensor."}
          </p>
        </div>

        {/* 2. Mist Maker (Humidifier) */}
        <div className="rounded-2xl border border-alpine-high p-4 sm:p-5 bg-surface flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${telemetry.statusMist === "ON" ? "bg-teal-100 text-teal-600 animate-pulse" : "bg-alpine-low text-ink-outline"}`}>
                  <Icon name="water_drop" className="text-[20px]" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-ink-primary">Mist Maker</h3>
                  <p className="font-mono text-[10px] text-ink-secondary">Relay PIN 27</p>
                </div>
              </div>
              <StatusBadge
                label={getDeviceLabel(telemetry.statusMist)}
                variant={getDeviceVariant(telemetry.statusMist)}
                showIcon={false}
              />
            </div>

            <div className="mt-4 pt-3 border-t border-alpine-high">
              <button
                type="button"
                disabled={disabled || mistRunning || telemetry.statusMist === "ON"}
                onClick={triggerMist}
                className="w-full km-btn km-btn-teal justify-center py-2 text-xs"
              >
                <Icon name="water_drop" className={`text-[16px] ${mistRunning ? "animate-spin" : ""}`} />
                {mistRunning ? "Aktif (10s)..." : "Picu Mist Manual"}
              </button>
            </div>
          </div>

          <p className="mt-3 font-body text-[11px] text-ink-outline">
            Aktif otomatis bila kelembaban di bawah batas bawah. Berjalan 10 detik.
          </p>
        </div>

        {/* 3. Motor Pemutar Rak */}
        <div className="rounded-2xl border border-alpine-high p-4 sm:p-5 bg-surface flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${telemetry.statusMotor === "ON" ? "bg-purple-100 text-purple-600 animate-spin" : "bg-alpine-low text-ink-outline"}`}>
                  <Icon name="autorenew" className="text-[20px]" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-ink-primary">Motor Rak Telur</h3>
                  <p className="font-mono text-[10px] text-ink-secondary">Relay PIN 26</p>
                </div>
              </div>
              <StatusBadge
                label={getDeviceLabel(telemetry.statusMotor)}
                variant={getDeviceVariant(telemetry.statusMotor)}
                showIcon={false}
              />
            </div>

            <div className="mt-4 pt-3 border-t border-alpine-high">
              <button
                type="button"
                disabled={disabled || motorRunning || telemetry.statusMotor === "ON"}
                onClick={triggerMotor}
                className="w-full km-btn km-btn-primary justify-center py-2 text-xs"
              >
                <Icon name="sync" className={`text-[16px] ${motorRunning ? "animate-spin" : ""}`} />
                {motorRunning ? "Memutar (30s)..." : "Picu Rotasi Rak"}
              </button>
            </div>
          </div>

          <p className="mt-3 font-body text-[11px] text-ink-outline">
            Berputar otomatis tiap 4 jam selama 30 detik untuk sirkulasi embrio telur.
          </p>
        </div>
      </div>

      {/* Threshold Configuration Section */}
      <div className="rounded-2xl border border-alpine-high p-5 bg-alpine-low/50 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-ink-primary">Pengaturan Ambang Batas ESP32</h3>
            <p className="font-body text-xs text-ink-secondary">
              Kirim parameter baru ke mikrokontroler via topik MQTT <span className="font-mono text-teal-iridescence">iot/cmd/*</span>.
            </p>
          </div>
          {configurationLocked && (
            <span className="km-badge km-badge-warning text-[10px] font-mono">LOCKED (VIEWER)</span>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Ambang Suhu */}
          <div className="rounded-xl border border-alpine-high p-4 bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-ink-primary">
                <Icon name="thermostat" className="text-amber-500 text-[18px]" />
                <span>Ambang Suhu Lampu Pemanas</span>
              </div>
              <span className="font-mono text-xs font-semibold text-teal-iridescence">
                {telemetry.temperature != null ? `${telemetry.temperature.toFixed(1)}°C` : "--"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Suhu Hidup/ON (≤ °C)" htmlFor="tempOn">
                <input
                  id="tempOn"
                  value={tempOn}
                  onChange={(e) => setTempOn(e.target.value)}
                  disabled={configurationLocked}
                  type="number"
                  step="0.1"
                  min="30"
                  max="45"
                  className="km-input font-mono text-sm py-2"
                />
              </FormField>
              <FormField label="Suhu Mati/OFF (≥ °C)" htmlFor="tempOff">
                <input
                  id="tempOff"
                  value={tempOff}
                  onChange={(e) => setTempOff(e.target.value)}
                  disabled={configurationLocked}
                  type="number"
                  step="0.1"
                  min="30"
                  max="45"
                  className="km-input font-mono text-sm py-2"
                />
              </FormField>
            </div>
            <button
              type="button"
              disabled={
                configurationLocked ||
                !validTemp(tempOn) ||
                !validTemp(tempOff) ||
                Number(tempOn) >= Number(tempOff)
              }
              onClick={publishTempThreshold}
              className="w-full km-btn km-btn-primary justify-center py-2 text-xs"
            >
              Update Ambang Suhu
            </button>
          </div>

          {/* Ambang Kelembaban */}
          <div className="rounded-xl border border-alpine-high p-4 bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-ink-primary">
                <Icon name="water_drop" className="text-teal-500 text-[18px]" />
                <span>Ambang Kelembaban Mist Maker</span>
              </div>
              <span className="font-mono text-xs font-semibold text-teal-iridescence">
                {telemetry.humidity != null ? `${telemetry.humidity.toFixed(0)}%` : "--"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Batas Bawah/ON (< %)" htmlFor="minHum">
                <input
                  id="minHum"
                  value={minHumidity}
                  onChange={(e) => setMinHumidity(e.target.value)}
                  disabled={configurationLocked}
                  type="number"
                  min="20"
                  max="90"
                  className="km-input font-mono text-sm py-2"
                />
              </FormField>
              <FormField label="Batas Atas (> %)" htmlFor="maxHum">
                <input
                  id="maxHum"
                  value={maxHumidity}
                  onChange={(e) => setMaxHumidity(e.target.value)}
                  disabled={configurationLocked}
                  type="number"
                  min="20"
                  max="95"
                  className="km-input font-mono text-sm py-2"
                />
              </FormField>
            </div>
            <button
              type="button"
              disabled={
                configurationLocked ||
                !validHumidity(minHumidity) ||
                !validHumidity(maxHumidity) ||
                Number(minHumidity) >= Number(maxHumidity)
              }
              onClick={publishHumidityThreshold}
              className="w-full km-btn km-btn-teal justify-center py-2 text-xs"
            >
              Update Ambang Kelembaban
            </button>
          </div>
        </div>

        {configurationLocked && (
          <div className="flex items-start gap-2 rounded-xl bg-alpine-low px-4 py-3">
            <Icon name="info" className="text-[18px] text-ink-outline mt-0.5" />
            <p className="font-body text-xs leading-5 text-ink-secondary">
              Hanya Admin dan Operator yang berwenang mengirim perintah threshold dan mengontrol aktuator ESP32.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
