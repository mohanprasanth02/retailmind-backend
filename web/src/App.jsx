import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import { API_BASE_URL } from "./config";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

// ── Layout Components ─────────────────────────────────────────────────────────
import Sidebar from "./components/Sidebar";
import { NotificationProvider, BellDropdown, useNotifications } from "./components/NotificationSystem";
import BackgroundOrbs from "./components/BackgroundOrbs";
import CommandPalette, { useCommandPalette } from "./components/CommandPalette";
import QuickActions from "./components/QuickActions";

// ── Pages ─────────────────────────────────────────────────────────────────────
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import AIAssistant from "./pages/AIAssistant";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import Channels from "./pages/Channels";

// ── Page meta ─────────────────────────────────────────────────────────────────
const PAGE_META = {
  "/": { title: "Dashboard", subtitle: "Live retail operations overview" },
  "/orders": { title: "Orders", subtitle: "Incoming AI-parsed platform orders" },
  "/inventory": { title: "Inventory", subtitle: "Stock management & supplier data" },
  "/products": { title: "Products", subtitle: "Product catalog & pricing" },
  "/customers": { title: "Customers", subtitle: "Customer directory & transaction history" },
  "/invoices": { title: "Invoices", subtitle: "Download & manage PDF invoices" },
  "/ai-assistant": { title: "AI Assistant", subtitle: "Natural language business queries" },
  "/reports": { title: "Reports", subtitle: "Operations analytics & exports" },
  "/analytics": { title: "Analytics", subtitle: "Revenue trends & product performance" },
  "/channels": { title: "Sales Channels", subtitle: "WhatsApp, Instagram, Website & Email" },
  "/settings": { title: "Settings", subtitle: "Store configuration & integrations" },
};

// ── Page transition variants ──────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 28 }
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    transition: { duration: 0.15, ease: "easeIn" }
  },
};

// ── Animated Page Wrapper ─────────────────────────────────────────────────────
const PageWrapper = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="min-h-full transform-gpu"
  >
    {children}
  </motion.div>
);

// ── Top Header ────────────────────────────────────────────────────────────────
const TopHeader = ({ pendingCount, onCmdOpen, onToggleMobile }) => {
  const location = useLocation();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const page = PAGE_META[location.pathname] || { title: "RetailMind", subtitle: "" };

  return (
    <header className="apple-vibrancy-header flex items-center justify-between md:px-8 px-4 py-3 flex-shrink-0 sticky top-0 z-30 shadow-xs backdrop-blur-xl bg-white/80 border-b border-black/[0.06]">
      {/* Page title & Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="md:hidden w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center border-none cursor-pointer text-[#1D1D1F]"
        >
          <Menu size={18} />
        </button>

        <div>
          <h2 className="text-base md:text-lg font-extrabold text-[#1D1D1F] tracking-tight m-0 leading-tight">
            {page.title}
          </h2>
          <p className="hidden md:block text-[11px] text-[#86868B] font-medium tracking-tight mt-0.5 mb-0">
            {page.subtitle}
          </p>
        </div>
      </div>

      {/* Right actions — Unified Capsule Bar */}
      <div className="flex items-center gap-2 bg-black/[0.03] p-1 rounded-full border border-black/[0.06] backdrop-blur-md">
        {/* Search capsule button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onCmdOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all bg-white text-[#515154] shadow-xs text-xs font-semibold border border-black/[0.06] hover:bg-slate-50 cursor-pointer"
        >
          <span>Search</span>
          <div className="hidden sm:flex items-center gap-0.5 ml-1">
            <kbd className="bg-[#F5F5F7] border border-black/10 rounded px-1.5 text-[10px] font-mono text-[#1D1D1F]">⌘K</kbd>
          </div>
        </motion.button>

        {/* Pending pill */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF4E5] border border-[#FF9500]/30 text-[#FF9500]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9500] animate-pulse" />
            <span className="text-[11px] font-bold">
              {pendingCount} pending
            </span>
          </div>
        )}

        {/* Bell dropdown */}
        <BellDropdown notifications={notifications} unreadCount={unreadCount} onMarkAll={markAllRead} />

        {/* Live status badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF8ED] border border-[#34C759]/30 text-[#28A745]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] dot-pulse" />
          <span className="text-[11px] font-bold">Live Sync</span>
        </div>
      </div>
    </header>
  );
};

// ── Main App Inner ────────────────────────────────────────────────────────────
function AppInner() {
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const location = useLocation();
  const { open: cmdOpen, setOpen: setCmdOpen, onClose: onCmdClose } = useCommandPalette();

  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "orders"), where("status", "==", "Pending"));
      const unsub = onSnapshot(q, s => setPendingCount(s.size), () => { });
      return unsub;
    } else {
      const poll = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/orders`);
          if (res.ok) setPendingCount((await res.json()).filter(o => o.status === "Pending").length);
        } catch { }
      };
      poll();
      const iv = setInterval(poll, 3000);
      return () => clearInterval(iv);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F7] relative flex">
      <BackgroundOrbs />

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        pendingOrdersCount={pendingCount}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-[240px] ml-0 relative z-10 transition-all">
        <TopHeader
          pendingCount={pendingCount}
          onCmdOpen={() => setCmdOpen(true)}
          onToggleMobile={() => setMobileOpen(true)}
        />

        <main className="flex-1 md:p-8 p-4 relative">
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
              <Route path="/orders" element={<PageWrapper><Orders /></PageWrapper>} />
              <Route path="/inventory" element={<PageWrapper><Inventory /></PageWrapper>} />
              <Route path="/products" element={<PageWrapper><Products /></PageWrapper>} />
              <Route path="/customers" element={<PageWrapper><Customers /></PageWrapper>} />
              <Route path="/invoices" element={<PageWrapper><Invoices /></PageWrapper>} />
              <Route path="/ai-assistant" element={<PageWrapper><AIAssistant /></PageWrapper>} />
              <Route path="/reports" element={<PageWrapper><Reports /></PageWrapper>} />
              <Route path="/analytics" element={<PageWrapper><Analytics /></PageWrapper>} />
              <Route path="/channels" element={<PageWrapper><Channels /></PageWrapper>} />
              <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette open={cmdOpen} onClose={onCmdClose} />
      <QuickActions />
    </div>
  );
}

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AppInner />
      </NotificationProvider>
    </Router>
  );
}

export default App;
