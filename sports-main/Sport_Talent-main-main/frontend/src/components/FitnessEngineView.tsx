"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Dumbbell,
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  ArrowRight,
  Info,
  RefreshCw,
  Sliders,
  TrendingUp,
  Cpu,
  Sparkles,
  Trash2,
  Calendar,
  Layers,
  Heart,
  Zap,
  Award,
  ShieldCheck,
} from "lucide-react";

export interface LoggedWorkout {
  id: string | number;
  title: string;
  type: "STRENGTH" | "CARDIO" | "HIIT" | "MOBILITY" | "PLYOMETRICS";
  duration: number;
  rpe: number;
  cals: number;
  sets?: number;
  reps?: number;
  loadOrDistance?: string;
  date: string;
  notes?: string;
}

interface FitnessProps {
  onAssessmentSubmitted?: (scores: any) => void;
}

const WORKOUT_PRESETS = [
  {
    title: "5x5 Barbell Back Squats & Core",
    type: "STRENGTH" as const,
    duration: 45,
    rpe: 8,
    sets: 5,
    reps: 5,
    loadOrDistance: "100 kg",
    cals: 360,
    notes: "Deep controlled eccentrics with high core brace.",
  },
  {
    title: "5km Aerobic Interval Run",
    type: "CARDIO" as const,
    duration: 28,
    rpe: 7,
    sets: 1,
    reps: 1,
    loadOrDistance: "5.0 km",
    cals: 310,
    notes: "Zone 3 threshold tempo with 1km warm-up.",
  },
  {
    title: "HIIT Tabata Kinetic Sprints",
    type: "HIIT" as const,
    duration: 20,
    rpe: 9,
    sets: 8,
    reps: 20,
    loadOrDistance: "20s on / 10s off",
    cals: 280,
    notes: "High metabolic demand with full sprint cadence.",
  },
  {
    title: "Full-Body Hip & Joint Mobility",
    type: "MOBILITY" as const,
    duration: 25,
    rpe: 4,
    sets: 3,
    reps: 12,
    loadOrDistance: "Bodyweight",
    cals: 110,
    notes: "Ankle dorsiflexion and thoracic opening flow.",
  },
  {
    title: "Upper Calisthenics Volume (Push & Pull)",
    type: "STRENGTH" as const,
    duration: 35,
    rpe: 7,
    sets: 4,
    reps: 15,
    loadOrDistance: "Bodyweight",
    cals: 260,
    notes: "Strict pushups, pull-ups, and ring dips.",
  },
];

export const FitnessEngineView: React.FC<FitnessProps> = ({
  onAssessmentSubmitted,
}) => {
  const [activeTab, setActiveTab] = useState<"calibration" | "logger">("calibration");
  const [tier, setTier] = useState<"BEGINNER" | "INTERMEDIATE" | "ATHLETE">("INTERMEDIATE");

  // User input assessment parameters (Sliders & inputs)
  const [pushups, setPushups] = useState(28);
  const [squats, setSquats] = useState(42);
  const [plankSec, setPlankSec] = useState(110);
  const [situps, setSitups] = useState(35);
  const [runKm, setRunKm] = useState(3.0);
  const [runMins, setRunMins] = useState(16.5);
  const [flexCm, setFlexCm] = useState(28.0);
  const [balanceSec, setBalanceSec] = useState(40.0);

  // Dynamic Calculated Twin Scores
  const [scores, setScores] = useState({
    strength: 72,
    endurance: 70,
    cardio: 68,
    mobility: 64,
    flexibility: 62,
    balance: 74,
    agility: 66,
    consistency: 76,
  });

  const [isSynced, setIsSynced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Workout Session Logging Form State
  const [workoutTitle, setWorkoutTitle] = useState("5x5 Barbell Back Squats & Core");
  const [workoutType, setWorkoutType] = useState<LoggedWorkout["type"]>("STRENGTH");
  const [workoutDuration, setWorkoutDuration] = useState(45);
  const [workoutRPE, setWorkoutRPE] = useState(8);
  const [workoutSets, setWorkoutSets] = useState(5);
  const [workoutReps, setWorkoutReps] = useState(5);
  const [workoutLoad, setWorkoutLoad] = useState("100 kg");
  const [workoutNotes, setWorkoutNotes] = useState("Deep controlled eccentrics with high core brace.");
  const [logSuccess, setLogSuccess] = useState(false);

  // Logged Workouts State
  const [loggedWorkouts, setLoggedWorkouts] = useState<LoggedWorkout[]>([]);

  // Load saved workouts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("athena_logged_workouts");
      if (saved) {
        setLoggedWorkouts(JSON.parse(saved));
      } else {
        const initial: LoggedWorkout[] = [
          {
            id: "init-1",
            title: "Tempo Run & Strides",
            type: "CARDIO",
            duration: 30,
            rpe: 7,
            cals: 270,
            sets: 1,
            reps: 1,
            loadOrDistance: "4.5 km",
            date: "Yesterday at 07:15 AM",
            notes: "Aerobic recovery pace with 4x100m strides.",
          },
          {
            id: "init-2",
            title: "Lower Body Stability & Mobility",
            type: "MOBILITY",
            duration: 25,
            rpe: 5,
            cals: 130,
            sets: 3,
            reps: 12,
            loadOrDistance: "Bodyweight",
            date: "3 days ago",
            notes: "Pigeon poses and deep Cossack squats.",
          },
        ];
        setLoggedWorkouts(initial);
      }
    } catch {}
  }, []);

  // Persist workouts
  const persistWorkouts = (workouts: LoggedWorkout[]) => {
    setLoggedWorkouts(workouts);
    try {
      localStorage.setItem("athena_logged_workouts", JSON.stringify(workouts));
      window.dispatchEvent(new Event("athena_workout_updated"));
    } catch {}
  };

  // Real-Time Dynamic Calculation whenever parameters change
  useEffect(() => {
    const tierDiv = tier === "BEGINNER" ? 0.8 : tier === "INTERMEDIATE" ? 1.0 : 1.3;

    // Strength: Pushups (50%) + Squats (50%)
    const rawStrength = (pushups * 1.3 + squats * 0.8) / tierDiv;
    const calcStrength = Math.round(Math.min(99, Math.max(35, rawStrength)));

    // Endurance: Plank duration (60%) + Situps (40%)
    const rawEndurance = (plankSec * 0.4 + situps * 0.9) / tierDiv;
    const calcEndurance = Math.round(Math.min(99, Math.max(35, rawEndurance)));

    // Cardio: Speed in km/h = (km / (mins/60))
    const paceSpeed = runKm / Math.max(0.1, runMins / 60);
    const rawCardio = (paceSpeed * 6.8) / tierDiv;
    const calcCardio = Math.round(Math.min(99, Math.max(35, rawCardio)));

    // Flexibility & Mobility: Sit & reach
    const rawFlex = (flexCm * 2.2) / tierDiv;
    const calcFlex = Math.round(Math.min(99, Math.max(35, rawFlex)));
    const calcMobility = Math.round(Math.min(99, Math.max(35, rawFlex + 4)));

    // Balance & Agility
    const rawBalance = (balanceSec * 1.8) / tierDiv;
    const calcBalance = Math.round(Math.min(99, Math.max(35, rawBalance)));
    const calcAgility = Math.round(Math.min(99, Math.max(35, rawBalance - 6)));

    // Consistency based on logged workouts
    const calcConsistency = Math.min(98, 68 + loggedWorkouts.length * 4);

    const newScores = {
      strength: calcStrength,
      endurance: calcEndurance,
      cardio: calcCardio,
      mobility: calcMobility,
      flexibility: calcFlex,
      balance: calcBalance,
      agility: calcAgility,
      consistency: calcConsistency,
    };

    setScores(newScores);

    if (onAssessmentSubmitted) {
      onAssessmentSubmitted(newScores);
    }
  }, [pushups, squats, plankSec, situps, runKm, runMins, flexCm, balanceSec, tier, loggedWorkouts.length]);

  const handleSyncTwin = async () => {
    setIsSubmitting(true);
    try {
      if (onAssessmentSubmitted) {
        onAssessmentSubmitted(scores);
      }
      localStorage.setItem("athena_twin_scores", JSON.stringify(scores));
      setIsSynced(true);
      setTimeout(() => setIsSynced(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate dynamic calories burned based on duration and RPE intensity
  const estimatedCalories = Math.round(
    workoutDuration * (workoutRPE >= 8 ? 8.5 : workoutRPE >= 6 ? 7.0 : 4.8)
  );

  const handleSelectPreset = (p: typeof WORKOUT_PRESETS[0]) => {
    setWorkoutTitle(p.title);
    setWorkoutType(p.type);
    setWorkoutDuration(p.duration);
    setWorkoutRPE(p.rpe);
    setWorkoutSets(p.sets);
    setWorkoutReps(p.reps);
    setWorkoutLoad(p.loadOrDistance);
    setWorkoutNotes(p.notes);
  };

  const handleLogWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutTitle.trim()) {
      alert("Please enter a session title.");
      return;
    }

    const newWorkout: LoggedWorkout = {
      id: `wkt-${Date.now()}`,
      title: workoutTitle,
      type: workoutType,
      duration: workoutDuration,
      rpe: workoutRPE,
      cals: estimatedCalories,
      sets: workoutSets,
      reps: workoutReps,
      loadOrDistance: workoutLoad,
      date: "Today at " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      notes: workoutNotes,
    };

    const updated = [newWorkout, ...loggedWorkouts];
    persistWorkouts(updated);
    setLogSuccess(true);
    setTimeout(() => setLogSuccess(false), 3000);
  };

  const handleDeleteWorkout = (id: string | number) => {
    const updated = loggedWorkouts.filter((w) => w.id !== id);
    persistWorkouts(updated);
  };

  // Summary ribbon metrics
  const totalDuration = loggedWorkouts.reduce((sum, w) => sum + w.duration, 0);
  const totalCals = loggedWorkouts.reduce((sum, w) => sum + w.cals, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold tracking-wider text-blue-500 uppercase flex items-center gap-1.5 font-mono">
            <Activity className="w-3.5 h-3.5" />
            Biomechanical Assessment &bull; Training Session Hub
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Dynamic Fitness Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time physical parameter calibration, session activity logging, and reactive Digital Twin synchronization.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("calibration")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "calibration"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Vector Calibration
          </button>
          <button
            onClick={() => setActiveTab("logger")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "logger"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            Log Training Session ({loggedWorkouts.length})
          </button>
        </div>
      </div>

      {/* TAB 1: BIOMECHANICAL PARAMETER CALIBRATION */}
      {activeTab === "calibration" && (
        <div className="space-y-6">
          {/* Sync Header & Live Vector Output */}
          <div className="athena-card p-5 border-blue-500/30 bg-blue-950/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Live Digital Twin Vector Output (Real-Time Reactive)
                </span>
              </div>
              <button
                onClick={handleSyncTwin}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 shrink-0"
              >
                {isSynced ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <RefreshCw className="w-4 h-4" />}
                {isSynced ? "My Twin Calibrated!" : "Sync & Recalibrate My Twin"}
              </button>
            </div>

            {/* 8 Vectors Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 text-center">
              {Object.entries(scores).map(([k, v]) => (
                <div key={k} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">{k}</div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">{v}</div>
                  <div className="text-[9px] text-emerald-400 mt-0.5 font-semibold">
                    {v >= 75 ? "ELITE" : v >= 60 ? "OPTIMAL" : "BUILD"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tier Selector Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs font-semibold text-slate-300 font-mono">Calibrated Assessment Tier:</div>
            <div className="flex gap-1.5">
              {(["BEGINNER", "INTERMEDIATE", "ATHLETE"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    tier === t
                      ? "bg-blue-600 text-white font-bold shadow-sm"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Quadrant Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Strength */}
            <div className="athena-card p-5 space-y-4 border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-blue-400 uppercase font-mono flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5" />
                  Upper &amp; Lower Kinetic Power
                </span>
                <span className="text-xs font-mono text-white font-bold">{scores.strength} PTS</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Push-Ups (Max Unbroken Reps)</span>
                    <span className="font-mono text-white font-bold">{pushups} reps</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={80}
                    value={pushups}
                    onChange={(e) => setPushups(parseInt(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Full-Depth Bodyweight Squats</span>
                    <span className="font-mono text-white font-bold">{squats} reps</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={squats}
                    onChange={(e) => setSquats(parseInt(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Core & Isometric Endurance */}
            <div className="athena-card p-5 space-y-4 border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Core &amp; Isometric Stamina
                </span>
                <span className="text-xs font-mono text-white font-bold">{scores.endurance} PTS</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Prone Forearm Plank Hold</span>
                    <span className="font-mono text-white font-bold">{plankSec} sec</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={240}
                    step={5}
                    value={plankSec}
                    onChange={(e) => setPlankSec(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Controlled Sit-Ups (1-Min)</span>
                    <span className="font-mono text-white font-bold">{situps} reps</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={situps}
                    onChange={(e) => setSitups(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Aerobic Cardio */}
            <div className="athena-card p-5 space-y-4 border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase font-mono flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Aerobic Output &amp; Pace
                </span>
                <span className="text-xs font-mono text-white font-bold">{scores.cardio} PTS</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Run Distance</span>
                    <span className="font-mono text-white font-bold">{runKm.toFixed(1)} km</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={0.5}
                    value={runKm}
                    onChange={(e) => setRunKm(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Completion Time</span>
                    <span className="font-mono text-white font-bold">{runMins.toFixed(1)} mins</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={75}
                    step={0.5}
                    value={runMins}
                    onChange={(e) => setRunMins(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Mobility & Balance */}
            <div className="athena-card p-5 space-y-4 border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-400 uppercase font-mono flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Flexibility &amp; Balance Proprioception
                </span>
                <span className="text-xs font-mono text-white font-bold">
                  {Math.round((scores.flexibility + scores.balance) / 2)} PTS
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Sit &amp; Reach Reach Distance</span>
                    <span className="font-mono text-white font-bold">{flexCm} cm</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={50}
                    value={flexCm}
                    onChange={(e) => setFlexCm(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Single Leg Stance (Eyes Closed)</span>
                    <span className="font-mono text-white font-bold">{balanceSec} sec</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    value={balanceSec}
                    onChange={(e) => setBalanceSec(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRAINING SESSION LOGGER & DIARY */}
      {activeTab === "logger" && (
        <div className="space-y-6">
          {/* Stats Ribbon */}
          <div className="athena-card p-4 border-purple-500/30 bg-purple-950/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Sessions Logged</div>
                <div className="text-2xl font-bold font-mono text-white mt-1">{loggedWorkouts.length}</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Rolling Ledger</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Total Volume</div>
                <div className="text-2xl font-bold font-mono text-blue-400 mt-1">{totalDuration} min</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Training Time</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Energy Burned</div>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{totalCals} kcal</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Estimated Expenditure</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Consistency Score</div>
                <div className="text-2xl font-bold font-mono text-purple-400 mt-1">{scores.consistency}%</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Active Adherence</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Quick Presets & Session Entry Form (7 cols) */}
            <div className="lg:col-span-7 athena-card p-5 space-y-4 border-slate-800 bg-slate-950">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Record Completed Workout Session
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pick an athletic preset or enter your custom sets, reps, and perceived exertion.
                </p>
              </div>

              {/* Quick Athletic Presets */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono mb-2">
                  1-Click Athletic Presets:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {WORKOUT_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-all text-left flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                      <span>{p.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {logSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Training session recorded! Consistency score updated in your Digital Twin.
                </div>
              )}

              <form onSubmit={handleLogWorkout} className="space-y-4 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Session Title / Primary Exercise</label>
                  <input
                    type="text"
                    value={workoutTitle}
                    onChange={(e) => setWorkoutTitle(e.target.value)}
                    placeholder="e.g. 5x5 Barbell Back Squats & Core"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-purple-500 outline-none"
                  />
                </div>

                {/* Category Pills */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5">Discipline / Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(["STRENGTH", "CARDIO", "HIIT", "MOBILITY", "PLYOMETRICS"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setWorkoutType(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                          workoutType === cat
                            ? "bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30"
                            : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kinetic Details: Sets, Reps, Load / Distance */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Sets</label>
                    <input
                      type="number"
                      value={workoutSets}
                      onChange={(e) => setWorkoutSets(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Reps / Rounds</label>
                    <input
                      type="number"
                      value={workoutReps}
                      onChange={(e) => setWorkoutReps(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Load / Distance</label>
                    <input
                      type="text"
                      value={workoutLoad}
                      onChange={(e) => setWorkoutLoad(e.target.value)}
                      placeholder="e.g. 100 kg or 5km"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Duration & Live Calorie Burn */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={workoutDuration}
                      onChange={(e) => setWorkoutDuration(parseInt(e.target.value) || 10)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Calculated Energy Burn</label>
                    <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold font-mono">
                      ~{estimatedCalories} kcal
                    </div>
                  </div>
                </div>

                {/* RPE Exertion Visual Slider */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Perceived Exertion (RPE Intensity)</span>
                    <span className="font-mono text-purple-400 font-bold">
                      {workoutRPE} / 10 &bull;{" "}
                      {workoutRPE <= 4
                        ? "Light Aerobic"
                        : workoutRPE <= 6
                        ? "Moderate Base"
                        : workoutRPE <= 8
                        ? "Hard Working Effort"
                        : "Near Maximum Effort"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={workoutRPE}
                    onChange={(e) => setWorkoutRPE(parseInt(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1 (Warmup)</span>
                    <span>5 (Moderate)</span>
                    <span>8 (Strenuous)</span>
                    <span>10 (Max Limit)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Kinematic Notes &amp; Observations</label>
                  <input
                    type="text"
                    value={workoutNotes}
                    onChange={(e) => setWorkoutNotes(e.target.value)}
                    placeholder="e.g. Clean form, knee tracking stable"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Log Workout Session to Ledger
                </button>
              </form>
            </div>

            {/* Right: Workout Ledger / Diary (5 cols) */}
            <div className="lg:col-span-5 athena-card p-5 space-y-4 border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Training Session Diary
                </h3>
                <span className="text-xs text-purple-400 font-mono font-semibold">
                  {loggedWorkouts.length} Logged
                </span>
              </div>

              {loggedWorkouts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No sessions logged yet. Pick a preset on the left to record your first workout.
                </div>
              ) : (
                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {loggedWorkouts.map((w) => (
                    <div
                      key={w.id}
                      className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                                w.type === "STRENGTH"
                                  ? "bg-blue-950 text-blue-400 border border-blue-800"
                                  : w.type === "CARDIO"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : w.type === "HIIT"
                                  ? "bg-rose-950 text-rose-400 border border-rose-800"
                                  : "bg-amber-950 text-amber-400 border border-amber-800"
                              }`}
                            >
                              {w.type}
                            </span>
                            <span className="text-xs font-bold text-white">{w.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">{w.date}</div>
                        </div>

                        <button
                          onClick={() => handleDeleteWorkout(w.id)}
                          className="p-1 hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono text-[11px]">
                        <div className="p-1.5 rounded bg-slate-950 border border-slate-800/80">
                          <span className="text-slate-400 block text-[9px]">DURATION</span>
                          <span className="text-white font-bold">{w.duration}m</span>
                        </div>
                        <div className="p-1.5 rounded bg-slate-950 border border-slate-800/80">
                          <span className="text-slate-400 block text-[9px]">BURNED</span>
                          <span className="text-emerald-400 font-bold">{w.cals} kcal</span>
                        </div>
                        <div className="p-1.5 rounded bg-slate-950 border border-slate-800/80">
                          <span className="text-slate-400 block text-[9px]">RPE</span>
                          <span className="text-purple-400 font-bold">{w.rpe}/10</span>
                        </div>
                      </div>

                      {w.loadOrDistance && (
                        <div className="text-[11px] text-slate-300 font-mono">
                          Parameters: <span className="text-white font-semibold">{w.sets || 1} sets &times; {w.reps || 1} reps ({w.loadOrDistance})</span>
                        </div>
                      )}

                      {w.notes && (
                        <div className="text-[11px] text-slate-400 italic">
                          &ldquo;{w.notes}&rdquo;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
