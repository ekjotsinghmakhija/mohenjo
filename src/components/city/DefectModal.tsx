"use client";

import React from "react";
import { useSyncUser } from "@/hooks/useSyncUser";

export default function DefectModal({ onClose }: { onClose: () => void }) {
  const { setFaction } = useSyncUser();

  const handleDefect = async (newFaction: "architect_empire" | "artisan_republic" | "void_syndicate") => {
    if (confirm("WARNING: Defecting will cost 500 Bronze. Proceed?")) {
      await setFaction(newFaction);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-neutral-900 border border-red-900/50 p-8 rounded-xl max-w-2xl w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white">✕</button>

        <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-widest text-red-500">Defection Protocol</h2>
        <p className="text-neutral-400 mb-8 font-mono text-sm">
          Abandon your current empire. Your existing nodes will fall to ruin.
          Migration tax: <span className="text-amber-500">500 Compute (Bronze)</span>.
        </p>

        <div className="grid grid-cols-3 gap-4">
          <button onClick={() => handleDefect("architect_empire")} className="p-4 border border-amber-900/50 hover:bg-amber-900/20 rounded-lg text-center transition-colors">
            <div className="text-amber-500 font-bold mb-1">Architect</div>
            <div className="text-xs text-neutral-500">North Grid</div>
          </button>
          <button onClick={() => handleDefect("void_syndicate")} className="p-4 border border-green-900/50 hover:bg-green-900/20 rounded-lg text-center transition-colors">
            <div className="text-green-500 font-bold mb-1">Syndicate</div>
            <div className="text-xs text-neutral-500">East Grid</div>
          </button>
          <button onClick={() => handleDefect("artisan_republic")} className="p-4 border border-cyan-900/50 hover:bg-cyan-900/20 rounded-lg text-center transition-colors">
            <div className="text-cyan-500 font-bold mb-1">Artisan</div>
            <div className="text-xs text-neutral-500">West Grid</div>
          </button>
        </div>
      </div>
    </div>
  );
}
