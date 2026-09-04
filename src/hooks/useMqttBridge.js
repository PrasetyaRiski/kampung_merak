import { useCallback, useEffect, useRef, useState } from "react";
import mqtt from "mqtt";
import { MQTT_TOPICS, SUBSCRIBE_TOPICS, DEFAULT_TREND, DEFAULT_HUMIDITY_TREND, makeId, nowTime, normalizeStatus } from "../data/constants.js";
import { fetchApi } from "../utils/api.js";

export function useMqttBridge() {
  const [mqttConfig, setMqttConfig] = useState({
    url: import.meta.env.VITE_MQTT_URL || "wss://broker.emqx.io:8084/mqtt",
    username: import.meta.env.VITE_MQTT_USERNAME || undefined,
    password: import.meta.env.VITE_MQTT_PASSWORD || undefined,
  });
  const [clientId] = useState(
    () => `kampung-merak-inkubator-${Math.random().toString(16).slice(2, 10)}`
  );
  const clientRef = useRef(null);
  const [connection, setConnection] = useState({
    status: "idle",
    error: "",
    lastConnectedAt: null,
    lastTelemetryAt: null,
  });
  const [telemetry, setTelemetry] = useState({
    temperature: null,
    humidity: null,
    statusLamp: "UNKNOWN",
    statusMotor: "UNKNOWN",
    statusMist: "UNKNOWN",
  });
  const [temperatureTrend, setTemperatureTrend] = useState(DEFAULT_TREND);
  const [humidityTrend, setHumidityTrend] = useState(DEFAULT_HUMIDITY_TREND);
  const [logs, setLogs] = useState([
    {
      id: makeId("LOG"),
      time: nowTime(),
      type: "SYSTEM",
      text: "Dashboard inkubator siap. Menunggu koneksi MQTT WebSocket.",
    },
  ]);

  const pushLog = useCallback((type, text) => {
    setLogs((current) =>
      [{ id: makeId("LOG"), time: nowTime(), type, text }, ...current].slice(0, 32)
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchApi("/api/incubator/settings").then(settings => {
      if (mounted) {
        setMqttConfig({
          url: settings.mqtt_url || import.meta.env.VITE_MQTT_URL || "wss://broker.emqx.io:8084/mqtt",
          username: settings.mqtt_username || import.meta.env.VITE_MQTT_USERNAME || undefined,
          password: settings.mqtt_password || import.meta.env.VITE_MQTT_PASSWORD || undefined,
        });
      }
    }).catch(err => {
      console.warn("Failed fetching MQTT config from API, using .env fallback:", err);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setConnection((current) => ({ ...current, status: "connecting", error: "" }));
    pushLog("MQTT", `Membuka koneksi ke ${mqttConfig.url}`);

    const client = mqtt.connect(mqttConfig.url, {
      clientId,
      username: mqttConfig.username,
      password: mqttConfig.password,
      clean: true,
      keepalive: 30,
      connectTimeout: 10000,
      reconnectPeriod: 3000,
      resubscribe: true,
      protocolVersion: 4,
    });

    clientRef.current = client;

    client.on("connect", () => {
      setConnection({
        status: "connected",
        error: "",
        lastConnectedAt: new Date().toISOString(),
        lastTelemetryAt: null,
      });
      pushLog("MQTT", "Broker terhubung. Subscribe topik telemetri dijalankan.");
      client.subscribe(SUBSCRIBE_TOPICS, { qos: 0 }, (error) => {
        if (error) {
          setConnection((current) => ({ ...current, status: "error", error: error.message }));
          pushLog("ERROR", `Subscribe gagal: ${error.message}`);
          return;
        }
        pushLog("MQTT", `Subscribe aktif: ${SUBSCRIBE_TOPICS.join(", ")}`);
      });
    });

    client.on("reconnect", () => {
      setConnection((current) => ({ ...current, status: "reconnecting" }));
      pushLog("MQTT", "Koneksi terputus sementara. Mencoba menghubungkan ulang.");
    });

    client.on("offline", () => {
      setConnection((current) => ({ ...current, status: "offline" }));
      pushLog("MQTT", "Client MQTT offline.");
    });

    client.on("error", (error) => {
      setConnection((current) => ({ ...current, status: "error", error: error.message }));
      pushLog("ERROR", `Koneksi MQTT bermasalah: ${error.message}`);
    });

    client.on("message", (topic, buffer) => {
      const payload = buffer.toString().trim();
      setConnection((current) => ({ ...current, lastTelemetryAt: new Date().toISOString() }));
      pushLog("RX", `${topic} -> ${payload}`);

      if (topic === MQTT_TOPICS.temperature) {
        const temperature = Number.parseFloat(payload);
        if (!Number.isNaN(temperature)) {
          setTelemetry((current) => ({ ...current, temperature }));
          setTemperatureTrend((current) => [...current.slice(-23), temperature]);
        }
      }
      if (topic === MQTT_TOPICS.humidity) {
        const humidity = Number.parseFloat(payload);
        if (!Number.isNaN(humidity)) {
          setTelemetry((current) => ({ ...current, humidity }));
          setHumidityTrend((current) => [...current.slice(-23), humidity]);
        }
      }
      if (topic === MQTT_TOPICS.statusLamp)
        setTelemetry((current) => ({ ...current, statusLamp: normalizeStatus(payload) }));
      if (topic === MQTT_TOPICS.statusMotor)
        setTelemetry((current) => ({ ...current, statusMotor: normalizeStatus(payload) }));
      if (topic === MQTT_TOPICS.statusMist)
        setTelemetry((current) => ({ ...current, statusMist: normalizeStatus(payload) }));
    });

    return () => {
      client.removeAllListeners();
      client.end(true);
      clientRef.current = null;
    };
  }, [clientId, mqttConfig.url, mqttConfig.password, pushLog, mqttConfig.username]);

  const publish = useCallback(
    (topic, payload) => {
      const client = clientRef.current;
      if (!client || !client.connected) {
        pushLog("ERROR", `Publish gagal karena MQTT belum terhubung: ${topic}`);
        return false;
      }
      client.publish(topic, String(payload), { qos: 0, retain: false }, (error) => {
        if (error) {
          pushLog("ERROR", `Publish gagal ${topic}: ${error.message}`);
        } else {
          pushLog("TX", `${topic} <- ${payload}`);
        }
      });
      return true;
    },
    [pushLog]
  );

  return { mqttUrl: mqttConfig.url, clientId, connection, telemetry, temperatureTrend, humidityTrend, logs, publish, pushLog };
}
