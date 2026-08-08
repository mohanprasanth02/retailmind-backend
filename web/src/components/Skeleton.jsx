import React from "react";

/**
 * Skeleton — shimmer loading placeholder.
 * Usage: <Skeleton width="100%" height={20} rounded="8px" />
 *        <Skeleton variant="circle" size={40} />
 *        <Skeleton variant="card" />
 */
const Skeleton = ({
  width = "100%",
  height = 16,
  rounded = "8px",
  variant = "rect",   // "rect" | "circle" | "card" | "row" | "table"
  size,               // for circles
  rows = 3,           // for variant="table"
  className = "",
  style = {},
}) => {
  const base = {
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.6s ease-in-out infinite",
    flexShrink: 0,
  };

  if (variant === "circle") {
    const s = size || 40;
    return (
      <div className={`skeleton ${className}`}
        style={{ width: s, height: s, borderRadius: "50%", ...base, ...style }} />
    );
  }

  if (variant === "card") {
    return (
      <div className={`glass-card p-5 space-y-3 ${className}`} style={style}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10, ...base }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: "60%", height: 12, borderRadius: 6, ...base, marginBottom: 6 }} />
            <div className="skeleton" style={{ width: "40%", height: 10, borderRadius: 6, ...base }} />
          </div>
        </div>
        <div className="skeleton" style={{ width: "100%", height: 10, borderRadius: 6, ...base }} />
        <div className="skeleton" style={{ width: "80%", height: 10, borderRadius: 6, ...base }} />
        <div className="skeleton" style={{ width: "90%", height: 10, borderRadius: 6, ...base }} />
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={`glass-card overflow-hidden ${className}`} style={style}>
        {/* Header */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 12 }}>
          {[20, 15, 12, 10, 8].map((w, i) => (
            <div key={i} className="skeleton" style={{ width: `${w}%`, height: 10, borderRadius: 4, ...base }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, ri) => (
          <div key={ri} style={{
            padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)",
            display: "flex", gap: 12, alignItems: "center",
          }}>
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, ...base }} />
            {[25, 15, 12, 10, 8].map((w, i) => (
              <div key={i} className="skeleton" style={{ width: `${w}%`, height: 10, borderRadius: 4, ...base }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div className={`flex items-center gap-3 ${className}`} style={style}>
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10, ...base }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: "55%", height: 11, borderRadius: 5, ...base, marginBottom: 5 }} />
          <div className="skeleton" style={{ width: "35%", height: 9, borderRadius: 5, ...base }} />
        </div>
      </div>
    );
  }

  // Default: rect
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: rounded, ...base, ...style }}
    />
  );
};

export default Skeleton;
