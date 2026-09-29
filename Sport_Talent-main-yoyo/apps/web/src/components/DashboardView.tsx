"use client";

import React from "react";
import {
  Activity,
  Moon,
  Zap,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Info,
  Sparkles,
  FileText,
  Bot,
  Utensils,
  Target,
  ChevronDown,
} from "lucide-react";
import { ViewType } from "./Sidebar";

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
  twinData?: any;
  recommendation?: any;
  readinessData?: any;
  todayNutrition?: any;
}

/* ——————————————————————————————————————————
   Stat Ring – visual ring + number for each metric
   —————————————————————————————————————————— */
const StatRing: React.FC<{
  label: string;
  value: number;
  suffix?: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}> = ({ label, value, suffix = "", sub, icon, color, onClick }) => {
  const pct = Math.min(value, 100);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <button
      onClick={onClick}
      className="prana-card p-5 flex flex-col items-center gap-3 hover:border-[var(--primary)]/40 transition-all group cursor-pointer"
    >
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="var(--border)"
            strokeWidth="5"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold font-mono text-[var(--foreground)]">
            {value}
            {suffix}
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--foreground)]">
          {icon}
          {label}
        </div>
        <div className="text-[11px] text-[var(--muted)] mt-0.5">{sub}</div>
      </div>
    </button>
  );
};

/* ——————————————————————————————————————————
   Quick Link Card
   —————————————————————————————————————————— */
const QuickLink: React.FC<{
  label: string;
  desc: string;
  icon: React.ReactNode;
  borderColor: string;
  onClick: () => void;
}> = ({ label, desc, icon, borderColor, onClick }) => (
  <button
    onClick={onClick}
    className={`prana-card p-4 text-left hover:border-[var(--primary)]/40 transition-all group flex items-start gap-3 ${borderColor}`}
  >
    <div className="shrink-0 mt-0.5">{icon}</div>
    <div className="min-w-0">
      <div className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
        {label}
      </div>
      <div className="text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed">
        {desc}
      </div>
    </div>
    <ArrowRight className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors shrink-0 mt-1 opacity-0 group-hover:opacity-100" />
  </button>
);

/* ——————————————————————————————————————————
   MAIN DASHBOARD VIEW
   —————————————————————————————————————————— */
export const DashboardView: React.FC<DashboardProps> = ({
  onNavigate,
  twinData,
  recommendation,
  readinessData,
  todayNutrition,
}) => {
  const readiness = readinessData?.readiness_score ?? 74;
  const fitness = 78;
  const [activity, setActivity] = React.useState<number>(82);
  const [consistency, setConsistency] = React.useState<number>(76);
  const [showTodayDetails, setShowTodayDetails] = React.useState(false);

  // Live Dynamic State from AI Health Report & Lab Report Manager
  const [aiHealthScore, setAiHealthScore] = React.useState<number>(88);
  const [latestPanel, setLatestPanel] = React.useState<string>("Comprehensive Athlete Panel");
  const [latestPanelDate, setLatestPanelDate] = React.useState<string>("2026-08-28");
  const [labStatus, setLabStatus] = React.useState<string>("Optimal");

  React.useEffect(() => {
    const updateAll = () => {
      try {
        const savedScore = localStorage.getItem("athena_health_score");
        if (savedScore) setAiHealthScore(parseInt(savedScore));
        const savedReports = localStorage.getItem("athena_lab_reports");
        if (savedReports) {
          const parsed = JSON.parse(savedReports);
          if (parsed && parsed.length > 0) {
            setLatestPanel(parsed[0].panel);
            setLatestPanelDate(parsed[0].date);
            setLabStatus(parsed[0].status === "Normal" ? "Optimal" : "Attention");
          }
        }
        const savedWorkouts = localStorage.getItem("athena_logged_workouts");
        if (savedWorkouts) {
          const wList = JSON.parse(savedWorkouts);
          if (Array.isArray(wList)) {
            setConsistency(Math.min(98, 70 + wList.length * 4));
            const totalMins = wList.reduce((acc: number, cur: any) => acc + (cur.duration || 0), 0);
            setActivity(Math.min(99, 70 + Math.round(totalMins / 5)));
          }
        }
      } catch {}
    };
    updateAll();
    window.addEventListener("athena_health_updated", updateAll);
    window.addEventListener("athena_workout_updated", updateAll);
    return () => {
      window.removeEventListener("athena_health_updated", updateAll);
      window.removeEventListener("athena_workout_updated", updateAll);
    };
  }, []);

  const [userName, setUserName] = React.useState<string>("Alex");

  React.useEffect(() => {
    const resolveName = () => {
      try {
        const direct = localStorage.getItem("userName");
        if (direct && direct.trim()) {
          setUserName(direct.trim().split(" ")[0]);
          return;
        }
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          const u = JSON.parse(rawUser);
          if (u.fullName && u.fullName.trim()) {
            setUserName(u.fullName.trim().split(" ")[0]);
            return;
          }
        }
        const profile = localStorage.getItem("prana_user_profile") || localStorage.getItem("athena_user_profile");
        if (profile) {
          const p = JSON.parse(profile);
          if (p.fullName && p.fullName.trim()) {
            setUserName(p.fullName.trim().split(" ")[0]);
            return;
          }
        }
      } catch {}
    };

    resolveName();
    window.addEventListener("prana_profile_updated", resolveName);
    window.addEventListener("athena_profile_updated", resolveName);
    return () => {
      window.removeEventListener("prana_profile_updated", resolveName);
      window.removeEventListener("athena_profile_updated", resolveName);
    };
  }, []);

  const rec = recommendation || {
    title: "20 Min Moderate Kinetic Workout",
    summary: "Controlled bodyweight circuit with dynamic mobility warmup.",
    reasoning_why:
      "Your recovery is good, but activity has been lower than your normal baseline.",
    duration_minutes: 20,
    intensity: "MODERATE",
  };

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════
          ZONE 1: Greeting + Status Glance
          ═══════════════════════════════════════ */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {greeting}, {userName}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Here&apos;s your personalized fitness overview
          </p>
        </div>

        {/* 4 Stat Rings */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatRing
            label="Fitness"
            value={fitness}
            sub="+2.4 pts vs 30d"
            icon={<Activity className="w-3.5 h-3.5" />}
            color="var(--info)"
            onClick={() => onNavigate("fitness")}
          />
          <StatRing
            label="Readiness"
            value={readiness}
            sub="7.8h sleep • Good"
            icon={<Moon className="w-3.5 h-3.5" />}
            color="var(--success)"
            onClick={() => onNavigate("recovery")}
          />
          <StatRing
            label="Activity"
            value={activity}
            sub="42 / 50 min today"
            icon={<Zap className="w-3.5 h-3.5" />}
            color="var(--warning)"
            onClick={() => onNavigate("fitness")}
          />
          <StatRing
            label="Consistency"
            value={consistency}
            suffix="%"
            sub="4-week adherence"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            color="var(--accent-cyan)"
            onClick={() => onNavigate("progress")}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════
          ZONE 2: Today's Action (Focal Point)
          ═══════════════════════════════════════ */}
      <div className="prana-card p-6 border-[var(--primary)]/20 bg-[var(--surface-elevated)]/50">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Recommendation */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[var(--accent-cyan)] uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                PRANA Suggests
              </span>
              <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded border bg-[var(--accent-cyan)]/12 text-[var(--accent-cyan)] border-[var(--accent-cyan)]/30">
                {rec.duration_minutes} min • {rec.intensity}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
                {rec.title}
              </h2>
              <p className="text-sm text-[var(--secondary)] mt-1.5 leading-relaxed">
                {rec.summary}
              </p>
            </div>

            {/* Why section */}
            <div className="p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[var(--accent-cyan)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--secondary)] leading-relaxed">
                {rec.reasoning_why}
              </p>
            </div>

            {/* Primary CTA */}
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={() => onNavigate("fitness")}
                className="px-6 py-3 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--background)] font-bold text-sm transition-all flex items-center gap-2 shadow-md shadow-[var(--primary-glow)]"
              >
                Start Session ({rec.duration_minutes} min)
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate("coach")}
                className="px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] text-[var(--foreground)] font-medium text-sm transition-all flex items-center gap-2"
              >
                <Bot className="w-4 h-4 text-[var(--accent-cyan)]" />
                Ask Coach Jack
              </button>
            </div>
          </div>

          {/* Today's State – collapsed by default */}
          <div className="lg:w-72 shrink-0">
            <button
              onClick={() => setShowTodayDetails(!showTodayDetails)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[var(--secondary)] uppercase tracking-wider mb-3 hover:text-[var(--foreground)] transition-colors"
            >
              <span>Today&apos;s State</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showTodayDetails ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Always show summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-[var(--muted)]">Recovery</span>
                <span className="badge-clean badge-green">Good</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-[var(--muted)]">Sleep</span>
                <span className="text-[var(--secondary)] font-mono">7.8h • 82%</span>
              </div>
            </div>

            {/* Expanded details */}
            <div
              className={`transition-all duration-300 overflow-hidden ${
                showTodayDetails
                  ? "max-h-[300px] opacity-100 mt-2"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-[var(--muted)]">Activity Level</span>
                  <span className="badge-clean badge-amber">Low</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-[var(--muted)]">Hydration</span>
                  <span className="text-[var(--secondary)] font-mono">
                    1,750 / 2,500 ml
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-[var(--muted)]">Fatigue</span>
                  <span className="text-[var(--secondary)] font-mono">
                    4/10 (Fresh)
                  </span>
                </div>
                <button
                  onClick={() => onNavigate("recovery")}
                  className="w-full mt-2 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)] transition-colors flex items-center justify-center gap-1.5"
                >
                  Full Readiness Breakdown
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          ZONE 3: Quick Links (max 4)
          ═══════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--secondary)] uppercase tracking-wider mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickLink
            label="Nutrition Log"
            desc="Log meals & track macros"
            icon={<Utensils className="w-5 h-5 text-[var(--warning)]" />}
            borderColor=""
            onClick={() => onNavigate("nutrition")}
          />
          <QuickLink
            label="Goals & Progress"
            desc="Track your active goals"
            icon={<Target className="w-5 h-5 text-[var(--primary)]" />}
            borderColor=""
            onClick={() => onNavigate("goals")}
          />
          <QuickLink
            label="Lab Biomarkers"
            desc={`Score: ${aiHealthScore} • ${labStatus}`}
            icon={<FileText className="w-5 h-5 text-purple-400" />}
            borderColor=""
            onClick={() => onNavigate("health")}
          />
          <QuickLink
            label="Progress Trends"
            desc="View longitudinal data"
            icon={<TrendingUp className="w-5 h-5 text-[var(--accent-cyan)]" />}
            borderColor=""
            onClick={() => onNavigate("progress")}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════
          Insight Cards (condensed from original)
          ═══════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="prana-card p-4 space-y-1.5">
          <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-[var(--success)]" />
            What Changed?
          </div>
          <div className="text-xs text-[var(--secondary)] leading-relaxed">
            Cardio output improved by{" "}
            <span className="text-[var(--success)] font-semibold">+4.2%</span>{" "}
            over 8 weeks. Resting HR lowered by 2 bpm.
          </div>
        </div>

        <div className="prana-card p-4 space-y-1.5">
          <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[var(--accent-cyan)]" />
            Coach Tip
          </div>
          <div className="text-xs text-[var(--secondary)] leading-relaxed">
            Shift 15g protein to breakfast to stabilize muscle protein synthesis
            throughout the day.
          </div>
        </div>

        <div className="prana-card p-4 space-y-1.5">
          <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-3 h-3 text-[var(--info)]" />
            Goal Progress
          </div>
          <div className="text-xs text-[var(--secondary)] leading-relaxed">
            5km Pace & Core Mastery:{" "}
            <span className="text-[var(--info)] font-semibold">68%</span>{" "}
            complete (Week 4 of 8).
          </div>
        </div>
      </div>
    </div>
  );
};
