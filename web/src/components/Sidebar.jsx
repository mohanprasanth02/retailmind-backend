import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
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
  Cpu,
  X,
} from "lucide-react";

const navigationGroups = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Dashboard", path: "/", icon: LayoutDashboard, accent: "#007AFF" },
      { name: "Analytics", path: "/analytics", icon: TrendingUp, accent: "#34C759" },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { name: "Orders", path: "/orders", icon: ShoppingBag, accent: "#FF9500", hasBadge: true },
      { name: "Products", path: "/products", icon: Package, accent: "#34C759" },
      { name: "Inventory", path: "/inventory", icon: Warehouse, accent: "#5856D6" },
      { name: "Customers", path: "/customers", icon: Users, accent: "#007AFF" },
      { name: "Invoices", path: "/invoices", icon: FileText, accent: "#FF3B30" },
    ],
  },
  {
    title: "CHANNELS & AI",
    items: [
      { name: "Sales Channels", path: "/channels", icon: Radio, accent: "#30B0C7" },
      { name: "AI Assistant", path: "/ai-assistant", icon: Bot, accent: "#AF52DE" },
      { name: "Reports", path: "/reports", icon: BarChart3, accent: "#007AFF" },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Settings", path: "/settings", icon: Settings, accent: "#8E8E93" },
    ],
  },
];

const Sidebar = ({ pendingOrdersCount = 0, mobileOpen = false, onCloseMobile }) => {
  const location = useLocation();

  return (
    <aside
      className={`sidebar apple-vibrancy-sidebar flex flex-col h-screen fixed left-0 top-0 z-50 select-none transition-transform duration-300 ease-out bg-white/95 backdrop-blur-2xl border-r border-black/[0.08] ${
        mobileOpen
          ? "translate-x-0 shadow-2xl"
          : "-translate-x-full md:translate-x-0"
      }`}
      style={{ width: "240px" }}
    >
      {/* ── Brand Header Bar ──────────── */}
      <div className="px-5 pt-5 pb-3 border-b border-black/[0.06] flex items-center justify-between">
        <Link to="/" onClick={onCloseMobile} className="flex items-center gap-3 no-underline group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#0051A8] text-white flex items-center justify-center shadow-lg shadow-blue-500/25"
          >
            <Zap size={18} strokeWidth={2} />
          </motion.div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-[#1D1D1F] flex items-center gap-1.5 m-0">
              RetailMind
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#E5F1FF] text-[#007AFF]">
                OS
              </span>
            </h1>
            <p className="text-[10px] font-medium text-[#86868B] tracking-tight m-0">
              Smart Store Operations
            </p>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center border-none cursor-pointer text-[#1D1D1F]"
          aria-label="Close menu"
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Navigation List ────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <p
              className="px-3 mb-1.5 text-[9.5px] font-extrabold tracking-[0.06em] uppercase"
              style={{ color: "rgba(60, 60, 67, 0.55)" }}
            >
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                const badge = item.hasBadge ? pendingOrdersCount : 0;

                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={onCloseMobile}
                    className="no-underline block"
                  >
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={`relative flex items-center justify-between px-3 py-2 text-xs font-semibold transition-all duration-150 rounded-xl ${
                        isActive
                          ? "text-white bg-[#007AFF] shadow-md shadow-blue-500/20"
                          : "text-[#1D1D1F] hover:bg-black/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            isActive ? "bg-white/20" : ""
                          }`}
                        >
                          <Icon
                            size={15}
                            strokeWidth={isActive ? 2 : 1.75}
                            style={{ color: isActive ? "#FFFFFF" : item.accent }}
                          />
                        </div>
                        <span className="truncate tracking-tight">{item.name}</span>
                      </div>

                      {badge > 0 ? (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-transform ${
                            isActive
                              ? "bg-white text-[#007AFF]"
                              : "bg-[#FFF4E5] text-[#FF9500]"
                          }`}
                        >
                          {badge}
                        </span>
                      ) : isActive ? (
                        <ChevronRight size={13} strokeWidth={2} className="text-white/80" />
                      ) : null}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer Status Widget ───────────────────────────── */}
      <div className="p-3 border-t border-black/[0.06] bg-white/40">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center justify-between p-2.5 rounded-2xl bg-white/80 border border-black/[0.05] shadow-xs backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#EAF8ED] text-[#34C759] flex items-center justify-center">
              <Cpu size={12} strokeWidth={2} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#1D1D1F] block leading-none">
                AI Store Engine
              </span>
              <span className="text-[9px] font-medium text-[#86868B]">
                High-Speed Sync
              </span>
            </div>
          </div>
          <span className="text-[10px] text-[#007AFF] font-mono font-bold bg-[#E5F1FF] px-1.5 py-0.5 rounded-full">
            v3.2
          </span>
        </motion.div>
      </div>
    </aside>
  );
};

export default Sidebar;
