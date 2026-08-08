import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import {
  Radio, MessageSquare, Mail, Globe, ShoppingBag,
  TrendingUp, Clock, Activity, RefreshCw, Users,
  CheckCircle, AlertCircle, Zap
} from "lucide-react";
import { formatPrice } from "../utils/currency";
import { API_BASE_URL } from "../config";

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
  whatsapp:  { label: "WhatsApp",  color: "#25D366", bg: "rgba(37,211,102,0.10)", border: "rgba(37,211,102,0.25)", icon: MessageSquare },
  instagram: { label: "Instagram", color: "#E1306C", bg: "rgba(225,48,108,0.10)", border: "rgba(225,48,108,0.25)", icon: Instagram },
  website:   { label: "Website",   color: "#60a5fa", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.25)", icon: Globe },
  email:     { label: "Email",     color: "#fbbf24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.25)", icon: Mail },
};

const CustomTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-4 py-3 rounded-xl text-xs"
      style={{ background: "rgba(10,10,14,0.97)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
      <p className="font-bold mb-1" style={{ color: payload[0].payload.fill || payload[0].color }}>
        {payload[0].name || payload[0].dataKey}
      </p>
      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`);
      if (res.ok) setOrders(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchOrders(); const iv = setInterval(fetchOrders, 5000); return () => clearInterval(iv); }, []);

  // ── Derived Stats ──────────────────────────────────────────────────────────
  const statsByPlatform = (() => {
    const map = {};
    orders.forEach(o => {
      const p = (o.platform || "website").toLowerCase();
      if (!map[p]) map[p] = { total: 0, orders: 0, completed: 0, revenue: 0, responseTimes: [] };
      map[p].orders++;
      map[p].revenue += o.total || 0;
      if (o.status === "Completed") map[p].completed++;
      if (o.timestamp) {
        const age = Date.now() / 1000 - (typeof o.timestamp === "number" ? o.timestamp : o.timestamp._seconds);
        map[p].responseTimes.push(age / 3600); // hours
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

  // Recent orders for message preview
  const recentByPlatform = (() => {
    const map = {};
    [...orders].sort((a, b) => {
      const ta = typeof a.timestamp === "number" ? a.timestamp : a.timestamp?._seconds || 0;
      const tb = typeof b.timestamp === "number" ? b.timestamp : b.timestamp?._seconds || 0;
      return tb - ta;
    }).forEach(o => {
      const p = (o.platform || "website").toLowerCase();
      if (!map[p]) map[p] = [];
      if (map[p].length < 3) map[p].push(o);
    });
    return map;
  })();

  const totalOrders  = orders.length;
  const totalRevenue = orders.filter(o => o.status === "Completed").reduce((s, o) => s + (o.total || 0), 0);
  const avgResponse  = (() => {
    const all = Object.values(statsByPlatform).flatMap(v => v.responseTimes);
    return all.length ? (all.reduce((s, v) => s + v, 0) / all.length).toFixed(1) : "—";
  })();

  return (
    <div className="space-y-7 relative z-10">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="section-header">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.2)" }}>
              <Radio size={17} style={{ color: "#25D366" }} />
            </span>
            Sales Channels
          </h1>
          <p className="section-subtitle">Live status of all order channels — WhatsApp, Instagram, Website, Email</p>
        </div>
        <button onClick={fetchOrders} className="btn btn-ghost">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* ── Top KPIs ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Channels",   value: 4,                             color: "#25D366", icon: Radio },
          { label: "All Orders",       value: totalOrders,                   color: "#60a5fa", icon: ShoppingBag },
          { label: "Total Revenue",    value: formatPrice(totalRevenue),     color: "#34d399", icon: IndianRupee, isStr: true },
          { label: "Avg Response",     value: `${avgResponse}h`,             color: "#a78bfa", icon: Clock, isStr: true },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }} className="glass-card p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: "var(--text-muted)" }}>{s.label}</p>
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

      {/* ── Channel Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {Object.entries(PLATFORMS).map(([key, cfg], i) => {
          const Icon = cfg.icon;
          const stats = statsByPlatform[key] || { orders: 0, completed: 0, revenue: 0 };
          const convRate = stats.orders ? Math.round((stats.completed / stats.orders) * 100) : 0;
          const isOn = botStates[key];
          const recent = recentByPlatform[key] || [];

          return (
            <motion.div key={key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.08 }}
              className="glass-card p-0 overflow-hidden"
              style={{ borderColor: isOn ? cfg.border : "var(--border-subtle)" }}>
              {/* Top bar */}
              <div className="h-[2px]" style={{ background: isOn ? `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` : "transparent" }} />

              {/* Header */}
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>{cfg.label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: isOn ? "#34d399" : "#fb7185" }} />
                      <span className="text-[10px] font-semibold" style={{ color: isOn ? "#34d399" : "#fb7185" }}>
                        {isOn ? "Active" : "Paused"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => setBotStates(p => ({ ...p, [key]: !p[key] }))}
                  className="relative w-10 h-5 rounded-full transition-all duration-300 cursor-pointer"
                  style={{ background: isOn ? `${cfg.color}30` : "rgba(255,255,255,0.06)", border: `1px solid ${isOn ? cfg.border : "var(--border-subtle)"}` }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center"
                    style={{ background: isOn ? cfg.color : "rgba(255,255,255,0.2)", left: isOn ? "calc(100% - 18px)" : "2px" }} />
                </button>
              </div>

              {/* Stats */}
              <div className="p-4 grid grid-cols-2 gap-3">
                <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-[9px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>Orders</p>
                  <p className="text-lg font-bold mt-0.5" style={{ color: cfg.color }}>{stats.orders}</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-[9px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>Revenue</p>
                  <p className="text-[13px] font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                    ₹{Math.round(stats.revenue / 1000)}k
                  </p>
                </div>
              </div>

              {/* Conversion bar */}
              <div className="px-4 pb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>Conversion</span>
                  <span className="text-[11px] font-bold" style={{ color: cfg.color }}>{convRate}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${convRate}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                    style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}80)` }} />
                </div>
              </div>

              {/* Recent messages */}
              {recent.length > 0 && (
                <div className="px-4 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    Recent Messages
                  </p>
                  <div className="space-y-1.5">
                    {recent.map((o, ri) => (
                      <div key={ri} className="text-[11px] px-2.5 py-1.5 rounded-lg truncate"
                        style={{ background: cfg.bg, color: "var(--text-secondary)", border: `1px solid ${cfg.border}` }}>
                        <span className="font-semibold" style={{ color: cfg.color }}>{o.customerName}: </span>
                        {o.message ? `"${o.message.slice(0, 40)}${o.message.length > 40 ? "…" : ""}"` : "Form submission"}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Charts Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
              <IndianRupee size={14} style={{ color: "#22d3ee" }} />
            </div>
            <div>
              <h2 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Revenue by Channel</h2>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Share of total revenue per platform</p>
            </div>
          </div>
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <Activity size={28} className="opacity-20" />
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No order data yet</p>
            </div>
          ) : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={45}
                    dataKey="value" nameKey="name" paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTip />} />
                  <Legend formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Orders bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.68 }}
          className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)" }}>
              <ShoppingBag size={14} style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <h2 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Orders vs Completed</h2>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Per channel performance</p>
            </div>
          </div>
          {barData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <ShoppingBag size={28} className="opacity-20" />
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No data yet</p>
            </div>
          ) : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "rgba(10,10,14,0.97)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="Orders" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {barData.map((d, i) => <Cell key={i} fill={`${d.fill}80`} />)}
                  </Bar>
                  <Bar dataKey="Completed" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Channels;
