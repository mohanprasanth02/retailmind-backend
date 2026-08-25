import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../config";
import { onSnapshot, collection } from "firebase/firestore";
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
} from "lucide-react";
import { formatPrice } from "../utils/currency";

// ── Chart Palette ────────────────────────────────────────────────────────────
const PIE_COLORS = ["#007AFF", "#34C759", "#FF9500", "#5856D6"];

// ── Count up hook ────────────────────────────────────────────────────────────
function useCountUp(target, duration = 800) {
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

// ── Apple-Style Stat Card ──────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, accent, prefix = "", suffix = "", delay = 0 }) => {
  const animated = useCountUp(
    typeof value === "number" ? value : parseFloat(value) || 0,
    800
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ delay, duration: 0.35, type: "spring", stiffness: 350, damping: 25 }}
      className="glass-card p-5 rounded-2xl bg-white border border-black/[0.06] shadow-xs relative overflow-hidden select-none"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="apple-section-label mb-1.5">
            {label}
          </p>
          <h3 className="text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
            {prefix}{typeof value === "number" ? animated.toLocaleString("en-IN") : value}{suffix}
          </h3>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs"
          style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
        >
          <Icon size={19} style={{ color: accent }} strokeWidth={2} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/[0.05]">
        <div
          className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${accent}15`, color: accent }}
        >
          <ArrowUpRight size={11} strokeWidth={2.5} />
          Live Synced
        </div>
        <span className="text-[10px] font-medium text-[#86868B]">AI Core Engine</span>
      </div>
    </motion.div>
  );
};

// ── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3.5 py-2.5 rounded-2xl bg-white/95 border border-black/10 shadow-lg backdrop-blur-xl text-xs">
      <p className="font-semibold text-[#86868B] mb-0.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold text-sm text-[#007AFF] m-0">
          {formatPrice(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Notification Item ─────────────────────────────────────────────────────────
const NotifItem = ({ n, i }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: i * 0.04 }}
    className="flex gap-2.5 p-3 rounded-xl transition-all"
    style={{
      background: n.read ? "rgba(0, 0, 0, 0.02)" : "rgba(0, 122, 255, 0.06)",
      border: `1px solid ${n.read ? "rgba(0,0,0,0.05)" : "rgba(0,122,255,0.15)"}`,
    }}
  >
    <div
      className="w-1.5 flex-shrink-0 rounded-full mt-0.5"
      style={{
        background: n.type === "low_stock" ? "#FF3B30" : "#007AFF",
        minHeight: "16px",
        opacity: n.read ? 0.4 : 1,
      }}
    />
    <div className="min-w-0 flex-1">
      <p
        className="text-[10px] font-extrabold uppercase tracking-wider mb-0.5"
        style={{ color: n.type === "low_stock" ? "#FF3B30" : "#007AFF" }}
      >
        {n.title}
      </p>
      <p className="text-[12px] leading-snug font-medium text-[#1D1D1F] m-0">
        {n.message}
      </p>
      {n.timestamp && (
        <p className="text-[10px] mt-1 text-[#86868B] m-0">
          {new Date(n.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  </motion.div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("7 Days");
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

        // Revenue chart calculation
        const days = {};
        const count = activeTab === "1 Year" ? 30 : activeTab === "30 Days" ? 14 : 7;
        for (let i = count - 1; i >= 0; i--) {
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
              { name: "WHATSAPP", value: 4 },
              { name: "INSTAGRAM", value: 3 },
              { name: "WEBSITE", value: 5 },
              { name: "EMAIL", value: 2 },
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
    const iv = setInterval(fetchData, 2000);
    return () => clearInterval(iv);
  }, [activeTab]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/read`, { method: "PUT" });
      if (res.ok) fetchData();
    } catch (e) { }
  };

  const statCards = [
    { label: "Total Revenue", value: metrics.totalRevenue, icon: IndianRupee, accent: "#007AFF", prefix: "₹" },
    { label: "Pending Orders", value: metrics.pendingOrders, icon: Clock, accent: "#FF9500" },
    { label: "Completed Orders", value: metrics.completedOrders, icon: CheckCircle, accent: "#34C759" },
    { label: "Total Products", value: metrics.totalProducts, icon: Package, accent: "#5856D6" },
    { label: "Low Stock Alerts", value: metrics.lowStockItems, icon: AlertTriangle, accent: "#FF3B30" },
  ];

  return (
    <div className="relative z-10 space-y-8">
      {/* ── Apple-Style High Impact Header ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-black/[0.06]"
      >
        <div>
          <span className="apple-section-label block mb-2 text-[#007AFF]">
            Operational Command Center
          </span>
          <h1 className="apple-hero-title">
            The intelligence behind every sale.
          </h1>
          <p className="apple-hero-subtitle">
            Live multi-channel revenue analytics, AI-parsed customer orders, and real-time inventory synchronization.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={fetchData}
          className="btn btn-ghost flex items-center gap-2 cursor-pointer shadow-xs self-start md:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} style={{ color: "#007AFF" }} />
          <span>Sync Operations</span>
        </motion.button>
      </motion.div>

      {/* ── Loading Skeleton ─────────────────────────────────────────────── */}
      {loading && chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-[#86868B] tracking-widest uppercase">
            Fetching Store Metrics...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Stat Cards Grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {statCards.map((s, i) => (
              <StatCard key={s.label} {...s} delay={i * 0.05} />
            ))}
          </div>

          {/* ── Charts Row ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Area Chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 350, damping: 25 }}
              className="glass-card p-6 lg:col-span-2 bg-white rounded-2xl border border-black/[0.06] shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-black/[0.05]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center border border-[#007AFF]/20">
                    <TrendingUp size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#1D1D1F] m-0 leading-tight">
                      Revenue Dynamics
                    </h2>
                    <p className="text-xs text-[#86868B] m-0">
                      Multi-channel performance trajectory
                    </p>
                  </div>
                </div>

                {/* Segmented Control */}
                <div className="apple-segmented-control">
                  {["7 Days", "30 Days", "1 Year"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`apple-segmented-btn ${activeTab === tab ? "active" : ""}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#007AFF" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#007AFF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(0,0,0,0.2)"
                      tick={{ fill: "#86868B", fontSize: 11 }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      stroke="rgba(0,0,0,0.1)"
                      tick={{ fill: "#86868B", fontSize: 11 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      axisLine={false} tickLine={false} width={45}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="Revenue"
                      stroke="#007AFF"
                      strokeWidth={2.5}
                      fill="url(#revGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: "#007AFF", strokeWidth: 2, stroke: "#FFFFFF" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Sales Channel Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, type: "spring", stiffness: 350, damping: 25 }}
              className="glass-card p-6 bg-white rounded-2xl border border-black/[0.06] shadow-xs"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-black/[0.05]">
                <div className="w-9 h-9 rounded-xl bg-[#F2F1FD] text-[#5856D6] flex items-center justify-center border border-[#5856D6]/20">
                  <ShoppingBag size={18} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#1D1D1F] m-0 leading-tight">
                    Sales by Channel
                  </h2>
                  <p className="text-xs text-[#86868B] m-0">Order share breakdown</p>
                </div>
              </div>

              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformData}
                      cx="50%" cy="42%"
                      innerRadius={52} outerRadius={78}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {platformData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.08)" }} />
                    <Legend
                      verticalAlign="bottom" height={36}
                      wrapperStyle={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#86868B" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* ── Bottom Section ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, type: "spring", stiffness: 350, damping: 25 }}
              className="glass-card p-5 bg-white rounded-2xl border border-black/[0.06] shadow-xs"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/[0.05]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center">
                    <BellRing size={14} strokeWidth={2} />
                  </div>
                  <h2 className="text-xs font-bold text-[#1D1D1F] m-0">Live Alerts</h2>
                </div>
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-semibold text-[#007AFF] hover:underline cursor-pointer bg-none border-none"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[230px]">
                {recentNotifications.length === 0 ? (
                  <div className="text-center py-8 text-[#86868B]">
                    <BellRing size={22} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No active notifications</p>
                  </div>
                ) : (
                  recentNotifications.map((n, i) => <NotifItem key={i} n={n} i={i} />)
                )}
              </div>
            </motion.div>

            {/* Low Stock Items */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.44, type: "spring", stiffness: 350, damping: 25 }}
              className="glass-card p-5 bg-white rounded-2xl border border-black/[0.06] shadow-xs"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-black/[0.05]">
                <div className="w-7 h-7 rounded-lg bg-[#FFEBEA] text-[#FF3B30] flex items-center justify-center">
                  <AlertTriangle size={14} strokeWidth={2} />
                </div>
                <h2 className="text-xs font-bold text-[#1D1D1F] m-0">Low Stock Warnings</h2>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[230px]">
                {lowStockProducts.length === 0 ? (
                  <div className="text-center py-8 text-[#86868B]">
                    <Package size={22} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">All inventory normal</p>
                  </div>
                ) : (
                  lowStockProducts.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FFEBEA]/40 border border-[#FF3B30]/20"
                    >
                      {p.image && (
                        <img
                          src={p.image} alt={p.name}
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-black/10"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate text-[#1D1D1F] m-0">{p.name}</p>
                        <p className="text-[10px] text-[#86868B] m-0">SKU: {p.sku}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-extrabold text-[#FF3B30] m-0">{p.stock}</p>
                        <p className="text-[9px] text-[#86868B] m-0">units</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Activity Logs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 350, damping: 25 }}
              className="glass-card p-5 bg-white rounded-2xl border border-black/[0.06] shadow-xs"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-black/[0.05]">
                <div className="w-7 h-7 rounded-lg bg-[#F2F1FD] text-[#5856D6] flex items-center justify-center">
                  <Activity size={14} strokeWidth={2} />
                </div>
                <h2 className="text-xs font-bold text-[#1D1D1F] m-0">Activity Trail</h2>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[230px]">
                {activityLogs.length === 0 ? (
                  <div className="text-center py-8 text-[#86868B]">
                    <Activity size={22} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No recent logs</p>
                  </div>
                ) : (
                  activityLogs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex gap-2.5 p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04]"
                    >
                      <div className="w-1 rounded-full bg-[#5856D6] min-h-[16px]" />
                      <div className="min-w-0">
                        <p className="text-xs leading-snug font-medium text-[#1D1D1F] m-0">
                          {log.message}
                        </p>
                        <p className="text-[10px] mt-0.5 text-[#86868B] m-0">
                          {log.userId === "admin_1" ? "Admin" : "System"} ·{" "}
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
