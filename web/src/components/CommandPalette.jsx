import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search, LayoutDashboard, ShoppingBag, Warehouse, Package,
  Users, FileText, Bot, BarChart3, Settings, TrendingUp,
  Radio, X, ArrowRight, Command, Hash
} from "lucide-react";

// ── All navigable commands ────────────────────────────────────────────────────
const COMMANDS = [
  // Navigation
  { id: "dashboard",    label: "Dashboard",        desc: "Live operations overview",    path: "/",             icon: LayoutDashboard, color: "#60a5fa",  group: "Pages" },
  { id: "orders",       label: "Orders",            desc: "Incoming AI-parsed orders",   path: "/orders",       icon: ShoppingBag,     color: "#fbbf24",  group: "Pages" },
  { id: "inventory",    label: "Inventory",         desc: "Stock & supplier data",       path: "/inventory",    icon: Warehouse,       color: "#a78bfa",  group: "Pages" },
  { id: "products",     label: "Products",          desc: "Catalog & pricing",           path: "/products",     icon: Package,         color: "#34d399",  group: "Pages" },
  { id: "customers",    label: "Customers",         desc: "Customer directory",          path: "/customers",    icon: Users,           color: "#22d3ee",  group: "Pages" },
  { id: "invoices",     label: "Invoices",          desc: "PDF invoice management",      path: "/invoices",     icon: FileText,        color: "#fb7185",  group: "Pages" },
  { id: "ai",           label: "AI Assistant",      desc: "Natural language queries",    path: "/ai-assistant", icon: Bot,             color: "#f59e0b",  group: "Pages" },
  { id: "analytics",    label: "Analytics",         desc: "Revenue & performance",       path: "/analytics",    icon: TrendingUp,      color: "#34d399",  group: "Pages" },
  { id: "channels",     label: "Sales Channels",    desc: "WhatsApp, Instagram, Email",  path: "/channels",     icon: Radio,           color: "#25D366",  group: "Pages" },
  { id: "reports",      label: "Reports",           desc: "Export & audit reports",      path: "/reports",      icon: BarChart3,       color: "#818cf8",  group: "Pages" },
  { id: "settings",     label: "Settings",          desc: "Store configuration",         path: "/settings",     icon: Settings,        color: "#94a3b8",  group: "Pages" },
  // Actions
  { id: "add-product",  label: "Add New Product",   desc: "Open product creation form",  path: "/products",     icon: Package,         color: "#34d399",  group: "Actions" },
  { id: "view-orders",  label: "View Pending Orders",desc: "Filter orders to Pending",   path: "/orders",       icon: ShoppingBag,     color: "#fbbf24",  group: "Actions" },
  { id: "export-csv",   label: "Export CSV Report", desc: "Download orders as CSV",      path: "/reports",      icon: BarChart3,       color: "#818cf8",  group: "Actions" },
];

// ── Command Palette Component ─────────────────────────────────────────────────
const CommandPalette = ({ open, onClose }) => {
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef                = useRef(null);
  const navigate                = useNavigate();

  // Filter commands
  const filtered = query.trim()
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.desc.toLowerCase().includes(query.toLowerCase()) ||
        c.group.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS;

  // Group results
  const groups = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {});
  const flat = filtered; // for keyboard nav

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  const handleKey = useCallback((e) => {
    if (!open) return;
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && flat[selected]) {
      navigate(flat[selected].path);
      onClose();
    }
  }, [open, flat, selected, navigate, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Reset selection when query changes
  useEffect(() => { setSelected(0); }, [query]);

  const runCommand = (cmd) => {
    navigate(cmd.path);
    onClose();
  };

  let flatIdx = 0; // track flat index across groups for keyboard highlight

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 9000,
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(6px)",
            }}
          />

          {/* Palette Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ type: "spring", stiffness: 480, damping: 36 }}
            style={{
              position: "fixed", top: "18%", left: "50%", transform: "translateX(-50%)",
              zIndex: 9001, width: "90%", maxWidth: 580,
              background: "rgba(255,255,255,0.98)",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 20,
              boxShadow: "0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
              backdropFilter: "blur(32px)",
              overflow: "hidden",
            }}
          >
            {/* Search Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <Search size={16} style={{ color: "#86868B", flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search pages, actions, products…"
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "#1D1D1F", fontSize: 14, fontFamily: "inherit", fontWeight: 500,
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <kbd style={{
                  background: "#F5F5F7", border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 6, padding: "2px 6px", fontSize: 10, color: "#86868B",
                  fontFamily: "monospace",
                }}>ESC</kbd>
              </div>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 400, overflowY: "auto", padding: "8px 0" }}>
              {flat.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                  No results for "{query}"
                </div>
              ) : (
                Object.entries(groups).map(([groupName, cmds]) => (
                  <div key={groupName}>
                    <div style={{ padding: "6px 16px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                      {groupName}
                    </div>
                    {cmds.map((cmd) => {
                      const isSelected = flat[selected]?.id === cmd.id;
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => runCommand(cmd)}
                          onMouseEnter={() => setSelected(flat.indexOf(cmd))}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            width: "100%", padding: "9px 16px",
                            background: isSelected ? "rgba(255,255,255,0.06)" : "transparent",
                            border: "none", cursor: "pointer", textAlign: "left",
                            transition: "background 0.12s",
                          }}
                        >
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, display: "flex",
                            alignItems: "center", justifyContent: "center", flexShrink: 0,
                            background: `${cmd.color}15`, border: `1px solid ${cmd.color}25`,
                          }}>
                            <Icon size={14} style={{ color: cmd.color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>{cmd.label}</p>
                            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{cmd.desc}</p>
                          </div>
                          {isSelected && (
                            <div style={{ flexShrink: 0, opacity: 0.5 }}>
                              <ArrowRight size={13} style={{ color: "var(--text-primary)" }} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: "flex", alignItems: "center", gap: 16, padding: "8px 16px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(255,255,255,0.01)",
            }}>
              {[
                { keys: ["↑", "↓"], label: "navigate" },
                { keys: ["↵"], label: "open" },
                { keys: ["ESC"], label: "close" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {item.keys.map(k => (
                    <kbd key={k} style={{
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 4, padding: "1px 5px", fontSize: 10, color: "rgba(255,255,255,0.5)",
                      fontFamily: "monospace",
                    }}>{k}</kbd>
                  ))}
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{item.label}</span>
                </div>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                <Command size={10} />
                <span>RetailMind</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ── Hook for global Ctrl+K listener ──────────────────────────────────────────
export const useCommandPalette = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(p => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen, onClose: () => setOpen(false) };
};

export default CommandPalette;
