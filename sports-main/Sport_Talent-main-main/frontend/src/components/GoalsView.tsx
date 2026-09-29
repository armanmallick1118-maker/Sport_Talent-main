"use client";

import React, { useState, useEffect } from "react";
import {
  Target,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  TrendingUp,
  Award,
  Zap,
  Flame,
  Check,
  Edit3,
  Trash2,
  ChevronRight,
  Sparkles,
  RefreshCw,
  X,
  Dumbbell,
  Heart,
  Activity,
  Compass,
} from "lucide-react";

export interface Milestone {
  id: string;
  week: number;
  label: string;
  targetMetric?: string;
  completed: boolean;
}

export interface GoalItem {
  id: string;
  title: string;
  category: "ENDURANCE" | "STRENGTH" | "MOBILITY" | "BODY_COMP" | "AGILITY" | "RECOVERY";
  target: string;
  current: string;
  baseline: string;
  unit: string;
  timeline_weeks: number;
  current_week: number;
  progress_percentage: number;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  milestones: Milestone[];
  weekly_actions: string[];
  notes?: string;
  createdAt: string;
}

const DEFAULT_GOALS: GoalItem[] = [
  {
    id: "goal_5k_run",
    title: "Sub-24 Min 5km Run & Aerobic Threshold",
    category: "ENDURANCE",
    target: "24.0",
    current: "27.5",
    baseline: "32.0",
    unit: "mins",
    timeline_weeks: 8,
    current_week: 4,
    progress_percentage: 56,
    status: "ACTIVE",
    milestones: [
      { id: "m1", week: 2, label: "Pacing Consistency & 3km Baseline (Sub-17 min)", completed: true },
      { id: "m2", week: 4, label: "Continuous 5km aerobic run at under 28:00 pace", completed: true },
      { id: "m3", week: 6, label: "Interval Stamina: 5x800m repeats at 3:45 pace", completed: false },
      { id: "m4", week: 8, label: "Target Milestone: 24:00 5km Continuous Pace", completed: false },
    ],
    weekly_actions: [
      "3 structured aerobic runs (1 Interval, 1 Tempo, 1 Long Steady Run)",
      "Maintain post-run mobility & hamstring stretching for 15 mins",
      "Log sleep quality and target 7.5+ hours restorative rest",
    ],
    createdAt: "2026-08-15",
  },
  {
    id: "goal_pullups",
    title: "Upper Body Calisthenics: 20 Strict Pull-Ups",
    category: "STRENGTH",
    target: "20",
    current: "14",
    baseline: "6",
    unit: "reps",
    timeline_weeks: 10,
    current_week: 6,
    progress_percentage: 57,
    status: "ACTIVE",
    milestones: [
      { id: "m11", week: 2, label: "Dead-hang endurance for 60s & scapular retractions", completed: true },
      { id: "m12", week: 4, label: "Reach 10 clean chest-to-bar pull-ups unbroken", completed: true },
      { id: "m13", week: 7, label: "3 sets of 12 weighted pull-ups (+5kg vest)", completed: false },
      { id: "m14", week: 10, label: "20 consecutive strict bodyweight pull-ups", completed: false },
    ],
    weekly_actions: [
      "2 dedicated back & lat pull-up volume sessions per week",
      "Grip strengthening and active dead hangs 3x/week",
      "Rotator cuff and rear delt prehab routine twice weekly",
    ],
    createdAt: "2026-08-10",
  },
  {
    id: "goal_mobility",
    title: "Deep Squat Postural Depth & Thoracic Mobility",
    category: "MOBILITY",
    target: "100",
    current: "85",
    baseline: "50",
    unit: "% depth",
    timeline_weeks: 6,
    current_week: 5,
    progress_percentage: 70,
    status: "ACTIVE",
    milestones: [
      { id: "m21", week: 2, label: "Overcome ankle dorsiflexion stiffness via calf drills", completed: true },
      { id: "m22", week: 4, label: "Full 2-minute unassisted deep Asian squat hold", completed: true },
      { id: "m23", week: 6, label: "Overhead squat with straight thoracic spine lock", completed: false },
    ],
    weekly_actions: [
      "Daily 10-minute morning dynamic hip opener routine",
      "Foam roll thoracic spine and adductors prior to training",
      "Evening restorative pigeon and couch stretch holds",
    ],
    createdAt: "2026-08-20",
  },
];

const PRESET_TEMPLATES = [
  {
    title: "10km Road Race Preparation",
    category: "ENDURANCE" as const,
    baseline: "62.0",
    current: "58.0",
    target: "49.5",
    unit: "mins",
    timeline_weeks: 10,
    milestones: [
      { id: "t1", week: 3, label: "Complete uninterrupted 7km run at steady pace", completed: false },
      { id: "t2", week: 6, label: "Break sub-25 min on 5km intermediate check", completed: false },
      { id: "t3", week: 8, label: "Long run progression to 12km sub-aerobic", completed: false },
      { id: "t4", week: 10, label: "10km race pace under 4:55/km", completed: false },
    ],
    weekly_actions: [
      "3 weekly runs including 1 weekend long run",
      "Electrolyte replenishment on long days",
      "1 weekly lower body injury prevention circuit",
    ],
  },
  {
    title: "Body Fat Reduction & Lean Muscle Tone",
    category: "BODY_COMP" as const,
    baseline: "22.5",
    current: "19.8",
    target: "14.5",
    unit: "% body fat",
    timeline_weeks: 12,
    milestones: [
      { id: "t11", week: 3, label: "Establish consistent 300 kcal daily caloric deficit", completed: false },
      { id: "t12", week: 6, label: "Reach sub-18% body fat milestone with full energy", completed: false },
      { id: "t13", week: 9, label: "Maintain 1.8g/kg protein intake across all 7 days", completed: false },
      { id: "t14", week: 12, label: "Target 14.5% body composition achievement", completed: false },
    ],
    weekly_actions: [
      "4 high-intensity strength & resistance training sessions",
      "Daily 8,000 to 10,000 baseline steps",
      "Track daily macronutrients inside PRANA Nutrition Hub",
    ],
  },
  {
    title: "Bench Press 100kg Century Milestone",
    category: "STRENGTH" as const,
    baseline: "75.0",
    current: "85.0",
    target: "100.0",
    unit: "kg",
    timeline_weeks: 8,
    milestones: [
      { id: "t21", week: 2, label: "Bar path alignment & 5x5 at 80kg with pause", completed: false },
      { id: "t22", week: 4, label: "Solid 90kg single with zero elbow flare", completed: false },
      { id: "t23", week: 6, label: "Overload lockout drill: 95kg for 2 clean reps", completed: false },
      { id: "t24", week: 8, label: "Triple-digit 100kg 1-Rep Max accomplishment", completed: false },
    ],
    weekly_actions: [
      "2 heavy chest & triceps progressive overload sessions",
      "Weekly rotator cuff face pulls and band dislocates",
      "Creatine monohydrate daily adherence (5g)",
    ],
  },
];

export const GoalsView: React.FC = () => {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [activeGoalId, setActiveGoalId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED" | "ALL">("ACTIVE");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateMetricModalOpen, setIsUpdateMetricModalOpen] = useState(false);
  const [newMetricInput, setNewMetricInput] = useState("");
  const [weeklyHabitChecks, setWeeklyHabitChecks] = useState<Record<string, boolean>>({});

  // New goal form state
  const [newGoal, setNewGoal] = useState({
    title: "",
    category: "ENDURANCE" as GoalItem["category"],
    baseline: "",
    current: "",
    target: "",
    unit: "mins",
    timeline_weeks: 8,
    action1: "",
    action2: "",
    action3: "",
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedGoals = localStorage.getItem("prana_user_goals");
      if (savedGoals) {
        const parsed = JSON.parse(savedGoals);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGoals(parsed);
          setActiveGoalId(parsed[0].id);
        } else {
          setGoals(DEFAULT_GOALS);
          setActiveGoalId(DEFAULT_GOALS[0].id);
          localStorage.setItem("prana_user_goals", JSON.stringify(DEFAULT_GOALS));
        }
      } else {
        setGoals(DEFAULT_GOALS);
        setActiveGoalId(DEFAULT_GOALS[0].id);
        localStorage.setItem("prana_user_goals", JSON.stringify(DEFAULT_GOALS));
      }

      const savedHabits = localStorage.getItem("prana_goal_habits");
      if (savedHabits) {
        setWeeklyHabitChecks(JSON.parse(savedHabits));
      }
    } catch {
      setGoals(DEFAULT_GOALS);
      setActiveGoalId(DEFAULT_GOALS[0].id);
    }
  }, []);

  // Save changes to localStorage helper
  const persistGoals = (updatedGoals: GoalItem[]) => {
    setGoals(updatedGoals);
    try {
      localStorage.setItem("prana_user_goals", JSON.stringify(updatedGoals));
    } catch (err) {
      console.error("Failed to persist goals:", err);
    }
  };

  const activeGoal = goals.find((g) => g.id === activeGoalId) || goals[0] || null;

  // Toggle milestone completion
  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    const updated = goals.map((g) => {
      if (g.id !== goalId) return g;

      const updatedMilestones = g.milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );

      const completedCount = updatedMilestones.filter((m) => m.completed).length;
      const totalCount = updatedMilestones.length;
      const progressPercentage = Math.round((completedCount / Math.max(1, totalCount)) * 100);

      const isCompleted = completedCount === totalCount && totalCount > 0;

      return {
        ...g,
        milestones: updatedMilestones,
        progress_percentage: progressPercentage,
        status: isCompleted ? ("COMPLETED" as const) : ("ACTIVE" as const),
      };
    });

    persistGoals(updated);
  };

  // Toggle habit checkbox
  const handleToggleHabit = (goalId: string, habitIndex: number) => {
    const key = `${goalId}_h_${habitIndex}`;
    const updated = { ...weeklyHabitChecks, [key]: !weeklyHabitChecks[key] };
    setWeeklyHabitChecks(updated);
    try {
      localStorage.setItem("prana_goal_habits", JSON.stringify(updated));
    } catch {}
  };

  // Update current metric
  const handleUpdateCurrentMetric = () => {
    if (!activeGoal || !newMetricInput.trim()) return;
    const updated = goals.map((g) => {
      if (g.id !== activeGoal.id) return g;
      return {
        ...g,
        current: newMetricInput.trim(),
      };
    });
    persistGoals(updated);
    setIsUpdateMetricModalOpen(false);
    setNewMetricInput("");
  };

  // Create new goal
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim() || !newGoal.target.trim()) return;

    const weeks = Number(newGoal.timeline_weeks) || 8;
    const currentVal = newGoal.current.trim() || newGoal.baseline.trim() || "0";
    const baselineVal = newGoal.baseline.trim() || currentVal;

    const newMilestones: Milestone[] = [
      { id: "m_" + Date.now() + "_1", week: Math.max(1, Math.round(weeks * 0.25)), label: `Phase 1: Foundation & Consistency Habit`, completed: false },
      { id: "m_" + Date.now() + "_2", week: Math.max(2, Math.round(weeks * 0.5)), label: `Phase 2: Progressive Overload Adaptations`, completed: false },
      { id: "m_" + Date.now() + "_3", week: Math.max(3, Math.round(weeks * 0.75)), label: `Phase 3: Threshold & Peak Stamina Testing`, completed: false },
      { id: "m_" + Date.now() + "_4", week: weeks, label: `Final Peak: Target ${newGoal.target} ${newGoal.unit} Milestone`, completed: false },
    ];

    const actions = [
      newGoal.action1.trim() || `3 targeted ${newGoal.category.toLowerCase()} sessions per week`,
      newGoal.action2.trim() || "Log daily recovery scores and sleep minimum 7.5 hours",
      newGoal.action3.trim() || "Weekly milestone checkpoint self-assessment",
    ];

    const item: GoalItem = {
      id: "goal_" + Date.now(),
      title: newGoal.title.trim(),
      category: newGoal.category,
      target: newGoal.target.trim(),
      current: currentVal,
      baseline: baselineVal,
      unit: newGoal.unit.trim() || "units",
      timeline_weeks: weeks,
      current_week: 1,
      progress_percentage: 0,
      status: "ACTIVE",
      milestones: newMilestones,
      weekly_actions: actions,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updated = [item, ...goals];
    persistGoals(updated);
    setActiveGoalId(item.id);
    setIsCreateModalOpen(false);

    // Reset form
    setNewGoal({
      title: "",
      category: "ENDURANCE",
      baseline: "",
      current: "",
      target: "",
      unit: "mins",
      timeline_weeks: 8,
      action1: "",
      action2: "",
      action3: "",
    });
  };

  // Add template goal directly
  const handleAddTemplate = (tpl: typeof PRESET_TEMPLATES[0]) => {
    const item: GoalItem = {
      id: "goal_tpl_" + Date.now(),
      title: tpl.title,
      category: tpl.category,
      target: tpl.target,
      current: tpl.current,
      baseline: tpl.baseline,
      unit: tpl.unit,
      timeline_weeks: tpl.timeline_weeks,
      current_week: 1,
      progress_percentage: 0,
      status: "ACTIVE",
      milestones: tpl.milestones.map((m) => ({ ...m, id: "m_" + Date.now() + "_" + m.week })),
      weekly_actions: tpl.weekly_actions,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updated = [item, ...goals];
    persistGoals(updated);
    setActiveGoalId(item.id);
  };

  // Delete goal
  const handleDeleteGoal = (goalId: string) => {
    if (goals.length <= 1) {
      alert("You need at least one goal in your engine.");
      return;
    }
    const updated = goals.filter((g) => g.id !== goalId);
    persistGoals(updated);
    if (activeGoalId === goalId) {
      setActiveGoalId(updated[0].id);
    }
  };

  // Filter goals
  const filteredGoals = goals.filter((g) => {
    if (activeTab === "ACTIVE") return g.status === "ACTIVE";
    if (activeTab === "COMPLETED") return g.status === "COMPLETED";
    return true;
  });

  // Calculate overall stats
  const activeCount = goals.filter((g) => g.status === "ACTIVE").length;
  const completedCount = goals.filter((g) => g.status === "COMPLETED").length;
  const totalMilestones = goals.reduce((acc, g) => acc + g.milestones.length, 0);
  const completedMilestones = goals.reduce(
    (acc, g) => acc + g.milestones.filter((m) => m.completed).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header with Stats & Actions */}
      <div className="border-b border-[var(--border)] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wider text-[var(--primary)] uppercase flex items-center gap-1.5 font-mono">
            <Target className="w-4 h-4" />
            Adaptive Engineering &amp; Habit Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-0.5">
            PRANA Goal Engine
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Systematic goal calibration: Baseline &rarr; Target &rarr; Sequential Milestones &rarr; Weekly Habit Adherence.
          </p>
        </div>

        {/* Create Goal Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[var(--primary)] text-[#0B100E] font-bold text-xs flex items-center gap-1.5 hover:opacity-95 shadow-md shadow-[var(--primary)]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Goal</span>
          </button>
        </div>
      </div>

      {/* Overview Analytics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-[var(--muted)] uppercase font-mono">Active Goals</div>
            <div className="text-xl font-bold font-mono text-[var(--foreground)] mt-0.5">
              {activeCount}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--secondary)]/10 text-[var(--secondary)]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-[var(--muted)] uppercase font-mono">Goals Completed</div>
            <div className="text-xl font-bold font-mono text-[var(--foreground)] mt-0.5">
              {completedCount}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-[var(--muted)] uppercase font-mono">Milestones Cleared</div>
            <div className="text-xl font-bold font-mono text-[var(--foreground)] mt-0.5">
              {completedMilestones} / {totalMilestones}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-[var(--muted)] uppercase font-mono">Overall Velocity</div>
            <div className="text-xl font-bold font-mono text-[var(--foreground)] mt-0.5">
              {Math.round((completedMilestones / Math.max(1, totalMilestones)) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Goal Switcher & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] w-fit">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "ACTIVE"
                ? "bg-[var(--surface-elevated)] text-[var(--primary)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "COMPLETED"
                ? "bg-[var(--surface-elevated)] text-[var(--primary)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "ALL"
                ? "bg-[var(--surface-elevated)] text-[var(--primary)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            All Goals ({goals.length})
          </button>
        </div>

        {/* Goal Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {filteredGoals.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGoalId(g.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                g.id === activeGoal?.id
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)] font-semibold shadow-sm"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  g.status === "COMPLETED" ? "bg-emerald-400" : "bg-[var(--primary)]"
                }`}
              ></span>
              <span className="truncate max-w-[140px] sm:max-w-[180px]">{g.title}</span>
              <span className="font-mono text-[10px] text-[var(--muted)]">{g.progress_percentage}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Goal Details Workspace */}
      {activeGoal ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Goal Overview & Milestones */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Goal Focus Card */}
            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] uppercase font-mono font-bold bg-[var(--surface-elevated)] text-[var(--secondary)] border border-[var(--border)]">
                      {activeGoal.category}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] font-mono">
                      {activeGoal.timeline_weeks} WEEKS HORIZON
                    </span>
                    {activeGoal.status === "COMPLETED" && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        COMPLETED 🏆
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mt-2">
                    {activeGoal.title}
                  </h2>
                </div>

                {/* Progress Metric Ring & Percentage */}
                <div className="flex items-center sm:flex-col sm:items-end gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-mono text-[var(--muted)]">Overall Progress</div>
                    <div className="text-3xl font-bold font-mono text-[var(--primary)]">
                      {activeGoal.progress_percentage}%
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNewMetricInput(activeGoal.current);
                      setIsUpdateMetricModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)] hover:text-[var(--foreground)] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Update Current Value"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[var(--secondary)]" />
                    <span>Log Progress</span>
                  </button>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-[var(--muted)]">
                  <span>Week 1 Baseline</span>
                  <span className="text-[var(--foreground)] font-semibold">
                    {activeGoal.milestones.filter((m) => m.completed).length} of{" "}
                    {activeGoal.milestones.length} Milestones Cleared
                  </span>
                  <span>Week {activeGoal.timeline_weeks} Target</span>
                </div>
                <div className="h-3 w-full bg-[var(--surface-elevated)] rounded-full overflow-hidden border border-[var(--border)]/60">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)] transition-all duration-500 rounded-full"
                    style={{ width: `${Math.max(4, activeGoal.progress_percentage)}%` }}
                  ></div>
                </div>
              </div>

              {/* Metric Progression Triple-Matrix */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)]">
                  <div className="text-[10px] text-[var(--muted)] uppercase font-mono">Baseline</div>
                  <div className="text-base sm:text-lg font-mono font-bold text-[var(--muted)] mt-1">
                    {activeGoal.baseline} {activeGoal.unit}
                  </div>
                </div>
                <div className="p-3.5 bg-[var(--surface-elevated)] rounded-xl border border-[var(--secondary)]/30 relative">
                  <div className="text-[10px] text-[var(--secondary)] uppercase font-mono font-semibold">
                    Current Record
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-[var(--secondary)] mt-1">
                    {activeGoal.current} {activeGoal.unit}
                  </div>
                </div>
                <div className="p-3.5 bg-[var(--surface-elevated)] rounded-xl border border-[var(--primary)]/30 relative">
                  <div className="text-[10px] text-[var(--primary)] uppercase font-mono font-semibold">
                    Target Goal
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-[var(--primary)] mt-1">
                    {activeGoal.target} {activeGoal.unit}
                  </div>
                </div>
              </div>

              {/* Interactive Milestones List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[var(--foreground)] uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                    Sequential Milestones Checklist (Click to Toggle)
                  </div>
                  <span className="text-[10px] text-[var(--muted)] font-mono">Interactive</span>
                </div>

                <div className="space-y-2.5">
                  {activeGoal.milestones.map((m, idx) => (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMilestone(activeGoal.id, m.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group select-none ${
                        m.completed
                          ? "bg-[var(--primary)]/5 border-[var(--primary)]/40 text-[var(--foreground)]"
                          : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/30 hover:text-[var(--foreground)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            m.completed
                              ? "bg-[var(--primary)] border-[var(--primary)] text-[#0B100E]"
                              : "border-[var(--border)] group-hover:border-[var(--primary)] text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div>
                          <span className="text-xs font-medium">
                            <strong className="text-[var(--foreground)] font-mono mr-1.5">
                              Week {m.week}:
                            </strong>
                            <span className={m.completed ? "line-through opacity-80" : ""}>
                              {m.label}
                            </span>
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          m.completed
                            ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                            : "bg-[var(--surface)] text-[var(--muted)]"
                        }`}
                      >
                        {m.completed ? "ACHIEVED" : "IN PROGRESS"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Goal Footer Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs text-[var(--muted)]">
                <span className="font-mono text-[10px]">
                  Created {activeGoal.createdAt} • ID: {activeGoal.id}
                </span>
                <button
                  onClick={() => handleDeleteGoal(activeGoal.id)}
                  className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Goal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Col: Weekly Habits & Templates */}
          <div className="space-y-6">
            {/* Prescribed Weekly Actions & Habits */}
            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="text-xs font-semibold text-[var(--foreground)] uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Weekly Habit Adherence
                </div>
                <span className="text-[10px] font-mono text-[var(--primary)]">This Week</span>
              </div>

              <p className="text-xs text-[var(--muted)]">
                Check off your prescribed recurring habits to build longitudinal adaptation:
              </p>

              <div className="space-y-2.5">
                {activeGoal.weekly_actions.map((act, i) => {
                  const isChecked = !!weeklyHabitChecks[`${activeGoal.id}_h_${i}`];
                  return (
                    <div
                      key={i}
                      onClick={() => handleToggleHabit(activeGoal.id, i)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? "bg-[var(--surface-elevated)] border-emerald-500/40 text-[var(--foreground)]"
                          : "bg-[var(--surface-elevated)]/60 border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/30"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-all ${
                          isChecked
                            ? "bg-emerald-400 border-emerald-400 text-[#0B100E]"
                            : "border-[var(--border)]"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={`text-xs leading-relaxed ${isChecked ? "line-through opacity-80" : ""}`}>
                        {act}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Templates Shelf */}
            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="text-xs font-semibold text-[var(--foreground)] uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[var(--secondary)]" />
                  Recommended Goal Templates
                </div>
              </div>

              <div className="space-y-3">
                {PRESET_TEMPLATES.map((tpl, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--primary)]/40 transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-[var(--secondary)]">
                        {tpl.category}
                      </span>
                      <span className="text-[10px] text-[var(--muted)] font-mono">
                        {tpl.timeline_weeks} WEEKS
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[var(--foreground)]">
                      {tpl.title}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono text-[var(--muted)]">
                        Target: <strong className="text-[var(--primary)]">{tpl.target} {tpl.unit}</strong>
                      </span>
                      <button
                        onClick={() => handleAddTemplate(tpl)}
                        className="px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[#0B100E] font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Goal</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
          <Target className="w-10 h-10 text-[var(--muted)] mx-auto opacity-40" />
          <h3 className="text-lg font-bold text-[var(--foreground)]">No goals found</h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            You don't have any goals matching this filter. Create a new goal or select a template above!
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[#0B100E] font-bold text-xs"
          >
            Create Your First Goal
          </button>
        </div>
      )}

      {/* Log Progress Quick Modal */}
      {isUpdateMetricModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[var(--secondary)]" />
                <span>Log Current Metric</span>
              </div>
              <button
                onClick={() => setIsUpdateMetricModalOpen(false)}
                className="p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--muted)]">
              Update your latest recorded result for: <strong className="text-[var(--foreground)]">{activeGoal?.title}</strong>
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[var(--muted)] uppercase">
                New Current Value ({activeGoal?.unit})
              </label>
              <input
                type="text"
                value={newMetricInput}
                onChange={(e) => setNewMetricInput(e.target.value)}
                placeholder={`e.g. ${activeGoal?.target}`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-sm text-[var(--foreground)] font-mono outline-none focus:border-[var(--primary)]"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUpdateMetricModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateCurrentMetric}
                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[#0B100E] font-bold text-xs"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--primary)]" />
                <span>Configure New Athletic Goal</span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-[11px] font-mono text-[var(--muted)] uppercase block mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sub-20 Min 5km Run, 100kg Bench Press..."
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-[11px] font-mono text-[var(--muted)] uppercase block mb-1">
                  Category
                </label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as any })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                >
                  <option value="ENDURANCE">ENDURANCE (Running, Cardio, Stamina)</option>
                  <option value="STRENGTH">STRENGTH (Lifting, Bodyweight, Power)</option>
                  <option value="MOBILITY">MOBILITY (Flexibility, Range of Motion)</option>
                  <option value="BODY_COMP">BODY COMPOSITION (Fat loss, Muscle Gain)</option>
                  <option value="AGILITY">AGILITY (Speed, Footwork, Quickness)</option>
                  <option value="RECOVERY">RECOVERY (Sleep, HRV, Restoration)</option>
                </select>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-[var(--muted)] uppercase block mb-1">
                    Baseline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 30"
                    value={newGoal.baseline}
                    onChange={(e) => setNewGoal({ ...newGoal, baseline: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--muted)] uppercase block mb-1">
                    Current
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 28"
                    value={newGoal.current}
                    onChange={(e) => setNewGoal({ ...newGoal, current: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--muted)] uppercase block mb-1">
                    Target Goal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--primary)]/40 bg-[var(--surface-elevated)] text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--muted)] uppercase block mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    placeholder="mins / kg"
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
              </div>

              {/* Timeline */}
              <div>
                <label className="text-[11px] font-mono text-[var(--muted)] uppercase block mb-1">
                  Timeline Horizon ({newGoal.timeline_weeks} Weeks)
                </label>
                <input
                  type="range"
                  min="2"
                  max="24"
                  step="2"
                  value={newGoal.timeline_weeks}
                  onChange={(e) => setNewGoal({ ...newGoal, timeline_weeks: Number(e.target.value) })}
                  className="w-full accent-[var(--primary)] cursor-pointer"
                />
              </div>

              {/* Weekly Habit Actions */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-[var(--muted)] uppercase block">
                  Prescribed Weekly Habits (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Habit 1: e.g. 3 dedicated runs per week"
                  value={newGoal.action1}
                  onChange={(e) => setNewGoal({ ...newGoal, action1: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--foreground)]"
                />
                <input
                  type="text"
                  placeholder="Habit 2: e.g. Sleep minimum 7.5 hours"
                  value={newGoal.action2}
                  onChange={(e) => setNewGoal({ ...newGoal, action2: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--foreground)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[#0B100E] font-bold text-xs"
                >
                  Create Adaptive Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

