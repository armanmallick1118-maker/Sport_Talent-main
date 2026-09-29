"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Cpu,
  Activity,
  Bot,
  Utensils,
  Moon,
  Brain,
  Camera,
  Compass,
  TrendingUp,
  Target,
  Sparkles,
  FileText,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export interface FeatureNodeItem {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  icon: React.ElementType;
  route: string;
}

export const PRANA_13_FEATURES: FeatureNodeItem[] = [
  {
    id: "twin",
    num: "01",
    title: "MY TWIN",
    subtitle: "Digital Twin",
    shortDescription: "Continuous physiological, biomechanical and behavioral digital modeling of you.",
    icon: Cpu,
    route: "/dashboard?view=twin",
  },
  {
    id: "fitness",
    num: "02",
    title: "FITNESS",
    subtitle: "Physical Fitness Engine",
    shortDescription: "Assess strength, endurance, mobility, balance and kinetic power output.",
    icon: Activity,
    route: "/dashboard?view=fitness",
  },
  {
    id: "coach",
    num: "03",
    title: "PRANA COACH",
    subtitle: "Adaptive AI Coach",
    shortDescription: "Deterministic training calibration, verdict matching and recovery plans with Coach Jack.",
    icon: Bot,
    route: "/dashboard?view=coach",
  },
  {
    id: "nutrition",
    num: "04",
    title: "NUTRITION",
    subtitle: "Nutrition & Calorie Intelligence",
    shortDescription: "Metabolic expenditure, macronutrient partitioning and hydration telemetry.",
    icon: Utensils,
    route: "/dashboard?view=nutrition",
  },
  {
    id: "recovery",
    num: "05",
    title: "RECOVERY",
    subtitle: "Sleep & Recovery Intelligence",
    shortDescription: "Autonomic nervous system recovery, HRV monitoring and morning readiness scoring.",
    icon: Moon,
    route: "/dashboard?view=recovery",
  },
  {
    id: "mental",
    num: "06",
    title: "MENTAL WELLNESS",
    subtitle: "Mental Wellness",
    shortDescription: "Cognitive stress profiling, emotional equilibrium and psychological readiness index.",
    icon: Brain,
    route: "/dashboard?view=mental",
  },
  {
    id: "cv",
    num: "07",
    title: "EXERCISE AI",
    subtitle: "CV Exercise Analysis",
    shortDescription: "Real-time computer vision pose estimation, velocity tracking and form correction.",
    icon: Camera,
    route: "/dashboard?view=cv",
  },
  {
    id: "georadar",
    num: "08",
    title: "FITNESS RADAR",
    subtitle: "Geo-Fitness Radar",
    shortDescription: "Hyperlocal geospatial discovery of gyms, tracks, stadiums, courts and athletic centers.",
    icon: Compass,
    route: "/dashboard?view=georadar",
  },
  {
    id: "progress",
    num: "09",
    title: "PROGRESS",
    subtitle: "Longitudinal Progress",
    shortDescription: "Long-term biometric trajectory, volumetric load trends and milestone achievements.",
    icon: TrendingUp,
    route: "/dashboard?view=progress",
  },
  {
    id: "goals",
    num: "10",
    title: "GOALS",
    subtitle: "Adaptive Goals Engine",
    shortDescription: "Current state to target calibration, sequential milestones and weekly habit tracking.",
    icon: Target,
    route: "/dashboard?view=goals",
  },
  {
    id: "simulator",
    num: "11",
    title: "SIMULATOR",
    subtitle: "Future / What-If Simulator",
    shortDescription: "Predictive trajectory modeling: simulate training frequency, sleep and load outcomes.",
    icon: Sparkles,
    route: "/dashboard?view=twin",
  },
  {
    id: "health",
    num: "12",
    title: "HEALTH",
    subtitle: "Health & Lab Reports",
    shortDescription: "Comprehensive biomarker indexing, lipid panels, metabolic markers and medical diagnostics.",
    icon: FileText,
    route: "/dashboard?view=health",
  },
  {
    id: "specialized",
    num: "13",
    title: "SPECIALIZED",
    subtitle: "Specialized Hub",
    shortDescription: "Bespoke sports protocols for Women's Wellness, PCOS Support, Youth Athleticism & AGE+.",
    icon: Layers,
    route: "/dashboard?view=specialized",
  },
];

export const PranaOrbit: React.FC = () => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(270);
  const [containerSize, setContainerSize] = useState<number>(680);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive radius calculation
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setRadius(140);
        setContainerSize(350);
      } else if (width < 1024) {
        setRadius(205);
        setContainerSize(520);
      } else {
        setRadius(270);
        setContainerSize(680);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const center = containerSize / 2;
  const totalNodes = PRANA_13_FEATURES.length; // Exactly 13

  const hoveredNode = PRANA_13_FEATURES.find((f) => f.id === hoveredNodeId) || null;

  return (
    <div className="relative flex flex-col items-center justify-center py-6 sm:py-10 select-none">
      {/* Outer Glow & Atmosphere */}
      <div className="absolute inset-0 max-w-4xl mx-auto flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] bg-[var(--primary)]/5 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="w-[400px] h-[400px] bg-[var(--secondary)]/5 rounded-full blur-[120px] pointer-events-none"></div>
      </div>

      {/* Main Orbit Circular System */}
      <div
        ref={containerRef}
        style={{ width: `${containerSize}px`, height: `${containerSize}px` }}
        className="relative mx-auto flex items-center justify-center transition-all duration-300"
      >
        {/* SVG Geometry: Main Orbit Ring, Concentric Guides & Radiating Connection Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          viewBox={`0 0 ${containerSize} ${containerSize}`}
        >
          {/* Outer Dashed Orbit Guide */}
          <circle
            cx={center}
            cy={center}
            r={radius + 35}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="3 6"
            opacity="0.35"
          />

          {/* Primary Mathematical Orbit Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1.5"
            className="transition-colors duration-300"
          />

          {/* Subtle Secondary Inner Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius - 45}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.2"
          />

          {/* Radiating Connection Lines (Center to 13 Nodes) */}
          {PRANA_13_FEATURES.map((feature, idx) => {
            const angle = (360 / totalNodes) * idx - 90;
            const angleRad = (angle * Math.PI) / 180;
            const targetX = center + radius * Math.cos(angleRad);
            const targetY = center + radius * Math.sin(angleRad);
            const isHovered = hoveredNodeId === feature.id;

            return (
              <line
                key={feature.id}
                x1={center}
                y1={center}
                x2={targetX}
                y2={targetY}
                stroke={isHovered ? "var(--primary)" : "var(--border)"}
                strokeWidth={isHovered ? 1.75 : 0.75}
                strokeDasharray={isHovered ? "none" : "2 4"}
                opacity={isHovered ? 0.9 : 0.25}
                className="transition-all duration-200"
              />
            );
          })}
        </svg>

        {/* =================================================== */}
        {/* CENTRAL PRANA INTELLIGENCE CORE                     */}
        {/* =================================================== */}
        <div
          style={{
            width: radius > 200 ? "230px" : radius > 150 ? "180px" : "130px",
            height: radius > 200 ? "230px" : radius > 150 ? "180px" : "130px",
          }}
          className="relative z-10 rounded-full bg-[#0B100E] border border-[var(--border)] shadow-2xl flex flex-col items-center justify-center p-4 text-center group cursor-pointer transition-all duration-300"
        >
          {/* Subtle concentric rings inside core */}
          <div className="absolute inset-1.5 rounded-full border border-[var(--border)]/60 pointer-events-none"></div>
          <div className="absolute inset-4 rounded-full border border-[var(--primary)]/15 pointer-events-none"></div>

          <Link href="/dashboard" className="flex flex-col items-center text-center group">
            {/* PRANA Emblem */}
            <div className="relative mb-1 sm:mb-1.5">
              <img
                src="/prana-logo.jpg"
                alt="PRANA Core"
                className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover border border-[var(--primary)]/50 shadow-md shadow-[var(--primary)]/20 group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--primary)] border-2 border-[#0B100E] animate-pulse"></span>
            </div>

            {/* Core Branding */}
            <span className="text-sm sm:text-base font-bold tracking-widest font-mono text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
              PRANA
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-[var(--secondary)] font-semibold leading-none mt-0.5">
              Personal Intelligence
            </span>

            {/* Core USP micro statement (hidden on ultra-small mobile) */}
            <p className="text-[8px] sm:text-[9.5px] text-[var(--muted)] leading-tight mt-1 sm:mt-1.5 max-w-[170px] hidden sm:block">
              Models your present. Shapes your future.
            </p>

            <span className="mt-1 sm:mt-1.5 inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-mono text-[var(--primary)] font-semibold bg-[var(--primary)]/10 px-2 py-0.5 rounded-full border border-[var(--primary)]/30 group-hover:bg-[var(--primary)] group-hover:text-[#0B100E] transition-colors">
              Active Core &rarr;
            </span>
          </Link>
        </div>

        {/* =================================================== */}
        {/* EXACTLY 13 MATHEMATICAL CIRCULAR FEATURE NODES     */}
        {/* =================================================== */}
        {PRANA_13_FEATURES.map((feature, idx) => {
          const angle = (360 / totalNodes) * idx - 90; // Start 12 o'clock
          const angleRad = (angle * Math.PI) / 180;
          const x = center + radius * Math.cos(angleRad);
          const y = center + radius * Math.sin(angleRad);
          const isHovered = hoveredNodeId === feature.id;
          const Icon = feature.icon;

          // Responsive node diameter
          const nodeDiameter = radius > 200 ? 58 : radius > 150 ? 48 : 38;
          const iconSize = radius > 200 ? 20 : radius > 150 ? 16 : 14;

          return (
            <div
              key={feature.id}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: "translate(-50%, -50%)",
              }}
              className="absolute z-20"
              onMouseEnter={() => setHoveredNodeId(feature.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onFocus={() => setHoveredNodeId(feature.id)}
              onBlur={() => setHoveredNodeId(null)}
            >
              <Link
                href={feature.route}
                aria-label={`Open ${feature.title} (${feature.subtitle})`}
                className="group flex flex-col items-center focus:outline-none"
              >
                {/* Circular Feature Node */}
                <div
                  style={{ width: `${nodeDiameter}px`, height: `${nodeDiameter}px` }}
                  className={`rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg ${
                    isHovered
                      ? "bg-[#161F1B] border-2 border-[var(--primary)] scale-110 shadow-[0_0_18px_rgba(183,243,74,0.35)] text-[var(--primary)]"
                      : "bg-[#111815] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/50"
                  }`}
                >
                  <Icon style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
                </div>

                {/* Node Label Badge */}
                <div className="absolute top-full mt-1 flex flex-col items-center pointer-events-none">
                  <span
                    className={`font-mono font-bold tracking-tight uppercase whitespace-nowrap transition-colors duration-150 ${
                      isHovered
                        ? "text-[var(--primary)] text-[10px] sm:text-[11px]"
                        : "text-[var(--muted)] text-[8px] sm:text-[9.5px]"
                    }`}
                  >
                    {feature.title}
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* =================================================== */}
      {/* ACTIVE NODE INSPECTION DRAWER / TOOLTIP BAR         */}
      {/* =================================================== */}
      <div className="w-full max-w-xl mx-auto mt-8 sm:mt-10 px-4 min-h-[92px] transition-all">
        {hoveredNode ? (
          <div className="p-4 rounded-2xl border border-[var(--primary)]/40 bg-[#111815] shadow-lg flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/40 flex items-center justify-center text-[var(--primary)] shrink-0">
                <hoveredNode.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[var(--primary)]">
                    {hoveredNode.num} // {hoveredNode.title}
                  </span>
                  <span className="text-[10px] text-[var(--secondary)] font-mono">
                    {hoveredNode.subtitle}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed mt-0.5 truncate sm:whitespace-normal">
                  {hoveredNode.shortDescription}
                </p>
              </div>
            </div>

            <Link
              href={hoveredNode.route}
              className="px-3 py-1.5 rounded-xl bg-[var(--primary)] text-[#0B100E] text-xs font-bold font-mono flex items-center gap-1 shrink-0 hover:bg-[#cbf774] transition-colors"
            >
              <span>Explore</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-[var(--border)]/60 bg-[#111815]/50 text-center flex items-center justify-center gap-2 text-xs text-[var(--muted)] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--secondary)]"></span>
            <span>Hover any of the 13 feature nodes above to inspect capabilities or click to launch.</span>
          </div>
        )}
      </div>
    </div>
  );
};
