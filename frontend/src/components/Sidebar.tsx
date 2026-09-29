"use client";

import React, { useState } from "react";
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
  Layers,
  User,
  ShieldCheck,
  FileText,
  Compass,
  ChevronLeft,
  ChevronDown,
  Camera,
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

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  twinVersion?: string;
  readinessScore?: number;
  onToggleCollapse?: () => void;
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    defaultOpen: true,
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "twin", label: "My Twin", icon: Cpu },
    ],
  },
  {
    label: "Training & Fitness",
    defaultOpen: true,
    items: [
      { id: "fitness", label: "Fitness Engine", icon: Activity },
      { id: "cv", label: "Exercise CV Coach", icon: Camera },
      { id: "goals", label: "Goals Engine", icon: Target },
    ],
  },
  {
    label: "Health & Wellness",
    defaultOpen: true,
    items: [
      { id: "nutrition", label: "Nutrition & Calorie", icon: Utensils },
      { id: "recovery", label: "Recovery & Sleep", icon: Moon },
      { id: "mental", label: "Mental Wellness", icon: Brain },
      { id: "health", label: "Health & Lab Reports", icon: FileText },
      { id: "specialized", label: "Specialized Hub", icon: Layers },
    ],
  },
  {
    label: "Tools",
    defaultOpen: false,
    items: [
      { id: "coach", label: "Coach Jack (AI)", icon: Bot },
      { id: "georadar", label: "Sports & Fitness Radar", icon: Compass },
      { id: "progress", label: "Longitudinal Progress", icon: TrendingUp },
      { id: "profile", label: "Profile & Privacy", icon: User },
    ],
  },
];

const NavGroupComponent: React.FC<{
  group: NavGroup;
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
}> = ({ group, currentView, onSelectView }) => {
  // Auto-open group if current view is within it
  const hasActiveItem = group.items.some((item) => item.id === currentView);
  const [isOpen, setIsOpen] = useState(group.defaultOpen || hasActiveItem);

  return (
    <div className="mb-1">
      {/* Group Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--secondary)] transition-colors"
      >
        <span>{group.label}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${
            isOpen ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>

      {/* Group Items */}
      <div
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-0.5 pb-2">
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-[var(--surface-elevated)] text-[var(--foreground)] border-l-2 border-[var(--primary)] font-semibold shadow-sm"
                    : "text-[var(--secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)]/50 border-l-2 border-transparent"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? "text-[var(--primary)]" : "text-[var(--muted)]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  twinVersion = "Twin v1",
  readinessScore = 74,
  onToggleCollapse,
}) => {
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

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {navGroups.map((group) => (
          <NavGroupComponent
            key={group.label}
            group={group}
            currentView={currentView}
            onSelectView={onSelectView}
          />
        ))}
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
