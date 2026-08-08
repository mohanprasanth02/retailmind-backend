import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Download, FileText, CheckCircle, RefreshCw, Layers, TrendingUp, ShoppingBag, Package, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { formatPrice } from "../utils/currency";
import Skeleton from "../components/Skeleton";
import { API_BASE_URL } from "../config";

const BAR_COLORS = ["#007AFF", "#34C759", "#5856D6", "#FF9500", "#FF3B30", "#30B0C7"];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    lowStockItems: 0
  });
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const summaryRows = [
    { label: "Net Revenue",          value: formatPrice(metrics.totalRevenue), color: "#007AFF" },
    { label: "Completed Orders",     value: metrics.completedOrders,           color: "#34C759" },
    { label: "Pending Orders",       value: metrics.pendingOrders,             color: "#FF9500" },
    { label: "Active Products",      value: metrics.totalProducts,             color: "#5856D6" },
    { label: "Critical Stock Items", value: metrics.lowStockItems,             color: "#FF3B30" },
  ];

  return (
    <div className="space-y-6 relative z-10">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-black/[0.06]"
      >
        <div>
          <span className="apple-section-label block mb-1 text-[#007AFF]">
            Analytics & Audits
          </span>
          <h1 className="apple-hero-title">
            Data-driven operations audits.
          </h1>
          <p className="apple-hero-subtitle">
            Export store CSV reports, print transaction statements, and audit catalog distribution.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => window.open(`${API_BASE_URL}/api/reports/export`, "_blank")}
            className="btn btn-primary shadow-md shadow-blue-500/20 cursor-pointer text-xs"
          >
            <Download size={14} strokeWidth={2} />
            <span>Export CSV</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => window.print()}
            className="btn btn-ghost shadow-xs cursor-pointer text-xs"
          >
            <FileText size={14} strokeWidth={2} />
            <span>Print Report</span>
          </motion.button>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" />
          <Skeleton variant="table" className="lg:col-span-2" rows={6} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 bg-white rounded-2xl border border-black/[0.06] shadow-xs space-y-4"
          >
            <h2 className="text-sm font-extrabold text-[#1D1D1F] pb-3 border-b border-black/[0.05] m-0">
              Executive Summary
            </h2>
            <div className="space-y-3">
              {summaryRows.map((row, i) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center py-2 border-b border-black/[0.04] last:border-none"
                >
                  <span className="text-xs font-semibold text-[#86868B]">{row.label}</span>
                  <span className="text-sm font-bold" style={{ color: row.color }}>
                    {typeof row.value === "number" ? row.value.toLocaleString("en-IN") : row.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bar Chart Panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 bg-white rounded-2xl border border-black/[0.06] shadow-xs lg:col-span-2 flex flex-col justify-between"
          >
            <div className="mb-4 pb-3 border-b border-black/[0.05]">
              <h2 className="text-sm font-extrabold text-[#1D1D1F] m-0">
                Units in Stock by Category
              </h2>
              <p className="text-xs text-[#86868B] m-0">Inventory distribution analysis</p>
            </div>

            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(0,0,0,0.2)" tick={{ fill: "#86868B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(0,0,0,0.1)" tick={{ fill: "#86868B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="Units" radius={[8, 8, 0, 0]}>
                    {categoryStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Reports;
