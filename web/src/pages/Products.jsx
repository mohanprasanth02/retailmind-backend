import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Search, Trash2, Edit2, X, RefreshCw, Tag, TrendingUp, AlertTriangle } from "lucide-react";
import { formatPrice } from "../utils/currency";
import Skeleton from "../components/Skeleton";
import { API_BASE_URL } from "../config";

const CATEGORY_COLORS = {
  Shoes:       { color: "#007AFF", bg: "#E5F1FF" },
  Apparel:     { color: "#5856D6", bg: "#F2F1FD" },
  Electronics: { color: "#34C759", bg: "#EAF8ED" },
  Accessories: { color: "#FF9500", bg: "#FFF4E5" },
  default:     { color: "#8E8E93", bg: "#F2F2F7" },
};

const CATEGORIES = ["All", "Shoes", "Apparel", "Electronics", "Accessories"];

const Products = () => {
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [showModal, setShowModal]     = useState(false);
  const [editingProduct, setEditProd] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minPrice, setMinPrice]       = useState("");
  const [maxPrice, setMaxPrice]       = useState("");

  const [formData, setFormData]       = useState({
    name: "", category: "Shoes", price: "", stock: "", image: "", sku: "", supplier: ""
  });

  const fetchProducts = async () => {
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

  useEffect(() => { fetchProducts(); }, []);

  const openAdd = () => {
    setEditProd(null);
    setFormData({ name: "", category: "Shoes", price: "", stock: "", image: "", sku: "", supplier: "" });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProd(p);
    setFormData({
      name: p.name,
      category: p.category,
      price: p.price.toString(),
      stock: p.stock.toString(),
      image: p.image || "",
      sku: p.sku || "",
      supplier: p.supplier || ""
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      sku: formData.sku || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      supplier: formData.supplier || "RetailMind Direct Supplier"
    };

    try {
      const res = editingProduct
        ? await fetch(`${API_BASE_URL}/api/products/${editingProduct.productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          })
        : await fetch(`${API_BASE_URL}/api/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
      if (res.ok) {
        fetchProducts();
        setShowModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, { method: "DELETE" });
      if (res.ok) fetchProducts();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const priceVal = p.price || 0;
    const matchesMin = minPrice === "" || priceVal >= parseFloat(minPrice);
    const matchesMax = maxPrice === "" || priceVal <= parseFloat(maxPrice);
    return matchesSearch && matchesCat && matchesMin && matchesMax;
  });

  const totalValue = products.reduce((s, p) => s + (p.price * p.stock), 0);
  const lowStockCount = products.filter(p => p.stock < 10).length;

  return (
    <div className="space-y-6 relative z-10">
      {/* ── Page Header Bar ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-black/[0.06]"
      >
        <div>
          <span className="apple-section-label block mb-1 text-[#007AFF]">
            Product Management
          </span>
          <h1 className="apple-hero-title">
            Crafted for inventory clarity.
          </h1>
          <p className="apple-hero-subtitle">
            Real-time stock tracking, ₹ INR pricing control, and automated catalog updates across your store.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={openAdd}
          className="btn btn-primary shadow-md shadow-blue-500/20 cursor-pointer self-start md:self-auto"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Add Product</span>
        </motion.button>
      </motion.div>

      {/* ── Metric Highlights ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-[#86868B] tracking-wider m-0 mb-1">Total Products</p>
            <h3 className="text-xl font-bold text-[#1D1D1F] m-0">{products.length} Items</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center">
            <Package size={18} strokeWidth={2} />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-[#86868B] tracking-wider m-0 mb-1">Catalog Value</p>
            <h3 className="text-xl font-bold text-[#1D1D1F] m-0">{formatPrice(totalValue)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EAF8ED] text-[#34C759] flex items-center justify-center">
            <TrendingUp size={18} strokeWidth={2} />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-[#86868B] tracking-wider m-0 mb-1">Low Stock Items</p>
            <h3 className="text-xl font-bold text-[#FF3B30] m-0">{lowStockCount} Products</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFEBEA] text-[#FF3B30] flex items-center justify-center">
            <AlertTriangle size={18} strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* ── Filters Bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-black/[0.06] shadow-xs">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
          <input
            type="text"
            placeholder="Search catalog by name, category or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        {/* iOS Segmented Category Control */}
        <div className="apple-segmented-control">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`apple-segmented-btn ${selectedCategory === cat ? "active" : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Products Grid ────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} variant="card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center bg-white rounded-2xl border border-black/[0.06]">
          <Package size={36} className="mx-auto mb-3 text-[#86868B] opacity-30" />
          <p className="text-sm font-semibold text-[#86868B] m-0">No products match your criteria</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((prod, i) => {
              const catTheme = CATEGORY_COLORS[prod.category] || CATEGORY_COLORS.default;
              const isLowStock = prod.stock < 10;

              return (
                <motion.div
                  key={prod.productId || i}
                  layout
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25, delay: i * 0.03 }}
                  className="glass-card p-4 bg-white rounded-2xl border border-black/[0.06] shadow-xs flex flex-col justify-between relative"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-start gap-3.5 mb-3">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-16 h-16 rounded-xl object-cover border border-black/10 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-[#F2F2F7] flex items-center justify-center text-[#86868B] flex-shrink-0">
                          <Package size={24} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span
                            className="badge text-[10px] font-bold"
                            style={{ background: catTheme.bg, color: catTheme.color }}
                          >
                            {prod.category}
                          </span>
                          {isLowStock && (
                            <span className="badge text-[10px] font-bold bg-[#FFEBEA] text-[#FF3B30]">
                              Low Stock
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-[#1D1D1F] leading-tight truncate m-0">
                          {prod.name}
                        </h3>
                        <p className="text-[11px] text-[#86868B] font-mono mt-0.5 m-0">
                          {prod.sku}
                        </p>
                      </div>
                    </div>

                    {/* Stock & Supplier Info */}
                    <div className="p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04] text-xs flex justify-between items-center mb-3">
                      <span className="text-[#86868B] font-medium">Stock Level:</span>
                      <span className={`font-bold ${isLowStock ? "text-[#FF3B30]" : "text-[#1D1D1F]"}`}>
                        {prod.stock} units
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Row */}
                  <div className="flex items-center justify-between pt-3 border-t border-black/[0.05]">
                    <div className="text-lg font-bold text-[#007AFF] tracking-tight">
                      {formatPrice(prod.price)}
                    </div>
                    <div className="flex items-center gap-1">
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => openEdit(prod)}
                        className="w-8 h-8 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] flex items-center justify-center cursor-pointer border-none"
                      >
                        <Edit2 size={13} />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleDelete(prod.productId)}
                        className="w-8 h-8 rounded-lg bg-[#FFEBEA] hover:bg-[#FFD6D4] text-[#FF3B30] flex items-center justify-center cursor-pointer border-none"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-black/10 shadow-2xl w-full max-w-md p-6 relative"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/[0.06]">
                <h2 className="text-base font-bold text-[#1D1D1F] m-0">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center border-none cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-extrabold uppercase text-[#86868B] block mb-1">Product Name</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Nike Air Max 270"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-extrabold uppercase text-[#86868B] block mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input-field cursor-pointer"
                    >
                      {CATEGORIES.filter(c => c !== "All").map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold uppercase text-[#86868B] block mb-1">Price (₹ INR)</label>
                    <input
                      type="number" required min="0" step="any"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="input-field"
                      placeholder="12999"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-extrabold uppercase text-[#86868B] block mb-1">Stock Quantity</label>
                    <input
                      type="number" required min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="input-field"
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold uppercase text-[#86868B] block mb-1">SKU Code</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="input-field"
                      placeholder="NIK-AIR-270"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold uppercase text-[#86868B] block mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="input-field"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="pt-3 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-ghost cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    {editingProduct ? "Save Changes" : "Create Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
