import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import {
  ShoppingBag, MessageSquare, User, MapPin, Phone,
  Check, X, Clock, Bot, FileText, AlertTriangle, ArrowRight, Filter
} from "lucide-react";
import { formatPrice } from "../utils/currency";
import Skeleton from "../components/Skeleton";
import { fireOrderConfetti, SuccessToast, AnimatedCheckmark } from "../components/MicroAnimations";
import { AnimatePresence as AP } from "framer-motion";
import { API_BASE_URL } from "../config";

const PLATFORM_CONFIG = {
  whatsapp:  { label: "WhatsApp",  color: "#25D366", bg: "rgba(37,211,102,0.12)", border: "rgba(37,211,102,0.25)" },
  instagram: { label: "Instagram", color: "#E1306C", bg: "rgba(225,48,108,0.12)", border: "rgba(225,48,108,0.25)" },
  website:   { label: "Website",   color: "#007AFF", bg: "#E5F1FF", border: "rgba(0,122,255,0.25)" },
  email:     { label: "Email",     color: "#FF9500", bg: "#FFF4E5", border: "rgba(255,149,0,0.25)" },
};

const STATUS_CONFIG = {
  Pending:    { color: "#FF9500", bg: "#FFF4E5", border: "rgba(255,149,0,0.3)"  },
  Processing: { color: "#007AFF", bg: "#E5F1FF", border: "rgba(0,122,255,0.3)"  },
  Completed:  { color: "#34C759", bg: "#EAF8ED", border: "rgba(52,199,89,0.3)"  },
  Rejected:   { color: "#FF3B30", bg: "#FFEBEA", border: "rgba(255,59,48,0.3)" },
};

const TABS = ["all", "pending", "processing", "completed", "rejected"];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`);
      if (res.ok) setOrders(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 2000);
    return () => clearInterval(iv);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!isFirebaseConfigured) fetchOrders();
      if (newStatus === "Completed") {
        fireOrderConfetti();
        setSuccessMsg("Order marked as completed! 🎉");
      } else if (newStatus === "Processing") {
        setSuccessMsg("Order is now processing.");
      }
    } catch (e) { console.error(e); }
  };

  const filteredOrders = orders.filter((o) =>
    activeTab === "all" ? true : o.status?.toLowerCase() === activeTab
  );

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === "all" ? orders.length : orders.filter((o) => o.status?.toLowerCase() === t).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6 relative z-10">
      {/* ── Success Toast ────────────────────────────────────────────────── */}
      <AP>
        {successMsg && (
          <SuccessToast
            message={successMsg}
            onClose={() => setSuccessMsg(null)}
            autoClose={3500}
          />
        )}
      </AP>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-black/[0.06]">
        <div>
          <span className="apple-section-label block mb-1 text-[#007AFF]">
            Omnichannel Processing
          </span>
          <h1 className="apple-hero-title">
            All your channels. One unified order stream.
          </h1>
          <p className="apple-hero-subtitle">
            AI automatically parses customer messages from WhatsApp, Instagram, Website, and Email into verified orders.
          </p>
        </div>

        {/* Segmented Filter Control */}
        <div className="apple-segmented-control self-start md:self-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`apple-segmented-btn capitalize ${activeTab === tab ? "active" : ""}`}
            >
              {tab}
              {counts[tab] > 0 && (
                <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded-full bg-black/5 font-mono">
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <Skeleton key={i} variant="card" />)}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filteredOrders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card p-12 text-center">
              <ShoppingBag size={36} className="mx-auto mb-3 opacity-20" />
              <p style={{ color: "var(--text-muted)" }}>No orders under "{activeTab}"</p>
            </motion.div>
          ) : (
            <div className="space-y-5">
              {filteredOrders.map((order, i) => {
                const plat = PLATFORM_CONFIG[order.platform?.toLowerCase()] || PLATFORM_CONFIG.website;
                const stat = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
                const ts = order.timestamp;
                const date = ts ? new Date((typeof ts === "number" ? ts : ts._seconds) * 1000).toLocaleString() : "";

                return (
                  <motion.div
                    key={order.orderId}
                    layoutId={order.orderId}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 28 }}
                    className="glass-card p-0 overflow-hidden"
                    style={{ borderColor: stat.border }}
                  >
                    {/* Top accent bar */}
                    <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)` }} />

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Col 1: Customer Info */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="badge" style={{ background: plat.bg, color: plat.color, border: `1px solid ${plat.border}` }}>
                            {plat.label}
                          </span>
                          <span className="badge" style={{ background: stat.bg, color: stat.color, border: `1px solid ${stat.border}` }}>
                            {order.status}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{date}</span>
                        </div>

                        <div>
                          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <User size={15} style={{ color: stat.color }} />
                            {order.customerName}
                          </h2>
                          <p className="text-[12px] mt-1 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                            <Phone size={11} />{order.phone || "No phone"}
                          </p>
                          <p className="text-[12px] mt-1 flex items-start gap-1.5" style={{ color: "var(--text-muted)" }}>
                            <MapPin size={11} className="mt-0.5 flex-shrink-0" />
                            <span>{order.address || "No address"}</span>
                          </p>
                        </div>

                        <div className="p-3 rounded-xl text-[12px]"
                          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                          <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                            <MessageSquare size={10} /> Platform Message
                          </p>
                          <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                            "{order.message || "Form submission order"}"
                          </p>
                        </div>
                      </div>

                      {/* Col 2: AI Parsing */}
                      <div className="rounded-xl p-5 flex flex-col justify-between"
                        style={{ background: "rgba(96,165,250,0.03)", border: "1px solid rgba(96,165,250,0.1)" }}>
                        <div>
                          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                            <h3 className="text-[12px] font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                              <Bot size={14} style={{ color: "#60a5fa" }} /> AI Parsing Engine
                            </h3>
                            <span className="badge" style={order.aiProcessed
                              ? { background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }
                              : { background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }
                            }>
                              {order.aiProcessed ? "Processed" : "Running..."}
                            </span>
                          </div>

                          {order.aiProcessed && (
                            <div className="space-y-2">
                              {order.products?.map((prod, idx) => (
                                <div key={idx} className="flex justify-between text-[12px] pb-2"
                                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                  <div>
                                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{prod.name}</span>
                                    <span className="ml-2 text-[10px]" style={{ color: "var(--text-muted)" }}>×{prod.quantity}</span>
                                  </div>
                                  <span style={{ color: "var(--text-secondary)" }}>{formatPrice(prod.price * prod.quantity)}</span>
                                </div>
                              ))}

                              {order.aiSuggestions?.length > 0 && (
                                <div className="p-3 rounded-xl mt-2"
                                  style={{ background: "rgba(251,113,133,0.05)", border: "1px solid rgba(251,113,133,0.15)" }}>
                                  <div className="flex items-center gap-1 text-[10px] font-bold mb-1.5" style={{ color: "#fb7185" }}>
                                    <AlertTriangle size={11} /> Alternatives:
                                  </div>
                                  {order.aiSuggestions.map((s, si) => (
                                    <p key={si} className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                                      <ArrowRight size={9} style={{ color: "#60a5fa" }} />{s}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {order.aiProcessed && (
                          <div className="flex justify-between items-center mt-4 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                            <span className="text-[10px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>
                              Total (GST 18%)
                            </span>
                            <span className="text-xl font-bold" style={{ color: "#60a5fa" }}>{formatPrice(order.total)}</span>
                          </div>
                        )}
                      </div>

                      {/* Col 3: Actions */}
                      <div className="flex flex-col justify-center gap-3">
                        {order.status === "Pending" && (
                          <>
                            <button onClick={() => handleUpdateStatus(order.orderId, "Processing")}
                              className="btn btn-primary w-full justify-center">
                              <Check size={14} /> Accept & Process
                            </button>
                            <button onClick={() => handleUpdateStatus(order.orderId, "Rejected")}
                              className="btn btn-danger w-full justify-center">
                              <X size={14} /> Reject Order
                            </button>
                          </>
                        )}
                        {order.status === "Processing" && (
                          <>
                            <button onClick={() => handleUpdateStatus(order.orderId, "Completed")}
                              className="btn w-full justify-center"
                              style={{ background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }}>
                              <Check size={14} /> Complete & Deduct Stock
                            </button>
                            <button onClick={() => handleUpdateStatus(order.orderId, "Rejected")}
                              className="btn btn-ghost w-full justify-center">
                              <X size={14} /> Cancel Order
                            </button>
                          </>
                        )}
                        {(order.status === "Processing" || order.status === "Completed") && (
                          <button onClick={() => window.open(`${API_BASE_URL}/api/orders/${order.orderId}/invoice`, "_blank")}
                            className="btn btn-ghost w-full justify-center">
                            <FileText size={14} /> Download Invoice PDF
                          </button>
                        )}
                        {order.status === "Rejected" && (
                          <div className="p-4 rounded-xl text-center text-[11px] font-bold uppercase"
                            style={{ background: "rgba(251,113,133,0.05)", border: "1px dashed rgba(251,113,133,0.25)", color: "#fb7185" }}>
                            Order Rejected
                          </div>
                        )}
                        {order.status === "Completed" && (
                          <div className="p-4 rounded-xl text-center text-[11px] font-bold uppercase"
                            style={{ background: "rgba(52,211,153,0.05)", border: "1px dashed rgba(52,211,153,0.25)", color: "#34d399" }}>
                            ✓ Order Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Orders;
