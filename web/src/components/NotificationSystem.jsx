import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BellRing, ShoppingBag, AlertTriangle, X, CheckCircle, Info, Bell } from "lucide-react";
import { API_BASE_URL } from "../config";

// ── Context ──────────────────────────────────────────────────────────────────
const NotificationContext = createContext(null);
export const useNotifications = () => useContext(NotificationContext);

// ── Toast Icons ──────────────────────────────────────────────────────────────
const TOAST_ICONS = {
  order:     { icon: ShoppingBag, color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.25)" },
  low_stock: { icon: AlertTriangle, color: "#fb7185", bg: "rgba(251,113,133,0.12)", border: "rgba(251,113,133,0.25)" },
  success:   { icon: CheckCircle, color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.25)" },
  info:      { icon: Info,         color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.25)" },
};

// ── Individual Toast ──────────────────────────────────────────────────────────
const Toast = ({ id, title, message, type = "info", onDismiss }) => {
  const cfg = TOAST_ICONS[type] || TOAST_ICONS.info;
  const Icon = cfg.icon;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 5000);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="flex items-start gap-3 p-4 rounded-2xl shadow-xl w-80 relative overflow-hidden cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.96)",
        border: `1px solid ${cfg.border}`,
        backdropFilter: "blur(20px)",
        boxShadow: `0 12px 36px rgba(0,0,0,0.12), 0 0 0 1px ${cfg.border}`,
      }}
      onClick={() => onDismiss(id)}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: cfg.color }} />

      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ml-1"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
        <Icon size={16} style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{title}</p>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "var(--text-secondary)" }}>{message}</p>
      </div>

      {/* Dismiss */}
      <button onClick={(e) => { e.stopPropagation(); onDismiss(id); }}
        className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
        style={{ background: "rgba(255,255,255,0.08)" }}>
        <X size={10} style={{ color: "var(--text-primary)" }} />
      </button>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] rounded-b-2xl"
        style={{ background: cfg.color }}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 5, ease: "linear" }}
      />
    </motion.div>
  );
};

// ── Toast Container ───────────────────────────────────────────────────────────
const ToastContainer = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-3 items-end pointer-events-none">
    <AnimatePresence mode="popLayout">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onDismiss={onDismiss} />
        </div>
      ))}
    </AnimatePresence>
  </div>
);

// ── Bell Dropdown ─────────────────────────────────────────────────────────────
const BellDropdown = ({ notifications, unreadCount, onMarkAll }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={{
          background: open ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? "rgba(251,191,36,0.3)" : "var(--border-subtle)"}`,
        }}
      >
        <Bell size={15} style={{ color: unreadCount > 0 ? "#fbbf24" : "var(--text-muted)" }} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: "#fbbf24", color: "#000" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute right-0 top-11 z-50 w-80 rounded-2xl overflow-hidden bg-white/95 border border-black/10 backdrop-blur-2xl shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-2">
                  <BellRing size={14} style={{ color: "#fbbf24" }} />
                  <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="badge amber">{unreadCount} new</span>
                  )}
                </div>
                <button onClick={onMarkAll}
                  className="text-[11px] font-semibold hover:opacity-70 transition-opacity"
                  style={{ color: "#fbbf24" }}>
                  Clear all
                </button>
              </div>

              {/* List */}
              <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell size={24} className="mx-auto mb-2 opacity-20" />
                    <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>All caught up!</p>
                  </div>
                ) : notifications.map((n, i) => {
                  const cfg = TOAST_ICONS[n.type] || TOAST_ICONS.info;
                  const Icon = cfg.icon;
                  return (
                    <div key={i}
                      className="flex gap-3 px-4 py-3 transition-colors"
                      style={{
                        background: n.read ? "transparent" : `${cfg.color}06`,
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                      }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <Icon size={12} style={{ color: cfg.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "var(--text-secondary)" }}>{n.message}</p>
                        {n.timestamp && (
                          <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                            {new Date(n.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: cfg.color }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts]             = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]   = useState(0);
  const prevIdsRef = useRef(new Set());

  const addToast = useCallback((toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((p) => [...p.slice(-4), { ...toast, id }]);   // max 5 toasts
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read`, { method: "PUT" });
      setNotifications((p) => p.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  // Poll every 4s
  useEffect(() => {
    const poll = async () => {
      try {
        const [notifRes, ordRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/notifications`),
          fetch(`${API_BASE_URL}/api/orders`),
        ]);

        if (notifRes.ok) {
          const notifs = await notifRes.json();
          setNotifications(notifs.slice(0, 20));
          const unread = notifs.filter((n) => !n.read);
          setUnreadCount(unread.length);

          // Show toasts for NEW notifications
          unread.forEach((n) => {
            if (!prevIdsRef.current.has(n.id || n.title + n.timestamp)) {
              const key = n.id || n.title + n.timestamp;
              prevIdsRef.current.add(key);
              addToast({ title: n.title, message: n.message, type: n.type || "info" });
            }
          });
        }

        if (ordRes.ok) {
          const orders = await ordRes.json();
          const pending = orders.filter((o) => o.status === "Pending");
          pending.forEach((o) => {
            const key = `order-${o.orderId}`;
            if (!prevIdsRef.current.has(key)) {
              prevIdsRef.current.add(key);
              addToast({
                title: "New Order Received!",
                message: `${o.customerName} via ${o.platform || "Website"} — ${o.products?.length || 1} item(s)`,
                type: "order",
              });
            }
          });
        }
      } catch {}
    };

    // First load — populate prevIds without toasting
    const init = async () => {
      try {
        const [notifRes, ordRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/notifications`),
          fetch(`${API_BASE_URL}/api/orders`),
        ]);
        if (notifRes.ok) {
          const notifs = await notifRes.json();
          setNotifications(notifs.slice(0, 20));
          setUnreadCount(notifs.filter((n) => !n.read).length);
          notifs.filter((n) => !n.read).forEach((n) => {
            prevIdsRef.current.add(n.id || n.title + n.timestamp);
          });
        }
        if (ordRes.ok) {
          const orders = await ordRes.json();
          orders.filter((o) => o.status === "Pending").forEach((o) => {
            prevIdsRef.current.add(`order-${o.orderId}`);
          });
        }
      } catch {}
    };

    init();
    const iv = setInterval(poll, 4000);
    return () => clearInterval(iv);
  }, [addToast]);

  return (
    <NotificationContext.Provider value={{ addToast, notifications, unreadCount, markAllRead }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
};

// ── Exported Bell for Topbar ──────────────────────────────────────────────────
export { BellDropdown };
