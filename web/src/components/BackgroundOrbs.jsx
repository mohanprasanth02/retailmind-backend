import React from "react";

/**
 * BackgroundOrbs — animated floating gradient blobs that give the
 * app a premium "alive" feeling. Fixed behind all content, z-index 0.
 */
const BackgroundOrbs = () => (
  <div
    aria-hidden="true"
    style={{
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      overflow: "hidden",
      zIndex: 0,
    }}
  >
    {/* Large blue orb — top-left, slow drift */}
    <div className="bg-orb bg-orb-1" />
    {/* Violet orb — top-right */}
    <div className="bg-orb bg-orb-2" />
    {/* Emerald orb — bottom-center */}
    <div className="bg-orb bg-orb-3" />
    {/* Amber micro-orb — mid-right */}
    <div className="bg-orb bg-orb-4" />
    {/* Rose micro-orb — bottom-left */}
    <div className="bg-orb bg-orb-5" />

    {/* Subtle dot-grid overlay */}
    <div className="bg-dot-grid" />
  </div>
);

export default BackgroundOrbs;
