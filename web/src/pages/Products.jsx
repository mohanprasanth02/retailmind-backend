import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Search, Trash2, Edit2, X, RefreshCw, Tag, TrendingUp } from "lucide-react";
import { formatPrice } from "../utils/currency";
import Skeleton from "../components/Skeleton";
import { API_BASE_URL } from "../config";

const CATEGORY_COLORS = {
  Shoes:       { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  Apparel:     { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  Electronics: { color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  Accessories: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  default:     { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};

const Products = () => {
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [showModal, setShowModal]     = useState(false);
  const [editingProduct, setEditProd] = useState(null);
  const [formData, setFormData]       = useState({ name:"", category:"Shoes", price:"", stock:"", image:"", sku:"", supplier:"" });

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (res.ok) setProducts(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchProducts(); }, []);

  const openAdd = () => {
    setEditProd(null);
    setFormData({ name:"", category:"Shoes", price:"", stock:"", image:"", sku:"", supplier:"" });
    setShowModal(true);
  };
  const openEdit = (p) => {
    setEditProd(p);
    setFormData({ name:p.name, category:p.category, price:p.price.toString(), stock:p.stock.toString(), image:p.image, sku:p.sku, supplier:p.supplier });
    setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, price: parseFloat(formData.price)||0, stock: parseInt(formData.stock)||0,
      sku: formData.sku || `SKU-${Math.random().toString(36).substr(2,6).toUpperCase()}`,
      supplier: formData.supplier || "RetailMind Supplier" };
    try {
      const res = editingProduct
        ? await fetch(`${API_BASE_URL}/api/products/${editingProduct.productId}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) })
        : await fetch(`${API_BASE_URL}/api/products`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      if (res.ok) { fetchProducts(); setShowModal(false); }
    } catch (e) { console.error(e); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, { method:"DELETE" });
      if (res.ok) fetchProducts();
    } catch (e) { console.error(e); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const lowStockCount = products.filter(p => p.stock < 10).length;

  return (
    <div className="space-y-7 relative z-10">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="section-header">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <Package size={17} style={{ color: "#34d399" }} />
            </span>
            Product Catalog
          </h1>
          <p className="section-subtitle">Manage products, pricing, stock levels and product images</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* ── Summary Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Products", value: products.length, color: "#34d399" },
          { label: "Catalog Value",  value: formatPrice(totalValue), color: "#60a5fa", isStr: true },
          { label: "Low Stock",      value: lowStockCount, color: "#fb7185" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <TrendingUp size={16} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.isStr ? s.value : s.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search Row ──────────────────────────────────────── */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input type="text" placeholder="Search by name, SKU or category..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10" />
        </div>
        <button onClick={fetchProducts} className="btn btn-ghost">
          <RefreshCw size={13} /> Sync
        </button>
      </div>

      {/* ── Product Grid ─────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} variant="card" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <div className="glass-card p-12 text-center col-span-full">
                <Package size={36} className="mx-auto mb-3 opacity-20" />
                <p style={{ color: "var(--text-muted)" }}>No products found. Add your first product!</p>
              </div>
            ) : filtered.map((p, i) => {
              const cat = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.default;
              return (
                <motion.div key={p.productId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card overflow-hidden flex flex-col group">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
                    <img src={p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {/* Top overlay */}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(5,5,7,0.8))" }} />
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm"
                        style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30` }}>
                        <Tag size={8} className="inline mr-1" />{p.category}
                      </span>
                    </div>
                    {p.stock < 10 && (
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm"
                          style={{ background: "rgba(251,113,133,0.15)", color: "#fb7185", border: "1px solid rgba(251,113,133,0.3)" }}>
                          Low Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div>
                      <h2 className="font-bold text-[15px] leading-snug group-hover:text-[#34d399] transition-colors"
                        style={{ color: "var(--text-primary)" }}>
                        {p.name}
                      </h2>
                      <p className="text-[10px] mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>SKU: {p.sku}</p>
                    </div>

                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Price</p>
                        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{formatPrice(p.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Stock</p>
                        <p className="text-xl font-bold" style={{ color: p.stock < 10 ? "#fb7185" : "#34d399" }}>
                          {p.stock} <span className="text-[11px] font-normal">units</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 p-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <button onClick={() => openEdit(p)} className="btn btn-ghost flex-1 justify-center text-[11px]">
                      <Edit2 size={12} /> Edit
                    </button>
                    <button onClick={() => handleDelete(p.productId)} className="btn btn-danger flex-1 justify-center text-[11px]">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(5,5,7,0.85)", backdropFilter: "blur(8px)" }}>
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}
              className="glass-card w-full max-w-lg"
              style={{ border: "1px solid rgba(52,211,153,0.2)", boxShadow: "0 0 40px rgba(52,211,153,0.08)" }}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <h2 className="font-bold text-[16px]" style={{ color: "var(--text-primary)" }}>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost p-2">
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Product Name</label>
                    <input type="text" required value={formData.name} placeholder="e.g. Nike Air Max"
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input-field">
                      {["Shoes","Apparel","Electronics","Accessories"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>SKU Code</label>
                    <input type="text" value={formData.sku} placeholder="Auto-generated if blank"
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Price (₹)</label>
                    <input type="number" step="0.01" required value={formData.price} placeholder="1200.00"
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Stock Count</label>
                    <input type="number" required value={formData.stock} placeholder="50"
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="input-field" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Supplier Name</label>
                    <input type="text" value={formData.supplier} placeholder="e.g. Nike Inc."
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="input-field" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Image URL</label>
                    <input type="url" value={formData.image} placeholder="https://images.unsplash.com/..."
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="input-field" />
                  </div>
                </div>

                <div className="flex gap-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost flex-1 justify-center">Cancel</button>
                  <button type="submit" className="btn btn-primary flex-1 justify-center">
                    {editingProduct ? "Save Changes" : "Create Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
