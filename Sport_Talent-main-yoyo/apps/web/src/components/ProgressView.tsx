"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Clock,
  Calendar,
  Activity,
  CheckCircle2,
  Info,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Moon,
  Scale,
  Heart,
  Award,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type TimePeriod = "7_DAYS" | "30_DAYS" | "90_DAYS" | "6_MONTHS" | "1_YEAR";
type MetricDimension = "composite" | "strength" | "cardio" | "body_comp";

interface ProgressCheckIn {
  id: string;
  date: string;
  weightKg: number;
  restingHr: number;
  readinessScore: number;
  fitnessScore: number;
  note: string;
}

export const ProgressView: React.FC = () => {
  const [period, setPeriod] = useState<TimePeriod>("30_DAYS");
  const [metricDim, setMetricDim] = useState<MetricDimension>("composite");

  // Check-in form state
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split("T")[0]);
  const [checkInWeight, setCheckInWeight] = useState("74.2");
  const [checkInHr, setCheckInHr] = useState("58");
  const [checkInReadiness, setCheckInReadiness] = useState("78");
  const [checkInFitness, setCheckInFitness] = useState("80");
  const [checkInNote, setCheckInNote] = useState("Kinematic CV session felt strong with balanced recovery.");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Stored check-ins
  const [checkIns, setCheckIns] = useState<ProgressCheckIn[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("athena_progress_checkins");
      if (saved) {
        setCheckIns(JSON.parse(saved));
      } else {
        const initial: ProgressCheckIn[] = [
          {
            id: "chk-1",
            date: "2026-08-15",
            weightKg: 75.8,
            restingHr: 62,
            readinessScore: 70,
            fitnessScore: 72,
            note: "Baseline check-in. Initiating 8-week volume cycle.",
          },
          {
            id: "chk-2",
            date: "2026-08-25",
            weightKg: 75.0,
            restingHr: 60,
            readinessScore: 74,
            fitnessScore: 75,
            note: "Resting HR dropped by 2 bpm. Improved aerobic endurance.",
          },
          {
            id: "chk-3",
            date: "2026-09-04",
            weightKg: 74.2,
            restingHr: 58,
            readinessScore: 78,
            fitnessScore: 79,
            note: "Squat form consistency on Port 8002 CV coach reached 91%.",
          },
        ];
        setCheckIns(initial);
      }
    } catch {}
  }, []);

  const persistCheckIns = (items: ProgressCheckIn[]) => {
    setCheckIns(items);
    try {
      localStorage.setItem("athena_progress_checkins", JSON.stringify(items));
    } catch {}
  };

  const handleSaveCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: ProgressCheckIn = {
      id: `chk-${Date.now()}`,
      date: checkInDate,
      weightKg: parseFloat(checkInWeight) || 74.0,
      restingHr: parseInt(checkInHr) || 60,
      readinessScore: parseInt(checkInReadiness) || 75,
      fitnessScore: parseInt(checkInFitness) || 78,
      note: checkInNote,
    };

    persistCheckIns([newEntry, ...checkIns]);
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setShowCheckInModal(false);
    }, 1500);
  };

  const handleDeleteCheckIn = (id: string) => {
    persistCheckIns(checkIns.filter((c) => c.id !== id));
  };

  // Generate dynamic chart data based on active period and metric dimension
  const getDynamicChartData = () => {
    switch (period) {
      case "7_DAYS":
        return [
          { date: "Mon", fitness: 76, readiness: 74, consistency: 72, powerWatts: 240, squatLoad: 95, rhr: 60, weight: 74.6, hsCrp: 0.9 },
          { date: "Tue", fitness: 76, readiness: 75, consistency: 75, powerWatts: 245, squatLoad: 95, rhr: 59, weight: 74.5, hsCrp: 0.9 },
          { date: "Wed", fitness: 77, readiness: 72, consistency: 75, powerWatts: 242, squatLoad: 97.5, rhr: 61, weight: 74.4, hsCrp: 0.8 },
          { date: "Thu", fitness: 77, readiness: 78, consistency: 78, powerWatts: 250, squatLoad: 97.5, rhr: 58, weight: 74.3, hsCrp: 0.8 },
          { date: "Fri", fitness: 78, readiness: 76, consistency: 80, powerWatts: 255, squatLoad: 100, rhr: 58, weight: 74.3, hsCrp: 0.8 },
          { date: "Sat", fitness: 79, readiness: 74, consistency: 82, powerWatts: 258, squatLoad: 100, rhr: 59, weight: 74.2, hsCrp: 0.7 },
          { date: "Sun", fitness: 80, readiness: 80, consistency: 85, powerWatts: 262, squatLoad: 102.5, rhr: 57, weight: 74.1, hsCrp: 0.7 },
        ];
      case "30_DAYS":
        return [
          { date: "Day 1", fitness: 72, readiness: 70, consistency: 65, powerWatts: 230, squatLoad: 90, rhr: 62, weight: 75.8, hsCrp: 1.1 },
          { date: "Day 6", fitness: 73, readiness: 72, consistency: 68, powerWatts: 235, squatLoad: 92.5, rhr: 61, weight: 75.4, hsCrp: 1.0 },
          { date: "Day 12", fitness: 74, readiness: 71, consistency: 72, powerWatts: 240, squatLoad: 95, rhr: 61, weight: 75.0, hsCrp: 0.9 },
          { date: "Day 18", fitness: 76, readiness: 76, consistency: 76, powerWatts: 248, squatLoad: 97.5, rhr: 59, weight: 74.7, hsCrp: 0.8 },
          { date: "Day 24", fitness: 78, readiness: 75, consistency: 80, powerWatts: 254, squatLoad: 100, rhr: 58, weight: 74.4, hsCrp: 0.8 },
          { date: "Day 30", fitness: 80, readiness: 78, consistency: 84, powerWatts: 260, squatLoad: 102.5, rhr: 58, weight: 74.2, hsCrp: 0.7 },
        ];
      case "90_DAYS":
        return [
          { date: "Wk 1", fitness: 68, readiness: 68, consistency: 60, powerWatts: 215, squatLoad: 85, rhr: 64, weight: 76.5, hsCrp: 1.3 },
          { date: "Wk 3", fitness: 70, readiness: 71, consistency: 65, powerWatts: 225, squatLoad: 87.5, rhr: 63, weight: 76.0, hsCrp: 1.2 },
          { date: "Wk 5", fitness: 73, readiness: 73, consistency: 70, powerWatts: 235, squatLoad: 92.5, rhr: 61, weight: 75.4, hsCrp: 1.0 },
          { date: "Wk 7", fitness: 75, readiness: 74, consistency: 75, powerWatts: 245, squatLoad: 95, rhr: 60, weight: 75.0, hsCrp: 0.9 },
          { date: "Wk 9", fitness: 77, readiness: 76, consistency: 80, powerWatts: 252, squatLoad: 100, rhr: 59, weight: 74.6, hsCrp: 0.8 },
          { date: "Wk 12", fitness: 80, readiness: 78, consistency: 84, powerWatts: 260, squatLoad: 102.5, rhr: 58, weight: 74.2, hsCrp: 0.7 },
        ];
      case "6_MONTHS":
        return [
          { date: "Month 1", fitness: 64, readiness: 66, consistency: 55, powerWatts: 200, squatLoad: 80, rhr: 66, weight: 77.2, hsCrp: 1.4 },
          { date: "Month 2", fitness: 68, readiness: 69, consistency: 62, powerWatts: 215, squatLoad: 85, rhr: 64, weight: 76.5, hsCrp: 1.2 },
          { date: "Month 3", fitness: 72, readiness: 71, consistency: 68, powerWatts: 230, squatLoad: 90, rhr: 62, weight: 75.8, hsCrp: 1.0 },
          { date: "Month 4", fitness: 75, readiness: 74, consistency: 74, powerWatts: 245, squatLoad: 95, rhr: 60, weight: 75.2, hsCrp: 0.9 },
          { date: "Month 5", fitness: 78, readiness: 76, consistency: 80, powerWatts: 255, squatLoad: 100, rhr: 59, weight: 74.6, hsCrp: 0.8 },
          { date: "Month 6", fitness: 80, readiness: 78, consistency: 85, powerWatts: 262, squatLoad: 102.5, rhr: 57, weight: 74.2, hsCrp: 0.7 },
        ];
      case "1_YEAR":
        return [
          { date: "Oct", fitness: 60, readiness: 64, consistency: 50, powerWatts: 190, squatLoad: 75, rhr: 68, weight: 78.0, hsCrp: 1.6 },
          { date: "Dec", fitness: 65, readiness: 67, consistency: 58, powerWatts: 205, squatLoad: 82.5, rhr: 65, weight: 77.0, hsCrp: 1.3 },
          { date: "Feb", fitness: 70, readiness: 71, consistency: 66, powerWatts: 225, squatLoad: 87.5, rhr: 63, weight: 76.2, hsCrp: 1.1 },
          { date: "Apr", fitness: 74, readiness: 73, consistency: 72, powerWatts: 240, squatLoad: 92.5, rhr: 61, weight: 75.5, hsCrp: 1.0 },
          { date: "Jun", fitness: 77, readiness: 76, consistency: 79, powerWatts: 252, squatLoad: 97.5, rhr: 59, weight: 74.8, hsCrp: 0.8 },
          { date: "Aug", fitness: 80, readiness: 78, consistency: 85, powerWatts: 262, squatLoad: 102.5, rhr: 57, weight: 74.2, hsCrp: 0.7 },
        ];
    }
  };

  const chartData = getDynamicChartData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold tracking-wider text-blue-500 uppercase flex items-center gap-1.5 font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            Longitudinal Physiological Progression
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Progress &amp; Trend Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Multi-horizon trajectory tracking across physical fitness, cardiovascular output, kinetic strength, and body composition.
          </p>
        </div>

        {/* Action Button: Log Check-In */}
        <button
          onClick={() => setShowCheckInModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Log Progress Check-In
        </button>
      </div>

      {/* Check-In Modal Form */}
      {showCheckInModal && (
        <div className="athena-card p-6 border-blue-500/30 bg-slate-950 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase">Record Physical Check-In</h3>
            </div>
            <button
              onClick={() => setShowCheckInModal(false)}
              className="text-xs text-slate-500 hover:text-white"
            >
              Cancel
            </button>
          </div>

          {submitSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Check-in recorded! Longitudinal trajectory updated.
            </div>
          )}

          <form onSubmit={handleSaveCheckIn} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Body Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={checkInWeight}
                  onChange={(e) => setCheckInWeight(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Resting Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={checkInHr}
                  onChange={(e) => setCheckInHr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Subjective Energy (1-100)</label>
                <input
                  type="number"
                  value={checkInReadiness}
                  onChange={(e) => setCheckInReadiness(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Milestone Notes &amp; Observations</label>
              <input
                type="text"
                placeholder="e.g. Completed 5k in 22m, knee alignment improved"
                value={checkInNote}
                onChange={(e) => setCheckInNote(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Save Check-In &amp; Calibrate Trajectory
            </button>
          </form>
        </div>
      )}

      {/* Timeframe & Metric Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
        {/* Timeframe selector */}
        <div className="flex flex-wrap gap-1.5">
          {(["7_DAYS", "30_DAYS", "90_DAYS", "6_MONTHS", "1_YEAR"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                period === p
                  ? "bg-blue-600 border-blue-500 text-white font-semibold shadow-sm"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {p.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Metric Dimension selector */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setMetricDim("composite")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              metricDim === "composite" ? "bg-slate-800 text-blue-400 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            Composite
          </button>
          <button
            onClick={() => setMetricDim("strength")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              metricDim === "strength" ? "bg-slate-800 text-emerald-400 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            Strength &amp; Power
          </button>
          <button
            onClick={() => setMetricDim("cardio")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              metricDim === "cardio" ? "bg-slate-800 text-amber-400 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            Cardio Output
          </button>
          <button
            onClick={() => setMetricDim("body_comp")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              metricDim === "body_comp" ? "bg-slate-800 text-purple-400 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            Body &amp; Biomarkers
          </button>
        </div>
      </div>

      {/* Trend Status Tags Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="athena-card p-4">
          <div className="text-[11px] text-slate-400 uppercase font-medium">Cardiovascular Stamina</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="badge-clean badge-emerald font-semibold">IMPROVING</span>
            <span className="text-xs font-mono text-white">+5.2%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Steady pace gain over {period.replace("_", " ")}</div>
        </div>

        <div className="athena-card p-4">
          <div className="text-[11px] text-slate-400 uppercase font-medium">Functional Strength</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="badge-clean badge-emerald font-semibold">IMPROVING</span>
            <span className="text-xs font-mono text-white">+6.8%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Upper &amp; core stamina calibration</div>
        </div>

        <div className="athena-card p-4">
          <div className="text-[11px] text-slate-400 uppercase font-medium">Recovery &amp; Sleep</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="badge-clean badge-blue font-semibold">STABLE</span>
            <span className="text-xs font-mono text-white">7.8h avg</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Consistent nocturnal restoration</div>
        </div>

        <div className="athena-card p-4">
          <div className="text-[11px] text-slate-400 uppercase font-medium">Habit Consistency</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="badge-clean badge-emerald font-semibold">IMPROVING</span>
            <span className="text-xs font-mono text-white">82%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Multi-cycle adherence score</div>
        </div>
      </div>

      {/* Main Longitudinal Trajectory Graph */}
      <div className="athena-card p-6 border-slate-800 bg-slate-950 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
            Longitudinal Trajectory ({period.replace("_", " ")}) &bull; {metricDim.toUpperCase()}
          </h2>
          <div className="text-xs text-slate-400 font-mono">
            {chartData.length} checkpoints plotted
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: "8px", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />

              {metricDim === "composite" && (
                <>
                  <Line type="monotone" dataKey="fitness" name="Fitness Score" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="readiness" name="Readiness Score" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="consistency" name="Consistency %" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" />
                </>
              )}

              {metricDim === "strength" && (
                <>
                  <Line type="monotone" dataKey="powerWatts" name="Power Output (Watts)" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="squatLoad" name="Squat Working Load (kg)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </>
              )}

              {metricDim === "cardio" && (
                <>
                  <Line type="monotone" dataKey="fitness" name="Cardio Stamina Score" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="rhr" name="Resting Heart Rate (bpm)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </>
              )}

              {metricDim === "body_comp" && (
                <>
                  <Line type="monotone" dataKey="weight" name="Body Weight (kg)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="hsCrp" name="hs-CRP Inflammation (mg/L)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recorded Progress Check-Ins History Table */}
      <div className="athena-card p-5 border-slate-800 bg-slate-950 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Logged Check-In Telemetry ({checkIns.length} Check-Ins)
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Persisted Locally</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 font-mono">
                <th className="pb-2.5">Date</th>
                <th className="pb-2.5">Weight</th>
                <th className="pb-2.5">Resting HR</th>
                <th className="pb-2.5">Readiness</th>
                <th className="pb-2.5">Fitness</th>
                <th className="pb-2.5">Observations</th>
                <th className="pb-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              {checkIns.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 text-white">{item.date}</td>
                  <td className="py-2.5 text-amber-400 font-bold">{item.weightKg} kg</td>
                  <td className="py-2.5 text-rose-400">{item.restingHr} bpm</td>
                  <td className="py-2.5 text-emerald-400">{item.readinessScore} / 100</td>
                  <td className="py-2.5 text-blue-400">{item.fitnessScore} / 100</td>
                  <td className="py-2.5 text-slate-300 font-sans max-w-xs truncate">{item.note}</td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => handleDeleteCheckIn(item.id)}
                      className="p-1 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete check-in"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
