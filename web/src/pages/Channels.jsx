import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import {
  Radio, MessageSquare, Mail, Globe, ShoppingBag,
  TrendingUp, Clock, Activity, RefreshCw, Users,
  CheckCircle, AlertCircle, Zap, Settings as SettingsIcon,
  Play, Send, Check, ShieldCheck, X, Copy, ChevronRight
} from "lucide-react";
import { formatPrice } from "../utils/currency";
import { API_BASE_URL } from "../config";
import { fireSuccessBurst } from "../components/MicroAnimations";

const Instagram = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const IndianRupee = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13h4.5a4.5 4.5 0 0 1 0 9" />
    <path d="M10.5 13 18 22" />
    <path d="M6 3c5 0 6.5 5 6.5 5" />
  </svg>
);

const PLATFORMS = {
  whatsapp:  { label: "WhatsApp Bot",  color: "#25D366", bg: "rgba(37,211,102,0.10)", border: "rgba(37,211,102,0.30)", icon: MessageSquare, handle: "+91 98765 00123", webhook: "/api/webhooks/whatsapp" },
  instagram: { label: "Instagram DM AI", color: "#E1306C", bg: "rgba(225,48,108,0.10)", border: "rgba(225,48,108,0.30)", icon: Instagram, handle: "@retailmind_official", webhook: "/api/webhooks/instagram" },
  website:   { label: "Website Store",   color: "#60a5fa", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.30)", icon: Globe, handle: "store.retailmind.ai", webhook: "/api/webhooks/web" },
  email:     { label: "Email Auto-Parser", color: "#fbbf24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.30)", icon: Mail, handle: "orders@retailmind.ai", webhook: "/api/webhooks/email" },
};

const CustomTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-4 py-3 rounded-xl text-xs bg-white border border-slate-200 shadow-xl">
      <p className="font-bold mb-1" style={{ color: payload[0].payload.fill || payload[0].color }}>
        {payload[0].name || payload[0].dataKey}
      </p>
      <p className="text-sm font-bold text-slate-900">
        {formatPrice(payload[0].value)}
      </p>
    </div>
  );
};

const Channels = () => {
  const [loading, setLoading]   = useState(true);
  const [orders, setOrders]     = useState([]);
  const [botStates, setBotStates] = useState({
    whatsapp: true, instagram: true, website: true, email: true,
  });

  const [activeTabFilter, setActiveTabFilter] = useState("all");
  const [simModalOpen, setSimModalOpen]       = useState(false);
  const [configModalPlatform, setConfigModalPlatform] = useState(null);

  // Simulator Form State
  const [simPlatform, setSimPlatform] = useState("whatsapp");
  const [simName, setSimName]         = useState("Arjun Kumar");
  const [simMsg, setSimMsg]           = useState("Hi! Want 2 Nike Air Max shoes deliver to Bangalore.");
  const [simSending, setSimSending]   = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`);
      if (res.ok) setOrders(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 5000);
    return () => clearInterval(iv);
  }, []);

  // ── Derived Stats ──────────────────────────────────────────────────────────
  const statsByPlatform = (() => {
    const map = {};
    orders.forEach(o => {
      const p = (o.platform || "website").toLowerCase();
      if (!map[p]) map[p] = { total: 0, orders: 0, completed: 0, revenue: 0, responseTimes: [] };
      map[p].orders++;
      map[p].revenue += (o.total || 0);
      if (o.status === "Completed") map[p].completed++;
      if (o.timestamp) {
        const age = Date.now() / 1000 - (typeof o.timestamp === "number" ? o.timestamp : o.timestamp._seconds || Date.now() / 1000);
        map[p].responseTimes.push(Math.max(0.1, age / 3600)); // hours
      }
    });
    return map;
  })();

  const pieData = Object.entries(statsByPlatform).map(([key, val]) => ({
    name: PLATFORMS[key]?.label || key,
    value: Math.round(val.revenue),
    fill: PLATFORMS[key]?.color || "#94a3b8",
  }));

  const barData = Object.entries(statsByPlatform).map(([key, val]) => ({
    name: PLATFORMS[key]?.label || key,
    Orders: val.orders,
    Completed: val.completed,
    fill: PLATFORMS[key]?.color || "#94a3b8",
  }));

  const totalOrders  = orders.length;
  const totalRevenue = orders.filter(o => o.status === "Completed").reduce((s, o) => s + (o.total || 0), 0);
  const avgResponse  = (() => {
    const all = Object.values(statsByPlatform).flatMap(v => v.responseTimes);
    return all.length ? (all.reduce((s, v) => s + v, 0) / all.length).toFixed(1) : "0.4";
  })();

  const handleSimulateSubmit = async (e) => {
    e.preventDefault();
    setSimSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: simPlatform,
          customerName: simName,
          message: simMsg,
          rawMessage: simMsg,
          items: [{ productId: "prod_1", name: "Nike Air Max", quantity: 2, price: 9960 }],
          total: 19920,
          status: "Pending",
          deliveryAddress: "Koramangala, Bengaluru, KA 560034",
        }),
      });
      if (res.ok) {
        fireSuccessBurst(0.5, 0.4);
        setSimModalOpen(false);
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimSending(false);
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      {/* ── Top Bar / Header ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-black/[0.06]"
      >
        <div>
          <span className="apple-section-label block mb-1 text-[#007AFF]">
            Multi-Channel Operations
          </span>
          <h1 className="apple-hero-title">
            Omnichannel AI connectivity.
          </h1>
          <p className="apple-hero-subtitle">
            Automated webhook listeners, platform bot triggers, and live order simulation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSimModalOpen(true)}
            className="btn btn-primary shadow-md shadow-blue-500/20 cursor-pointer text-xs"
          >
            <Play size={14} fill="currentColor" />
            <span>Simulate Order Message</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={fetchOrders}
            className="btn btn-ghost shadow-xs cursor-pointer text-xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} style={{ color: "#007AFF" }} />
            <span>Sync Channels</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ── KPI Cards Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Channels",  value: `${Object.values(botStates).filter(Boolean).length} / 4`, color: "#25D366", icon: Radio, isStr: true },
          { label: "Channel Orders",   value: totalOrders, color: "#60a5fa", icon: ShoppingBag },
          { label: "Channel Revenue",  value: formatPrice(totalRevenue), color: "#34d399", icon: IndianRupee, isStr: true },
          { label: "Avg Latency",      value: `${avgResponse}h`, color: "#a78bfa", icon: Clock, isStr: true },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }} className="glass-card p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {s.isStr ? s.value : s.value.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Channel Cards Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {Object.entries(PLATFORMS).map(([key, cfg], i) => {
          const Icon = cfg.icon;
          const stats = statsByPlatform[key] || { orders: 0, completed: 0, revenue: 0 };
          const convRate = stats.orders ? Math.round((stats.completed / stats.orders) * 100) : 0;
          const isOn = botStates[key];

          return (
            <motion.div key={key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="glass-card p-0 overflow-hidden relative group hover:border-emerald-500/30 transition-all"
              style={{ borderColor: isOn ? cfg.border : "var(--border-subtle)" }}>
              {/* Header Gradient */}
              <div className="h-[3px]" style={{ background: isOn ? `linear-gradient(90deg, ${cfg.color}, transparent)` : "transparent" }} />

              {/* Title & Toggle */}
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <Icon size={18} style={{ color: cfg.color }} />
                    {isOn && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                      {cfg.label}
                    </p>
                    <p className="text-[10px] text-neutral-400">{cfg.handle}</p>
                  </div>
                </div>

                {/* Switch button */}
                <button
                  onClick={() => setBotStates(p => ({ ...p, [key]: !p[key] }))}
                  className="relative w-11 h-6 rounded-full transition-all duration-300 cursor-pointer"
                  style={{ background: isOn ? `${cfg.color}35` : "rgba(255,255,255,0.06)", border: `1px solid ${isOn ? cfg.border : "var(--border-subtle)"}` }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center text-[10px] font-bold"
                    style={{ background: isOn ? cfg.color : "rgba(255,255,255,0.3)", left: isOn ? "calc(100% - 22px)" : "2px", color: isOn ? "#000" : "#fff" }}>
                    {isOn ? "ON" : ""}
                  </span>
                </button>
              </div>

              {/* Channel Performance stats */}
              <div className="p-4 grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Total Orders</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color: cfg.color }}>{stats.orders}</p>
                </div>
                <div className="p-2.5 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Revenue</p>
                  <p className="text-sm font-bold mt-1 text-emerald-400">
                    {formatPrice(stats.revenue)}
                  </p>
                </div>
              </div>

              {/* Conversion bar */}
              <div className="px-4 pb-4">
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <span className="text-[10px] text-neutral-400">Conversion Rate</span>
                  <span className="font-bold" style={{ color: cfg.color }}>{convRate}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${convRate}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ background: cfg.color }} />
                </div>
              </div>

              {/* Footer action button */}
              <div className="p-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-400" /> AI Parsed
                </span>
                <button
                  onClick={() => setConfigModalPlatform(key)}
                  className="text-[11px] font-semibold text-neutral-300 hover:text-white flex items-center gap-1">
                  Config <ChevronRight size={12} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Live Message Streams & Interactive Filter ────────────────── */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-white/5">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Zap size={16} className="text-amber-400" /> Incoming Live Channel Feed
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">Real-time parsed messages transformed into store orders</p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            {["all", "whatsapp", "instagram", "website", "email"].map((tab) => (
              <button key={tab}
                onClick={() => setActiveTabFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  activeTabFilter === tab
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Message Feed List */}
        <div className="space-y-3">
          {orders
            .filter(o => activeTabFilter === "all" || (o.platform || "website").toLowerCase() === activeTabFilter)
            .slice(0, 6)
            .map((order, idx) => {
              const platKey = (order.platform || "website").toLowerCase();
              const plat = PLATFORMS[platKey] || PLATFORMS.website;
              const PlatIcon = plat.icon;

              return (
                <div key={order.orderId || idx}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border transition-all hover:bg-white/[0.02]"
                  style={{ background: "rgba(10,12,18,0.5)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: plat.bg, border: `1px solid ${plat.border}` }}>
                      <PlatIcon size={15} style={{ color: plat.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{order.customerName || "Customer"}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: plat.bg, color: plat.color, border: `1px solid ${plat.border}` }}>
                          {plat.label}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 mt-1 italic">
                        "{order.message || order.rawMessage || "Order generated via store checkout"}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-400">{formatPrice(order.total || 0)}</p>
                      <p className="text-[10px] text-neutral-400">{order.status || "Pending"}</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ── Revenue Charts ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold">Revenue Breakdown by Channel</h3>
              <p className="text-[11px] text-neutral-400">Total gross sales per sales channel</p>
            </div>
            <IndianRupee size={16} className="text-emerald-400" />
          </div>
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={48}
                  dataKey="value" nameKey="name" paddingAngle={4}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTip />} />
                <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold">Order Volume per Channel</h3>
              <p className="text-[11px] text-neutral-400">Total vs Completed orders per platform</p>
            </div>
            <ShoppingBag size={16} className="text-indigo-400" />
          </div>
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "rgba(10,10,16,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="Orders" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {barData.map((d, i) => <Cell key={i} fill={`${d.fill}70`} />)}
                </Bar>
                <Bar dataKey="Completed" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── Test Order Simulator Modal ────────────────────────────── */}
      <AnimatePresence>
        {simModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-black/10 shadow-2xl max-w-md w-full p-6 relative"
            >
              <button
                onClick={() => setSimModalOpen(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center border-none cursor-pointer text-[#1D1D1F]"
              >
                <X size={15} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#EAF8ED] text-[#34C759] flex items-center justify-center border border-[#34C759]/25">
                  <Play size={18} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1D1D1F] m-0">Simulate Channel Order</h3>
                  <p className="text-xs text-[#86868B] m-0">Test AI natural language parsing for incoming orders</p>
                </div>
              </div>

              <form onSubmit={handleSimulateSubmit} className="space-y-3.5">
                <div>
                  <label className="apple-section-label block mb-1">Target Sales Channel</label>
                  <select
                    value={simPlatform}
                    onChange={(e) => setSimPlatform(e.target.value)}
                    className="input-field cursor-pointer"
                  >
                    <option value="whatsapp">WhatsApp Bot</option>
                    <option value="instagram">Instagram Direct</option>
                    <option value="website">Website Store</option>
                    <option value="email">Email Auto-Parser</option>
                  </select>
                </div>

                <div>
                  <label className="apple-section-label block mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="apple-section-label block mb-1">Natural Language Order Text</label>
                  <textarea
                    rows={3}
                    value={simMsg}
                    onChange={(e) => setSimMsg(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.05]">
                  <button type="button" onClick={() => setSimModalOpen(false)} className="btn btn-ghost">Cancel</button>
                  <button type="submit" disabled={simSending} className="btn btn-primary shadow-md shadow-blue-500/20">
                    {simSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>Send Test Order</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Channel Config Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {configModalPlatform && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-black/10 shadow-2xl max-w-md w-full p-6 relative"
            >
              <button
                onClick={() => setConfigModalPlatform(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center border-none cursor-pointer text-[#1D1D1F]"
              >
                <X size={15} />
              </button>

              {(() => {
                const cfg = PLATFORMS[configModalPlatform];
                const Icon = cfg.icon;
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                      >
                        <Icon size={20} style={{ color: cfg.color }} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#1D1D1F] m-0">{cfg.label} Integration</h3>
                        <p className="text-xs text-[#86868B] m-0">Webhook endpoint & AI processing status</p>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="apple-section-label block mb-1">Webhook Endpoint URL</span>
                        <div className="flex items-center gap-2 bg-[#F5F5F7] p-2.5 rounded-xl border border-black/[0.06]">
                          <code className="text-[#007AFF] font-mono text-[11px] flex-1 truncate">{API_BASE_URL}{cfg.webhook}</code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${API_BASE_URL}${cfg.webhook}`);
                              setCopiedWebhook(true);
                              setTimeout(() => setCopiedWebhook(false), 2000);
                            }}
                            className="p-1 text-[#86868B] hover:text-[#1D1D1F] border-none bg-none cursor-pointer"
                          >
                            {copiedWebhook ? <Check size={14} className="text-[#34C759]" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.04] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[#86868B]">Channel Bot Status</span>
                          <span className="badge green">Online & Listening</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#86868B]">AI Confidence Threshold</span>
                          <span className="font-bold text-[#1D1D1F]">85% Minimum</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-black/[0.05] flex justify-end">
                      <button onClick={() => setConfigModalPlatform(null)} className="btn btn-primary">Done</button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Channels;
