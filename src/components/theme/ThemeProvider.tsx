"use client";

import React, { createContext, useContext } from "react";
import { useSyncUser } from "@/hooks/useSyncUser";

type Faction = "vanguard" | "syndicate" | "celestial" | "unassigned";

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  gridLine: string;
  buildingCore: string;
  buildingStandard: string;
  shadowColor: string;
  glowEffect: boolean;
}

const THEMES: Record<Faction, ThemeColors> = {
  vanguard: {
    primary: "6, 182, 212", // Cyan 500
    secondary: "245, 158, 11", // Amber 500
    background: "#050505",
    gridLine: "rgba(6, 182, 212, 0.15)",
    buildingCore: "245, 158, 11",
    buildingStandard: "6, 182, 212",
    shadowColor: "rgb(6, 182, 212)",
    glowEffect: true,
  },
  syndicate: {
    primary: "220, 38, 38", // Red 600
    secondary: "115, 115, 115", // Neutral 500
    background: "#0a0a0a",
    gridLine: "rgba(220, 38, 38, 0.1)",
    buildingCore: "220, 38, 38",
    buildingStandard: "23, 23, 23", // Dark Neutral
    shadowColor: "rgba(0,0,0,0.8)",
    glowEffect: false,
  },
  celestial: {
    primary: "255, 255, 255", // White
    secondary: "251, 191, 36", // Amber 400
    background: "#171717",
    gridLine: "rgba(255, 255, 255, 0.1)",
    buildingCore: "251, 191, 36",
    buildingStandard: "255, 255, 255",
    shadowColor: "rgba(255,255,255,0.2)",
    glowEffect: false,
  },
  unassigned: {
    primary: "115, 115, 115",
    secondary: "115, 115, 115",
    background: "#0a0a0a",
    gridLine: "rgba(255, 255, 255, 0.05)",
    buildingCore: "115, 115, 115",
    buildingStandard: "64, 64, 64",
    shadowColor: "rgba(0,0,0,0)",
    glowEffect: false,
  }
};

const ThemeContext = createContext<{ faction: Faction; theme: ThemeColors } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { dbUser } = useSyncUser();
  const faction: Faction = (dbUser?.faction as Faction) || "unassigned";
  const theme = THEMES[faction];

  return (
    <ThemeContext.Provider value={{ faction, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
