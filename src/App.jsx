import { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar.jsx";
import RoleLoginModal from "./components/RoleLoginModal.jsx";
import RoleVerificationModal from "./components/RoleVerificationModal.jsx";
import { fetchApi } from "./utils/api.js";

// Pages
import DashboardPage from "./pages/DashboardPage.jsx";
import CctvPage from "./pages/CctvPage.jsx";
import EggPage from "./pages/EggPage.jsx";
import SensorHistoryPage from "./pages/SensorHistoryPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import AccountsPage from "./pages/AccountsPage.jsx";
import SalesPage from "./pages/SalesPage.jsx";
import KatalogPage from "./pages/KatalogPage.jsx";

// Hooks & Data
import { useMqttBridge } from "./hooks/useMqttBridge.js";
import {
  ROLES,
  ROLE_ACCESS_CODES,
  INITIAL_EGGS,
  INITIAL_PEAFOWL,
  INITIAL_SALES,
  INITIAL_ALERTS,
} from "./data/constants.js";

// Custom hook for localStorage (previously inline)
function useStoredState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Gagal menyimpan state ke localStorage (${key}):`, error);
    }
  }, [key, state]);

  return [state, setState];
}

export default function App() {
  // === GLOBAL STATES ===
  const [activePage, setActivePage] = useStoredState("km_page", "dashboard");
  const [role, setRole] = useStoredState("km_role", "viewer");
  const [verifiedRoles, setVerifiedRoles] = useStoredState("km_verified_roles", {});
  const [darkMode, setDarkMode] = useStoredState("km_dark_mode", false);
  const [activeVariety, setActiveVariety] = useStoredState("km_active_variety", "hijau");
  const [cctvUrl, setCctvUrl] = useStoredState("km_cctv_url", "rtsp://admin:Admin123@192.168.110.227:554/V_ENC_000");
  // === DATA STATES ===
  const [eggs, setEggsState] = useStoredState("km_eggs", INITIAL_EGGS);
  const [peafowl, setPeafowl] = useStoredState("km_peafowl", INITIAL_PEAFOWL);
  const [sales, setSalesState] = useStoredState("km_sales", INITIAL_SALES);
  const [alerts, setAlerts] = useStoredState("km_alerts", INITIAL_ALERTS);

  // Sync wrappers for database REST API
  const setEggs = async (val) => {
    const nextState = typeof val === "function" ? val(eggs) : val;
    setEggsState(nextState);
    
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (apiBaseUrl === undefined) return;

    try {
      if (nextState.length > eggs.length) {
        const added = nextState.find(item => !eggs.some(x => x.id === item.id));
        if (added) {
          await fetchApi(`/api/eggs`, {
            method: "POST",
            body: JSON.stringify(added),
          });
        }
      } else if (nextState.length < eggs.length) {
        const deleted = eggs.find(item => !nextState.some(x => x.id === item.id));
        if (deleted) {
          await fetchApi(`/api/eggs/${deleted.id}`, {
            method: "DELETE",
          });
        }
      } else {
        const updated = nextState.find(item => {
          const old = eggs.find(x => x.id === item.id);
          return old && JSON.stringify(old) !== JSON.stringify(item);
        });
        if (updated) {
          await fetchApi(`/api/eggs/${updated.id}`, {
            method: "PUT",
            body: JSON.stringify(updated),
          });
        }
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data telur ke API:", err);
    }
  };

  const setSales = async (val) => {
    const nextState = typeof val === "function" ? val(sales) : val;
    setSalesState(nextState);
    
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (apiBaseUrl === undefined) return;

    try {
      if (nextState.length > sales.length) {
        const added = nextState.find(item => !sales.some(x => x.id === item.id));
        if (added) {
          await fetchApi(`/api/sales`, {
            method: "POST",
            body: JSON.stringify(added),
          });
        }
      } else if (nextState.length < sales.length) {
        const deleted = sales.find(item => !nextState.some(x => x.id === item.id));
        if (deleted) {
          await fetchApi(`/api/sales/${deleted.id}`, {
            method: "DELETE",
          });
        }
      } else {
        const updated = nextState.find(item => {
          const old = sales.find(x => x.id === item.id);
          return old && JSON.stringify(old) !== JSON.stringify(item);
        });
        if (updated) {
          await fetchApi(`/api/sales/${updated.id}`, {
            method: "PUT",
            body: JSON.stringify(updated),
          });
        }
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data penjualan ke API:", err);
    }
  };

  // === UI STATES ===
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [roleRequest, setRoleRequest] = useState(null);
  const [isHandleHovered, setIsHandleHovered] = useState(false);

  useEffect(() => {
    // Close sidebar on mount if mobile
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  // Fetch initial data from API if configured
  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!apiBaseUrl) return;

    const fetchInitialData = async () => {
      try {
        const eggsData = await fetchApi(`/api/eggs`);
        setEggsState(eggsData);
      } catch (err) {
        console.error("Gagal mengambil data telur dari API:", err);
      }

      try {
        const salesData = await fetchApi(`/api/sales`);
        setSalesState(salesData);
      } catch (err) {
        console.error("Gagal mengambil data penjualan dari API:", err);
      }
    };

    fetchInitialData();
  }, []);

  // === MQTT BRIDGE ===
  const { mqttUrl, clientId, connection, telemetry, temperatureTrend, humidityTrend, logs, publish } =
    useMqttBridge();

  // === SIDE-EFFECTS ===
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, [darkMode]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }
  }, [sidebarOpen]);

  // Sync telemetry readings to MySQL database via REST API (once every 60 seconds)
  const lastSavedTelemetryRef = useRef(0);

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!apiBaseUrl) return;
    if (telemetry.temp === null || telemetry.humidity === null || telemetry.temp === undefined || telemetry.humidity === undefined) return;

    const now = Date.now();
    if (now - lastSavedTelemetryRef.current >= 60000) {
      lastSavedTelemetryRef.current = now;
      
      const logData = {
        timestamp: new Date().toISOString(),
        temperature: parseFloat(telemetry.temp),
        humidity: parseFloat(telemetry.humidity)
      };

      fetchApi(`/api/incubator/telemetry-logs`, {
        method: "POST",
        body: JSON.stringify(logData),
      }).catch((err) => {
        console.error("Gagal menyimpan log telemetri ke database:", err);
      });
    }
  }, [telemetry]);

  // === HANDLERS ===
  const handleRoleRequest = (requestedRole) => {
    if (requestedRole === "login") {
      setShowLoginModal(true);
    } else if (requestedRole === "viewer") {
      setRole("viewer");
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user_info");
      setSidebarOpen(false);
    } else if (verifiedRoles[requestedRole]) {
      setRole(requestedRole);
      setSidebarOpen(false);
    } else {
      setRoleRequest(requestedRole);
    }
  };

  const handleLoginSelectRole = (selectedRole) => {
    setVerifiedRoles((prev) => ({
      ...prev,
      [selectedRole]: true,
    }));
    setRole(selectedRole);
    setShowLoginModal(false);
    setSidebarOpen(false);
  };

  const handlePageChange = (pageId) => {
    setActivePage(pageId);
    setSidebarOpen(false);
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // === RENDER PAGE ===
  const renderPage = () => {
    const props = {
      role,
      setRole,
      publish,
      connection,
      telemetry,
      mqttUrl,
      clientId,
      temperatureTrend,
      humidityTrend,
      alerts,
      setAlerts,
      activeVariety,
      setActiveVariety,
      cctvUrl,
      setCctvUrl,
    };
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardPage
            {...props}
            mqttUrl={mqttUrl}
            clientId={clientId}
            temperatureTrend={temperatureTrend}
            activeVariety={activeVariety}
            alerts={alerts}
            setAlerts={setAlerts}
            eggs={eggs}
            logs={logs}
          />
        );
      case "kamera":
        return <CctvPage {...props} />;
      case "telur":
        return <EggPage {...props} eggs={eggs} setEggs={setEggs} />;
      case "katalog":
        return <KatalogPage {...props} onPageChange={handlePageChange} />;
      case "histori":
        return <SensorHistoryPage {...props} />;
      case "pengaturan":
        return (
          <SettingsPage
            {...props}
            activeVariety={activeVariety}
            setActiveVariety={setActiveVariety}
          />
        );
      case "penjualan":
        return <SalesPage {...props} sales={sales} setSales={setSales} />;
      case "akun":
        return <AccountsPage {...props} />;
      default:
        return <DashboardPage {...props} />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile Topbar */}
      <div
        className="flex h-16 items-center justify-between border-b px-4 lg:hidden sticky top-0 z-50 shadow-sm transition-colors duration-500"
        style={{ borderColor: "var(--alpine-high)", backgroundColor: "var(--surface)", color: "var(--ink-primary)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white shadow-sm border border-alpine-high">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-cover" />
          </div>
          <span className="font-display font-extrabold text-ink-primary">Kampung Merak</span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-alpine-high bg-alpine-low text-ink-secondary"
          aria-label="Buka Menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      <Sidebar
        connection={connection}
        activePage={activePage}
        onPageChange={handlePageChange}
        role={role}
        onRoleRequest={handleRoleRequest}
        verifiedRoles={verifiedRoles}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Desktop vertical middle toggle handle */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        onMouseEnter={() => setIsHandleHovered(true)}
        onMouseLeave={() => setIsHandleHovered(false)}
        className="fixed top-1/2 -translate-y-1/2 z-[80] hidden lg:flex h-8 w-8 items-center justify-center rounded-full border border-alpine-high bg-surface shadow-md hover:bg-alpine-low text-ink-primary transition-all active:scale-95 cursor-pointer"
        style={{
          left: sidebarOpen ? "264px" : (isHandleHovered ? "0px" : "-16px"),
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.1s, background-color 0.2s, color 0.2s",
        }}
        title={sidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
      >
        <span className="material-symbols-outlined text-[20px]">
          {sidebarOpen ? "chevron_left" : "chevron_right"}
        </span>
      </button>

      {/* Overlay for mobile sidebar */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-[280px]" : "lg:ml-0"}`}
        style={{ backgroundColor: "var(--alpine-mist)", color: "var(--ink-primary)" }}
      >
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </div>
      </main>

      {showLoginModal && (
        <RoleLoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={(newRole) => {
            // Map remote backend roles to local UI roles
            let mappedRole = "viewer";
            if (newRole === "pemilik" || newRole === "admin") mappedRole = "admin";
            else if (newRole === "staff" || newRole === "operator") mappedRole = "operator";
            
            setRole(mappedRole);
            setSidebarOpen(false);
          }}
        />
      )}

      {roleRequest && (
        <RoleVerificationModal
          role={roleRequest}
          expectedCode={ROLE_ACCESS_CODES[roleRequest]}
          onSuccess={() => {
            setVerifiedRoles((prev) => ({ ...prev, [roleRequest]: true }));
            setRole(roleRequest);
            setRoleRequest(null);
            setSidebarOpen(false);
          }}
          onCancel={() => setRoleRequest(null)}
        />
      )}
    </div>
  );
}