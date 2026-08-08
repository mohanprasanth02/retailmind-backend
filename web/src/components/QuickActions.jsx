import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, X, ShoppingBag, Package, BarChart3, Bot, TrendingUp } from "lucide-react";

const ACTIONS = [
  { label: "New Order",    icon: ShoppingBag, path: "/orders",    color: "#fbbf24", angle: 270 },
  { label: "Add Product",  icon: Package,     path: "/products",  color: "#34d399", angle: 225 },
  { label: "Analytics",   icon: TrendingUp,  path: "/analytics", color: "#60a5fa", angle: 315 },
  { label: "Ask AI",       icon: Bot,         path: "/ai-assistant", color: "#f59e0b", angle: 180 },
];

const QuickActions = () => {
  const [open, setOpen]  = useState(false);
  const navigate         = useNavigate();

  const handleAction = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      {/* Backdrop to close */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 890 }}
          />
        )}
      </AnimatePresence>

      {/* FAB container */}
      <div style={{ position: "fixed", bottom: 32, right: 32, zIndex: 900 }}>
        {/* Action buttons — radial expand */}
        <AnimatePresence>
          {open && ACTIONS.map((action, i) => {
            const Icon = action.icon;
            // Calculate position: spread above and to the left
            const positions = [
              { x: 0,   y: -70 },   // up
              { x: -70, y: 0  },   // left
              { x: -50, y: -50 },  // up-left
              { x: 0,   y: -140 }, // up-far
            ];
            const pos = positions[i] || { x: 0, y: -(70 * (i + 1)) };

            return (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
                exit={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28, delay: i * 0.055 }}
                style={{ position: "absolute", bottom: 0, right: 0 }}
              >
                {/* Tooltip label */}
                <motion.div
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.055 }}
                  style={{
                    position: "absolute", right: 54, top: "50%", transform: "translateY(-50%)",
                    whiteSpace: "nowrap", background: "rgba(10,10,14,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                    padding: "4px 10px", fontSize: 11, fontWeight: 600,
                    color: "var(--text-primary)", backdropFilter: "blur(12px)",
                    pointerEvents: "none",
                  }}
                >
                  {action.label}
                </motion.div>

                {/* Action button */}
                <button
                  onClick={() => handleAction(action.path)}
                  style={{
                    width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${action.color}18`,
                    border: `1.5px solid ${action.color}40`,
                    backdropFilter: "blur(12px)",
                    boxShadow: `0 4px 20px ${action.color}25`,
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "scale(1.12)";
                    e.currentTarget.style.boxShadow = `0 6px 28px ${action.color}40`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = `0 4px 20px ${action.color}25`;
                  }}
                >
                  <Icon size={18} style={{ color: action.color }} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          onClick={() => setOpen(p => !p)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: 54, height: 54, borderRadius: "50%",
            background: open
              ? "rgba(251,113,133,0.15)"
              : "rgba(255,255,255,0.08)",
            border: open
              ? "1.5px solid rgba(251,113,133,0.4)"
              : "1.5px solid rgba(255,255,255,0.15)",
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(16px)",
            boxShadow: open
              ? "0 8px 32px rgba(251,113,133,0.25), 0 0 0 8px rgba(251,113,133,0.05)"
              : "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
            transition: "all 0.25s",
            position: "relative", zIndex: 2,
          }}
        >
          <motion.div
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {open
              ? <X size={20} style={{ color: "#fb7185" }} />
              : <Plus size={22} style={{ color: "var(--text-primary)" }} />
            }
          </motion.div>

          {/* Pulse ring when closed */}
          {!open && (
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
              style={{
                position: "absolute", inset: -3, borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.15)", pointerEvents: "none",
              }}
            />
          )}
        </motion.button>
      </div>
    </>
  );
};

export default QuickActions;
