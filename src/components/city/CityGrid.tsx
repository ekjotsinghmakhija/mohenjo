"use client";

import React, { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useUser } from "@clerk/nextjs";
import FactionPicker from "./FactionPicker";
import DefectModal from "./DefectModal";

const GRID_SIZE = 30;

export default function CityGrid() {
  const { user } = useUser();
  const buildings = useQuery(api.buildings.getAll) || [];
  const placeBuilding = useMutation(api.buildings.placeBuilding);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { faction, theme } = useTheme();

  const [showDefectModal, setShowDefectModal] = useState(false);

  // Camera & Interaction State
  const camera = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Lightweight "Block Characters" State
  const agents = useRef<Array<{x: number, y: number, tx: number, ty: number, progress: number}>>([]);

  useEffect(() => {
    if (faction === "unassigned") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    // Generate random agents based on building count
    if (agents.current.length === 0 && buildings.length > 0) {
      for(let i=0; i < Math.min(buildings.length * 2, 50); i++) {
        const start = buildings[Math.floor(Math.random() * buildings.length)];
        const end = buildings[Math.floor(Math.random() * buildings.length)];
        agents.current.push({ x: start.q, y: start.r, tx: end.q, ty: end.r, progress: Math.random() });
      }
    }

    const render = () => {
      // 1. Fullscreen Canvas Setup
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (canvas.width !== width * dpr) canvas.width = width * dpr;
      if (canvas.height !== height * dpr) canvas.height = height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clear Void
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#020202";
      ctx.fillRect(0, 0, width, height);

      const TILE_W = 80;
      const TILE_H = 40;
      const offsetX = width / 2;
      const offsetY = height / 4;

      const toIso = (q: number, r: number, z: number = 0) => ({
        px: (q - r) * (TILE_W / 2) + offsetX + camera.current.x,
        py: (q + r) * (TILE_H / 2) + offsetY + camera.current.y - z
      });

      // 2. Draw Floor Grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let q = 0; q < GRID_SIZE; q++) {
        for (let r = 0; r < GRID_SIZE; r++) {
          const p1 = toIso(q, r); const p2 = toIso(q + 1, r);
          const p3 = toIso(q + 1, r + 1); const p4 = toIso(q, r + 1);
          ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py);
          ctx.lineTo(p3.px, p3.py); ctx.lineTo(p4.px, p4.py); ctx.closePath(); ctx.stroke();
        }
      }

      // 3. Draw Buildings
      const sortedBuildings = [...buildings].sort((a, b) => (a.q + a.r) - (b.q + b.r));
      sortedBuildings.forEach((b: any) => {
        const h = b.level * 25;
        const c = toIso(b.q, b.r, 0);

        // Faction Colors
        const color = b.faction === "architect_empire" ? "245, 158, 11" :
                      b.faction === "void_syndicate" ? "16, 185, 129" : "6, 182, 212";

        ctx.fillStyle = `rgba(${color}, 0.15)`;
        ctx.strokeStyle = `rgba(${color}, 0.8)`;
        ctx.lineWidth = 1.5;

        // Draw simple 3D Block
        ctx.beginPath();
        ctx.moveTo(c.px, c.py);
        ctx.lineTo(c.px - TILE_W/2, c.py - TILE_H/2);
        ctx.lineTo(c.px - TILE_W/2, c.py - TILE_H/2 - h);
        ctx.lineTo(c.px, c.py - h);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(c.px, c.py);
        ctx.lineTo(c.px + TILE_W/2, c.py - TILE_H/2);
        ctx.lineTo(c.px + TILE_W/2, c.py - TILE_H/2 - h);
        ctx.lineTo(c.px, c.py - h);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Roof
        ctx.fillStyle = `rgba(${color}, 0.3)`;
        ctx.beginPath();
        ctx.moveTo(c.px, c.py - h);
        ctx.lineTo(c.px - TILE_W/2, c.py - TILE_H/2 - h);
        ctx.lineTo(c.px, c.py - TILE_H - h);
        ctx.lineTo(c.px + TILE_W/2, c.py - TILE_H/2 - h);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });

      // 4. Draw Block Characters (Agents)
      ctx.globalCompositeOperation = "screen";
      agents.current.forEach(a => {
        a.progress += 0.01; // Movement speed
        if (a.progress >= 1) {
           a.progress = 0;
           a.x = a.tx; a.y = a.ty;
           const next = buildings[Math.floor(Math.random() * buildings.length)];
           if(next) { a.tx = next.q; a.ty = next.r; }
        }

        // Interpolate position
        const currentQ = a.x + (a.tx - a.x) * a.progress;
        const currentR = a.y + (a.ty - a.y) * a.progress;
        const pos = toIso(currentQ, currentR, 5); // Float slightly above ground

        // Draw a glowing data block
        ctx.shadowBlur = 10; ctx.shadowColor = theme.primary;
        ctx.fillStyle = `rgb(${theme.primary})`;
        ctx.fillRect(pos.px - 3, pos.py - 3, 6, 6);
        ctx.shadowBlur = 0;
      });
      ctx.globalCompositeOperation = "source-over";

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Camera Drag Handlers
    const handleMouseDown = (e: MouseEvent) => { isDragging.current = true; hasDragged.current = false; lastMouse.current = { x: e.clientX, y: e.clientY }; };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      hasDragged.current = true;
      camera.current.x += e.clientX - lastMouse.current.x; camera.current.y += e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => { isDragging.current = false; };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", render); // Handle window resize

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", render);
    };
  }, [buildings, faction, theme]);

  if (faction === "unassigned") return <FactionPicker />;

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair block bg-black" />

      {/* --- HUD OVERLAYS --- */}

      {/* Top Right: Economy / Resources */}
      <div className="absolute top-6 right-6 flex gap-3 pointer-events-auto z-40">
        <div className="bg-black/80 backdrop-blur-md border border-amber-900/50 px-4 py-2 rounded-lg flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-600 shadow-[0_0_10px_#d97706]" />
          <span className="font-mono text-amber-500 font-bold tracking-widest">1,200 BRONZE</span>
        </div>
        <div className="bg-black/80 backdrop-blur-md border border-neutral-700 px-4 py-2 rounded-lg flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neutral-400 shadow-[0_0_10px_#9ca3af]" />
          <span className="font-mono text-neutral-300 font-bold tracking-widest">45 SILVER</span>
        </div>
      </div>

      {/* Top Left: Profile & Defection */}
      <div className="absolute top-6 left-6 z-40 pointer-events-auto">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-12 h-12 rounded-full bg-neutral-800 overflow-hidden border-2 border-cyan-500">
                <img src={user?.imageUrl} alt="Avatar" className="w-full h-full object-cover"/>
             </div>
             <div>
                <div className="text-white font-bold text-lg leading-tight">{user?.username || "Commander"}</div>
                <div className="text-cyan-400 text-xs font-mono tracking-widest uppercase">{faction?.replace("_", " ")}</div>
             </div>
          </div>

          <button
            onClick={() => setShowDefectModal(true)}
            className="w-full py-2 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 rounded text-red-500 text-xs font-mono transition-colors"
          >
            INITIATE DEFECTION
          </button>
        </div>
      </div>

      {/* Bottom Center: Build Action Bar (Clash of Clans style) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex gap-4">
        <button className="flex flex-col items-center bg-black/90 border border-amber-500/50 hover:border-amber-500 rounded-xl p-4 transition-all hover:-translate-y-2">
           <div className="w-12 h-12 bg-amber-900/30 rounded mb-2 border border-amber-500/30 flex items-center justify-center">🏛️</div>
           <span className="text-white font-bold text-sm">Construct</span>
           <span className="text-amber-500 text-xs font-mono mt-1">-10 Bronze</span>
        </button>

        <button className="flex flex-col items-center bg-black/90 border border-cyan-500/50 hover:border-cyan-500 rounded-xl p-4 transition-all hover:-translate-y-2 opacity-50 cursor-not-allowed">
           <div className="w-12 h-12 bg-cyan-900/30 rounded mb-2 border border-cyan-500/30 flex items-center justify-center">⬆️</div>
           <span className="text-white font-bold text-sm">Upgrade</span>
           <span className="text-cyan-500 text-xs font-mono mt-1">Select Node</span>
        </button>

        <button className="flex flex-col items-center bg-black/90 border border-red-500/50 hover:border-red-500 rounded-xl p-4 transition-all hover:-translate-y-2 opacity-50 cursor-not-allowed">
           <div className="w-12 h-12 bg-red-900/30 rounded mb-2 border border-red-500/30 flex items-center justify-center">⚔️</div>
           <span className="text-white font-bold text-sm">Attack</span>
           <span className="text-red-500 text-xs font-mono mt-1">Requires Clan</span>
        </button>
      </div>

      {/* Modals */}
      {showDefectModal && <DefectModal onClose={() => setShowDefectModal(false)} />}
    </div>
  );
}
