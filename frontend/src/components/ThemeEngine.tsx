"use client";

import React, { useState, useEffect } from "react";
import { Palette, Check, X, RotateCcw, Sliders, Sun, Moon, Sparkles } from "lucide-react";

export type ThemePresetId =
  | "prana-vital"
  | "agni"
  | "neel"
  | "van"
  | "sandhya"
  | "daylight";

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  tagline: string;
  bgHex: string;
  primaryHex: string;
  secondaryHex: string;
  isLight?: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "prana-vital",
    name: "PRANA VITAL",
    tagline: "Default • Athletic Carbon + Vitality Green",
    bgHex: "#0B100E",
    primaryHex: "#B7F34A",
    secondaryHex: "#25D9D0",
  },
  {
    id: "agni",
    name: "AGNI",
    tagline: "Power • Warm Athletic Intensity",
    bgHex: "#110C09",
    primaryHex: "#FF8A3D",
    secondaryHex: "#FFD166",
  },
  {
    id: "neel",
    name: "NEEL",
    tagline: "Precision • Cool Performance & Focus",
    bgHex: "#080E16",
    primaryHex: "#4CC9F0",
    secondaryHex: "#7C9CFF",
  },
  {
    id: "van",
    name: "VAN",
    tagline: "Recovery • Forest Biomechanics",
    bgHex: "#0B120E",
    primaryHex: "#79D98A",
    secondaryHex: "#B7F34A",
  },
  {
    id: "sandhya",
    name: "SANDHYA",
    tagline: "Calm • Mental Wellness & Premium Dusk",
    bgHex: "#110E16",
    primaryHex: "#C7A7FF",
    secondaryHex: "#6EE7D8",
  },
  {
    id: "daylight",
    name: "DAYLIGHT",
    tagline: "Clinical • Clean Light Performance",
    bgHex: "#F5F7F3",
    primaryHex: "#3F7D20",
    secondaryHex: "#087F8C",
    isLight: true,
  },
];

export interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTheme, setActiveTheme] = useState<ThemePresetId>("prana-vital");
  const [customAccent, setCustomAccent] = useState<string>("");
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable");

  // Load saved theme configuration on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("prana_theme_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.theme) {
          setActiveTheme(parsed.theme);
          applyTheme(parsed.theme, parsed.customAccent);
        }
        if (parsed.customAccent) setCustomAccent(parsed.customAccent);
        if (parsed.density) setDensity(parsed.density);
      } else {
        applyTheme("prana-vital");
      }
    } catch {}
  }, []);

  const applyTheme = (themeId: ThemePresetId, accentOverride?: string) => {
    document.documentElement.setAttribute("data-theme", themeId);
    if (accentOverride) {
      document.documentElement.style.setProperty("--primary", accentOverride);
      document.documentElement.style.setProperty("--border-focus", accentOverride);
    } else {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--border-focus");
    }
  };

  const handleSelectTheme = (themeId: ThemePresetId) => {
    setActiveTheme(themeId);
    applyTheme(themeId, customAccent);
    saveConfig(themeId, customAccent, density);
  };

  const handleCustomAccentChange = (hex: string) => {
    setCustomAccent(hex);
    applyTheme(activeTheme, hex);
    saveConfig(activeTheme, hex, density);
  };

  const handleResetToDefault = () => {
    setActiveTheme("prana-vital");
    setCustomAccent("");
    setDensity("comfortable");
    applyTheme("prana-vital");
    try {
      localStorage.removeItem("prana_theme_config");
    } catch {}
  };

  const saveConfig = (theme: ThemePresetId, accent: string, den: string) => {
    try {
      localStorage.setItem(
        "prana_theme_config",
        JSON.stringify({ theme, customAccent: accent, density: den })
      );
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="prana-card w-full max-w-lg p-6 bg-[var(--surface-card)] border border-[var(--border)] space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--primary)] font-bold flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> PRANA Theme Engine
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)] mt-0.5">
              Appearance &amp; Color System
            </h3>
            <p className="text-xs text-[var(--secondary)]">
              Choose an athletic theme preset or customize visual accents.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Theme Presets Grid */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-[var(--secondary)] uppercase tracking-wider block">
            Built-in Themes (6 Presets)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {THEME_PRESETS.map((preset) => {
              const isSelected = activeTheme === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectTheme(preset.id)}
                  style={{ backgroundColor: preset.bgHex }}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                    isSelected
                      ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/30 shadow-md"
                      : "border-[var(--border)] hover:border-[var(--border-focus)]/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: preset.primaryHex }}
                      ></span>
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/40 opacity-70"
                        style={{ backgroundColor: preset.secondaryHex }}
                      ></span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[var(--primary)]" />
                    )}
                  </div>

                  <div
                    className={`text-xs font-bold font-mono ${
                      preset.isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {preset.name}
                  </div>
                  <div
                    className={`text-[9px] mt-0.5 truncate leading-tight ${
                      preset.isLight ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {preset.tagline.split("•")[0]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Accent Color Picker */}
        <div className="p-3.5 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[var(--secondary)] uppercase">
              Custom Primary Accent
            </span>
            {customAccent && (
              <button
                onClick={() => handleCustomAccentChange("")}
                className="text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] underline font-mono"
              >
                Clear Custom Accent
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Swatches */}
            <div className="flex items-center gap-2">
              {["#B7F34A", "#25D9D0", "#FF8A3D", "#4CC9F0", "#79D98A", "#C7A7FF", "#FF6B6B"].map(
                (hex) => (
                  <button
                    key={hex}
                    onClick={() => handleCustomAccentChange(hex)}
                    style={{ backgroundColor: hex }}
                    className={`w-6 h-6 rounded-full border border-black/30 transition-transform ${
                      customAccent === hex ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                    }`}
                    title={hex}
                  />
                )
              )}
            </div>

            {/* Native Color Input */}
            <div className="flex items-center gap-1.5 ml-auto">
              <input
                type="color"
                value={customAccent || "#B7F34A"}
                onChange={(e) => handleCustomAccentChange(e.target.value)}
                className="w-7 h-7 rounded border border-[var(--border)] cursor-pointer bg-transparent"
              />
              <span className="text-[10px] font-mono text-[var(--muted)]">
                {customAccent || "Default"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-1 flex items-center justify-between border-t border-[var(--border)] text-xs font-mono">
          <button
            onClick={handleResetToDefault}
            className="text-[var(--secondary)] hover:text-[var(--foreground)] flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to PRANA VITAL
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--primary)] text-black font-bold text-xs rounded-xl shadow-md hover:brightness-105 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
