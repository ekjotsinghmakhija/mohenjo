"use client";

import React, { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTheme } from "@/components/theme/ThemeProvider";
import FactionPicker from "./FactionPicker";

export default function CityGrid() {
  const buildings = useQuery(api.buildings.getAll) || [];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { faction, theme } = useTheme();

  useEffect(() => {
    if (faction === "unassigned") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    // 1. Clear & Background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, width, height);

    // 2. Setup Faction Rendering Rules
    if (theme.glowEffect) {
      ctx.globalCompositeOperation = "screen";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }

    // Isometric Constants
    const TILE_W = 60;
    const TILE_H = 30;
    const GRID_SIZE = 15;
    const offsetX = width / 2;
    const offsetY = height / 4;

    const toIso = (x: number, y: number, z: number = 0) => {
      return {
        px: (x - y) * (TILE_W / 2) + offsetX,
        py: (x + y) * (TILE_H / 2) + offsetY - z
      };
    };

    // 3. Draw Grid
    ctx.strokeStyle = theme.gridLine;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      const startX = toIso(i, 0);
      const endX = toIso(i, GRID_SIZE);
      ctx.beginPath(); ctx.moveTo(startX.px, startX.py); ctx.lineTo(endX.px, endX.py); ctx.stroke();

      const startY = toIso(0, i);
      const endY = toIso(GRID_SIZE, i);
      ctx.beginPath(); ctx.moveTo(startY.px, startY.py); ctx.lineTo(endY.px, endY.py); ctx.stroke();
    }

    // 4. Painter's Algorithm
    const sortedBuildings = [...buildings].sort((a, b) => (a.x + a.y) - (b.x + b.y));

    // 5. Draw Buildings
    sortedBuildings.forEach((b) => {
      const h = b.level * 20;
      const c = toIso(b.x, b.y, 0);

      const left = { px: c.px - TILE_W / 2, py: c.py };
      const right = { px: c.px + TILE_W / 2, py: c.py };
      const top = { px: c.px, py: c.py - TILE_H / 2 };
      const bottom = { px: c.px, py: c.py + TILE_H / 2 };

      const color = b.type === "core" ? theme.buildingCore : theme.buildingStandard;

      // Syndicate specific shadow
      if (!theme.glowEffect && faction === "syndicate") {
        ctx.shadowColor = theme.shadowColor;
        ctx.shadowOffsetY = 10;
        ctx.shadowBlur = 10;
      } else if (theme.glowEffect) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgb(${color})`;
      }

      ctx.strokeStyle = faction === "syndicate" ? "#333" : `rgb(${color})`;
      ctx.lineWidth = 1.5;

      // Draw Prisms (Left, Right, Top)
      const drawFace = (path: any[], fillRaw: string) => {
        ctx.fillStyle = fillRaw;
        ctx.beginPath();
        ctx.moveTo(path[0].px, path[0].py);
        for(let i=1; i<path.length; i++) ctx.lineTo(path[i].px, path[i].py);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      // Left Face
      drawFace([bottom, left, {px: left.px, py: left.py-h}, {px: bottom.px, py: bottom.py-h}],
        faction === "syndicate" ? `rgb(${color})` : `rgba(${color}, 0.1)`);

      // Right Face
      drawFace([bottom, right, {px: right.px, py: right.py-h}, {px: bottom.px, py: bottom.py-h}],
        faction === "syndicate" ? `rgba(0,0,0,0.5)` : `rgba(${color}, 0.15)`); // Syndicate shading

      // Top Face
      drawFace([left, top, right, bottom].map(p => ({px: p.px, py: p.py-h})),
        faction === "syndicate" ? `#222` : `rgba(${color}, 0.3)`);

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    });

  }, [buildings, faction, theme]);

  if (faction === "unassigned") return <FactionPicker />;

  return (
    <div className="w-full relative rounded-xl overflow-hidden border border-white/5 shadow-2xl">
      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] z-10" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)] z-20" />

      <canvas ref={canvasRef} className="w-full h-[700px] cursor-crosshair block" />

      <div className="absolute bottom-6 left-6 z-30 flex flex-col gap-1">
        <div className={`text-[10px] font-mono tracking-widest uppercase mb-1`} style={{ color: `rgb(${theme.primary})` }}>
          FACTION: {faction}
        </div>
        <div className="px-3 py-1.5 bg-black/60 border border-white/10 rounded text-xs text-white/70 font-mono backdrop-blur-md">
          ACTIVE_NODES: {buildings.length}
        </div>
      </div>
    </div>
  );
}
