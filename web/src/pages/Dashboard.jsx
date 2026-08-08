import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../config";
import {
  onSnapshot,
  collection,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  IndianRupee,
  ShoppingBag,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  BellRing,
  Activity,
  ArrowUpRight,
  Package,
  Zap,
  Sparkles,
} from "lucide-react";
import { formatPrice } from "../utils/currency";

// ── Chart palette ────────────────────────────────────────────────────────────
const PIE_COLORS = ["#60a5fa", "#34d399", "#a78bfa", "#fbbf24"];

// ── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, accent, prefix = "", suffix = "", delay = 0 }) => {
  const animated = useCountUp(
    typeof value === "number" ? value : parseFloat(value) || 0,
    900
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`stat-card`}
      style={{ "--accent-color": accent }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-12 translate-x-12 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}12, transparent 70%)` }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase mb-3" style={{ color: "var(--text-muted)" }}>
            {label}
          </p>
          <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
            {prefix}{typeof value === "number" ? animated.toLocaleString() : value}{suffix}
          </p>
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
        >
          <Icon size={20} style={{ color: accent }} />
        </div>
      </div>

      {/* Trend indicator */}
      <div className="flex items-center gap-1.5 mt-4">
        <div
          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${accent}12`, color: accent }}
        >
          <ArrowUpRight size={10} />
          Live
        </div>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>synced</span>
      </div>
    </motion.div>
  );
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-4 py-3 rounded-xl text-xs"
      style={{
        background: "rgba(10,10,14,0.97)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold text-sm" style={{ color: p.color }}>
          {formatPrice(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Notification Item ─────────────────────────────────────────────────────────
const NotifItem = ({ n, i }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: i * 0.05 }}
    className="flex gap-3 p-3 rounded-xl"
    style={{
      background: n.read ? "rgba(255,255,255,0.02)" : "rgba(96,165,250,0.05)",
      border: `1px solid ${n.read ? "rgba(255,255,255,0.04)" : "rgba(96,165,250,0.12)"}`,
    }}
  >
    <div
      className="w-1.5 flex-shrink-0 rounded-full mt-0.5"
      style={{
        background: n.type === "low_stock" ? "var(--accent-rose)" : "var(--accent-blue)",
        height: "auto",
        minHeight: "16px",
        opacity: n.read ? 0.3 : 1,
      }}
    />
    <div className="min-w-0">
      <p
        className="text-[11px] font-bold uppercase tracking-wider"
        style={{ color: n.type === "low_stock" ? "var(--accent-rose)" : "var(--accent-blue)" }}
      >
        {n.title}
      </p>
      <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {n.message}
      </p>
      {n.timestamp && (
        <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
          {new Date(n.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  </motion.div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    lowStockItems: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [platformData, setPlatformData] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportRes, logsRes, prodRes, ordRes, notifRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/reports`),
        fetch(`${API_BASE_URL}/api/logs`),
        fetch(`${API_BASE_URL}/api/products`),
        fetch(`${API_BASE_URL}/api/orders`),
        fetch(`${API_BASE_URL}/api/notifications`),
      ]);

      if (reportRes.ok && logsRes.ok && prodRes.ok && ordRes.ok && notifRes.ok) {
        const [report, logs, products, orders, notifications] = await Promise.all([
          reportRes.json(), logsRes.json(), prodRes.json(), ordRes.json(), notifRes.json(),
        ]);

        setMetrics(report.metrics);
        setActivityLogs(logs.slice(0, 5));
        setRecentNotifications(notifications.slice(0, 5));
        setLowStockProducts(products.filter((p) => p.stock < 10));

        // Revenue chart (last 7 days)
        const days = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          days[d.toLocaleDateString("en-US", { month: "short", day: "numeric" })] = 0;
        }
        orders.forEach((o) => {
          let dateStr = "";
          const ts = o.timestamp;
          if (ts) {
            let dateObj =
              typeof ts === "number" ? new Date(ts * 1000)
              : ts._seconds ? new Date(ts._seconds * 1000)
              : new Date(ts);
            dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }
          if (days[dateStr] !== undefined && (o.status === "Completed" || o.status === "Processing")) {
            days[dateStr] += o.total || 0;
          }
        });
        setChartData(Object.keys(days).map((k) => ({ name: k, Revenue: Math.round(days[k]) })));

        const platCounts = report.platforms || {};
        const pData = Object.keys(platCounts).map((k) => ({ name: k.toUpperCase(), value: platCounts[k] }));
        setPlatformData(
          pData.length
            ? pData
            : [
                { name: "WHATSAPP", value: 3 },
                { name: "INSTAGRAM", value: 2 },
                { name: "WEBSITE", value: 4 },
                { name: "EMAIL", value: 1 },
              ]
        );
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (isFirebaseConfigured && db) {
      const unsub = onSnapshot(collection(db, "orders"), fetchData);
      return () => unsub();
    } else {
      const iv = setInterval(fetchData, 5000);
      return () => clearInterval(iv);
    }
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/read`, { method: "PUT" });
      if (res.ok) fetchData();
    } catch (e) {}
  };

  const statCards = [
    { label: "Total Revenue",     value: metrics.totalRevenue,    icon: IndianRupee, accent: "#60a5fa", prefix: "₹" },
    { label: "Pending Orders",    value: metrics.pendingOrders,   icon: Clock,       accent: "#fbbf24" },
    { label: "Completed Orders",  value: metrics.completedOrders, icon: CheckCircle, accent: "#34d399" },
    { label: "Total Products",    value: metrics.totalProducts,   icon: Package,     accent: "#a78bfa" },
    { label: "Low Stock Alerts",  value: metrics.lowStockItems,   icon: AlertTriangle, accent: "#fb7185" },
  ];

  return (
    <div className="relative z-10">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-header"
      >
        <div>
          <h1 className="section-title flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "linear-gradient(135deg, #60a5fa20, #a78bfa20)", border: "1px solid rgba(96,165,250,0.2)" }}
            >
              <Zap size={17} style={{ color: "#60a5fa" }} />
            </span>
            Operational Dashboard
          </h1>
          <p className="section-subtitle">
            Real-time retail intelligence · live order tracking · AI-powered insights
          </p>
        </div>

        <button
          onClick={fetchData}
          className="btn btn-ghost"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} style={{ color: "#60a5fa" }} />
          Sync Operations
        </button>
      </motion.div>

      {/* ── Loading Skeleton ─────────────────────────────────────────────── */}
      {loading && chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="relative">
            <div
              className="w-14 h-14 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "rgba(96,165,250,0.3)", borderTopColor: "#60a5fa" }}
            />
            <Sparkles
              size={18}
              className="absolute inset-0 m-auto"
              style={{ color: "#60a5fa" }}
            />
          </div>
          <p className="text-[12px] tracking-[0.15em] font-medium" style={{ color: "var(--text-muted)" }}>
            LOADING INTELLIGENCE...
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          {/* ── Stat Cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {statCards.map((s, i) => (
              <StatCard key={s.label} {...s} delay={i * 0.07} />
            ))}
          </div>

          {/* ── Charts Row ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Revenue Area Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="glass-card p-6 lg:col-span-2"
            >
              <div
                className="flex items-center justify-between mb-6 pb-4"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.2)" }}
                  >
                    <TrendingUp size={15} style={{ color: "#60a5fa" }} />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>
                      Revenue Trend
                    </h2>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      Last 7 days
                    </p>
                  </div>
                </div>
                <span className="badge blue">Live</span>
              </div>

              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.1)"
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.05)"
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      axisLine={false} tickLine={false} width={50}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone" dataKey="Revenue"
                      stroke="#60a5fa" strokeWidth={2.5}
                      fill="url(#revGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: "#60a5fa", strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Platform Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.5 }}
              className="glass-card p-6"
            >
              <div
                className="flex items-center gap-3 mb-6 pb-4"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.2)" }}
                >
                  <ShoppingBag size={15} style={{ color: "#a78bfa" }} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>
                    Sales by Platform
                  </h2>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Order distribution</p>
                </div>
              </div>

              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformData}
                      cx="50%" cy="42%"
                      innerRadius={55} outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {platformData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={0.9} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,10,14,0.97)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "white",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom" height={40}
                      wrapperStyle={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* ── Bottom Row: Notifications / Low Stock / Activity ──────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Live Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="glass-card p-6"
            >
              <div
                className="flex items-center justify-between mb-5 pb-4"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.2)" }}
                  >
                    <BellRing size={13} style={{ color: "#60a5fa" }} />
                  </div>
                  <h2 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Live Alerts</h2>
                </div>
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-semibold hover:opacity-70 transition-opacity"
                  style={{ color: "#60a5fa" }}
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 240 }}>
                {recentNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <BellRing size={24} className="mx-auto mb-2 opacity-20" />
                    <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No active notifications</p>
                  </div>
                ) : (
                  recentNotifications.map((n, i) => <NotifItem key={i} n={n} i={i} />)
                )}
              </div>
            </motion.div>

            {/* Low Stock */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52, duration: 0.5 }}
              className="glass-card p-6"
            >
              <div
                className="flex items-center gap-2.5 mb-5 pb-4"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(251,113,133,0.12)", border: "1px solid rgba(251,113,133,0.2)" }}
                >
                  <AlertTriangle size={13} style={{ color: "#fb7185" }} />
                </div>
                <h2 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Low Stock</h2>
              </div>

              <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 240 }}>
                {lowStockProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package size={24} className="mx-auto mb-2 opacity-20" />
                    <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>All inventory normal</p>
                  </div>
                ) : (
                  lowStockProducts.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 rounded-xl"
                      style={{ background: "rgba(251,113,133,0.05)", border: "1px solid rgba(251,113,133,0.1)" }}
                    >
                      {p.image && (
                        <img
                          src={p.image} alt={p.name}
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>SKU: {p.sku}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[12px] font-bold" style={{ color: "#fb7185" }}>{p.stock}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>units</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Activity Logs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58, duration: 0.5 }}
              className="glass-card p-6"
            >
              <div
                className="flex items-center gap-2.5 mb-5 pb-4"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.2)" }}
                >
                  <Activity size={13} style={{ color: "#a78bfa" }} />
                </div>
                <h2 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Activity Logs</h2>
              </div>

              <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 240 }}>
                {activityLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity size={24} className="mx-auto mb-2 opacity-20" />
                    <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No recent activity</p>
                  </div>
                ) : (
                  activityLogs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.08)" }}
                    >
                      <div
                        className="w-1.5 rounded-full flex-shrink-0"
                        style={{ background: "#a78bfa", minHeight: "16px", height: "auto" }}
                      />
                      <div className="min-w-0">
                        <p className="text-[12px] leading-snug" style={{ color: "var(--text-secondary)" }}>
                          {log.message}
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                          {log.userId === "admin_1" ? "Admin" : "Customer"} ·{" "}
                          {new Date(log.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
