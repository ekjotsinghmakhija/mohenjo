"use client";

import React, { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useUser } from "@clerk/nextjs";
import FactionPicker from "./FactionPicker";

const GRID_SIZE = 30; // Massive 30x30 shared map

// Helper to determine which territory a tile belongs to
const getSector = (x: number, y: number) => {
  if (x < 15 && y < 15) return "vanguard";
  if (x >= 15 && y < 15) return "syndicate";
  return "celestial";
};

// Helper for Faction-specific building styling
const getBuildingStyle = (bFaction: string) => {
  if (bFaction === "vanguard") return { color: "6, 182, 212", glow: true, shadow: "rgb(6, 182, 212)", dark: false };
  if (bFaction === "syndicate") return { color: "220, 38, 38", glow: false, shadow: "rgba(0,0,0,0.8)", dark: true };
  if (bFaction === "celestial") return { color: "255, 255, 255", glow: false, shadow: "rgba(255,255,255,0.2)", dark: false };
  return { color: "115, 115, 115", glow: false, shadow: "transparent", dark: true };
};

export default function CityGrid() {
  const { user } = useUser();
  const buildings = useQuery(api.buildings.getAll) || [];
  const placeBuilding = useMutation(api.buildings.placeBuilding);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { faction } = useTheme();

  // Interactive Camera State
  const camera = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const hasDragged = useRef(false); // Prevents clicking when panning
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (faction === "unassigned") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      // Prevent constant resizing in loop, only set once per render phase
      if (canvas.width !== rect.width * dpr) canvas.width = rect.width * dpr;
      if (canvas.height !== rect.height * dpr) canvas.height = rect.height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset scale
      const width = rect.width;
      const height = rect.height;

      // 1. Clear & Deep Void Background
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, width, height);

      const TILE_W = 60;
      const TILE_H = 30;
      const offsetX = width / 2;
      const offsetY = height / 4;

      const toIso = (x: number, y: number, z: number = 0) => ({
        px: (x - y) * (TILE_W / 2) + offsetX + camera.current.x,
        py: (x + y) * (TILE_H / 2) + offsetY + camera.current.y - z
      });

      // 2. Draw Territory Zoning (The Ground)
      ctx.globalCompositeOperation = "source-over";
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          const sector = getSector(x, y);
          const p1 = toIso(x, y);
          const p2 = toIso(x + 1, y);
          const p3 = toIso(x + 1, y + 1);
          const p4 = toIso(x, y + 1);

          if (sector === "vanguard") { ctx.fillStyle = "rgba(6, 182, 212, 0.05)"; ctx.strokeStyle = "rgba(6, 182, 212, 0.15)"; }
          else if (sector === "syndicate") { ctx.fillStyle = "rgba(220, 38, 38, 0.05)"; ctx.strokeStyle = "rgba(220, 38, 38, 0.15)"; }
          else { ctx.fillStyle = "rgba(255, 255, 255, 0.02)"; ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"; }

          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.lineTo(p3.px, p3.py); ctx.lineTo(p4.px, p4.py);
          ctx.closePath();
          ctx.fill(); ctx.stroke();
        }
      }

      // 3. Draw Buildings (Painter's Algorithm)
      const sortedBuildings = [...buildings].sort((a, b) => (a.x + a.y) - (b.x + b.y));

      sortedBuildings.forEach((b: any) => {
        const h = b.level * 20;
        const c = toIso(b.x, b.y, 0);

        const left = { px: c.px - TILE_W / 2, py: c.py };
        const right = { px: c.px + TILE_W / 2, py: c.py };
        const top = { px: c.px, py: c.py - TILE_H / 2 };
        const bottom = { px: c.px, py: c.py + TILE_H / 2 };

        const style = getBuildingStyle(b.faction);

        if (style.glow) {
          ctx.shadowBlur = 15; ctx.shadowColor = style.shadow; ctx.globalCompositeOperation = "screen";
        } else {
          ctx.shadowBlur = style.dark ? 10 : 0; ctx.shadowOffsetY = style.dark ? 10 : 0;
          ctx.shadowColor = style.shadow; ctx.globalCompositeOperation = "source-over";
        }

        ctx.strokeStyle = style.dark ? "#333" : `rgb(${style.color})`;
        ctx.lineWidth = 1.5;

        const drawFace = (path: any[], fillStyle: string) => {
          ctx.fillStyle = fillStyle;
          ctx.beginPath(); ctx.moveTo(path[0].px, path[0].py);
          for(let i=1; i<path.length; i++) ctx.lineTo(path[i].px, path[i].py);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        };

        // Draw Left, Right, Top Prisms
        drawFace([bottom, left, {px: left.px, py: left.py-h}, {px: bottom.px, py: bottom.py-h}], style.dark ? `rgb(${style.color})` : `rgba(${style.color}, 0.1)`);
        drawFace([bottom, right, {px: right.px, py: right.py-h}, {px: bottom.px, py: bottom.py-h}], style.dark ? `rgba(0,0,0,0.5)` : `rgba(${style.color}, 0.15)`);
        drawFace([left, top, right, bottom].map(p => ({px: p.px, py: p.py-h})), style.dark ? `#222` : `rgba(${style.color}, 0.3)`);

        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; // Reset
      });
    };

    render(); // Initial draw

    // --- INTERACTIVE EVENT LISTENERS ---
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      hasDragged.current = false;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      hasDragged.current = true; // Mark as a drag so we don't accidentally build
      camera.current.x += e.clientX - lastMouse.current.x;
      camera.current.y += e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      render(); // Only re-render when moving!
    };

    const handleMouseUp = () => { isDragging.current = false; };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [buildings, faction]); // Re-render when DB updates

  // --- CLICK TO BUILD LOGIC ---
  const handleCanvasClick = async (e: React.MouseEvent) => {
    if (hasDragged.current || !user) return; // Don't build if we were just panning the map!

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const TILE_W = 60; const TILE_H = 30;
    const offsetX = rect.width / 2; const offsetY = rect.height / 4;

    // Reverse Isometric Math to find which Grid (X, Y) was clicked
    const adjX = clickX - offsetX - camera.current.x;
    const adjY = clickY - offsetY - camera.current.y;

    const gridY = (adjY / (TILE_H / 2) - adjX / (TILE_W / 2)) / 2;
    const gridX = (adjY / (TILE_H / 2) + adjX / (TILE_W / 2)) / 2;

    const gx = Math.floor(gridX);
    const gy = Math.floor(gridY);

    if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
      const tileSector = getSector(gx, gy);

      // GAME MECHANIC: Territory Enforcement
      if (tileSector !== faction) {
        alert(`ACCESS DENIED: You belong to the ${faction?.toUpperCase()} faction. You can only build in your territory!`);
        return;
      }

      try {
        await placeBuilding({ externalId: user.id, x: gx, y: gy });
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  if (faction === "unassigned") return <FactionPicker />;

  return (
    <div className="w-full relative rounded-xl overflow-hidden border border-white/5 shadow-2xl">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] z-10" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)] z-20" />

      {/* The Map Canvas is now Clickable! */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-[700px] cursor-crosshair block active:cursor-grabbing"
      />

      <div className="absolute bottom-6 left-6 z-30 flex flex-col gap-1 pointer-events-none">
        <div className={`text-[10px] font-mono tracking-widest uppercase mb-1 ${faction === 'vanguard' ? 'text-cyan-400' : faction === 'syndicate' ? 'text-red-500' : 'text-white'}`}>
          FACTION: {faction}
        </div>
        <div className="px-3 py-1.5 bg-black/60 border border-white/10 rounded text-xs text-white/70 font-mono backdrop-blur-md">
          GLOBAL_NODES: {buildings.length}
        </div>
        <div className="text-[10px] text-neutral-500 font-mono mt-1">
          Click and drag to pan the map. Click your sector to build.
        </div>
      </div>
    </div>
  );
}
