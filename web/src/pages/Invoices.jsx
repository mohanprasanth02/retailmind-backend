import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Search, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { formatPrice } from "../utils/currency";
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


const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.filter(o => o.status === "Completed" || o.status === "Processing" || o.subtotal > 0));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchInvoices(); }, []);

  const filtered = invoices.filter(inv =>
    inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    inv.orderId?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = invoices.filter(i => i.status === "Completed").reduce((s, i) => s + (i.total || 0), 0);

  return (
    <div className="space-y-7 relative z-10">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="section-header">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "rgba(251,113,133,0.12)", border: "1px solid rgba(251,113,133,0.2)" }}>
              <FileText size={17} style={{ color: "#fb7185" }} />
            </span>
            Invoice Records
          </h1>
          <p className="section-subtitle">Review order statements, tax breakdowns and download PDF invoices</p>
        </div>
        <button onClick={fetchInvoices} className="btn btn-ghost">
          <RefreshCw size={13} /> Reload
        </button>
      </div>

      {/* ── Summary ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Invoices",  value: invoices.length, color: "#fb7185" },
          { label: "Completed",       value: invoices.filter(i => i.status === "Completed").length, color: "#34d399" },
          { label: "Revenue Invoiced",value: formatPrice(totalRevenue), color: "#60a5fa", isStr: true },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <IndianRupee size={16} style={{ color: s.color }} />
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
        <input type="text" placeholder="Search by customer or Order ID..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "rgba(251,113,133,0.3)", borderTopColor: "#fb7185" }} />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <FileText size={32} className="mx-auto mb-2 opacity-20" />
                  <p style={{ color: "var(--text-muted)" }}>No invoices found</p>
                </td></tr>
              ) : filtered.map((inv, i) => {
                const shortId = inv.orderId?.substring(6, 14).toUpperCase() || "UNKNOWN";
                const ts = inv.timestamp;
                const date = ts ? new Date((typeof ts === "number" ? ts : ts._seconds) * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
                const isCompleted = inv.status === "Completed";

                return (
                  <motion.tr key={inv.orderId}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}>
                    <td>
                      <span className="font-mono text-[12px] font-bold" style={{ color: "#fb7185" }}>
                        #INV-{shortId}
                      </span>
                    </td>
                    <td className="font-semibold">{inv.customerName}</td>
                    <td className="text-[12px]">{date}</td>
                    <td className="text-[12px]">{inv.products?.length || "—"} items</td>
                    <td className="text-right font-bold" style={{ color: "var(--text-primary)" }}>
                      {formatPrice(inv.total)}
                    </td>
                    <td>
                      <span className="badge" style={isCompleted
                        ? { background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }
                        : { background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)" }
                      }>
                        {isCompleted ? <CheckCircle size={9} /> : <Clock size={9} />}
                        {inv.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button onClick={() => window.open(`${API_BASE_URL}/api/orders/${inv.orderId}/invoice`, "_blank")}
                        className="btn btn-primary text-[11px] py-1.5 px-3">
                        <Download size={11} /> PDF
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

export default Invoices;
