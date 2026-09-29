"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Cpu,
  Activity,
  Bot,
  Utensils,
  Moon,
  Brain,
  TrendingUp,
  Target,
  Sparkles,
  Camera,
  Layers,
  User,
  ShieldCheck,
  FileText,
  Compass,
  ChevronLeft,
} from "lucide-react";

export type ViewType =
  | "dashboard"
  | "twin"
  | "fitness"
  | "coach"
  | "health"
  | "cv"
  | "georadar"
  | "nutrition"
  | "recovery"
  | "mental"
  | "progress"
  | "goals"
  | "specialized"
  | "profile";

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  twinVersion?: string;
  readinessScore?: number;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  twinVersion = "Twin v1",
  readinessScore = 74,
  onToggleCollapse,
}) => {
  const [profileCompletion, setProfileCompletion] = React.useState<number>(100);

  React.useEffect(() => {
    const updateCompletion = () => {
      try {
        const saved = localStorage.getItem("athena_profile_completion");
        if (saved !== null) {
          setProfileCompletion(parseInt(saved));
        }
      } catch {}
    };
    updateCompletion();
    window.addEventListener("athena_profile_updated", updateCompletion);
    return () => window.removeEventListener("athena_profile_updated", updateCompletion);
  }, []);

  const navItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "twin", label: "My Twin", icon: Cpu },
    { id: "fitness", label: "Fitness Engine", icon: Activity },
    { id: "coach", label: "Coach Jack", icon: Bot },
    { id: "health", label: "Health & Lab Reports", icon: FileText },
    { id: "cv", label: "Exercise CV Coach", icon: Camera },
    { id: "georadar", label: "Sports & Fitness Radar", icon: Compass },
    { id: "nutrition", label: "Nutrition & Calorie", icon: Utensils },
    { id: "recovery", label: "Recovery & Sleep", icon: Moon },
    { id: "mental", label: "Mental Wellness", icon: Brain },
    { id: "progress", label: "Longitudinal Progress", icon: TrendingUp },
    { id: "goals", label: "Goals Engine", icon: Target },
    { id: "specialized", label: "Specialized Hub", icon: Layers },
    { id: "profile", label: "Profile & Privacy", icon: User },
  ];

  return (
    <div className="w-64 h-full border-r border-[var(--border)] bg-[var(--surface)] flex flex-col select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer"
            aria-label="Go to PRANA home"
            title="Go to PRANA home"
          >
            <img
              src="/prana-logo.jpg"
              alt="PRANA Logo"
              className="w-9 h-9 rounded-xl object-cover border border-[var(--primary)]/40 shadow-sm shadow-[var(--primary)]/20 shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="min-w-0">
              <div className="text-lg font-bold tracking-wider text-[var(--foreground)] font-mono leading-tight flex items-center gap-1.5 group-hover:text-[var(--primary)] transition-colors">
                PRANA
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] inline-block animate-pulse"></span>
              </div>
              <div className="text-[9px] font-medium text-[var(--secondary)] lowercase tracking-tight leading-tight mt-0.5 truncate">
                personal responsive adaptive network &amp; analytics
              </div>
            </div>
          </Link>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--secondary)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-2.5 px-2.5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                isActive
                  ? "bg-[var(--surface-elevated)] text-[var(--foreground)] border-l-2 border-[var(--primary)] font-semibold shadow-sm"
                  : "text-[var(--secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)]/50 border-l-2 border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? "text-[var(--primary)]" : "text-[var(--muted)]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Platform & Safety Tag */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)]/90">
        <div className="flex items-center gap-2 text-[11px] text-[var(--secondary)]">
          <ShieldCheck className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <div className="leading-tight">
            <div className="font-semibold text-[var(--foreground)]">PRANA Guardrails Active</div>
            <div className="text-[10px] text-[var(--muted)] lowercase">
              personal responsive adaptive network &amp; analytics
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
