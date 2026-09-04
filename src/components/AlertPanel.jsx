import { useState, useEffect } from "react";
import Icon from "./Icon.jsx";
import StatusBadge, { getAlertVariant } from "./StatusBadge.jsx";
import EmptyState from "./EmptyState.jsx";
import { ROLES, MQTT_TOPICS } from "../data/constants.js";
import { fetchApi } from "../utils/api.js";

export default function AlertPanel({ role, publish }) {
  const [alerts, setAlerts] = useState([]);
  const canAck = ROLES[role].canAcknowledge;

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const data = await fetchApi('/api/alerts');
        const mappedAlerts = data.map(a => ({
          id: a.id,
          status: a.is_read ? "acknowledged" : "open",
          level: a.level,
          title: a.tipe,
          detail: a.pesan,
          source: a.tipe,
          createdAt: a.created_at ? new Date(a.created_at).toLocaleString("id-ID") : "-",
          acknowledgedBy: "Sistem"
        }));
        setAlerts(mappedAlerts);
      } catch (err) {
        console.error("Gagal memuat alerts", err);
      }
    };
    loadAlerts();
    // Optional: add interval for polling if MQTT is not pushing
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, []);
  const openAlerts = alerts.filter((a) => a.status === "open");
  const openCount = openAlerts.length;

  const acknowledge = async (id) => {
    if (!canAck) return;
    try {
      await fetchApi(`/api/alerts/${id}/read`, { method: "PUT" });
      setAlerts((current) =>
        current.map((alert) =>
          alert.id === id
            ? { ...alert, status: "acknowledged", acknowledgedBy: ROLES[role].short }
            : alert
        )
      );
      publish(MQTT_TOPICS.alertAck, id);
    } catch (err) {
      console.error("Gagal acknowledge alert", err);
    }
  };

  const deleteAlert = async (id) => {
    if (!canAck) return;
    try {
      await fetchApi(`/api/alerts/${id}`, { method: "DELETE" });
      setAlerts((current) => current.filter((alert) => alert.id !== id));
    } catch (err) {
      console.error("Gagal hapus alert", err);
    }
  };


  return (
    <section className="km-card p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-teal-iridescence">
            Alert Operasional
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold text-ink-primary">
            Kendala dan Acknowledge
          </h2>
          <p className="mt-1 font-body text-sm text-ink-secondary max-w-lg">
            Admin dan Operator dapat menandai masalah sudah ditangani di lapangan.
          </p>
        </div>
        {openCount > 0 ? (
          <StatusBadge label={`${openCount} OPEN`} variant="danger" />
        ) : (
          <StatusBadge label="Semua Aman" variant="success" icon="check_circle" />
        )}
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {alerts.length === 0 ? (
          <EmptyState
            icon="notifications"
            title="Tidak ada alert"
            desc="Sistem berjalan normal dan stabil."
          />
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-2xl border p-4 transition-colors ${
                alert.status === "open"
                  ? "border-status-warning bg-surface hover:bg-status-warningBg/20"
                  : "border-alpine-high bg-alpine-low"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge
                      label={alert.level}
                      variant={getAlertVariant(alert.level)}
                      showIcon={false}
                    />
                    <p className="font-body text-sm font-bold text-ink-primary">
                      {alert.title}
                    </p>
                  </div>
                  <p className="mt-2 font-body text-sm leading-6 text-ink-secondary">
                    {alert.detail}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] font-semibold text-ink-outline">
                    <span className="flex items-center gap-1">
                      <Icon name="tag" className="text-[14px]" />
                      {alert.id}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="sensors" className="text-[14px]" />
                      {alert.source}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="schedule" className="text-[14px]" />
                      {alert.createdAt}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <StatusBadge
                    label={
                      alert.status === "open" ? "Perlu tindakan" : `Ack: ${alert.acknowledgedBy}`
                    }
                    variant={alert.status === "open" ? "warning" : "success"}
                    icon={alert.status === "open" ? "priority_high" : "check"}
                  />
                  {alert.status === "open" && canAck && (
                    <button
                      onClick={() => acknowledge(alert.id)}
                      className="km-btn km-btn-primary km-btn-sm mt-1"
                    >
                      Acknowledge
                    </button>
                  )}
                  {canAck && (
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="km-btn km-btn-danger km-btn-sm mt-1"
                      title="Hapus alert"
                    >
                      <Icon name="delete" className="text-[14px]" />
                      Hapus
                    </button>
                  )}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!canAck && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-alpine-low px-4 py-3">
          <Icon name="info" className="text-[18px] text-ink-outline mt-0.5" />
          <p className="font-body text-xs leading-5 text-ink-secondary">
            Mode viewer tidak menerima notifikasi darurat secara aktif dan tidak memiliki
            izin untuk melakukan acknowledge alert.
          </p>
        </div>
      )}
    </section>
  );
}
