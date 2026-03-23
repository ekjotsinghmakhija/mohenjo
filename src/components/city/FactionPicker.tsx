"use client";

import React from "react";
import { useSyncUser } from "@/hooks/useSyncUser";

export default function FactionPicker() {
  const { setFaction } = useSyncUser();

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <h2 className="text-4xl font-bold tracking-tight text-white mb-2">Choose Your Alignment</h2>
      <p className="text-neutral-400 mb-12 max-w-lg text-center">
        Your faction determines the architectural style of your grid and your side in the global conflict.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {/* VANGUARD */}
        <button
          onClick={() => setFaction("vanguard")}
          className="group relative flex flex-col items-center p-8 border border-cyan-900/50 bg-black/50 rounded-xl hover:border-cyan-500 transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-2xl font-bold text-cyan-400 mb-2">Vanguard</h3>
          <p className="text-sm text-cyan-900 mb-4 font-mono">HOLOGRAPHIC // TECH // NEON</p>
          <p className="text-neutral-400 text-sm text-center">Construct glowing data-prisms. Architects of the digital frontier.</p>
        </button>

        {/* SYNDICATE */}
        <button
          onClick={() => setFaction("syndicate")}
          className="group relative flex flex-col items-center p-8 border border-red-900/50 bg-black/50 rounded-xl hover:border-red-500 transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-2xl font-bold text-red-500 mb-2">Syndicate</h3>
          <p className="text-sm text-red-900 mb-4 font-mono">MONOLITHIC // NOIR // SHADOW</p>
          <p className="text-neutral-400 text-sm text-center">Forge dark brutalist towers. Rulers of the subterranean grid.</p>
        </button>

        {/* CELESTIAL */}
        <button
          onClick={() => setFaction("celestial")}
          className="group relative flex flex-col items-center p-8 border border-white/20 bg-black/50 rounded-xl hover:border-white transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-2xl font-bold text-white mb-2">Celestial</h3>
          <p className="text-sm text-neutral-500 mb-4 font-mono">PRISTINE // LIGHT // GOLD</p>
          <p className="text-neutral-400 text-sm text-center">Build flawless gleaming spires. The elite utopian engineers.</p>
        </button>
      </div>
    </div>
  );
}
