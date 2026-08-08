import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../config";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import {
  TrendingUp, Award, ShoppingBag, Package, ArrowUpRight,
  ArrowDownRight, Zap, RefreshCw, Star
} from "lucide-react";
import { formatPrice } from "../utils/currency";

const IndianRupee = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13h4.5a4.5 4.5 0 0 1 0 9" />
    <path d="M10.5 13 18 22" />
    <path d="M6 3c5 0 6.5 5 6.5 5" />
  </svg>
);


const PIE_COLORS  = ["#007AFF", "#34C759", "#5856D6", "#FF9500", "#FF3B30", "#30B0C7"];
const BAR_COLORS  = ["#007AFF", "#34C759", "#5856D6", "#FF9500", "#FF3B30"];
const DOW_LABELS  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTip = ({ active, payload, label, prefix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3.5 py-2.5 rounded-2xl bg-white/95 border border-black/10 shadow-lg backdrop-blur-xl text-xs">
      <p className="font-semibold text-[#86868B] mb-0.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold text-sm text-[#007AFF] m-0">
          {prefix}{formatPrice(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Mini Stat Card ────────────────────────────────────────────────────────────
const MiniStat = ({ label, value, delta, color, icon: Icon, prefix = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 14, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    whileHover={{ y: -2 }}
    transition={{ delay, duration: 0.35, type: "spring", stiffness: 350, damping: 25 }}
    className="glass-card p-5 rounded-2xl bg-white border border-black/[0.06] shadow-xs relative overflow-hidden"
  >
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#86868B] mb-1">
          {label}
        </p>
        <h3 className="text-2xl font-bold tracking-tight text-[#1D1D1F] m-0">
          {prefix}{typeof value === "number" ? value.toLocaleString("en-IN") : value}
        </h3>
        {delta !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {delta >= 0
              ? <ArrowUpRight size={12} className="text-[#34C759]" strokeWidth={2.5} />
              : <ArrowDownRight size={12} className="text-[#FF3B30]" strokeWidth={2.5} />}
            <span className={`text-[11px] font-bold ${delta >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
              {Math.abs(delta)}% vs last week
            </span>
          </div>
        )}
      </div>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}
      >
        <Icon size={19} style={{ color }} strokeWidth={2} />
      </div>
    </div>
  </motion.div>
);

// ── Revenue Heatmap ───────────────────────────────────────────────────────────
const RevenueHeatmap = ({ orders }) => {
  // Build heatmap: day of week × hour of day
  const grid = Array.from({ length: 7 }, () => Array(12).fill(0)); // 7 days × 12 two-hour slots
  orders.forEach(o => {
    const ts = o.timestamp;
    if (!ts) return;
    const d = new Date((typeof ts === "number" ? ts : ts._seconds) * 1000);
    const dow = d.getDay();
    const slot = Math.floor(d.getHours() / 2);
    grid[dow][slot] += o.total || 0;
  });
  const maxVal = Math.max(...grid.flat(), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 mb-2">
        <div className="w-8" />
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="flex-1 text-center text-[9px]" style={{ color: "var(--text-muted)", minWidth: 24 }}>
            {`${i * 2}h`}
          </div>
        ))}
      </div>
      {DOW_LABELS.map((day, di) => (
        <div key={day} className="flex gap-1 mb-1 items-center">
          <div className="w-8 text-[9px] font-semibold text-right pr-1" style={{ color: "var(--text-muted)" }}>{day}</div>
          {grid[di].map((val, hi) => {
            const intensity = val / maxVal;
            const alpha = Math.max(0.05, intensity);
            return (
              <div key={hi} title={`${day} ${hi * 2}:00 – ${(hi + 1) * 2}:00 → ${formatPrice(val)}`}
                className="flex-1 rounded cursor-pointer transition-transform hover:scale-110"
                style={{
                  minWidth: 24, height: 20,
                  background: `rgba(96,165,250,${alpha})`,
                  border: `1px solid rgba(96,165,250,${alpha * 0.5})`,
                }} />
            );
          })}
        </div>
      ))}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Low</span>
        {[0.1, 0.3, 0.5, 0.7, 1].map(a => (
          <div key={a} className="w-5 h-3 rounded-sm" style={{ background: `rgba(96,165,250,${a})` }} />
        ))}
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>High</span>
      </div>
    </div>
  );
};

// ── Main Analytics Page ───────────────────────────────────────────────────────
const Analytics = () => {
  const [loading, setLoading]   = useState(true);
  const [orders, setOrders]     = useState([]);
  const [products, setProducts] = useState([]);
  const [metrics, setMetrics]   = useState({});

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [oRes, pRes, rRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/orders`),
        fetch(`${API_BASE_URL}/api/products`),
        fetch(`${API_BASE_URL}/api/reports`),
      ]);
      if (oRes.ok) setOrders(await oRes.json());
      if (pRes.ok) setProducts(await pRes.json());
      if (rRes.ok) { const d = await rRes.json(); setMetrics(d.metrics || {}); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  // ── Derived data ─────────────────────────────────────────────────────────
  const completed = orders.filter(o => o.status === "Completed");

  // Revenue last 14 days
  const revenueByDay = (() => {
    const days = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days[k] = 0;
    }
    completed.forEach(o => {
      const ts = o.timestamp;
      if (!ts) return;
      const d = new Date((typeof ts === "number" ? ts : ts._seconds) * 1000);
      const k = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (days[k] !== undefined) days[k] += o.total || 0;
    });
    return Object.keys(days).map(k => ({ name: k, Revenue: Math.round(days[k]) }));
  })();

  // Top 5 products by quantity sold
  const productSales = (() => {
    const map = {};
    completed.forEach(o => {
      (o.products || []).forEach(p => {
        map[p.name] = (map[p.name] || 0) + (p.quantity || 1);
      });
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, qty]) => ({ name: name.length > 16 ? name.slice(0, 14) + "…" : name, qty }));
  })();

  // Monthly comparison (this month vs last)
  const monthComparison = (() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear  = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastYear  = thisMonth === 0 ? thisYear - 1 : thisYear;

    let current = 0, previous = 0;
    completed.forEach(o => {
      const ts = o.timestamp;
      if (!ts) return;
      const d = new Date((typeof ts === "number" ? ts : ts._seconds) * 1000);
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) current += o.total || 0;
      if (d.getMonth() === lastMonth && d.getFullYear() === lastYear)  previous += o.total || 0;
    });
    const pct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
    return { current, previous, pct };
  })();

  // Conversion funnel
  const total   = orders.length || 1;
  const funnel  = [
    { label: "Received",   count: orders.length,                                   color: "#60a5fa" },
    { label: "Processed",  count: orders.filter(o => o.aiProcessed).length,        color: "#a78bfa" },
    { label: "Accepted",   count: orders.filter(o => o.status !== "Pending" && o.status !== "Rejected").length, color: "#fbbf24" },
    { label: "Completed",  count: completed.length,                                color: "#34d399" },
  ];

  const conversion = Math.round((completed.length / total) * 100);
  const avgOrder   = completed.length ? Math.round(completed.reduce((s, o) => s + (o.total || 0), 0) / completed.length) : 0;

  return (
    <div className="space-y-7 relative z-10">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="section-header">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.2)" }}>
              <TrendingUp size={17} style={{ color: "#60a5fa" }} />
            </span>
            Live Sales Analytics
          </h1>
          <p className="section-subtitle">Revenue trends, product performance, conversion funnel and order heatmap</p>
        </div>
        <button onClick={fetchAll} className="btn btn-ghost">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "rgba(96,165,250,0.3)", borderTopColor: "#60a5fa" }} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── KPI Row ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniStat label="Total Revenue"    value={metrics.totalRevenue || 0}   color="#60a5fa" icon={IndianRupee} prefix="₹" delta={monthComparison.pct} delay={0} />
            <MiniStat label="Conversion Rate"  value={`${conversion}%`}             color="#34d399" icon={TrendingUp}  delay={0.07} />
            <MiniStat label="Avg Order Value"  value={avgOrder}                     color="#a78bfa" icon={ShoppingBag} prefix="₹" delay={0.14} />
            <MiniStat label="Products Tracked" value={products.length}              color="#fbbf24" icon={Package}     delay={0.21} />
          </div>

          {/* ── Charts Row ───────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 14-day Revenue Trend */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="glass-card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.2)" }}>
                    <TrendingUp size={14} style={{ color: "#60a5fa" }} />
                  </div>
                  <div>
                    <h2 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Revenue Trend</h2>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Last 14 days</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: monthComparison.pct >= 0 ? "rgba(52,211,153,0.08)" : "rgba(251,113,133,0.08)",
                    border: `1px solid ${monthComparison.pct >= 0 ? "rgba(52,211,153,0.2)" : "rgba(251,113,133,0.2)"}` }}>
                  {monthComparison.pct >= 0
                    ? <ArrowUpRight size={12} style={{ color: "#34d399" }} />
                    : <ArrowDownRight size={12} style={{ color: "#fb7185" }} />}
                  <span className="text-[11px] font-bold"
                    style={{ color: monthComparison.pct >= 0 ? "#34d399" : "#fb7185" }}>
                    {monthComparison.pct >= 0 ? "+" : ""}{monthComparison.pct}% this month
                  </span>
                </div>
              </div>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueByDay} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                      tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} width={48} />
                    <Tooltip content={<CustomTip />} />
                    <Area type="monotone" dataKey="Revenue" stroke="#60a5fa" strokeWidth={2.5}
                      fill="url(#aGrad)" dot={false} activeDot={{ r: 5, fill: "#60a5fa", strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Top 5 Products */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.37 }}
              className="glass-card p-6">
              <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <Award size={14} style={{ color: "#fbbf24" }} />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Top 5 Products</h2>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>By units sold</p>
                </div>
              </div>

              {productSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <Package size={28} className="opacity-20" />
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No completed orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {productSales.map((p, i) => {
                    const maxQty = productSales[0].qty;
                    const pct = Math.round((p.qty / maxQty) * 100);
                    return (
                      <div key={p.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black"
                              style={{ background: `${BAR_COLORS[i]}15`, color: BAR_COLORS[i], border: `1px solid ${BAR_COLORS[i]}30` }}>
                              {i + 1}
                            </span>
                            <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                          </div>
                          <span className="text-[12px] font-bold" style={{ color: BAR_COLORS[i] }}>{p.qty} sold</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <motion.div className="h-full rounded-full"
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.4 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                            style={{ background: `linear-gradient(90deg, ${BAR_COLORS[i]}, ${BAR_COLORS[i]}80)` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Heatmap + Funnel Row ─────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Order Heatmap */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
              className="glass-card p-6 lg:col-span-2">
              <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.2)" }}>
                  <Zap size={14} style={{ color: "#22d3ee" }} />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Revenue Heatmap</h2>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Sales intensity by day & hour</p>
                </div>
              </div>
              <RevenueHeatmap orders={completed} />
            </motion.div>

            {/* Conversion Funnel */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="glass-card p-6">
              <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.2)" }}>
                  <Star size={14} style={{ color: "#a78bfa" }} />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Order Funnel</h2>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Conversion pipeline</p>
                </div>
              </div>

              <div className="space-y-3">
                {funnel.map((stage, i) => {
                  const pct = Math.round((stage.count / (funnel[0].count || 1)) * 100);
                  return (
                    <div key={stage.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>{stage.label}</span>
                        <span className="text-[11px] font-bold" style={{ color: stage.color }}>
                          {stage.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <motion.div className="h-full rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 0.7, ease: "easeOut" }}
                          style={{ background: `linear-gradient(90deg, ${stage.color}, ${stage.color}80)` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="mt-5 p-4 rounded-xl text-center"
                style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Overall Conversion
                </p>
                <p className="text-3xl font-bold mt-1" style={{ color: "#34d399", fontFamily: "'Space Grotesk', sans-serif" }}>
                  {conversion}%
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
