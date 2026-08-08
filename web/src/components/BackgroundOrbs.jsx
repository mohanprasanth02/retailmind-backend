import React from "react";

/**
 * Ultra-clean ambient background for Light Enterprise Theme.
 */
const BackgroundOrbs = () => (
  <div
    aria-hidden="true"
    className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    style={{ transform: "translateZ(0)" }}
  >
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(circle at 10% 0%, rgba(79, 70, 229, 0.025) 0%, transparent 60%), radial-gradient(circle at 90% 100%, rgba(16, 185, 129, 0.025) 0%, transparent 60%)",
      }}
    />
  </div>
);

export default BackgroundOrbs;
