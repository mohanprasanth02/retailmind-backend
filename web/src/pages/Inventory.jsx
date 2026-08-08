import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Warehouse, Search, AlertTriangle, Plus, Minus, RefreshCw, Package, BarChart2 } from "lucide-react";
import { formatPrice } from "../utils/currency";
import Skeleton from "../components/Skeleton";
import { API_BASE_URL } from "../config";

const Inventory = () => {
  const [products, setProducts]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [search, setSearch]                   = useState("");
  const [selectedStockStatus, setStockStatus] = useState("all");

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (res.ok) setProducts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleAdjustStock = async (productId, newStock) => {
    if (newStock < 0) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProducts(products.map(p => p.productId === productId ? { ...p, stock: updated.stock } : p));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch =
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchStock =
      selectedStockStatus === "all" ? true
      : selectedStockStatus === "low" ? p.stock < 10 && p.stock > 0
      : selectedStockStatus === "out" ? p.stock === 0
      : p.stock >= 10;
    return matchSearch && matchStock;
  });

  const totalUnits = products.reduce((s, p) => s + p.stock, 0);
  const lowCount = products.filter(p => p.stock < 10 && p.stock > 0).length;
  const outCount = products.filter(p => p.stock === 0).length;

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
            Warehouse & Stock Control
          </span>
          <h1 className="apple-hero-title">
            Precision stock control.
          </h1>
          <p className="apple-hero-subtitle">
            Live inventory adjustments, automated low-stock warnings, and supplier management.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={fetchInventory}
          className="btn btn-ghost shadow-xs self-start md:self-auto cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} style={{ color: "#007AFF" }} />
          <span>Reload Stock</span>
        </motion.button>
      </motion.div>

      {/* ── Summary Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-[#86868B] tracking-wider m-0 mb-1">Total Store Units</p>
            <h3 className="text-xl font-bold text-[#1D1D1F] m-0">{totalUnits.toLocaleString("en-IN")} Units</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F2F1FD] text-[#5856D6] flex items-center justify-center">
            <Warehouse size={18} strokeWidth={2} />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-[#86868B] tracking-wider m-0 mb-1">Low Stock Warning</p>
            <h3 className="text-xl font-bold text-[#FF9500] m-0">{lowCount} Items</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF4E5] text-[#FF9500] flex items-center justify-center">
            <AlertTriangle size={18} strokeWidth={2} />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-[#86868B] tracking-wider m-0 mb-1">Out of Stock</p>
            <h3 className="text-xl font-bold text-[#FF3B30] m-0">{outCount} Items</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFEBEA] text-[#FF3B30] flex items-center justify-center">
            <Package size={18} strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-black/[0.06] shadow-xs">
        <div className="relative min-w-[240px] flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B] z-10 pointer-events-none" />
          <input
            type="text"
            placeholder="Search stock by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: "42px" }}
          />
        </div>

        <div className="apple-segmented-control">
          {[
            { id: "all", label: "All Items" },
            { id: "low", label: "Low Stock" },
            { id: "out", label: "Out of Stock" }
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => setStockStatus(status.id)}
              className={`apple-segmented-btn ${selectedStockStatus === status.id ? "active" : ""}`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table / Grid ───────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} variant="card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center bg-white rounded-2xl border border-black/[0.06]">
          <Warehouse size={36} className="mx-auto mb-3 text-[#86868B] opacity-30" />
          <p className="text-sm font-semibold text-[#86868B] m-0">No inventory items found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden bg-white rounded-2xl border border-black/[0.06] shadow-xs">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 220, padding: "14px 20px" }}>Product</th>
                  <th style={{ minWidth: 120, padding: "14px 20px" }}>SKU</th>
                  <th style={{ minWidth: 120, padding: "14px 20px" }}>Category</th>
                  <th style={{ minWidth: 120, padding: "14px 20px" }}>Price (₹)</th>
                  <th style={{ minWidth: 150, padding: "14px 20px" }}>Stock Status</th>
                  <th style={{ minWidth: 130, padding: "14px 20px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((prod) => {
                  const isLow = prod.stock < 10 && prod.stock > 0;
                  const isOut = prod.stock === 0;

                  return (
                    <tr key={prod.productId}>
                      <td style={{ padding: "14px 20px" }} className="font-bold text-[#1D1D1F]">
                        <div className="flex items-center gap-3">
                          {prod.image ? (
                            <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover border border-black/10 flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[#F2F2F7] flex items-center justify-center text-[#86868B]">
                              <Package size={14} />
                            </div>
                          )}
                          <span className="truncate">{prod.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }} className="font-mono text-xs text-[#86868B]">{prod.sku}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span className="badge gray">{prod.category}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }} className="font-bold text-[#1D1D1F]">{formatPrice(prod.price)}</td>
                      <td style={{ padding: "14px 20px" }}>
                        {isOut ? (
                          <span className="badge red">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge orange">Low Stock ({prod.stock})</span>
                        ) : (
                          <span className="badge green">Normal ({prod.stock})</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAdjustStock(prod.productId, prod.stock - 1)}
                            className="w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center border-none cursor-pointer text-[#1D1D1F]"
                            title="Decrease Stock"
                          >
                            <Minus size={12} />
                          </motion.button>

                          <span className="w-8 text-center font-bold text-xs text-[#1D1D1F]">
                            {prod.stock}
                          </span>

                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAdjustStock(prod.productId, prod.stock + 1)}
                            className="w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center border-none cursor-pointer text-[#1D1D1F]"
                            title="Increase Stock"
                          >
                            <Plus size={12} />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
