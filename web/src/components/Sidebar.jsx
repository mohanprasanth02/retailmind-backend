import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  Warehouse,
  Package,
  Users,
  FileText,
  Bot,
  BarChart3,
  Settings,
  Zap,
  ChevronRight,
  TrendingUp,
  Radio,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard",    path: "/",            icon: LayoutDashboard, accent: "#60a5fa" },
  { name: "Orders",       path: "/orders",       icon: ShoppingBag,     accent: "#fbbf24", hasBadge: true },
  { name: "Inventory",    path: "/inventory",    icon: Warehouse,       accent: "#a78bfa" },
  { name: "Products",     path: "/products",     icon: Package,         accent: "#34d399" },
  { name: "Customers",    path: "/customers",    icon: Users,           accent: "#22d3ee" },
  { name: "Invoices",     path: "/invoices",     icon: FileText,        accent: "#fb7185" },
  { name: "AI Assistant", path: "/ai-assistant", icon: Bot,             accent: "#f59e0b" },
  { name: "Analytics",    path: "/analytics",    icon: TrendingUp,      accent: "#34d399" },
  { name: "Channels",     path: "/channels",     icon: Radio,           accent: "#25D366" },
  { name: "Reports",      path: "/reports",      icon: BarChart3,       accent: "#818cf8" },
  { name: "Settings",     path: "/settings",     icon: Settings,        accent: "#94a3b8" },
];

const Sidebar = ({ pendingOrdersCount = 0, unreadNotifsCount = 0 }) => {
  const location = useLocation();

  return (
    <aside className="sidebar flex flex-col">
      {/* ── Brand Header ──────────────────────────────────── */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <Link to="/" className="flex items-center gap-3 no-underline">
          {/* Logo mark */}
          <div
            className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #60a5fa, #a78bfa)" }}
          >
            <Zap size={18} className="text-white" />
            {/* Live ping */}
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full dot-pulse"
              style={{ background: "#34d399", boxShadow: "0 0 8px #34d399" }}
            />
          </div>
          <div>
            <h1
              className="text-sm font-bold tracking-widest uppercase"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)", letterSpacing: "0.12em" }}
            >
              RetailMind
            </h1>
            <p className="text-[10px] font-medium tracking-wider" style={{ color: "var(--text-muted)" }}>
              AI OPERATIONS
            </p>
          </div>
        </Link>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p
          className="px-3 mb-3 text-[9px] font-bold tracking-[0.15em] uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          Main Menu
        </p>

        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const badge = item.hasBadge ? pendingOrdersCount : 0;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Icon */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{
                    background: isActive ? `${item.accent}18` : "transparent",
                    border: isActive ? `1px solid ${item.accent}30` : "1px solid transparent",
                  }}
                >
                  <Icon
                    size={14}
                    style={{ color: isActive ? item.accent : "var(--text-muted)" }}
                  />
                </div>
                <span className="truncate" style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {item.name}
                </span>
              </div>

              {/* Badge or Arrow */}
              {badge > 0 ? (
                <span
                  className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}
                >
                  {badge}
                </span>
              ) : isActive ? (
                <ChevronRight size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              ) : null}

              {/* Active background glow */}
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg -z-10"
                  style={{ background: `${item.accent}08` }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── System Status Footer ──────────────────────────── */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {/* Status Row */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}
          >
            <span className="w-2 h-2 rounded-full dot-pulse" style={{ background: "#34d399" }} />
          </div>
          <div>
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
              System Online
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              AI Sync Active
            </p>
          </div>
        </div>

        {/* Notifications pill */}
        {unreadNotifsCount > 0 && (
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg text-[11px]"
            style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}
          >
            <span style={{ color: "#fbbf24" }}>Unread alerts</span>
            <span className="font-bold" style={{ color: "#fbbf24" }}>{unreadNotifsCount}</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
