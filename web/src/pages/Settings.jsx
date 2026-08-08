import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, ShieldCheck, Database, Cpu, Save, Server, Zap, Globe } from "lucide-react";
import { fireSuccessBurst, AnimatedCheckmark } from "../components/MicroAnimations";
import { API_BASE_URL } from "../config";

const Settings = () => {
  const [sysStatus, setSysStatus] = useState({ mock_db: true, mock_ai: true, status: "offline" });
  const [storeConfig, setStoreConfig] = useState({
    storeName: "RetailMind Smart Store",
    supportEmail: "support@retailmind.ai",
    supportPhone: "+91-800-RETAIL",
    gstPercentage: "18",
    currency: "INR (₹)",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/status`);
        if (res.ok) setSysStatus(await res.json());
      } catch {}
    };
    check();
    const cfg = localStorage.getItem("retailmind_store_config");
    if (cfg) setStoreConfig(JSON.parse(cfg));
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("retailmind_store_config", JSON.stringify(storeConfig));
    setSaved(true);
    fireSuccessBurst(0.5, 0.5); // 🎉 confetti burst from center
    setTimeout(() => setSaved(false), 3000);
  };

  const integrations = [
    {
      icon: Database,
      label: "Database Source",
      desc: sysStatus.mock_db ? "In-Memory Polling" : "Cloud Firestore Live",
      active: !sysStatus.mock_db,
      badge: sysStatus.mock_db ? "Mock Mode" : "Live",
      color: sysStatus.mock_db ? "#fbbf24" : "#34d399",
    },
    {
      icon: Cpu,
      label: "AI Parsing Engine",
      desc: sysStatus.mock_ai ? "Heuristics Regex Engine" : "GPT-4o Mini",
      active: !sysStatus.mock_ai,
      badge: sysStatus.mock_ai ? "Mock Mode" : "GPT Active",
      color: sysStatus.mock_ai ? "#fbbf24" : "#34d399",
    },
    {
      icon: Server,
      label: "FastAPI Backend",
      desc: API_BASE_URL,
      active: sysStatus.status === "online",
      badge: sysStatus.status === "online" ? "Online" : "Offline",
      color: sysStatus.status === "online" ? "#34d399" : "#fb7185",
    },
    {
      icon: Globe,
      label: "Webhook Listeners",
      desc: "WhatsApp / Instagram / Email",
      active: true,
      badge: "Active",
      color: "#60a5fa",
    },
  ];

  const formFields = [
    { key: "storeName",     label: "Store Name",        type: "text",   span: 2, placeholder: "RetailMind Smart Store" },
    { key: "supportEmail",  label: "Support Email",     type: "email",  span: 1, placeholder: "support@retailmind.ai" },
    { key: "supportPhone",  label: "Support Phone",     type: "text",   span: 1, placeholder: "+91-800-RETAIL" },
    { key: "gstPercentage", label: "GST Tax Rate (%)",  type: "number", span: 1, placeholder: "18" },
    { key: "currency",      label: "Currency",          type: "select", span: 1 },
  ];

  return (
    <div className="space-y-7 relative z-10">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="section-header">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.2)" }}>
              <SettingsIcon size={17} style={{ color: "#94a3b8" }} />
            </span>
            System Settings
          </h1>
          <p className="section-subtitle">Configure store variables, integrations, and database connections</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Integrations Panel ──────────────────────────── */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 space-y-3">
            <div className="flex items-center gap-2.5 mb-4 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.2)" }}>
                <ShieldCheck size={13} style={{ color: "#94a3b8" }} />
              </div>
              <h2 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                API & Cloud Integrations
              </h2>
            </div>

            {integrations.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}12`, border: `1px solid ${item.color}25` }}>
                      <Icon size={13} style={{ color: item.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                      <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                    </div>
                  </div>
                  <span className="badge flex-shrink-0 ml-2"
                    style={{ background: `${item.color}12`, color: item.color, border: `1px solid ${item.color}25` }}>
                    {item.badge}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>

          {/* System Info */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="glass-card p-5 flex items-start gap-3"
            style={{ border: "1px solid rgba(96,165,250,0.12)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)" }}>
              <Zap size={14} style={{ color: "#60a5fa" }} />
            </div>
            <div>
              <p className="text-[11px] font-bold mb-1" style={{ color: "#60a5fa" }}>RetailMind v2.0</p>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                AI-powered retail ops platform. FastAPI backend + Firebase Firestore + Flutter mobile.
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Store Config Form ───────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-6 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.2)" }}>
              <SettingsIcon size={13} style={{ color: "#94a3b8" }} />
            </div>
            <h2 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Store Configuration</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formFields.map((f) => (
                <div key={f.key} className={`space-y-1.5 ${f.span === 2 ? "col-span-2" : ""}`}>
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {f.label}
                  </label>
                  {f.type === "select" ? (
                    <select value={storeConfig[f.key]}
                      onChange={(e) => setStoreConfig({ ...storeConfig, [f.key]: e.target.value })}
                      className="input-field">
                      <option value="INR (₹)">INR (₹)</option>
                      <option value="USD ($)">USD ($)</option>
                      <option value="EUR (€)">EUR (€)</option>
                      <option value="GBP (£)">GBP (£)</option>
                    </select>
                  ) : (
                    <input type={f.type} value={storeConfig[f.key]} placeholder={f.placeholder}
                      onChange={(e) => setStoreConfig({ ...storeConfig, [f.key]: e.target.value })}
                      className="input-field" required />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.div key="saved"
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <AnimatedCheckmark size={22} color="#34d399" />
                    <p className="text-[11px] font-semibold" style={{ color: "#34d399" }}>
                      Configuration saved!
                    </p>
                  </motion.div>
                ) : (
                  <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Changes are stored locally in your browser.
                  </motion.p>
                )}
              </AnimatePresence>
              <button type="submit" className="btn btn-primary">
                <Save size={13} /> Save Configuration
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
