"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: "green" | "cyan" | "amber" | "rose" | "purple";
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const badgeStyles: Record<string, string> = {
  green: "bg-[var(--primary)]/12 text-[var(--primary)] border-[var(--primary)]/30",
  cyan: "bg-[var(--accent-cyan)]/12 text-[var(--accent-cyan)] border-[var(--accent-cyan)]/30",
  amber: "bg-[var(--warning)]/12 text-[var(--warning)] border-[var(--warning)]/30",
  rose: "bg-[var(--danger)]/12 text-[var(--danger)] border-[var(--danger)]/30",
  purple: "bg-purple-500/12 text-purple-400 border-purple-500/30",
};

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  badge,
  badgeColor = "cyan",
  defaultOpen = false,
  icon,
  children,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`prana-card overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-[var(--surface-elevated)]/50 transition-colors group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <span className="text-[var(--primary)] shrink-0">{icon}</span>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--foreground)] tracking-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-[var(--muted)] mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 ml-3">
          {badge && (
            <span
              className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded border ${badgeStyles[badgeColor]}`}
            >
              {badge}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen
            ? "max-h-[2000px] opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">{children}</div>
      </div>
    </div>
  );
};
