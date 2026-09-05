"use client";

import React from "react";
import {
  Activity,
  Moon,
  Zap,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Info,
  Clock,
  Target,
  Sparkles,
  FileText,
} from "lucide-react";
import { ViewType } from "./Sidebar";

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
  twinData?: any;
  recommendation?: any;
  readinessData?: any;
  todayNutrition?: any;
}

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
  const [workoutCount, setWorkoutCount] = React.useState<number>(2);

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
            setWorkoutCount(wList.length);
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

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold tracking-wider text-blue-500 uppercase">
            Personal Intelligence System
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
            Good evening, {userName}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            System status calibrated from longitudinal baseline. Twin v1 active.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("twin")}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-medium text-[var(--foreground)] hover:border-[var(--primary)] transition-colors flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
            Twin Calibration
          </button>
        </div>
      </div>

      {/* 4 Core Quantitative Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="athena-card p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>FITNESS</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">{fitness}</div>
          <div className="text-[11px] text-emerald-500 mt-1 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +2.4 pts vs 30d baseline
          </div>
        </div>

        <div className="athena-card p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>READINESS</span>
            <Moon className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">{readiness}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            State: <span className="text-emerald-400 font-medium">Good</span> (7.8h sleep)
          </div>
        </div>

        <div className="athena-card p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>ACTIVITY</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">{activity}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Today: <span className="text-slate-300 font-medium">42 mins</span> / 50 target
          </div>
        </div>

        <div className="athena-card p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>CONSISTENCY</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">{consistency}%</div>
          <div className="text-[11px] text-slate-400 mt-1">
            4-week rolling adherence
          </div>
        </div>
      </div>

      {/* Main Grid: Today's State & ATHENA Suggests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's State (4 cols) */}
        <div className="lg:col-span-4 athena-card p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Today&apos;s State
            </h2>
            <span className="text-[11px] font-mono text-slate-500">Live Telemetry</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-800/60 text-xs">
              <span className="text-slate-400">Recovery Status</span>
              <span className="badge-clean badge-emerald">Good</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800/60 text-xs">
              <span className="text-slate-400">Sleep Architecture</span>
              <span className="badge-clean badge-blue">7.8h • 82% Quality</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800/60 text-xs">
              <span className="text-slate-400">Daily Activity Level</span>
              <span className="badge-clean badge-amber">Low (Below Normal)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800/60 text-xs">
              <span className="text-slate-400">Hydration Intake</span>
              <span className="text-slate-300 font-mono">1,750 / 2,500 ml</span>
            </div>
            <div className="flex items-center justify-between py-2 text-xs">
              <span className="text-slate-400">Perceived Exertion Fatigue</span>
              <span className="text-slate-300 font-mono">4 / 10 (Fresh)</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate("recovery")}
              className="w-full py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              Inspect Readiness Breakdown
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ATHENA Suggests Recommendation Card (8 cols) */}
        <div className="lg:col-span-8 athena-card p-6 flex flex-col justify-between border-slate-700 bg-slate-900/60">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-xs font-bold tracking-wider text-cyan-400 uppercase">
                  PRANA SUGGESTS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge-clean badge-blue">
                  {rec.duration_minutes} min • {rec.intensity}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {rec.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {rec.summary}
              </p>
            </div>

            {/* WHY Section - Required Core PRANA Element */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                WHY IS PRANA RECOMMENDING THIS?
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {rec.reasoning_why}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate("fitness")}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
            >
              Start Session ({rec.duration_minutes} min)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate("coach")}
              className="px-4 py-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 hover:bg-amber-900/40 text-amber-300 font-medium text-xs transition-colors flex items-center gap-1.5"
            >
              Consult Coach Jack (Mentor)
            </button>
            <button
              onClick={() => onNavigate("cv")}
              className="px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              PRANA CV Kinematics
            </button>
            <button
              onClick={() => onNavigate("health")}
              className="px-4 py-2.5 rounded-lg bg-purple-950/40 border border-purple-500/40 hover:bg-purple-900/40 text-purple-300 font-medium text-xs transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              Lab Biomarkers Hub
            </button>
            <button
              onClick={() => onNavigate("georadar")}
              className="px-4 py-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/40 text-emerald-300 font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Talent Geo Radar (360°)
            </button>
          </div>
        </div>
      </div>

      {/* Answers to Core Questions + Lab Biomarker Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="athena-card p-4 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            WHAT CHANGED?
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            Your cardiovascular output improved by <span className="text-emerald-400 font-semibold">+4.2%</span> over 8 weeks, while resting heart rate lowered by 2 bpm.
          </div>
        </div>

        <div className="athena-card p-4 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            WHAT CAN I IMPROVE?
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            Coach Jack Directive: Shift 15g protein to breakfast to stabilize day-long muscle protein synthesis.
          </div>
        </div>

        <div className="athena-card p-4 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            GOAL MILESTONE
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            Target: 5km Pace & Core Mastery. Currently at <span className="text-blue-400 font-semibold">68% completion</span> (Week 4 of 8).
          </div>
        </div>

        <div
          onClick={() => onNavigate("health")}
          className="athena-card p-4 space-y-2 border-purple-500/30 bg-purple-950/20 hover:border-purple-500/60 transition-all cursor-pointer group"
        >
          <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3 h-3 text-purple-400" />
              AI HEALTH &amp; LABS
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              SCORE: {aiHealthScore}
            </span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            Latest Panel: <span className="text-white font-semibold">{latestPanel}</span> ({latestPanelDate}). Status: <span className="text-emerald-400 font-medium">{labStatus}</span>.
          </div>
          <div className="text-[10px] text-purple-400 font-medium group-hover:underline flex items-center gap-1 pt-0.5">
            View AI Diagnostic &amp; Lab Manager &rarr;
          </div>
        </div>
      </div>
    </div>
  );
};

