import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Mail, Phone, MapPin, Calendar, Search, UserCheck, Star, ShoppingBag } from "lucide-react";
import { formatPrice } from "../utils/currency";
import Skeleton from "../components/Skeleton";
import { API_BASE_URL } from "../config";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, oRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/customers`),
        fetch(`${API_BASE_URL}/api/orders`),
      ]);
      if (cRes.ok) setCustomers(await cRes.json());
      if (oRes.ok) setOrders(await oRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getStats = (customer) => {
    const custOrders = orders.filter(o =>
      o.customerName === customer.name || (customer.phone && o.phone === customer.phone)
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

  const totalRevenue = orders.filter(o => o.status === "Completed").reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="space-y-6 relative z-10">
      {/* ── Page Header Bar ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="pb-4 border-b border-black/[0.06]"
      >
        <span className="apple-section-label block mb-1 text-[#007AFF]">
          Customer Relationships
        </span>
        <h1 className="apple-hero-title">
          Know your buyers inside out.
        </h1>
        <p className="apple-hero-subtitle">
          Comprehensive customer profiles, purchase history, channel contacts, and lifetime revenue analytics.
        </p>
      </motion.div>

      {/* ── Summary Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-[#86868B] tracking-wider m-0 mb-1">Total Customers</p>
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

      {/* ── Search Bar ───────────────────────────────────────────── */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
        <input
          type="text"
          placeholder="Search by customer name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {/* ── Customer Cards Grid ──────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} variant="card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center bg-white rounded-2xl border border-black/[0.06]">
          <Users size={36} className="mx-auto mb-3 text-[#86868B] opacity-30" />
          <p className="text-sm font-semibold text-[#86868B] m-0">No customer records found</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((c, i) => {
              const { orderCount, totalSpent } = getStats(c);
              const isVIP = totalSpent > 10000 || orderCount >= 3;

              return (
                <motion.div
                  key={c.customerId || i}
                  layout
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25, delay: i * 0.03 }}
                  className="glass-card p-4 bg-white rounded-2xl border border-black/[0.06] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Customer Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#0051A8] text-white flex items-center justify-center font-bold text-base shadow-sm">
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
                        <p className="text-[11px] text-[#86868B] flex items-center gap-1 mt-0.5 m-0">
                          <Mail size={11} /> {c.email || "No email on record"}
                        </p>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-black/[0.02] border border-black/[0.04] text-xs text-[#515154] mb-3">
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-[#86868B]" />
                        <span>{c.phone || "No phone number"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-[#86868B]" />
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
    </div>
  );
};

export default Customers;
