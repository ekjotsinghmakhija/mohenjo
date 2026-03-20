"use client";

import React, { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function CityGrid() {
  // Fetch all buildings from the production/dev database
  const buildings = useQuery(api.buildings.getAll) || [];
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Clear the board
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Draw the dark background
    ctx.fillStyle = "#0a0a0a"; // Tailwind neutral-950
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Draw the Blueprint Grid lines
    const gridSize = 40; // 40px per grid square
    ctx.strokeStyle = "#262626"; // Tailwind neutral-800
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 4. Render the Buildings
    buildings.forEach((b) => {
      // Different colors for different building types
      ctx.fillStyle = b.type === "core" ? "#f59e0b" : "#10b981"; // Amber or Emerald

      // Calculate raw pixel position on the canvas
      const px = b.x * gridSize;
      const py = b.y * gridSize;

      // Draw building block
      ctx.fillRect(px, py, gridSize, gridSize);

      // Draw building border for definition
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, gridSize, gridSize);
    });
  }, [buildings]); // Re-run this effect anytime a new building is placed!

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl relative">
      {/* We give the canvas a fixed internal coordinate size (1200x800)
        but use CSS (w-full h-[600px]) to scale it dynamically.
      */}
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        className="w-full h-[600px] cursor-crosshair object-cover"
      />

      {/* Overlay UI */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <div className="px-3 py-1 bg-neutral-950/80 border border-neutral-800 rounded text-xs text-neutral-400 font-mono backdrop-blur-sm">
          Buildings: {buildings.length}
        </div>
      </div>
    </div>
  );
}
