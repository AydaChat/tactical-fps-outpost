'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';

export const SniperScope: React.FC = () => {
  const { isAiming, currentWeaponId, isDead } = useGameStore();

  const isVisible = isAiming && currentWeaponId === 'SR-99' && !isDead;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-25 overflow-hidden font-mono flex items-center justify-center animate-in fade-in duration-100">
      {/* 1. Peripheral Heavy Blackout / Scope Outer Vignette */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />

      {/* 2. Scope Optic Lens Aperture (Circular view) */}
      <div
        className="relative w-[75vh] h-[75vh] max-w-[680px] max-h-[680px] rounded-full border-[6px] border-[#181f2c] shadow-[inset_0_0_60px_rgba(0,0,0,0.9),0_0_0_9999px_rgba(3,5,8,0.97)] overflow-hidden flex items-center justify-center bg-transparent"
      >
        {/* Subtle Glass Tint & Lens Flare Ring */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 pointer-events-none" />
        <div className="absolute inset-3 rounded-full border border-gray-800/40 pointer-events-none" />

        {/* Tactical Crosshair: Full Length Horizontal Line */}
        <div className="absolute w-full h-[1px] bg-red-600/70" />

        {/* Tactical Crosshair: Full Length Vertical Line */}
        <div className="absolute h-full w-[1px] bg-red-600/70" />

        {/* Center Precise Red Dot */}
        <div className="absolute w-1 h-1 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />

        {/* Mil-Dot Hashmarks on Vertical Line (Elevation Drop 100m - 500m) */}
        {[-80, -60, -40, -20, 20, 40, 60, 80, 100, 120].map((offset) => (
          <div
            key={offset}
            className="absolute w-2.5 h-[1px] bg-red-500/80"
            style={{ top: `calc(50% + ${offset}px)` }}
          />
        ))}

        {/* Windage Hashmarks on Horizontal Line */}
        {[-120, -100, -80, -60, -40, -20, 20, 40, 60, 80, 100, 120].map((offset) => (
          <div
            key={offset}
            className="absolute h-2.5 w-[1px] bg-red-500/80"
            style={{ left: `calc(50% + ${offset}px)` }}
          />
        ))}

        {/* Corner Reticle Arcs / Framing */}
        <div className="absolute top-12 left-12 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50" />
        <div className="absolute top-12 right-12 w-8 h-8 border-t-2 border-r-2 border-cyan-400/50" />
        <div className="absolute bottom-12 left-12 w-8 h-8 border-b-2 border-l-2 border-cyan-400/50" />
        <div className="absolute bottom-12 right-12 w-8 h-8 border-b-2 border-r-2 border-cyan-400/50" />

        {/* Scope Telemetry Overlay */}
        <div className="absolute top-16 text-[10px] tracking-widest text-cyan-400/80 font-bold uppercase">
          SR-99 SPECTRE • 8.0x DIGITAL OPTIC
        </div>

        <div className="absolute bottom-16 flex items-center gap-8 text-[9px] text-gray-400 font-mono tracking-wider">
          <span>ZERO: 200M</span>
          <span className="text-emerald-400 font-bold">READY</span>
          <span>CALIBER: 12.7MM</span>
        </div>
      </div>
    </div>
  );
};
