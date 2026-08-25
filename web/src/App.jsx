import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Search, LogOut, User, ShieldCheck, ChevronDown, Sun, Moon, Mic, Sparkles } from "lucide-react";
import { API_BASE_URL } from "./config";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import VoiceAssistant from "./components/VoiceAssistant";

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
import Login from "./pages/Login";

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

// ── Admin Profile Dropdown Menu ───────────────────────────────────────────────
const AdminUserMenu = () => {
  const { currentUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full transition-all bg-white dark:bg-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.12] border border-black/[0.08] dark:border-white/[0.1] shadow-xs cursor-pointer"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
          {(currentUser?.name || "M")[0].toUpperCase()}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-[11px] font-extrabold text-[#1D1D1F] dark:text-[#F5F5F7] leading-tight">
            {currentUser?.name || "Mohan"}
          </span>
          <span className="text-[9px] font-semibold text-[#007AFF] leading-tight">
            {currentUser?.role || "Admin"}
          </span>
        </div>
        <ChevronDown size={12} className="text-[#86868B]" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 dark:bg-[#1C1C24]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.12] shadow-xl p-2 z-50 select-none"
          >
            {/* Header info */}
            <div className="px-3 py-2.5 border-b border-black/[0.06] dark:border-white/[0.08] mb-1">
              <p className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] m-0 truncate">
                {currentUser?.name || "Mohan"}
              </p>
              <p className="text-[11px] text-[#86868B] m-0 truncate">
                {currentUser?.email || "mohan@retailmind.ai"}
              </p>
              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E5F1FF] dark:bg-[#007AFF]/20 text-[#007AFF] text-[9px] font-bold">
                <ShieldCheck size={10} />
                <span>Store Administrator</span>
              </div>
            </div>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#FF3B30] hover:bg-[#FFF2F2] dark:hover:bg-[#FF3B30]/20 rounded-xl transition-colors border-none cursor-pointer text-left"
            >
              <LogOut size={14} />
              <span>Sign Out of Console</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Top Header ────────────────────────────────────────────────────────────────
const TopHeader = ({ pendingCount, onCmdOpen, onToggleMobile, onOpenVoice }) => {
  const location = useLocation();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const { isDark, toggleTheme } = useTheme();
  const page = PAGE_META[location.pathname] || { title: "RetailMind", subtitle: "" };

  return (
    <header className="apple-vibrancy-header flex items-center justify-between md:px-8 px-4 py-3 flex-shrink-0 sticky top-0 z-30 shadow-xs backdrop-blur-xl bg-white/85 dark:bg-[#121217]/85 border-b border-black/[0.06] dark:border-white/[0.08]">
      {/* Page title & Mobile Menu Toggle */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onToggleMobile}
          className="md:hidden w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 flex items-center justify-center border-none cursor-pointer text-[#1D1D1F] dark:text-[#F5F5F7] flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          <h2 className="text-base md:text-lg font-extrabold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight m-0 leading-tight truncate">
            {page.title}
          </h2>
          <p className="hidden md:block text-[11px] text-[#86868B] font-medium tracking-tight mt-0.5 mb-0 truncate">
            {page.subtitle}
          </p>
        </div>
      </div>

      {/* Right actions — Unified Capsule Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-black/[0.03] dark:bg-white/[0.04] p-1 rounded-full border border-black/[0.06] dark:border-white/[0.08] backdrop-blur-md flex-shrink-0">
        {/* Search capsule button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onCmdOpen}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full transition-all bg-white dark:bg-white/[0.08] text-[#515154] dark:text-[#D1D1D6] shadow-xs text-xs font-semibold border border-black/[0.06] dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.12] cursor-pointer"
        >
          <Search size={14} className="text-[#86868B]" />
          <span className="hidden sm:inline">Search</span>
          <div className="hidden sm:flex items-center gap-0.5 ml-1">
            <kbd className="bg-[#F5F5F7] dark:bg-white/10 border border-black/10 dark:border-white/10 rounded px-1.5 text-[10px] font-mono text-[#1D1D1F] dark:text-[#F5F5F7]">⌘K</kbd>
          </div>
        </motion.button>

        {/* AI Voice Assistant Capsule Button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenVoice}
          title="Hey RetailMind Voice Assistant (⌘J)"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full transition-all bg-gradient-to-r from-[#007AFF] to-[#AF52DE] text-white shadow-xs text-xs font-semibold border-none cursor-pointer hover:shadow-blue-500/20"
        >
          <Mic size={14} />
          <span className="hidden md:inline text-[11px] font-bold">Voice AI</span>
          <div className="hidden sm:flex items-center gap-0.5 ml-0.5">
            <kbd className="bg-white/20 rounded px-1 text-[9px] font-mono text-white">⌘J</kbd>
          </div>
        </motion.button>

        {/* Dark/Light Mode Switcher */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          title={isDark ? "Switch to Apple Light Mode" : "Switch to macOS Dark Mode"}
          className="w-8 h-8 rounded-full bg-white dark:bg-white/[0.08] hover:bg-black/5 dark:hover:bg-white/[0.12] border border-black/[0.06] dark:border-white/[0.1] flex items-center justify-center cursor-pointer text-[#1D1D1F] dark:text-[#F5F5F7] transition-all shadow-xs"
        >
          {isDark ? (
            <Sun size={15} className="text-[#FF9500]" />
          ) : (
            <Moon size={15} className="text-[#5856D6]" />
          )}
        </motion.button>

        {/* Pending pill */}
        {pendingCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#FFF4E5] dark:bg-[#FF9500]/20 border border-[#FF9500]/30 text-[#FF9500]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9500] animate-pulse" />
            <span className="text-[11px] font-bold">
              {pendingCount}
            </span>
          </div>
        )}

        {/* Bell dropdown */}
        <BellDropdown notifications={notifications} unreadCount={unreadCount} onMarkAll={markAllRead} />

        {/* Live status badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF8ED] dark:bg-[#34C759]/20 border border-[#34C759]/30 text-[#28A745]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] dot-pulse" />
          <span className="text-[11px] font-bold">Live Sync</span>
        </div>

        {/* Admin Profile Dropdown */}
        <AdminUserMenu />
      </div>
    </header>
  );
};

// ── Main Dashboard Layout ─────────────────────────────────────────────────────
function DashboardLayout() {
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const location = useLocation();
  const { open: cmdOpen, setOpen: setCmdOpen, onClose: onCmdClose } = useCommandPalette();

  // Keyboard shortcut listener for Voice Assistant (⌘J / Ctrl+J)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setVoiceOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0B0B0E] relative flex transition-colors duration-300">
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
          onOpenVoice={() => setVoiceOpen(true)}
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
      <VoiceAssistant isOpen={voiceOpen} onClose={() => setVoiceOpen(false)} />
    </div>
  );
}

// ── Public Login Route Guard (redirects if already logged in) ─────────────────
const LoginRoute = () => {
  const { isAuthenticated, isAuthLoading } = useAuth();
  if (!isAuthLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Login />;
};

// ── Root App Component ────────────────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <NotificationProvider>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<LoginRoute />} />

              {/* Protected Store Dashboard Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </NotificationProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
