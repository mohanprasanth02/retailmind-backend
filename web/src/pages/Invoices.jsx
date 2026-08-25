import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Search, RefreshCw, CheckCircle } from "lucide-react";
import { formatPrice } from "../utils/currency";
import { API_BASE_URL } from "../config";

const Invoices = () => {
  const [invoices, setInvoices] = useState(() => {
    try {
      const cached = localStorage.getItem("retailmind_invoices_cache");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`);
      if (res.ok) {
        const data = await res.json();
        const validInvoices = data.filter(o => o.status === "Completed" || o.status === "Processing" || o.subtotal > 0);
        setInvoices(validInvoices);
        try {
          localStorage.setItem("retailmind_invoices_cache", JSON.stringify(validInvoices));
        } catch {}
      }
    } catch (e) {
      console.error(e);
      const cached = localStorage.getItem("retailmind_invoices_cache");
      if (cached) {
        try { setInvoices(JSON.parse(cached)); } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const filtered = invoices.filter(inv =>
    (inv.customerName && inv.customerName.toLowerCase().includes(search.toLowerCase())) ||
    (inv.orderId && inv.orderId.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = invoices.filter(i => i.status === "Completed").reduce((s, i) => s + (i.total || 0), 0);

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
            Financial Documentation
          </span>
          <h1 className="apple-hero-title">
            Official store statements.
          </h1>
          <p className="apple-hero-subtitle">
            Automated GST/tax calculations, downloadable PDF invoices, and verified order statements.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={fetchInvoices}
          className="btn btn-ghost shadow-xs self-start md:self-auto cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} style={{ color: "#007AFF" }} />
          <span>Reload</span>
        </motion.button>
      </motion.div>

      {/* ── Summary Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-[#86868B] tracking-wider m-0 mb-1">Total Invoices</p>
            <h3 className="text-xl font-bold text-[#1D1D1F] m-0">{invoices.length} Statements</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center">
            <FileText size={18} strokeWidth={2} />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-[#86868B] tracking-wider m-0 mb-1">Completed Payments</p>
            <h3 className="text-xl font-bold text-[#34C759] m-0">
              {invoices.filter(i => i.status === "Completed").length} Invoices
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EAF8ED] text-[#34C759] flex items-center justify-center">
            <CheckCircle size={18} strokeWidth={2} />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-[#86868B] tracking-wider m-0 mb-1">Total Invoiced</p>
            <h3 className="text-xl font-bold text-[#1D1D1F] m-0">{formatPrice(totalRevenue)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F2F1FD] text-[#5856D6] flex items-center justify-center">
            <FileText size={18} strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* ── Search Bar ───────────────────────────────────────────── */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B] z-10 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by customer name or Order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          style={{ paddingLeft: "42px" }}
        />
      </div>

      {/* ── Invoice Table ────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden bg-white rounded-2xl border border-black/[0.06] shadow-xs">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 140, padding: "14px 20px" }}>Order ID</th>
                  <th style={{ minWidth: 220, padding: "14px 20px" }}>Customer</th>
                  <th style={{ minWidth: 120, padding: "14px 20px" }}>Date</th>
                  <th style={{ minWidth: 120, padding: "14px 20px" }}>Platform</th>
                  <th style={{ minWidth: 120, padding: "14px 20px" }}>Amount (₹)</th>
                  <th style={{ minWidth: 120, padding: "14px 20px" }}>Status</th>
                  <th style={{ minWidth: 140, padding: "14px 20px", textAlign: "right" }}>PDF Invoice</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#86868B]">
                      No invoice records found matching search
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => {
                    const ts = inv.timestamp;
                    const dateStr = ts
                      ? new Date((typeof ts === "number" ? ts : ts._seconds) * 1000).toLocaleDateString()
                      : "Today";

                    return (
                      <tr key={inv.orderId}>
                        <td style={{ padding: "14px 20px" }} className="font-mono text-xs font-bold text-[#007AFF]">
                          #{inv.orderId?.slice(0, 10)}
                        </td>
                        <td style={{ padding: "14px 20px" }} className="font-bold text-[#1D1D1F]">
                          {inv.customerName || "Customer"}
                        </td>
                        <td style={{ padding: "14px 20px" }} className="text-xs text-[#86868B]">{dateStr}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <span className="badge gray capitalize">{inv.platform || "Web"}</span>
                        </td>
                        <td style={{ padding: "14px 20px" }} className="font-bold text-[#1D1D1F]">
                          {formatPrice(inv.total)}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          {inv.status === "Completed" ? (
                            <span className="badge green">Paid</span>
                          ) : (
                            <span className="badge orange">Processing</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <a
                            href={`${API_BASE_URL}/api/invoices/${inv.orderId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#E5F1FF] text-[#007AFF] hover:bg-[#D4E7FF] no-underline transition-all"
                          >
                            <Download size={13} strokeWidth={2} />
                            Download
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
