"use client";

import React, { useState } from "react";
import {
  Cpu,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Clock,
  Shield,
  Layers,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface DigitalTwinProps {
  twinData?: any;
  onRefreshTwin?: () => void;
}

export const DigitalTwinView: React.FC<DigitalTwinProps> = ({
  twinData,
  onRefreshTwin,
}) => {
  const [selectedVersion, setSelectedVersion] = useState(twinData?.version === "Twin v2" ? "v2" : "v1");
  const [deltaWindow, setDeltaWindow] = useState<30 | 90 | 180>(30);

  React.useEffect(() => {
    if (twinData?.version === "Twin v2") {
      setSelectedVersion("v2");
    }
  }, [twinData?.version]);

  const scores = twinData?.scores || {
    strength: 72,
    endurance: 70,
    cardio: 68,
    mobility: 64,
    flexibility: 62,
    balance: 74,
    agility: 66,
    consistency: 76,
  };

  const radarData = [
    { subject: "Strength", value: scores.strength },
    { subject: "Endurance", value: scores.endurance },
    { subject: "Cardio", value: scores.cardio },
    { subject: "Mobility", value: scores.mobility },
    { subject: "Flexibility", value: scores.flexibility },
    { subject: "Balance", value: scores.balance },
    { subject: "Agility", value: scores.agility },
    { subject: "Consistency", value: scores.consistency },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Versioning Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold tracking-wider text-blue-500 uppercase flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            Continuously Evolving User State
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
            Personal Digital Fitness Twin
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable versioned representation across Physical, Recovery, Nutrition, Mental, Performance, and Goals.
          </p>
        </div>

        {/* Version Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs">
            <button
              onClick={() => setSelectedVersion("v1")}
              className={`px-2.5 py-1 rounded font-mono transition-colors ${
                selectedVersion === "v1"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Twin v1 (Baseline)
            </button>
            <button
              onClick={() => setSelectedVersion("v2")}
              className={`px-2.5 py-1 rounded font-mono transition-colors ${
                selectedVersion === "v2"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Twin v2 (Week 4)
            </button>
          </div>
          {onRefreshTwin && (
            <button
              onClick={onRefreshTwin}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              title="Recalibrate Twin Snapshot"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Radar Analysis & Longitudinal Delta Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Visualization (5 cols) */}
        <div className="lg:col-span-5 athena-card p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              8-Axis Dimensional State
            </h2>
            <span className="badge-clean badge-blue font-mono text-[10px]">
              {selectedVersion === "v1" ? "v1 Active" : "v2 Active"}
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: "#64748b", fontSize: 9 }}
                />
                <Radar
                  name="Twin State"
                  dataKey="value"
                  stroke="#2563eb"
                  fill="#1d4ed8"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Metrics Matrix */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center">
            <div className="p-2 bg-slate-950 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500 uppercase">Strength</div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">{scores.strength}</div>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500 uppercase">Endurance</div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">{scores.endurance}</div>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500 uppercase">Cardio</div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">{scores.cardio}</div>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500 uppercase">Mobility</div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">{scores.mobility}</div>
            </div>
          </div>
        </div>

        {/* Longitudinal Delta Engine (7 cols) */}
        <div className="lg:col-span-7 athena-card p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Longitudinal Delta Engine
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Answers: &ldquo;How has this person changed over the last 30/90/180 days?&rdquo;
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded p-1 text-xs">
              <button
                onClick={() => setDeltaWindow(30)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  deltaWindow === 30 ? "bg-slate-800 text-white font-medium" : "text-slate-500"
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setDeltaWindow(90)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  deltaWindow === 90 ? "bg-slate-800 text-white font-medium" : "text-slate-500"
                }`}
              >
                90 Days
              </button>
              <button
                onClick={() => setDeltaWindow(180)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  deltaWindow === 180 ? "bg-slate-800 text-white font-medium" : "text-slate-500"
                }`}
              >
                180 Days
              </button>
            </div>
          </div>

          {/* Delta Changes Table */}
          <div className="space-y-2.5">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Cardiovascular Stamina</span>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-slate-500">64.0 &rarr; 68.0</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +4.0 pts
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Push-up & Squat Functional Strength</span>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-slate-500">68.0 &rarr; 72.0</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +4.0 pts
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Training Consistency Adherence</span>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-slate-500">60.0% &rarr; 76.0%</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +16.0%
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Joint Mobility & Flexibility</span>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-slate-500">62.0 &rarr; 64.0</span>
                <span className="text-blue-400 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +2.0 pts
                </span>
              </div>
            </div>
          </div>

          {/* Delta Narrative Synthesis */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              PRANA Longitudinal Synthesis
            </div>
            <p className="leading-relaxed text-slate-300">
              Over the last {deltaWindow} days, the user&apos;s physiological adaptations demonstrate consistent progressive overload. Strength and endurance metrics show positive velocity without elevated systemic fatigue. Habit consistency represents the primary driver of cardiovascular progress.
            </p>
          </div>
        </div>
      </div>

      {/* Digital Twin State Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="athena-card p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            RECOVERY STATE PILLAR
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Average Sleep Duration: <span className="text-white font-mono">7.8 hrs</span></div>
            <div>Average Readiness: <span className="text-emerald-400 font-mono">74 / 100</span></div>
            <div>Neuromuscular Fatigue: <span className="text-white font-mono">Low-Moderate</span></div>
          </div>
        </div>

        <div className="athena-card p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            NUTRITION & HYDRATION PILLAR
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Daily Calorie Maintenance: <span className="text-white font-mono">2100–2300 kcal</span></div>
            <div>Hydration Target: <span className="text-blue-400 font-mono">2,500 ml</span></div>
            <div>Macro Ratio: <span className="text-white font-mono">25% P / 50% C / 25% F</span></div>
          </div>
        </div>

        <div className="athena-card p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            GOAL & MILESTONE PILLAR
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Target: <span className="text-white">5km Pace & Core Mastery</span></div>
            <div>Milestone Progress: <span className="text-emerald-400 font-mono">68%</span></div>
            <div>Remaining Weeks: <span className="text-white font-mono">4 weeks</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
