import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Mail, Phone, MapPin, Calendar, Search, UserCheck } from "lucide-react";
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


const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  const fetchData = async () => {
    try {
      const [cRes, oRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/customers`),
        fetch(`${API_BASE_URL}/api/orders`),
      ]);
      if (cRes.ok) setCustomers(await cRes.json());
      if (oRes.ok) setOrders(await oRes.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const getStats = (customer) => {
    const custOrders = orders.filter(o =>
      o.customerName === customer.name || o.phone === customer.phone
    );
    const completed = custOrders.filter(o => o.status === "Completed");
    const total = completed.reduce((s, o) => s + (o.total || 0), 0);
    return { orderCount: custOrders.length, totalSpent: total };
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const totalSpent = orders.filter(o => o.status === "Completed").reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="space-y-7 relative z-10">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="section-header">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.2)" }}>
              <Users size={17} style={{ color: "#22d3ee" }} />
            </span>
            Customer Directory
          </h1>
          <p className="section-subtitle">Review customer records, transaction history and contact details</p>
        </div>
      </div>

      {/* ── Summary ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Customers", value: customers.length, color: "#22d3ee" },
          { label: "Total Orders",    value: orders.length,    color: "#a78bfa" },
          { label: "Revenue Generated", value: formatPrice(totalSpent), color: "#34d399", isStr: true },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <UserCheck size={16} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.isStr ? s.value : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ─────────────────────────────────────────── */}
      <div className="relative max-w-md">
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input type="text" placeholder="Search by name, email, or phone..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {/* ── Grid ───────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} variant="card" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="glass-card p-12 text-center col-span-full">
              <Users size={36} className="mx-auto mb-3 opacity-20" />
              <p style={{ color: "var(--text-muted)" }}>No customers match your search</p>
            </div>
          ) : filtered.map((c, i) => {
            const stats = getStats(c);
            const initials = c.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
            return (
              <motion.div key={c.uid} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className="glass-card p-5 flex flex-col gap-4">
                {/* Avatar + Name */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #22d3ee20, #60a5fa20)", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}>
                      {initials}
                    </div>
                    <div>
                      <h2 className="font-bold text-[15px]" style={{ color: "var(--text-primary)" }}>{c.name}</h2>
                      <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>UID: {c.uid?.slice(0, 10)}…</p>
                    </div>
                  </div>
                  <span className="badge" style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }}>
                    Active
                  </span>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    <Mail size={12} style={{ color: "var(--text-muted)" }} />{c.email}
                  </p>
                  <p className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    <Phone size={12} style={{ color: "var(--text-muted)" }} />{c.phone}
                  </p>
                  <p className="flex items-start gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    <MapPin size={12} className="mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                    <span className="leading-snug">{c.address}</span>
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <div className="p-3 rounded-xl text-center"
                    style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.1)" }}>
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Total Spent</p>
                    <p className="font-bold flex items-center justify-center gap-0.5" style={{ color: "#22d3ee" }}>
                      <IndianRupee size={12} />
                      {stats.totalSpent.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl text-center"
                    style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.1)" }}>
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Orders</p>
                    <p className="font-bold flex items-center justify-center gap-1" style={{ color: "#a78bfa" }}>
                      <Calendar size={12} />{stats.orderCount || c.previousOrders || 0}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Customers;
