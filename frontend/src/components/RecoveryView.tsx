"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Moon,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  Info,
  TrendingUp,
  Plus,
  Heart,
  ShieldCheck,
  Sparkles,
  Save,
  RotateCcw,
  BedDouble,
  BatteryCharging,
  Flame,
  AlertTriangle,
} from "lucide-react";

interface RecoveryProps {
  readinessData?: any;
}

export const RecoveryView: React.FC<RecoveryProps> = ({ readinessData }) => {
  // State with LocalStorage persistence
  const [sleepHours, setSleepHours] = useState<number>(7.8);
  const [sleepQuality, setSleepQuality] = useState<number>(84);
  const [perceivedFatigue, setPerceivedFatigue] = useState<number>(4);
  const [trainingLoad, setTrainingLoad] = useState<number>(6);
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [hrvMs, setHrvMs] = useState<number>(72);
  const [restingHr, setRestingHr] = useState<number>(54);
  const [adherenceRate, setAdherenceRate] = useState<number>(85);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Load saved state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("prana_recovery_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sleepHours !== undefined) setSleepHours(parsed.sleepHours);
        if (parsed.sleepQuality !== undefined) setSleepQuality(parsed.sleepQuality);
        if (parsed.perceivedFatigue !== undefined) setPerceivedFatigue(parsed.perceivedFatigue);
        if (parsed.trainingLoad !== undefined) setTrainingLoad(parsed.trainingLoad);
        if (parsed.stressLevel !== undefined) setStressLevel(parsed.stressLevel);
        if (parsed.hrvMs !== undefined) setHrvMs(parsed.hrvMs);
        if (parsed.restingHr !== undefined) setRestingHr(parsed.restingHr);
        if (parsed.adherenceRate !== undefined) setAdherenceRate(parsed.adherenceRate);
      }
    } catch {}
  }, []);

  // Save current recovery log
  const handleSaveRecovery = () => {
    const dataToSave = {
      sleepHours,
      sleepQuality,
      perceivedFatigue,
      trainingLoad,
      stressLevel,
      hrvMs,
      restingHr,
      adherenceRate,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem("prana_recovery_data", JSON.stringify(dataToSave));
      window.dispatchEvent(new Event("prana_recovery_updated"));
      setSaveToast("Recovery & Sleep log successfully synchronized with Digital Twin!");
      setTimeout(() => setSaveToast(null), 3500);
    } catch {
      setSaveToast("Log saved locally.");
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  // Reset to default baseline
  const handleResetDefaults = () => {
    setSleepHours(7.8);
    setSleepQuality(84);
    setPerceivedFatigue(4);
    setTrainingLoad(6);
    setStressLevel(3);
    setHrvMs(72);
    setRestingHr(54);
    setAdherenceRate(85);
  };

  // DYNAMIC MATHEMATICAL READINESS ENGINE
  const { breakdown, totalReadiness, prescription, statusBadge } = useMemo(() => {
    // 1. Sleep Duration & Quality Delta
    // Optimal sleep 7.5 - 8.5h
    const sleepDelta = Math.round(
      ((sleepHours - 5) / 4) * 14 + ((sleepQuality - 50) / 50) * 12
    );

    // 2. Muscular Freshness (Fatigue inverted: 1 = fresh +16, 10 = exhausted 0)
    const freshnessDelta = Math.round((10 - perceivedFatigue) * 1.6);

    // 3. Prior Training Load Strain (Load 1 = -2, 10 = -16)
    const strainDelta = Math.round(-1 * (trainingLoad * 1.5));

    // 4. Systemic Stress Drag (Stress 1 = -1, 10 = -14)
    const stressDelta = Math.round(-1 * (stressLevel * 1.3));

    // 5. Autonomic HRV Bonus (Baseline 55ms, 90ms = +9, 35ms = -4)
    const hrvDelta = Math.round(((hrvMs - 55) / 35) * 7);

    // 6. Habit Adherence Consistency (+10 if >= 80%, +5 if >= 60%)
    const habitBonus = adherenceRate >= 80 ? 10 : adherenceRate >= 60 ? 5 : 0;

    const items = [
      {
        factor: "Base Physiological Baseline",
        delta: 50,
        sign: "+",
        detail: "Neutral autonomic recovery reference score",
      },
      {
        factor: "Sleep Duration & Quality",
        delta: sleepDelta,
        sign: sleepDelta >= 0 ? "+" : "",
        detail: `${sleepHours}h sleep logged with ${sleepQuality}% quality index`,
      },
      {
        factor: "Perceived Muscular Freshness",
        delta: freshnessDelta,
        sign: "+",
        detail: `Fatigue rated ${perceivedFatigue}/10 (${perceivedFatigue <= 3 ? "Very Fresh" : perceivedFatigue <= 6 ? "Moderate" : "High Strain"})`,
      },
      {
        factor: "Prior Training Load Strain",
        delta: strainDelta,
        sign: "",
        detail: `Previous workout load ${trainingLoad}/10 (${trainingLoad >= 8 ? "Severe Exertion" : "Controlled Demand"})`,
      },
      {
        factor: "Systemic Psychological Stress",
        delta: stressDelta,
        sign: "",
        detail: `Reported stress level ${stressLevel}/10`,
      },
      {
        factor: "Autonomic Balance & HRV",
        delta: hrvDelta,
        sign: hrvDelta >= 0 ? "+" : "",
        detail: `Nightly HRV ${hrvMs} ms &bull; Resting Heart Rate ${restingHr} bpm`,
      },
      {
        factor: "Weekly Adherence Consistency",
        delta: habitBonus,
        sign: "+",
        detail: `${adherenceRate}% training routine adherence`,
      },
    ];

    const rawTotal = items.reduce((acc, curr) => acc + curr.delta, 0);
    const clampedTotal = Math.min(100, Math.max(10, rawTotal));

    // Determine Prescriptions and Badges
    let badge = { text: "Optimal Recovery", color: "border-[#B7F34A]/50 bg-[#B7F34A]/10 text-[#B7F34A]" };
    let rx = {
      title: "Full Adaptive Intensity Cleared",
      recommendation: "Your nervous system and muscular tissue have restored glycogen and parasympathetic tone. Cleared for heavy compound overload, high-velocity sprints, and PR attempts.",
      focus: "Progressive Overload",
    };

    if (clampedTotal >= 82) {
      badge = { text: "Peak Athletic State", color: "border-[#B7F34A]/50 bg-[#B7F34A]/15 text-[#B7F34A]" };
      rx = {
        title: "Peak Neuromuscular Drive",
        recommendation: "Parasympathetic reserves are fully primed. Maximize high-threshold motor unit recruitment today with compound barbell movements or maximal anaerobic intervals.",
        focus: "Max Power & Overload",
      };
    } else if (clampedTotal >= 65) {
      badge = { text: "Solid Working State", color: "border-[#25D9D0]/50 bg-[#25D9D0]/15 text-[#25D9D0]" };
      rx = {
        title: "Standard Working Volume",
        recommendation: "Recovery is solid and sustainable. Execute scheduled working sets at RPE 7.5–8.5. Prioritize thorough hip and thoracic joint mobilization before lifting.",
        focus: "Hypertrophy / Stamina",
      };
    } else if (clampedTotal >= 50) {
      badge = { text: "Moderate Fatigue Drag", color: "border-amber-500/50 bg-amber-500/15 text-amber-400" };
      rx = {
        title: "Controlled Load Advisory",
        recommendation: "Cumulative muscular fatigue or sleep deficit detected. Reduce volume by 15-20%, avoid training to failure, and increase inter-set rest to 2.5 minutes.",
        focus: "Technique & Volume Cap",
      };
    } else {
      badge = { text: "High Fatigue / Deload Required", color: "border-rose-500/50 bg-rose-500/15 text-rose-400" };
      rx = {
        title: "Active Recovery Day Mandatory",
        recommendation: "Autonomic system is operating in sympathetic depletion. Avoid heavy spinal loading. Complete 20 minutes of Zone-2 cycling, light mobility, and aim for 9 hours of sleep tonight.",
        focus: "Active Flush & Sleep",
      };
    }

    return {
      breakdown: items,
      totalReadiness: clampedTotal,
      prescription: rx,
      statusBadge: badge,
    };
  }, [sleepHours, sleepQuality, perceivedFatigue, trainingLoad, stressLevel, hrvMs, restingHr, adherenceRate]);

  // Derived Bedtime & Wake Time
  const { bedtimeStr, waketimeStr, sleepDebtStr } = useMemo(() => {
    const wakeMinutes = 7 * 60; // 07:00 AM
    let bedMinutes = wakeMinutes - Math.round(sleepHours * 60);
    if (bedMinutes < 0) bedMinutes += 24 * 60;

    const bHour = Math.floor(bedMinutes / 60);
    const bMin = bedMinutes % 60;
    const bedtime = `${bHour.toString().padStart(2, "0")}:${bMin.toString().padStart(2, "0")}`;

    const debtHours = (8.0 - sleepHours).toFixed(1);
    const debt = parseFloat(debtHours) > 0 ? `+${debtHours}h Debt` : `${Math.abs(parseFloat(debtHours))}h Surplus`;

    return {
      bedtimeStr: bedtime,
      waketimeStr: "07:00",
      sleepDebtStr: debt,
    };
  }, [sleepHours]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27332D] pb-5">
        <div>
          <div className="text-xs font-semibold tracking-wider text-[#B7F34A] uppercase flex items-center gap-1.5 font-mono">
            <Moon className="w-3.5 h-3.5 text-[#B7F34A]" />
            Explainable Recovery &bull; PRANA Biometrics
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Sleep &amp; Recovery Engine
          </h1>
          <p className="text-xs text-[#A4AEA8] mt-1">
            Mathematical transparency into recovery readiness. Moving sliders dynamically recalculates your autonomic score and training prescription.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-xl border border-[#27332D] bg-[#111815] text-slate-400 hover:text-white text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset baseline values"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={handleSaveRecovery}
            className="px-4 py-1.5 rounded-xl bg-[#B7F34A] hover:bg-[#cbf774] text-[#0B100E] font-bold text-xs font-mono transition-all flex items-center gap-1.5 shadow-md shadow-[#B7F34A]/20 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Recovery Log</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-mono flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveToast}</span>
          </div>
          <button
            onClick={() => setSaveToast(null)}
            className="text-slate-400 hover:text-white text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Readiness Score Banner */}
      <div className="p-6 rounded-2xl border border-[#27332D] bg-[#0B100E] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-[#27332D] pb-5">
          <div>
            <div className="text-xs font-semibold text-[#A4AEA8] uppercase tracking-wider font-mono">
              TODAY&apos;S CALIBRATED READINESS SCORE
            </div>
            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <span className="text-5xl font-extrabold text-white font-mono tracking-tight">
                {totalReadiness}
              </span>
              <span className="text-slate-500 font-mono text-sm">/ 100</span>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ml-2 ${statusBadge.color}`}>
                {statusBadge.text}
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#111815] rounded-xl border border-[#27332D] text-xs text-slate-300 max-w-md space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-white flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-[#B7F34A]" />
                {prescription.title}
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#25D9D0]/20 text-[#25D9D0] font-bold">
                {prescription.focus}
              </span>
            </div>
            <p className="text-[11px] text-[#A4AEA8] leading-relaxed">
              {prescription.recommendation}
            </p>
          </div>
        </div>

        {/* Explainable Factor Breakdown (Live Mathematical Model) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Info className="w-3.5 h-3.5 text-[#25D9D0]" />
              MATHEMATICAL SCORE COMPOSITION (DYNAMIC &amp; EXPLAINABLE)
            </div>
            <span className="text-[11px] font-mono text-[#A4AEA8]">
              Live calculation from active sliders
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {breakdown.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-[#111815] rounded-xl border border-[#27332D] flex items-center justify-between text-xs transition-all hover:border-[#25D9D0]/40"
              >
                <div>
                  <div className="font-semibold text-white">{item.factor}</div>
                  <div className="text-[11px] text-[#A4AEA8] mt-0.5 font-mono">{item.detail}</div>
                </div>
                <div
                  className={`font-mono text-sm font-extrabold ml-3 shrink-0 ${
                    item.delta > 0
                      ? "text-[#B7F34A]"
                      : item.delta < 0
                      ? "text-rose-400"
                      : "text-slate-400"
                  }`}
                >
                  {item.sign}{item.delta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Telemetry & Adjustment Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sleep Architecture (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl border border-[#27332D] bg-[#0B100E] space-y-4">
          <div className="flex items-center justify-between border-b border-[#27332D] pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <Moon className="w-4 h-4 text-[#25D9D0]" />
              Sleep Architecture &amp; Chronobiology
            </h3>
            <span className="text-[10px] font-mono text-[#25D9D0] bg-[#25D9D0]/10 px-2 py-0.5 rounded border border-[#25D9D0]/30">
              {sleepDebtStr}
            </span>
          </div>

          <div className="space-y-4">
            {/* Sleep Duration Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#A4AEA8]">Sleep Duration Logged</span>
                <span className="font-mono text-white font-bold text-sm">{sleepHours} hrs</span>
              </div>
              <input
                type="range"
                min="4.0"
                max="10.0"
                step="0.1"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full accent-[#25D9D0] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>4.0h (Severe Deficit)</span>
                <span>7.5h–8.5h (Athletic Target)</span>
                <span>10.0h (Full Hyper-Sleep)</span>
              </div>
            </div>

            {/* Sleep Quality Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#A4AEA8]">Sleep Quality &amp; Efficiency Index</span>
                <span className="font-mono text-white font-bold text-sm">{sleepQuality}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={sleepQuality}
                onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                className="w-full accent-[#25D9D0] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>40% (Fragmented)</span>
                <span>80% (Restorative)</span>
                <span>100% (Perfect Continuity)</span>
              </div>
            </div>

            {/* Bedtime / Wake Time Derived Matrix */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 bg-[#111815] rounded-xl border border-[#27332D]">
                <div className="text-slate-400 text-[10px] font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#25D9D0]" />
                  Calculated Bedtime
                </div>
                <div className="font-mono text-white text-base font-bold mt-1">
                  {bedtimeStr}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Wind-down starts 30m prior</div>
              </div>

              <div className="p-3 bg-[#111815] rounded-xl border border-[#27332D]">
                <div className="text-slate-400 text-[10px] font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#B7F34A]" />
                  Target Wake Time
                </div>
                <div className="font-mono text-white text-base font-bold mt-1">
                  {waketimeStr}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Aligned with circadian rise</div>
              </div>
            </div>

            {/* Sleep Stages Decomposition Bar */}
            <div className="p-3.5 bg-[#111815] rounded-xl border border-[#27332D] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-white font-semibold">Sleep Stages Breakdown</span>
                <span className="text-[#A4AEA8]">{sleepHours}h Total</span>
              </div>
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-900 border border-[#27332D]">
                <div style={{ width: "22%" }} className="h-full bg-indigo-500" title="Deep Sleep (22%)"></div>
                <div style={{ width: "24%" }} className="h-full bg-[#25D9D0]" title="REM Sleep (24%)"></div>
                <div style={{ width: "48%" }} className="h-full bg-[#B7F34A]" title="Light Sleep (48%)"></div>
                <div style={{ width: "6%" }} className="h-full bg-rose-500" title="Awake / Restless (6%)"></div>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-slate-400 pt-1 text-center">
                <div><span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-1"></span>Deep 22%</div>
                <div><span className="inline-block w-2 h-2 rounded-full bg-[#25D9D0] mr-1"></span>REM 24%</div>
                <div><span className="inline-block w-2 h-2 rounded-full bg-[#B7F34A] mr-1"></span>Light 48%</div>
                <div><span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1"></span>Awake 6%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Autonomic & Training Load Telemetry (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl border border-[#27332D] bg-[#0B100E] space-y-4">
          <div className="flex items-center justify-between border-b border-[#27332D] pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <Activity className="w-4 h-4 text-[#B7F34A]" />
              Fatigue &amp; Training Strain Telemetry
            </h3>
            <span className="text-[10px] font-mono text-[#B7F34A] bg-[#B7F34A]/10 px-2 py-0.5 rounded border border-[#B7F34A]/30">
              Live Biometrics
            </span>
          </div>

          <div className="space-y-4">
            {/* Perceived Muscular Fatigue */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#A4AEA8]">Perceived Muscular Fatigue</span>
                <span className="font-mono text-white font-bold text-sm">{perceivedFatigue} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={perceivedFatigue}
                onChange={(e) => setPerceivedFatigue(parseInt(e.target.value))}
                className="w-full accent-[#B7F34A] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 (Fully Fresh)</span>
                <span>5 (Moderate Muscle Soreness)</span>
                <span>10 (Severe Exhaustion)</span>
              </div>
            </div>

            {/* Prior Training Load */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#A4AEA8]">Prior Day Training Volume &amp; Strain</span>
                <span className="font-mono text-white font-bold text-sm">{trainingLoad} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={trainingLoad}
                onChange={(e) => setTrainingLoad(parseInt(e.target.value))}
                className="w-full accent-[#B7F34A] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 (Rest / Recovery)</span>
                <span>6 (Typical Workout)</span>
                <span>10 (Competition / Max Load)</span>
              </div>
            </div>

            {/* Systemic Stress Level */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#A4AEA8]">Systemic Psychological Stress</span>
                <span className="font-mono text-white font-bold text-sm">{stressLevel} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stressLevel}
                onChange={(e) => setStressLevel(parseInt(e.target.value))}
                className="w-full accent-[#B7F34A] cursor-pointer"
              />
            </div>

            {/* Overnight HRV and Resting Heart Rate Matrix */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 bg-[#111815] rounded-xl border border-[#27332D] space-y-1">
                <div className="flex justify-between items-center text-slate-400 text-[10px] font-mono">
                  <span>Overnight HRV</span>
                  <span className="text-[#B7F34A] font-bold">{hrvMs} ms</span>
                </div>
                <input
                  type="range"
                  min="35"
                  max="100"
                  value={hrvMs}
                  onChange={(e) => setHrvMs(parseInt(e.target.value))}
                  className="w-full accent-[#B7F34A] cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">
                  {hrvMs >= 70 ? "High Vagal Tone (Restored)" : hrvMs >= 50 ? "Balanced Baseline" : "Suppressed Autonomic Tone"}
                </div>
              </div>

              <div className="p-3 bg-[#111815] rounded-xl border border-[#27332D] space-y-1">
                <div className="flex justify-between items-center text-slate-400 text-[10px] font-mono">
                  <span>Resting Heart Rate</span>
                  <span className="text-[#25D9D0] font-bold">{restingHr} bpm</span>
                </div>
                <input
                  type="range"
                  min="42"
                  max="80"
                  value={restingHr}
                  onChange={(e) => setRestingHr(parseInt(e.target.value))}
                  className="w-full accent-[#25D9D0] cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">
                  {restingHr <= 55 ? "Athletic Bradycardia (Optimal)" : "Normal Physiological Pulse"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Recovery Protocols Section */}
      <div className="p-6 rounded-2xl border border-[#27332D] bg-[#0B100E] space-y-4">
        <div className="flex items-center justify-between border-b border-[#27332D] pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
            <BatteryCharging className="w-4 h-4 text-[#B7F34A]" />
            Evidence-Based Athletic Recovery Interventions
          </h3>
          <span className="text-[11px] font-mono text-[#A4AEA8]">
            Targeted for {totalReadiness}/100 Score
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 bg-[#111815] rounded-xl border border-[#27332D] space-y-2 hover:border-[#B7F34A]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#B7F34A] uppercase font-bold">Cold Thermogenesis</span>
              <span className="text-[10px] text-slate-400 font-mono">3–5 mins</span>
            </div>
            <div className="text-xs font-bold text-white">Cold Shower / Ice Bath</div>
            <p className="text-[11px] text-[#A4AEA8] leading-relaxed">
              Vasoconstriction reduces secondary muscle damage and triggers norepinephrine release for central nervous system reset.
            </p>
          </div>

          <div className="p-4 bg-[#111815] rounded-xl border border-[#27332D] space-y-2 hover:border-[#25D9D0]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#25D9D0] uppercase font-bold">Parasympathetic Tone</span>
              <span className="text-[10px] text-slate-400 font-mono">5 mins</span>
            </div>
            <div className="text-xs font-bold text-white">Box Breathing (4-4-4-4)</div>
            <p className="text-[11px] text-[#A4AEA8] leading-relaxed">
              Slow vagal activation lowers cortisol and elevates Heart Rate Variability (HRV) prior to bedtime.
            </p>
          </div>

          <div className="p-4 bg-[#111815] rounded-xl border border-[#27332D] space-y-2 hover:border-indigo-400/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">Circadian Hygiene</span>
              <span className="text-[10px] text-slate-400 font-mono">60 mins pre-bed</span>
            </div>
            <div className="text-xs font-bold text-white">Blue Light Cutoff &bull; 19°C Room</div>
            <p className="text-[11px] text-[#A4AEA8] leading-relaxed">
              Enables natural melatonin synthesis and preserves deep slow-wave sleep cycles critical for growth hormone surge.
            </p>
          </div>

          <div className="p-4 bg-[#111815] rounded-xl border border-[#27332D] space-y-2 hover:border-amber-400/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Fascial Restoration</span>
              <span className="text-[10px] text-slate-400 font-mono">10 mins</span>
            </div>
            <div className="text-xs font-bold text-white">Targeted Myofascial Release</div>
            <p className="text-[11px] text-[#A4AEA8] leading-relaxed">
              Lowers muscle spindle tone in quadriceps, hip flexors, and thoracic spine to improve next-day mechanics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
