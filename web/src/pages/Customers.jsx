import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Mail, Phone, MapPin, Search, UserCheck, Star, ShoppingBag, 
  RefreshCw, UserPlus, Trash2, Plus, X, Check, ShieldCheck 
} from "lucide-react";
import { formatPrice } from "../utils/currency";
import Skeleton from "../components/Skeleton";
import { API_BASE_URL } from "../config";
import { fireSuccessBurst } from "../components/MicroAnimations";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // New Customer Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "customer"
  });

  const fetchData = async () => {
    try {
      const [cRes, oRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/customers`),
        fetch(`${API_BASE_URL}/api/orders`),
      ]);
      if (cRes.ok) {
        const data = await cRes.json();
        setCustomers(data);
      }
      if (oRes.ok) {
        setOrders(await oRes.json());
      }
    } catch (e) {
      console.error("Fetch customers error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newCustomer = await res.json();
        setCustomers(prev => {
          const exists = prev.some(c => c.uid === newCustomer.uid || c.email === newCustomer.email);
          if (exists) {
            return prev.map(c => (c.uid === newCustomer.uid || c.email === newCustomer.email) ? newCustomer : c);
          }
          return [newCustomer, ...prev];
        });
        fireSuccessBurst(0.5, 0.5);
        setToastMsg(`Customer "${formData.name}" added successfully!`);
        setTimeout(() => setToastMsg(null), 3000);
        setIsModalOpen(false);
        setFormData({ name: "", email: "", phone: "", address: "", role: "customer" });
        fetchData();
      }
    } catch (err) {
      console.error("Add customer error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (customerId, customerName) => {
    if (!window.confirm(`Are you sure you want to remove ${customerName || "this customer"}?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCustomers(prev => prev.filter(c => (c.uid || c.customerId) !== customerId));
        setToastMsg(`Customer "${customerName}" removed.`);
        setTimeout(() => setToastMsg(null), 3000);
        fetchData();
      }
    } catch (err) {
      console.error("Delete customer error:", err);
    }
  };

  const getStats = (customer) => {
    const custOrders = orders.filter(o =>
      (customer.name && o.customerName === customer.name) || 
      (customer.phone && o.phone === customer.phone) ||
      (customer.uid && o.customerId === customer.uid)
    );
    const completed = custOrders.filter(o => o.status === "Completed");
    const total = completed.reduce((s, o) => s + (o.total || 0), 0);
    return { orderCount: custOrders.length, totalSpent: total };
  };

  const filtered = customers.filter(c =>
    (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone && c.phone.includes(search))
  );

  const totalRevenue = orders
    .filter(o => o.status === "Completed")
    .reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="space-y-6 relative z-10">
      {/* ── Toast Notification ─────────────────────────────────────── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#1D1D1F] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold"
          >
            <Check size={14} className="text-[#34C759]" strokeWidth={3} />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Header Bar ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-black/[0.06]"
      >
        <div>
          <span className="apple-section-label block mb-1 text-[#007AFF]">
            Customer Management
          </span>
          <h1 className="apple-hero-title">
            Know your buyers inside out.
          </h1>
          <p className="apple-hero-subtitle">
            Directly register customers, view profiles, purchase history, channel contacts, and lifetime revenue.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={fetchData}
            className="btn btn-ghost flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} style={{ color: "#007AFF" }} />
            <span>Sync</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <UserPlus size={15} strokeWidth={2.5} />
            <span>+ Add Customer</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ── Summary Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-[#86868B] tracking-wider m-0 mb-1">Total Registered</p>
            <h3 className="text-xl font-bold text-[#1D1D1F] m-0">{customers.length} Profiles</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center">
            <Users size={18} strokeWidth={2} />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-[#86868B] tracking-wider m-0 mb-1">Orders Placed</p>
            <h3 className="text-xl font-bold text-[#1D1D1F] m-0">{orders.length} Orders</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F2F1FD] text-[#5856D6] flex items-center justify-center">
            <ShoppingBag size={18} strokeWidth={2} />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-[#86868B] tracking-wider m-0 mb-1">Lifetime Revenue</p>
            <h3 className="text-xl font-bold text-[#34C759] m-0">{formatPrice(totalRevenue)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EAF8ED] text-[#34C759] flex items-center justify-center">
            <UserCheck size={18} strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* ── Search & Controls Bar ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
          <input
            type="text"
            placeholder="Search by customer name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 w-full"
          />
        </div>

        <div className="text-xs font-semibold text-[#86868B]">
          Showing {filtered.length} of {customers.length} customers
        </div>
      </div>

      {/* ── Customer Cards Grid ──────────────────────────────────── */}
      {loading && customers.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} variant="card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center bg-white rounded-2xl border border-black/[0.06]">
          <Users size={36} className="mx-auto mb-3 text-[#86868B] opacity-30" />
          <p className="text-sm font-semibold text-[#86868B] m-0 mb-3">No customer records found</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Add First Customer
          </button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((c, i) => {
              const { orderCount, totalSpent } = getStats(c);
              const isVIP = totalSpent > 10000 || orderCount >= 3;
              const customerId = c.uid || c.customerId || `cust_${i}`;

              return (
                <motion.div
                  key={customerId}
                  layout
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25, delay: i * 0.03 }}
                  className="glass-card p-4 bg-white rounded-2xl border border-black/[0.06] shadow-xs flex flex-col justify-between group relative"
                >
                  {/* Delete Customer Button */}
                  <button
                    onClick={() => handleDeleteCustomer(customerId, c.name)}
                    title="Delete Customer Profile"
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-black/[0.03] hover:bg-[#FF3B30]/10 hover:text-[#FF3B30] text-[#86868B] flex items-center justify-center border-none cursor-pointer transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>

                  <div>
                    {/* Customer Header */}
                    <div className="flex items-center gap-3 mb-3 pr-8">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#0051A8] text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
                        {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-[#1D1D1F] truncate m-0">
                            {c.name || "Anonymous Customer"}
                          </h3>
                          {isVIP && (
                            <span className="badge text-[9px] font-extrabold bg-[#FFF4E5] text-[#FF9500] flex items-center gap-0.5">
                              <Star size={9} fill="#FF9500" /> VIP
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#86868B] flex items-center gap-1 mt-0.5 m-0 truncate">
                          <Mail size={11} className="flex-shrink-0" /> {c.email || "No email on record"}
                        </p>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-black/[0.02] border border-black/[0.04] text-xs text-[#515154] mb-3">
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-[#86868B] flex-shrink-0" />
                        <span>{c.phone || "No phone number"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-[#86868B] flex-shrink-0" />
                        <span className="truncate">{c.address || "India"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-black/[0.05]">
                    <div>
                      <span className="text-[10px] text-[#86868B] block">Total Orders</span>
                      <span className="text-xs font-bold text-[#1D1D1F]">{orderCount} Orders</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#86868B] block">Total Spent</span>
                      <span className="text-xs font-bold text-[#34C759]">{formatPrice(totalSpent)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Floating Action Button ──────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-13 h-13 rounded-full bg-[#007AFF] text-white shadow-xl shadow-blue-500/30 flex items-center justify-center border-none cursor-pointer z-40"
        title="Add New Customer"
      >
        <Plus size={24} strokeWidth={2.5} />
      </motion.button>

      {/* ── Add Customer Modal Dialog ───────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-black/[0.08] relative overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center">
                    <UserPlus size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1D1D1F] m-0">Register New Customer</h3>
                    <p className="text-xs text-[#86868B] m-0">Add buyer profile to your store database</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center border-none cursor-pointer text-[#1D1D1F]"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="apple-section-label block mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="apple-section-label block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="apple-section-label block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="apple-section-label block mb-1">Shipping / Store Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 104 Park Street, Mumbai, Maharashtra"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="apple-section-label block mb-1">Customer Segment</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input-field w-full cursor-pointer"
                  >
                    <option value="customer">Retail Customer</option>
                    <option value="vip">VIP Buyer</option>
                    <option value="wholesale">Wholesale Partner</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary cursor-pointer text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    {submitting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} strokeWidth={2.5} />
                    )}
                    <span>{submitting ? "Saving..." : "Save Customer"}</span>
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

export default Customers;
