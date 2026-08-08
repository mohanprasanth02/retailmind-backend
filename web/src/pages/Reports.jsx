import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Download, FileText, CheckCircle, RefreshCw, Layers, TrendingUp, ShoppingBag, Package, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { formatPrice } from "../utils/currency";
import Skeleton from "../components/Skeleton";
import { API_BASE_URL } from "../config";

const IndianRupee = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13h4.5a4.5 4.5 0 0 1 0 9" />
    <path d="M10.5 13 18 22" />
    <path d="M6 3c5 0 6.5 5 6.5 5" />
  </svg>
);


const BAR_COLORS = ["#60a5fa", "#34d399", "#a78bfa", "#fbbf24", "#fb7185", "#22d3ee"];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ totalRevenue:0, pendingOrders:0, completedOrders:0, totalProducts:0, lowStockItems:0 });
  const [categoryStats, setCategoryStats] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [repRes, prodRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/reports`),
        fetch(`${API_BASE_URL}/api/products`),
      ]);
      if (repRes.ok && prodRes.ok) {
        const [data, products] = await Promise.all([repRes.json(), prodRes.json()]);
        setMetrics(data.metrics);
        const catMap = {};
        products.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + p.stock; });
        setCategoryStats(Object.keys(catMap).map(k => ({ name: k, Units: catMap[k] })));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const summaryRows = [
    { label: "Net Revenue",          value: formatPrice(metrics.totalRevenue), color: "#60a5fa" },
    { label: "Completed Orders",     value: metrics.completedOrders,           color: "#34d399" },
    { label: "Pending Orders",       value: metrics.pendingOrders,             color: "#fbbf24" },
    { label: "Active Products",      value: metrics.totalProducts,             color: "#a78bfa" },
    { label: "Critical Stock Items", value: metrics.lowStockItems,             color: "#fb7185" },
  ];

  return (
    <div className="space-y-7 relative z-10">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="section-header">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.2)" }}>
              <BarChart3 size={17} style={{ color: "#818cf8" }} />
            </span>
            Operations Reports
          </h1>
          <p className="section-subtitle">Compile statements, export transaction audits and review catalog analytics</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.open(`${API_BASE_URL}/api/reports/export`, "_blank")}
            className="btn btn-primary text-[12px]">
            <Download size={13} /> Export CSV
          </button>
          <button onClick={() => window.print()} className="btn btn-ghost text-[12px]">
            <FileText size={13} /> Print PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" />
          <Skeleton variant="table" className="lg:col-span-2" rows={6} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Panel */}
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 space-y-1">
              <h2 className="text-[13px] font-bold mb-4 pb-3" style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)" }}>
                Report Summary
              </h2>
              {summaryRows.map((row, i) => (
                <div key={row.label} className="flex justify-between items-center py-2.5"
                  style={{ borderBottom: i < summaryRows.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                  <span className="text-[14px] font-bold" style={{ color: row.color }}>
                    {typeof row.value === "number" ? row.value.toLocaleString() : row.value}
                  </span>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="glass-card p-5 flex items-start gap-3"
              style={{ border: "1px solid rgba(52,211,153,0.15)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                <CheckCircle size={14} style={{ color: "#34d399" }} />
              </div>
              <div>
                <p className="text-[11px] font-bold mb-1" style={{ color: "#34d399" }}>Compliance Checks Active</p>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  All transaction ledgers are linked in real-time. Exports include system audit metadata and GST (18%) records.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Bar Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.2)" }}>
                <Layers size={15} style={{ color: "#818cf8" }} />
              </div>
              <div>
                <h2 className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>
                  Inventory Distribution by Category
                </h2>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Units in stock per category</p>
              </div>
            </div>

            <div style={{ height: 280 }}>
              {categoryStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Package size={32} className="opacity-20" />
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No inventory data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStats} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.08)"
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.05)"
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{
                      background: "rgba(10,10,14,0.97)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px", fontSize: "12px", color: "white",
                    }} />
                    <Bar dataKey="Units" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {categoryStats.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Reports;
