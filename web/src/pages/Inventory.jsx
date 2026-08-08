import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Warehouse, Search, AlertTriangle, Plus, Minus, Edit, Save, RefreshCw, Package, BarChart2 } from "lucide-react";
import { formatPrice } from "../utils/currency";
import Skeleton from "../components/Skeleton";
import { API_BASE_URL } from "../config";

const Inventory = () => {
  const [products, setProducts]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [search, setSearch]                   = useState("");
  const [selectedCategory, setCategory]       = useState("all");
  const [selectedStockStatus, setStockStatus] = useState("all");
  const [editingId, setEditingId]             = useState(null);
  const [editStockValue, setEditStockValue]   = useState("");

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (res.ok) setProducts(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchInventory(); }, []);

  const handleAdjustStock = async (productId, newStock) => {
    if (newStock < 0) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/${productId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProducts(products.map(p => p.productId === productId ? { ...p, stock: updated.stock } : p));
        setEditingId(null);
      }
    } catch (e) { console.error(e); }
  };

  const categories = ["all", ...new Set(products.map(p => p.category))];
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "all" || p.category === selectedCategory;
    const matchStock = selectedStockStatus === "all" ? true
      : selectedStockStatus === "low" ? p.stock < 10 && p.stock > 0
      : selectedStockStatus === "out" ? p.stock === 0
      : p.stock >= 10;
    return matchSearch && matchCat && matchStock;
  });

  const totalUnits = products.reduce((s, p) => s + p.stock, 0);
  const lowCount = products.filter(p => p.stock < 10).length;
  const outCount = products.filter(p => p.stock === 0).length;

  return (
    <div className="space-y-7 relative z-10">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="section-header">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.2)" }}>
              <Warehouse size={17} style={{ color: "#a78bfa" }} />
            </span>
            Inventory Tracking
          </h1>
          <p className="section-subtitle">Manage stock levels, configure restocks, inspect supplier data</p>
        </div>
        <button onClick={fetchInventory} className="btn btn-ghost">
          <RefreshCw size={13} /> Reload Stock
        </button>
      </div>

      {/* ── Summary Stat Cards ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Units in Store", value: totalUnits, color: "#a78bfa" },
          { label: "Low Stock Items",       value: lowCount,  color: "#fbbf24" },
          { label: "Out of Stock",          value: outCount,  color: "#fb7185" },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <BarChart2 size={16} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters Row ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input type="text" placeholder="Search by name or SKU..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <select value={selectedCategory} onChange={(e) => setCategory(e.target.value)} className="input-field w-auto min-w-[160px]">
          {categories.map(c => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
        </select>
        <select value={selectedStockStatus} onChange={(e) => setStockStatus(e.target.value)} className="input-field w-auto min-w-[180px]">
          <option value="all">All Stock Levels</option>
          <option value="in">In Stock (≥10)</option>
          <option value="low">Low Stock (&lt;10)</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      {loading ? (
        <Skeleton variant="table" rows={6} />
      ) : (

        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th className="text-right">Price</th>
                <th className="text-center">Stock</th>
                <th>Supplier</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Package size={32} className="mx-auto mb-2 opacity-20" />
                  <p style={{ color: "var(--text-muted)" }}>No products match your filters</p>
                </td></tr>
              ) : filtered.map((p, i) => {
                const isLow = p.stock < 10;
                const isOut = p.stock === 0;
                const isEditing = editingId === p.productId;
                return (
                  <motion.tr key={p.productId} as="tr"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                          style={{ border: "1px solid var(--border-subtle)" }} />
                        <div>
                          <p className="font-semibold text-[13px]" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                          <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>ID: {p.productId?.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-[11px]">{p.sku}</td>
                    <td>
                      <span className="badge gray">{p.category}</span>
                    </td>
                    <td className="text-right font-semibold">{formatPrice(p.price)}</td>
                    <td>
                      <div className="flex flex-col items-center gap-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input type="number" value={editStockValue}
                              onChange={(e) => setEditStockValue(e.target.value)}
                              className="input-field w-16 text-center py-1 text-[12px]" />
                            <button onClick={() => handleAdjustStock(p.productId, parseInt(editStockValue) || 0)}
                              className="p-1.5 rounded-lg" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
                              <Save size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleAdjustStock(p.productId, p.stock - 1)}
                              className="p-1 rounded-lg btn-ghost"><Minus size={11} /></button>
                            <span className="font-bold text-[14px] min-w-[28px] text-center"
                              style={{ color: isOut ? "#fb7185" : isLow ? "#fbbf24" : "var(--text-primary)" }}>
                              {p.stock}
                            </span>
                            <button onClick={() => handleAdjustStock(p.productId, p.stock + 1)}
                              className="p-1 rounded-lg btn-ghost"><Plus size={11} /></button>
                          </div>
                        )}
                        {isLow && !isEditing && (
                          <span className="flex items-center gap-1 text-[9px] font-bold uppercase"
                            style={{ color: isOut ? "#fb7185" : "#fbbf24" }}>
                            <AlertTriangle size={9} />
                            {isOut ? "Out of Stock" : "Low Stock"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-[12px]">{p.supplier || "Direct"}</td>
                    <td className="text-right">
                      <button
                        onClick={() => isEditing ? setEditingId(null) : (setEditingId(p.productId), setEditStockValue(p.stock.toString()))}
                        className="btn btn-ghost text-[11px]">
                        <Edit size={11} /> {isEditing ? "Cancel" : "Edit Stock"}
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Inventory;
