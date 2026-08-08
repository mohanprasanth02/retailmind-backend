import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, ShieldCheck, Database, Cpu, Save, Server, Zap, Globe, Check } from "lucide-react";
import { fireSuccessBurst } from "../components/MicroAnimations";
import { API_BASE_URL, getApiBaseUrl, setApiBaseUrl } from "../config";

const Settings = () => {
  const [sysStatus, setSysStatus] = useState({ mock_db: true, mock_ai: true, status: "offline" });
  const [storeConfig, setStoreConfig] = useState({
    storeName: "RetailMind Smart Store",
    supportEmail: "support@retailmind.ai",
    supportPhone: "+91-800-RETAIL",
    gstPercentage: "18",
    currency: "INR (₹)",
    backendUrl: getApiBaseUrl(),
  });
  const [saved, setSaved] = useState(false);

  const checkStatus = async (url) => {
    try {
      const target = url || getApiBaseUrl();
      const res = await fetch(`${target}/api/status`);
      if (res.ok) setSysStatus(await res.json());
      else setSysStatus({ mock_db: true, mock_ai: true, status: "offline" });
    } catch {
      setSysStatus({ mock_db: true, mock_ai: true, status: "offline" });
    }
  };

  useEffect(() => {
    checkStatus();
    const cfg = localStorage.getItem("retailmind_store_config");
    if (cfg) {
      const parsed = JSON.parse(cfg);
      setStoreConfig((prev) => ({ ...prev, ...parsed, backendUrl: parsed.backendUrl || getApiBaseUrl() }));
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (storeConfig.backendUrl) {
      setApiBaseUrl(storeConfig.backendUrl);
    }
    localStorage.setItem("retailmind_store_config", JSON.stringify(storeConfig));
    setSaved(true);
    fireSuccessBurst(0.5, 0.5);
    checkStatus(storeConfig.backendUrl);
    setTimeout(() => setSaved(false), 3000);
  };

  const integrations = [
    {
      icon: Database,
      label: "Database Connection",
      desc: sysStatus.mock_db ? "In-Memory Polling" : "Cloud Firestore Live",
      active: !sysStatus.mock_db,
      badge: sysStatus.mock_db ? "Mock Mode" : "Live",
      color: sysStatus.mock_db ? "#FF9500" : "#34C759",
    },
    {
      icon: Cpu,
      label: "AI Parsing Engine",
      desc: sysStatus.mock_ai ? "Heuristics Regex Engine" : "GPT-4o Mini",
      active: !sysStatus.mock_ai,
      badge: sysStatus.mock_ai ? "Mock Mode" : "GPT Active",
      color: sysStatus.mock_ai ? "#FF9500" : "#34C759",
    },
    {
      icon: Server,
      label: "Backend Server API",
      desc: storeConfig.backendUrl || getApiBaseUrl(),
      active: sysStatus.status === "online",
      badge: sysStatus.status === "online" ? "Online" : "Offline",
      color: sysStatus.status === "online" ? "#34C759" : "#FF3B30",
    },
    {
      icon: Globe,
      label: "Webhook Integration",
      desc: "WhatsApp / Instagram / Email",
      active: true,
      badge: "Active",
      color: "#007AFF",
    },
  ];

  return (
    <div className="space-y-6 relative z-10">
      {/* ── Page Header Bar ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-black/[0.06]"
      >
        <div>
          <span className="apple-section-label block mb-1 text-[#007AFF]">
            System Configuration
          </span>
          <h1 className="apple-hero-title">
            Configure your store environment.
          </h1>
          <p className="apple-hero-subtitle">
            Manage API connections, store information, tax rates, and live service integrations.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleSave}
          className="btn btn-primary shadow-md shadow-blue-500/20 cursor-pointer self-start md:self-auto"
        >
          {saved ? <Check size={15} strokeWidth={2.5} /> : <Save size={15} strokeWidth={2} />}
          <span>{saved ? "Settings Saved!" : "Save Configuration"}</span>
        </motion.button>
      </motion.div>

      {/* ── System Health Cards ────────────────────────────────────── */}
      <div>
        <p className="apple-section-label mb-3">Live System Integrations</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrations.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="glass-card p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                  <Icon size={18} style={{ color: item.color }} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3 className="text-xs font-bold text-[#1D1D1F] truncate m-0">{item.label}</h3>
                    <span className="badge text-[9px] font-bold" style={{ background: `${item.color}15`, color: item.color }}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#86868B] truncate m-0">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Configuration Form Card ───────────────────────────────── */}
      <div className="glass-card p-6 bg-white rounded-2xl border border-black/[0.06] shadow-xs">
        <h2 className="text-base font-bold text-[#1D1D1F] pb-3 border-b border-black/[0.06] m-0 mb-4">
          Store Details & API Endpoints
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="apple-section-label block mb-1">Backend Server API URL</label>
            <input
              type="text" required
              value={storeConfig.backendUrl}
              onChange={(e) => setStoreConfig({ ...storeConfig, backendUrl: e.target.value })}
              className="input-field font-mono text-xs"
              placeholder="http://localhost:8000"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="apple-section-label block mb-1">Store Name</label>
              <input
                type="text" required
                value={storeConfig.storeName}
                onChange={(e) => setStoreConfig({ ...storeConfig, storeName: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="apple-section-label block mb-1">Support Email</label>
              <input
                type="email" required
                value={storeConfig.supportEmail}
                onChange={(e) => setStoreConfig({ ...storeConfig, supportEmail: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="apple-section-label block mb-1">Support Phone</label>
              <input
                type="text"
                value={storeConfig.supportPhone}
                onChange={(e) => setStoreConfig({ ...storeConfig, supportPhone: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="apple-section-label block mb-1">GST Rate (%)</label>
              <input
                type="number"
                value={storeConfig.gstPercentage}
                onChange={(e) => setStoreConfig({ ...storeConfig, gstPercentage: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="apple-section-label block mb-1">Currency Format</label>
              <select
                value={storeConfig.currency}
                onChange={(e) => setStoreConfig({ ...storeConfig, currency: e.target.value })}
                className="input-field cursor-pointer"
              >
                <option value="INR (₹)">Indian Rupee (₹ INR)</option>
                <option value="USD ($)">US Dollar ($ USD)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-black/[0.05] flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              className="btn btn-primary shadow-md shadow-blue-500/20 cursor-pointer"
            >
              {saved ? <Check size={15} strokeWidth={2.5} /> : <Save size={15} strokeWidth={2} />}
              <span>{saved ? "Saved!" : "Save Changes"}</span>
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
