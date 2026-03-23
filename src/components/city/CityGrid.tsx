"use client";

import React, { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useUser } from "@clerk/nextjs";
import FactionPicker from "./FactionPicker";
import DefectModal from "./DefectModal";

const GRID_SIZE = 30;

// Type definition for our animated worker blocks
interface Agent {
  x: number;
  y: number;
  tx: number;
  ty: number;
  progress: number;
}

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
  const agents = useRef<Agent[]>([]);

  useEffect(() => {
    if (faction === "unassigned") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    // Filter to ensure we only use valid Hex buildings for agent routing
    const validBuildings = buildings.filter(b => b.q !== undefined && b.r !== undefined);

    // Initialize "Worker" Agents
    if (agents.current.length === 0 && validBuildings.length > 1) {
      for(let i=0; i < Math.min(validBuildings.length * 2, 50); i++) {
        const start = validBuildings[Math.floor(Math.random() * validBuildings.length)];
        const end = validBuildings[Math.floor(Math.random() * validBuildings.length)];

        // FIX: TypeScript safety fallback for optional fields
        agents.current.push({
          x: start.q ?? 0,
          y: start.r ?? 0,
          tx: end.q ?? 0,
          ty: end.r ?? 0,
          progress: Math.random()
        });
      }
    }

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (canvas.width !== width * dpr) canvas.width = width * dpr;
      if (canvas.height !== height * dpr) canvas.height = height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Deep Void Background
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

      // 1. Draw Grid Floor
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

      // 2. Draw Buildings (Painter's Algorithm)
      // Safe sorting ensuring undefineds are handled
      const sortedBuildings = [...validBuildings].sort((a, b) => ((a.q ?? 0) + (a.r ?? 0)) - ((b.q ?? 0) + (b.r ?? 0)));

      sortedBuildings.forEach((b) => {
        const h = b.level * 25;
        const c = toIso(b.q ?? 0, b.r ?? 0, 0);

        const color = b.faction === "architect_empire" ? "245, 158, 11" :
                      b.faction === "void_syndicate" ? "16, 185, 129" : "6, 182, 212";

        ctx.fillStyle = `rgba(${color}, 0.15)`;
        ctx.strokeStyle = `rgba(${color}, 0.8)`;
        ctx.lineWidth = 1.5;

        // Draw 3D Prisms
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

        ctx.fillStyle = `rgba(${color}, 0.3)`;
        ctx.beginPath();
        ctx.moveTo(c.px, c.py - h);
        ctx.lineTo(c.px - TILE_W/2, c.py - TILE_H/2 - h);
        ctx.lineTo(c.px, c.py - TILE_H - h);
        ctx.lineTo(c.px + TILE_W/2, c.py - TILE_H/2 - h);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });

      // 3. Draw Moving Agents (Workers)
      ctx.globalCompositeOperation = "screen";
      agents.current.forEach(a => {
        a.progress += 0.005; // Smooth speed
        if (a.progress >= 1) {
           a.progress = 0;
           a.x = a.tx; a.y = a.ty;
           if (validBuildings.length > 0) {
             const next = validBuildings[Math.floor(Math.random() * validBuildings.length)];
             a.tx = next.q ?? 0; a.ty = next.r ?? 0;
           }
        }

        const currentQ = a.x + (a.tx - a.x) * a.progress;
        const currentR = a.y + (a.ty - a.y) * a.progress;
        const pos = toIso(currentQ, currentR, 5);

        ctx.shadowBlur = 10; ctx.shadowColor = theme.primary;
        ctx.fillStyle = `rgb(${theme.primary})`;
        ctx.fillRect(pos.px - 3, pos.py - 3, 6, 6);
        ctx.shadowBlur = 0;
      });
      ctx.globalCompositeOperation = "source-over";

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Event Listeners for Camera
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
    window.addEventListener("resize", render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", render);
    };
  }, [buildings, faction, theme]);

  const handleCanvasClick = async (e: React.MouseEvent) => {
    if (hasDragged.current || !user) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const TILE_W = 80; const TILE_H = 40;
    const offsetX = rect.width / 2; const offsetY = rect.height / 4;

    const adjX = clickX - offsetX - camera.current.x;
    const adjY = clickY - offsetY - camera.current.y;

    const gridY = (adjY / (TILE_H / 2) - adjX / (TILE_W / 2)) / 2;
    const gridX = (adjY / (TILE_H / 2) + adjX / (TILE_W / 2)) / 2;

    const gx = Math.floor(gridX);
    const gy = Math.floor(gridY);

    if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
      try {
        await placeBuilding({ externalId: user.id, q: gx, r: gy });
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  if (faction === "unassigned") return <FactionPicker />;

  return (
    <div className="w-full h-full relative overflow-hidden font-sans">
      {/* VFX Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.9)_100%)] z-10" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] z-10 opacity-50" />

      {/* Engine Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair block bg-[#050505] active:cursor-grabbing"
      />

      {/* -------------------- HEADS UP DISPLAY (HUD) -------------------- */}

      {/* TOP LEFT: Profile & XP Bar */}
      <div className="absolute top-6 left-6 z-40 pointer-events-auto w-80">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-14 h-14 rounded-full bg-neutral-800 overflow-hidden border border-white/20 shrink-0">
                <img src={user?.imageUrl} alt="Avatar" className="w-full h-full object-cover"/>
             </div>
             <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-lg leading-tight truncate">{user?.username || "Commander"}</div>
                <div className="text-xs font-mono tracking-widest uppercase" style={{ color: `rgb(${theme.primary})` }}>
                  {faction?.replace("_", " ")}
                </div>
             </div>
             <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold font-mono">
               12
             </div>
          </div>

          {/* XP Bar */}
          <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden border border-white/5 relative mb-4">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 w-[65%]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4px_100%]" />
          </div>

          <button
            onClick={() => setShowDefectModal(true)}
            className="w-full py-2 bg-black/50 hover:bg-red-950/40 border border-white/5 hover:border-red-900/50 rounded-lg text-neutral-400 hover:text-red-400 text-xs font-mono transition-colors"
          >
            INITIATE DEFECTION
          </button>
        </div>
      </div>

      {/* TOP RIGHT: Economy Dashboard */}
      <div className="absolute top-6 right-6 z-40 pointer-events-auto flex flex-col gap-2 items-end">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-2 rounded-xl flex gap-2 shadow-2xl">
          <div className="px-3 py-1.5 bg-black/50 rounded-lg border border-amber-900/30 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-600 shadow-[0_0_8px_#d97706]" />
            <span className="font-mono text-amber-500 text-sm font-bold">1.2K BRONZE</span>
          </div>
          <div className="px-3 py-1.5 bg-black/50 rounded-lg border border-neutral-700/50 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-400 shadow-[0_0_8px_#9ca3af]" />
            <span className="font-mono text-neutral-300 text-sm font-bold">45 SILVER</span>
          </div>
          <div className="px-3 py-1.5 bg-black/50 rounded-lg border border-yellow-600/30 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
            <span className="font-mono text-yellow-500 text-sm font-bold">12 GOLD</span>
          </div>
        </div>
      </div>

      {/* BOTTOM LEFT: Activity Ticker */}
      <div className="absolute bottom-6 left-6 z-40 pointer-events-none w-96">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl">
          <div className="text-xs font-mono text-neutral-500 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            LIVE NETWORK ACTIVITY
          </div>
          <div className="flex flex-col gap-2 font-mono text-xs overflow-hidden h-24">
            <div className="text-cyan-400">&gt; [VANGUARD] Ekjot synced 42 commits.</div>
            <div className="text-red-400">&gt; [SYNDICATE] UserX claimed Sector 7.</div>
            <div className="text-amber-400">&gt; [ARCHITECT] Foundation laid in Zone Q4.</div>
            <div className="text-neutral-400 opacity-50">&gt; Awaiting network sync...</div>
          </div>
        </div>
      </div>

      {/* BOTTOM CENTER: Action Menu */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex gap-3">
        <button className="group flex flex-col items-center bg-black/60 backdrop-blur-xl border border-white/10 hover:border-amber-500/50 rounded-2xl p-4 transition-all hover:-translate-y-1 shadow-2xl">
           <div className="w-10 h-10 bg-amber-500/10 rounded-xl mb-2 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🏗️</div>
           <span className="text-white font-bold text-sm">Construct</span>
           <span className="text-amber-500 text-[10px] font-mono mt-1 tracking-widest">-10 BRNZ</span>
        </button>

        <button className="group flex flex-col items-center bg-black/60 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 rounded-2xl p-4 transition-all hover:-translate-y-1 shadow-2xl opacity-50 cursor-not-allowed">
           <div className="w-10 h-10 bg-cyan-500/10 rounded-xl mb-2 flex items-center justify-center text-xl">⬆️</div>
           <span className="text-white font-bold text-sm">Upgrade</span>
           <span className="text-cyan-500 text-[10px] font-mono mt-1 tracking-widest">LOCKED</span>
        </button>

        <button className="group flex flex-col items-center bg-black/60 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 rounded-2xl p-4 transition-all hover:-translate-y-1 shadow-2xl opacity-50 cursor-not-allowed">
           <div className="w-10 h-10 bg-purple-500/10 rounded-xl mb-2 flex items-center justify-center text-xl">⚡</div>
           <span className="text-white font-bold text-sm">Wonder</span>
           <span className="text-purple-500 text-[10px] font-mono mt-1 tracking-widest">REQ. DIAMOND</span>
        </button>
      </div>

      {/* Modals */}
      {showDefectModal && <DefectModal onClose={() => setShowDefectModal(false)} />}
    </div>
  );
}
