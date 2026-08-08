import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "./config";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

// ── Layout Components ─────────────────────────────────────────────────────────
import Sidebar    from "./components/Sidebar";
import { NotificationProvider, BellDropdown, useNotifications } from "./components/NotificationSystem";
import BackgroundOrbs  from "./components/BackgroundOrbs";
import CommandPalette, { useCommandPalette } from "./components/CommandPalette";
import QuickActions    from "./components/QuickActions";

// ── Pages ─────────────────────────────────────────────────────────────────────
import Dashboard   from "./pages/Dashboard";
import Orders      from "./pages/Orders";
import Inventory   from "./pages/Inventory";
import Products    from "./pages/Products";
import Customers   from "./pages/Customers";
import Invoices    from "./pages/Invoices";
import AIAssistant from "./pages/AIAssistant";
import Reports     from "./pages/Reports";
import Settings    from "./pages/Settings";
import Analytics   from "./pages/Analytics";
import Channels    from "./pages/Channels";

// ── Page meta ─────────────────────────────────────────────────────────────────
const PAGE_META = {
  "/":             { title: "Dashboard",        subtitle: "Live retail operations overview" },
  "/orders":       { title: "Orders",           subtitle: "Incoming AI-parsed platform orders" },
  "/inventory":    { title: "Inventory",        subtitle: "Stock management & supplier data" },
  "/products":     { title: "Products",         subtitle: "Product catalog & pricing" },
  "/customers":    { title: "Customers",        subtitle: "Customer directory & transaction history" },
  "/invoices":     { title: "Invoices",         subtitle: "Download & manage PDF invoices" },
  "/ai-assistant": { title: "AI Assistant",     subtitle: "Natural language business queries" },
  "/reports":      { title: "Reports",          subtitle: "Operations analytics & exports" },
  "/analytics":    { title: "Analytics",        subtitle: "Revenue trends & product performance" },
  "/channels":     { title: "Sales Channels",   subtitle: "WhatsApp, Instagram, Website & Email" },
  "/settings":     { title: "Settings",         subtitle: "Store configuration & integrations" },
};

// ── Page transition variants ──────────────────────────────────────────────────
const pageVariants = {
  initial:  { opacity: 0, y: 12, filter: "blur(2px)" },
  animate:  { opacity: 1, y: 0,  filter: "blur(0px)", transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:     { opacity: 0, y: -8, filter: "blur(1px)", transition: { duration: 0.18, ease: "easeIn" } },
};

// ── Animated Page Wrapper ─────────────────────────────────────────────────────
const PageWrapper = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{ minHeight: "100%" }}
  >
    {children}
  </motion.div>
);

// ── Top Header ────────────────────────────────────────────────────────────────
const TopHeader = ({ pendingCount, onCmdOpen }) => {
  const location = useLocation();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const page = PAGE_META[location.pathname] || { title: "RetailMind", subtitle: "" };

  return (
    <div
      className="flex items-center justify-between px-8 py-4 flex-shrink-0"
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(5,5,7,0.7)",
        backdropFilter: "blur(16px)",
        position: "sticky", top: 0, zIndex: 30,
      }}
    >
      {/* Page title */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>
          {page.title}
        </h2>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, marginBottom: 0 }}>{page.subtitle}</p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* ⌘K button */}
        <button
          onClick={onCmdOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-muted)", fontSize: 12,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <span>Search or navigate</span>
          <div className="flex items-center gap-1">
            <kbd style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>Ctrl</kbd>
            <kbd style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>K</kbd>
          </div>
        </button>

        {/* Pending pill */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#fbbf24" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24" }}>
              {pendingCount} pending
            </span>
          </div>
        )}

        {/* Bell */}
        <BellDropdown notifications={notifications} unreadCount={unreadCount} onMarkAll={markAllRead} />

        {/* Live dot */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <span className="w-1.5 h-1.5 rounded-full dot-pulse" style={{ background: "#34d399" }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: "#34d399" }}>Live</span>
        </div>
      </div>
    </div>
  );
};

// ── Main App Inner ────────────────────────────────────────────────────────────
function AppInner() {
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();
  const { open: cmdOpen, setOpen: setCmdOpen, onClose: onCmdClose } = useCommandPalette();

  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, "orders"), where("status", "==", "Pending"));
      const unsub = onSnapshot(q, s => setPendingCount(s.size), () => {});
      return unsub;
    } else {
      const poll = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/orders`);
          if (res.ok) setPendingCount((await res.json()).filter(o => o.status === "Pending").length);
        } catch {}
      };
      poll();
      const iv = setInterval(poll, 3000);
      return () => clearInterval(iv);
    }
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)", position: "relative" }}>
      {/* Feature 1: Animated background orbs */}
      <BackgroundOrbs />

      {/* Sidebar */}
      <Sidebar pendingOrdersCount={pendingCount} unreadNotifsCount={0} />

      {/* Right panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", marginLeft: 240, position: "relative", zIndex: 1 }}>
        <TopHeader pendingCount={pendingCount} onCmdOpen={() => setCmdOpen(true)} />

        {/* Feature 4: Page transitions with AnimatePresence */}
        <main style={{ flex: 1, padding: "32px 36px", position: "relative" }}>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/"             element={<PageWrapper><Dashboard /></PageWrapper>} />
              <Route path="/orders"       element={<PageWrapper><Orders /></PageWrapper>} />
              <Route path="/inventory"    element={<PageWrapper><Inventory /></PageWrapper>} />
              <Route path="/products"     element={<PageWrapper><Products /></PageWrapper>} />
              <Route path="/customers"    element={<PageWrapper><Customers /></PageWrapper>} />
              <Route path="/invoices"     element={<PageWrapper><Invoices /></PageWrapper>} />
              <Route path="/ai-assistant" element={<PageWrapper><AIAssistant /></PageWrapper>} />
              <Route path="/reports"      element={<PageWrapper><Reports /></PageWrapper>} />
              <Route path="/analytics"    element={<PageWrapper><Analytics /></PageWrapper>} />
              <Route path="/channels"     element={<PageWrapper><Channels /></PageWrapper>} />
              <Route path="/settings"     element={<PageWrapper><Settings /></PageWrapper>} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      {/* Feature 3: Ctrl+K Command Palette */}
      <CommandPalette open={cmdOpen} onClose={onCmdClose} />

      {/* Feature 5: Floating Action Button */}
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
