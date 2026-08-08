import { useEffect } from "react";
import confetti from "canvas-confetti";

// ── Confetti trigger helpers ──────────────────────────────────────────────────

/**
 * Fire a burst of confetti — call this when an order is completed.
 */
export function fireOrderConfetti() {
  const duration = 1800;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#34d399", "#60a5fa", "#a78bfa", "#fbbf24", "#fb7185"],
      gravity: 0.8,
      scalar: 0.9,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#34d399", "#60a5fa", "#a78bfa", "#fbbf24", "#fb7185"],
      gravity: 0.8,
      scalar: 0.9,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

/**
 * Subtle success burst — for save settings / add product
 */
export function fireSuccessBurst(originX = 0.5, originY = 0.6) {
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { x: originX, y: originY },
    colors: ["#34d399", "#60a5fa", "#ffffff"],
    gravity: 1.0,
    scalar: 0.8,
    ticks: 120,
  });
}

/**
 * Animated SVG checkmark that draws itself.
 * Usage: <AnimatedCheckmark size={48} color="#34d399" />
 */
export const AnimatedCheckmark = ({ size = 40, color = "#34d399", style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 52 52"
    style={{ display: "block", ...style }}
  >
    <circle
      cx="26"
      cy="26"
      r="24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      opacity="0.3"
    />
    <path
      fill="none"
      stroke={color}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 27 L22 35 L38 19"
      style={{
        strokeDasharray: 36,
        strokeDashoffset: 36,
        animation: "checkDraw 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards",
      }}
    />
  </svg>
);

/**
 * Typewriter text effect — streams text character by character.
 * Usage: <TypewriterText text="Hello, world!" speed={35} />
 */
import React, { useState, useEffect as useEff } from "react";

export const TypewriterText = ({ text = "", speed = 30, onDone, style = {} }) => {
  const [displayed, setDisplayed] = useState("");
  const [cursor, setCursor] = useState(true);

  useEff(() => {
    setDisplayed("");
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(iv);
        if (onDone) onDone();
        // Hide cursor after done
        setTimeout(() => setCursor(false), 800);
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  return (
    <span style={style}>
      {displayed}
      {cursor && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: "1em",
            background: "currentColor",
            marginLeft: 2,
            verticalAlign: "text-bottom",
            animation: "cursorBlink 0.8s step-end infinite",
          }}
        />
      )}
    </span>
  );
};

/**
 * Card flip-in animation wrapper — wraps any card with a 3D flip entrance.
 * Usage: <FlipIn delay={0.1}><YourCard /></FlipIn>
 */
import { motion } from "framer-motion";

export const FlipIn = ({ children, delay = 0, style = {} }) => (
  <motion.div
    initial={{ rotateY: 90, opacity: 0, scale: 0.95 }}
    animate={{ rotateY: 0, opacity: 1, scale: 1 }}
    transition={{
      type: "spring",
      stiffness: 200,
      damping: 20,
      delay,
    }}
    style={{ transformPerspective: 800, ...style }}
  >
    {children}
  </motion.div>
);

/**
 * Success Toast — a beautiful animated success notification.
 * Fires confetti automatically when shown.
 */
export const SuccessToast = ({ message = "Success!", onClose, autoClose = 3000 }) => {
  useEffect(() => {
    fireSuccessBurst(0.8, 0.9);
    if (autoClose && onClose) {
      const t = setTimeout(onClose, autoClose);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      style={{
        position: "fixed",
        bottom: 100,
        right: 32,
        zIndex: 9500,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 20px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(52,199,89,0.3)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(52,199,89,0.1)",
        backdropFilter: "blur(20px)",
        maxWidth: 340,
      }}
    >
      <AnimatedCheckmark size={28} color="#34d399" />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
          {message}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 4, color: "rgba(255,255,255,0.3)",
          }}
        >✕</button>
      )}
    </motion.div>
  );
};
