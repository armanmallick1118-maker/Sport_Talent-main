"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Download,
  Activity,
  Heart,
  Droplet,
  Zap,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bot,
  RefreshCw,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface BiomarkerItem {
  name: string;
  category: string;
  value: number;
  unit: string;
  range: string;
  status: "optimal" | "borderline" | "elevated" | "low";
}

interface LabReportEntry {
  id: string;
  panel: string;
  date: string;
  markersCount: number;
  status: "Normal" | "Attention";
}

export const LAB_PANELS_DEF: Record<
  string,
  { name: string; unit: string; min?: number; max?: number; desc: string }[]
> = {
  "Comprehensive Athlete Panel": [
    { name: "Fasting Blood Glucose", unit: "mg/dL", min: 70, max: 99, desc: "Optimal: 70-99" },
    { name: "hs-CRP (Inflammation)", unit: "mg/L", min: 0, max: 1.0, desc: "Optimal: < 1.0" },
    { name: "Total Testosterone", unit: "ng/dL", min: 300, max: 1000, desc: "Athletic: 500-1000" },
    { name: "Vitamin D3 (25-OH)", unit: "ng/mL", min: 30, max: 80, desc: "Optimal: 40-80" },
    { name: "Cortisol (Morning)", unit: "ug/dL", min: 6.0, max: 18.4, desc: "Optimal: 6.0-18.4" },
    { name: "Hemoglobin", unit: "g/dL", min: 13.8, max: 17.5, desc: "Optimal: 13.8-17.5" },
  ],
  "Hematology (CBC)": [
    { name: "Hemoglobin (Hb)", unit: "g/dL", min: 13.5, max: 17.5, desc: "13.5 - 17.5" },
    { name: "Total RBC", unit: "mill/mcL", min: 4.5, max: 5.9, desc: "4.5 - 5.9" },
    { name: "Total WBC", unit: "cells/mcL", min: 4000, max: 11000, desc: "4,000 - 11,000" },
    { name: "Platelet Count", unit: "cells/mcL", min: 150000, max: 450000, desc: "150k - 450k" },
    { name: "Hematocrit (PCV)", unit: "%", min: 41, max: 50, desc: "41% - 50%" },
  ],
  "Diabetes (Blood Sugar)": [
    { name: "Fasting Blood Sugar (FBS)", unit: "mg/dL", min: 70, max: 99, desc: "70 - 99" },
    { name: "Hemoglobin A1c (HbA1c)", unit: "%", min: 4.0, max: 5.7, desc: "Below 5.7" },
  ],
  "Lipid Profile": [
    { name: "Total Cholesterol", unit: "mg/dL", min: 125, max: 200, desc: "125 - 200" },
    { name: "HDL Cholesterol", unit: "mg/dL", min: 50, max: 90, desc: "Above 50" },
    { name: "LDL Cholesterol", unit: "mg/dL", min: 50, max: 100, desc: "Below 100" },
    { name: "Triglycerides", unit: "mg/dL", min: 50, max: 150, desc: "Below 150" },
  ],
};

const DEFAULT_BIOMARKERS: BiomarkerItem[] = [
  { name: "Fasting Blood Glucose", category: "Metabolic", value: 88, unit: "mg/dL", range: "70 - 99", status: "optimal" },
  { name: "Total Cholesterol", category: "Lipids", value: 175, unit: "mg/dL", range: "125 - 200", status: "optimal" },
  { name: "HDL Cholesterol", category: "Lipids", value: 62, unit: "mg/dL", range: "> 50", status: "optimal" },
  { name: "LDL Cholesterol", category: "Lipids", value: 98, unit: "mg/dL", range: "< 100", status: "optimal" },
  { name: "Cortisol (Morning)", category: "Endocrine", value: 16.4, unit: "ug/dL", range: "6.0 - 18.4", status: "optimal" },
  { name: "Total Testosterone", category: "Hormonal", value: 680, unit: "ng/dL", range: "300 - 1000", status: "optimal" },
  { name: "Vitamin D (25-OH)", category: "Micronutrient", value: 44, unit: "ng/mL", range: "30 - 80", status: "optimal" },
  { name: "hs-CRP (Inflammation)", category: "Immune", value: 0.8, unit: "mg/L", range: "< 1.0", status: "optimal" },
  { name: "Hemoglobin", category: "Hematology", value: 15.2, unit: "g/dL", range: "13.8 - 17.2", status: "optimal" },
];

export const HealthHubView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"ai_report" | "lab_manager" | "matrix">("ai_report");

  // Biomarkers State
  const [biomarkers, setBiomarkers] = useState<BiomarkerItem[]>(DEFAULT_BIOMARKERS);
  const [pastReports, setPastReports] = useState<LabReportEntry[]>([
    { id: "rep-1", panel: "Comprehensive Athlete Panel", date: "2026-08-28", markersCount: 6, status: "Normal" },
    { id: "rep-2", panel: "Lipid Profile", date: "2026-07-15", markersCount: 4, status: "Normal" },
  ]);

  // AI Health Score State
  const [aiScore, setAiScore] = useState<number>(88);
  const [workoutScore, setWorkoutScore] = useState<number>(85);
  const [nutritionScore, setNutritionScore] = useState<number>(82);
  const [labHealthScore, setLabHealthScore] = useState<number>(91);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");
  const [planExpanded, setPlanExpanded] = useState<boolean>(true);

  // Form State for Adding New Report
  const [selectedPanel, setSelectedPanel] = useState<string>("Comprehensive Athlete Panel");
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [panelInputs, setPanelInputs] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("athena_health_biomarkers");
      if (saved) {
        setBiomarkers(JSON.parse(saved));
      }
      const savedReports = localStorage.getItem("athena_lab_reports");
      if (savedReports) {
        setPastReports(JSON.parse(savedReports));
      }
      const savedScore = localStorage.getItem("athena_health_score");
      if (savedScore) {
        setAiScore(parseInt(savedScore));
      }
    } catch {}
  }, []);

  // Save changes & notify dashboard
  const persistState = (newMarkers: BiomarkerItem[], newScore: number, newReps?: LabReportEntry[]) => {
    try {
      localStorage.setItem("athena_health_biomarkers", JSON.stringify(newMarkers));
      localStorage.setItem("athena_health_score", String(newScore));
      if (newReps) {
        localStorage.setItem("athena_lab_reports", JSON.stringify(newReps));
      }
      window.dispatchEvent(new Event("athena_health_updated"));
    } catch {}
  };

  const handleRunDiagnostic = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      // Dynamic score calculation based on current biomarker metrics
      const optimalCount = biomarkers.filter((b) => b.status === "optimal").length;
      const ratio = optimalCount / Math.max(1, biomarkers.length);
      const computedScore = Math.min(98, Math.max(65, Math.round(75 + ratio * 20)));
      setAiScore(computedScore);
      setLabHealthScore(Math.min(99, Math.round(80 + ratio * 18)));
      persistState(biomarkers, computedScore);
      setIsAnalyzing(false);
    }, 1800);
  };

  const handlePanelInputChange = (markerName: string, val: string) => {
    setPanelInputs((prev) => ({ ...prev, [markerName]: val }));
  };

  const handleSaveLabReport = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPanelDefs = LAB_PANELS_DEF[selectedPanel] || [];
    const newItems: BiomarkerItem[] = [];

    currentPanelDefs.forEach((def) => {
      const rawVal = panelInputs[def.name];
      if (rawVal && rawVal.trim() !== "") {
        const num = parseFloat(rawVal);
        let status: BiomarkerItem["status"] = "optimal";
        if (def.min !== undefined && num < def.min) status = "low";
        if (def.max !== undefined && num > def.max) status = "elevated";

        newItems.push({
          name: def.name,
          category: selectedPanel.split(" ")[0],
          value: num,
          unit: def.unit,
          range: def.desc,
          status,
        });
      }
    });

    if (newItems.length === 0) {
      alert("Please fill at least one biomarker value to log the panel.");
      return;
    }

    // Merge or prepend biomarkers
    const updatedMarkers = [...newItems, ...biomarkers.filter((b) => !newItems.some((n) => n.name === b.name))];
    const newRepEntry: LabReportEntry = {
      id: `rep-${Date.now()}`,
      panel: selectedPanel,
      date: testDate,
      markersCount: newItems.length,
      status: newItems.some((i) => i.status !== "optimal") ? "Attention" : "Normal",
    };
    const updatedReports = [newRepEntry, ...pastReports];

    setBiomarkers(updatedMarkers);
    setPastReports(updatedReports);
    setPanelInputs({});
    setSubmitSuccess(true);

    // Compute updated AI score
    const optimalCount = updatedMarkers.filter((b) => b.status === "optimal").length;
    const computed = Math.min(98, Math.max(70, Math.round(76 + (optimalCount / updatedMarkers.length) * 20)));
    setAiScore(computed);
    persistState(updatedMarkers, computed, updatedReports);

    setTimeout(() => setSubmitSuccess(false), 3500);
  };

  // Mock Trend Chart Data
  const dailyChartData = [
    { date: "Mon", overall: 84, workout: 80, nutrition: 82, health: 89 },
    { date: "Tue", overall: 85, workout: 82, nutrition: 83, health: 89 },
    { date: "Wed", overall: 86, workout: 84, nutrition: 80, health: 90 },
    { date: "Thu", overall: 85, workout: 81, nutrition: 82, health: 90 },
    { date: "Fri", overall: 87, workout: 85, nutrition: 84, health: 91 },
    { date: "Sat", overall: 89, workout: 88, nutrition: 85, health: 92 },
    { date: "Sun", overall: aiScore, workout: workoutScore, nutrition: nutritionScore, health: labHealthScore },
  ];

  const weeklyChartData = [
    { date: "Wk 1", overall: 81, workout: 78, nutrition: 79, health: 86 },
    { date: "Wk 2", overall: 83, workout: 81, nutrition: 80, health: 88 },
    { date: "Wk 3", overall: 86, workout: 84, nutrition: 82, health: 90 },
    { date: "Wk 4", overall: aiScore, workout: workoutScore, nutrition: nutritionScore, health: labHealthScore },
  ];

  const monthlyChartData = [
    { date: "May", overall: 78, workout: 75, nutrition: 76, health: 82 },
    { date: "Jun", overall: 81, workout: 79, nutrition: 80, health: 85 },
    { date: "Jul", overall: 84, workout: 82, nutrition: 81, health: 88 },
    { date: "Aug", overall: 86, workout: 83, nutrition: 83, health: 90 },
    { date: "Sep", overall: aiScore, workout: workoutScore, nutrition: nutritionScore, health: labHealthScore },
  ];

  const activeChartData =
    timeframe === "daily" ? dailyChartData : timeframe === "weekly" ? weeklyChartData : monthlyChartData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold tracking-wider text-purple-400 uppercase flex items-center gap-1.5 font-mono">
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            Physiological Diagnostics &bull; AI Health Hub
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            AI Health Report &amp; Lab Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Synthesizes blood panels, cellular biomarkers, and physical training into your PRANA Health Profile.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("ai_report")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "ai_report"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Health Report
          </button>
          <button
            onClick={() => setActiveTab("lab_manager")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "lab_manager"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Lab Report Manager
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "matrix"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Biomarker Matrix ({biomarkers.length})
          </button>
        </div>
      </div>

      {/* TAB 1: AI HEALTH REPORT */}
      {activeTab === "ai_report" && (
        <div className="space-y-6">
          {/* Top Score Banner + Action */}
          <div className="athena-card p-6 border-purple-500/30 bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                {/* Radial Gauge */}
                <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-slate-800"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-purple-500 transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * aiScore) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold font-mono text-white">{aiScore}</span>
                    <span className="text-[10px] text-purple-400 font-semibold uppercase">Overall</span>
                  </div>
                </div>

                {/* Score Summary */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      OPTIMAL ATHLETIC TIER
                    </span>
                    <span className="text-xs text-slate-400 font-mono">+3.2 pts this month</span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Comprehensive Health &amp; Longevity Index
                  </h2>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    AI synthesis of blood panels, hormonal endocrine balance, and kinematic activity. Systemic inflammation is low and metabolic clearance is optimal.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleRunDiagnostic}
                disabled={isAnalyzing}
                className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                {isAnalyzing ? "Calibrating Telemetry..." : "Run AI Diagnostic"}
              </button>
            </div>

            {/* 3 Pillar Sub-Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">WORKOUT PERFORMANCE</div>
                <div className="text-xl font-bold text-white mt-1 font-mono">{workoutScore} / 100</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Strong volume adherence</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">NUTRITION &amp; METABOLISM</div>
                <div className="text-xl font-bold text-white mt-1 font-mono">{nutritionScore} / 100</div>
                <div className="text-[10px] text-blue-400 mt-0.5">Optimal glucose balance</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">LAB BIOMARKER STATUS</div>
                <div className="text-xl font-bold text-white mt-1 font-mono">{labHealthScore} / 100</div>
                <div className="text-[10px] text-purple-400 mt-0.5">{biomarkers.length} markers analyzed</div>
              </div>
            </div>
          </div>

          {/* Historical Longitudinal Trends */}
          <div className="athena-card p-6 border-slate-800 bg-slate-950 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Longitudinal Health Score Trend
                </h3>
                <p className="text-xs text-slate-400">Tracking health index changes across periods</p>
              </div>

              {/* Timeframe selector */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 self-start">
                <button
                  onClick={() => setTimeframe("daily")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    timeframe === "daily" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Daily (7d)
                </button>
                <button
                  onClick={() => setTimeframe("weekly")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    timeframe === "weekly" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Weekly (4w)
                </button>
                <button
                  onClick={() => setTimeframe("monthly")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    timeframe === "monthly" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Monthly (5m)
                </button>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[60, 100]} stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                    itemStyle={{ fontSize: "12px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="overall"
                    name="Overall AI Score"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#purpleGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="health"
                    name="Lab Health"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#blueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strengths, Weaknesses, Critical Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Strengths */}
            <div className="athena-card p-5 border-slate-800 bg-slate-900/60 space-y-3">
              <div className="text-xs font-bold text-emerald-400 uppercase font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Verified Strengths
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  Low systemic inflammation (hs-CRP 0.8 mg/L)
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  High anabolic androgenic recovery (Testosterone 680 ng/dL)
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  Optimal fasting glucose &amp; insulin sensitivity (88 mg/dL)
                </li>
              </ul>
            </div>

            {/* Opportunities */}
            <div className="athena-card p-5 border-slate-800 bg-slate-900/60 space-y-3">
              <div className="text-xs font-bold text-amber-400 uppercase font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Optimization Areas
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                  Vitamin D3 (44 ng/mL) is sufficient but could be optimized to 60 ng/mL.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                  Morning hydration baseline fluctuates prior to early sprint sessions.
                </li>
              </ul>
            </div>

            {/* Critical Alert */}
            <div className="athena-card p-5 border-emerald-500/30 bg-emerald-950/10 space-y-3">
              <div className="text-xs font-bold text-emerald-400 uppercase font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Safety Status: Cleared
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Zero acute safety hazards detected. Digital Twin telemetry shows full physiological clearance for high-intensity CV kinematics, plyometrics, and sprint assessments.
              </p>
            </div>
          </div>

          {/* 7-Day AI Action Plan */}
          <div className="athena-card p-5 border-slate-800 bg-slate-950 space-y-4">
            <button
              onClick={() => setPlanExpanded(!planExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono">
                  7-Day AI Physiological &amp; Nutrition Action Plan
                </h3>
              </div>
              {planExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {planExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-purple-400 font-mono">DAYS 1 - 2: RECOVERY LOAD</div>
                  <div className="text-xs text-slate-200 font-semibold">Glycogen Re-Saturation</div>
                  <p className="text-[11px] text-slate-400">Increase complex carbs by 40g post-training to align with optimal fasting glucose.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-purple-400 font-mono">DAYS 3 - 4: STRENGTH PEAK</div>
                  <div className="text-xs text-slate-200 font-semibold">Heavy CV &amp; Kinetic Squats</div>
                  <p className="text-[11px] text-slate-400">Leverage testosterone peak for 5x5 compound sets on port 8002 CV coach.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-purple-400 font-mono">DAYS 5 - 6: AEROBIC FLUSH</div>
                  <div className="text-xs text-slate-200 font-semibold">Zone 2 Cardio &amp; Mobility</div>
                  <p className="text-[11px] text-slate-400">Keep heart rate below 145 bpm to maintain low systemic inflammation.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-purple-400 font-mono">DAY 7: LAB REVIEW</div>
                  <div className="text-xs text-slate-200 font-semibold">Telemetry Calibration</div>
                  <p className="text-[11px] text-slate-400">Update morning resting HR and log any updated micronutrient lab tests.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LAB REPORT MANAGER */}
      {activeTab === "lab_manager" && (
        <div className="space-y-6">
          <div className="athena-card p-6 border-slate-800 bg-slate-950 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white">Interactive Lab Report Entry</h2>
              <p className="text-xs text-slate-400 mt-1">
                Select a diagnostic blood panel and input your lab results. PRANA will evaluate biomarkers against clinical athletic ranges and recalibrate your AI Health Score.
              </p>
            </div>

            {submitSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Lab Report successfully recorded! AI Health Report and Dashboard updated.
              </div>
            )}

            <form onSubmit={handleSaveLabReport} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Collection / Draw Date</label>
                  <input
                    type="date"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Diagnostic Panel</label>
                  <select
                    value={selectedPanel}
                    onChange={(e) => {
                      setSelectedPanel(e.target.value);
                      setPanelInputs({});
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-purple-500 outline-none"
                  >
                    {Object.keys(LAB_PANELS_DEF).map((panel) => (
                      <option key={panel} value={panel}>
                        {panel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Biomarker Fields for Selected Panel */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-white uppercase font-mono flex items-center justify-between">
                  <span>Enter Panel Markers</span>
                  <span className="text-[11px] text-purple-400 font-normal">
                    {LAB_PANELS_DEF[selectedPanel]?.length || 0} fields available
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(LAB_PANELS_DEF[selectedPanel] || []).map((field) => {
                    const currentVal = panelInputs[field.name] || "";
                    let valNum = parseFloat(currentVal);
                    let badge = null;
                    if (!isNaN(valNum) && currentVal.trim() !== "") {
                      if (field.min !== undefined && valNum < field.min) {
                        badge = <span className="text-[10px] text-amber-400 font-mono">LOW</span>;
                      } else if (field.max !== undefined && valNum > field.max) {
                        badge = <span className="text-[10px] text-rose-400 font-mono">HIGH</span>;
                      } else {
                        badge = <span className="text-[10px] text-emerald-400 font-mono">OPTIMAL</span>;
                      }
                    }

                    return (
                      <div key={field.name} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-200">{field.name}</label>
                          {badge}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="any"
                            placeholder="Enter value"
                            value={currentVal}
                            onChange={(e) => handlePanelInputChange(field.name, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
                          />
                          <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap min-w-[50px]">
                            {field.unit}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">Reference Range: {field.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Submit Lab Report &amp; Update AI Scores
              </button>
            </form>
          </div>

          {/* Past Submitted Reports Table */}
          <div className="athena-card p-5 border-slate-800 bg-slate-950 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Logged Lab Reports History
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 font-mono">
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Panel Name</th>
                    <th className="pb-2.5">Biomarkers Tested</th>
                    <th className="pb-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono">
                  {pastReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 text-white">{rep.date}</td>
                      <td className="py-2.5 text-slate-300 font-sans">{rep.panel}</td>
                      <td className="py-2.5 text-slate-400">{rep.markersCount} Markers</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {rep.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BIOMARKER MATRIX */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="athena-card p-4 border-slate-800 bg-slate-900/80">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>METABOLIC HEALTH</span>
                <Droplet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1.5 font-mono">88 mg/dL</div>
              <div className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Fasting Glucose In Optimal Zone
              </div>
            </div>

            <div className="athena-card p-4 border-slate-800 bg-slate-900/80">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>INFLAMMATION (hs-CRP)</span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1.5 font-mono">0.8 mg/L</div>
              <div className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Low Systemic Inflammation
              </div>
            </div>

            <div className="athena-card p-4 border-slate-800 bg-slate-900/80">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>VITAMIN D3</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1.5 font-mono">44 ng/mL</div>
              <div className="text-[11px] text-blue-400 mt-1 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Sufficient Athletic Baseline
              </div>
            </div>

            <div className="athena-card p-4 border-slate-800 bg-slate-900/80">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>TOTAL TESTOSTERONE</span>
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1.5 font-mono">680 ng/dL</div>
              <div className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Anabolic Peak Calibrated
              </div>
            </div>
          </div>

          <div className="athena-card p-5 border-slate-800 bg-slate-950 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Full Biomarker Matrix Directory ({biomarkers.length} Markers)
              </div>
              <div className="text-[11px] text-slate-400 font-mono">Updated Live with Lab Manager</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800/80 font-mono">
                    <th className="pb-3 font-semibold">Biomarker</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Measured Value</th>
                    <th className="pb-3 font-semibold">Reference Range</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono">
                  {biomarkers.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 font-medium text-white font-sans">{b.name}</td>
                      <td className="py-3 text-slate-400">{b.category}</td>
                      <td className="py-3 font-bold text-white">
                        {b.value} <span className="text-[10px] text-slate-400 font-normal">{b.unit}</span>
                      </td>
                      <td className="py-3 text-slate-400">{b.range}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            b.status === "optimal"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : b.status === "low"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
