"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Smile,
  Frown,
  Meh,
  Zap,
  AlertTriangle,
  Info,
  CheckCircle2,
  Heart,
  Shuffle,
  Play,
  RotateCcw,
  Sparkles,
  Wind,
  Flame,
  Sun,
  Activity,
  Award,
  ChevronRight,
  ShieldCheck,
  Dumbbell,
  Phone,
  PhoneCall,
  LifeBuoy,
  ShieldAlert,
} from "lucide-react";

interface MoodExercise {
  id: string;
  title: string;
  category: "Breathwork" | "Endorphin Cardio" | "Somatic Mobility" | "Grounding" | "High-Intensity Release";
  targetVerdict: "sad" | "stressed" | "happy" | "burned_out" | "all";
  durationMins: number;
  intensity: "Gentle" | "Moderate" | "Vigorous";
  whyItHelps: string;
  steps: string[];
}

const MENTAL_HEALTH_EXERCISES: MoodExercise[] = [
  {
    id: "ex-1",
    title: "Vagus Nerve Box Breathing (4-4-4-4 Protocol)",
    category: "Breathwork",
    targetVerdict: "stressed",
    durationMins: 5,
    intensity: "Gentle",
    whyItHelps: "Directly activates the parasympathetic nervous system, lowering acute cortisol and down-regulating sympathetic fight-or-flight tension.",
    steps: [
      "Inhale slowly through the nose for 4 seconds.",
      "Hold full breath gently for 4 seconds.",
      "Exhale smoothly through parted lips for 4 seconds.",
      "Hold empty lungs for 4 seconds before next inhale.",
      "Repeat for 4 to 6 continuous cycles."
    ],
  },
  {
    id: "ex-2",
    title: "Outdoor Sunlight Serotonin Stride",
    category: "Grounding",
    targetVerdict: "sad",
    durationMins: 15,
    intensity: "Gentle",
    whyItHelps: "Natural sunlight hits retinal photoreceptors to stimulate serotonin synthesis while low-impact locomotion stimulates bilateral brain rhythm.",
    steps: [
      "Step outside into natural daylight without sunglasses if safe.",
      "Walk at a relaxed, unhurried cadence with head held upright.",
      "Focus on 5 things you can see, 4 you can feel, 3 you can hear.",
      "Take 3 deep belly breaths every 5 minutes."
    ],
  },
  {
    id: "ex-3",
    title: "Dopamine-Surge Kinetic Jog & Strides",
    category: "Endorphin Cardio",
    targetVerdict: "sad",
    durationMins: 12,
    intensity: "Moderate",
    whyItHelps: "Triggers exercise-induced neurogenesis and releases beta-endorphins, rapidly dissolving feelings of lethargy and melancholia.",
    steps: [
      "2 minutes easy warm-up jog to elevate body temperature.",
      "6 minutes rhythmic zone-2 running at conversational pace.",
      "3x 20-second accelerated strides with 40-second walk recovery.",
      "1 minute cool-down walk with hands behind head."
    ],
  },
  {
    id: "ex-4",
    title: "Somatic Hip & Chest Opening Yin Flow",
    category: "Somatic Mobility",
    targetVerdict: "burned_out",
    durationMins: 10,
    intensity: "Gentle",
    whyItHelps: "The psoas and chest muscles physically store chronic emotional tension. Lengthening them signals physical safety to the brainstem.",
    steps: [
      "Deep kneeling hip flexor lunge (1.5 mins per side).",
      "Pigeon pose or figure-4 glute stretch (1.5 mins per side).",
      "Sphinx chest opener with gentle neck rotations (2 mins).",
      "Child's pose with outstretched arms and slow diaphragmatic breathing (3 mins)."
    ],
  },
  {
    id: "ex-5",
    title: "High-Power Shadow Boxing & Tension Release",
    category: "High-Intensity Release",
    targetVerdict: "stressed",
    durationMins: 8,
    intensity: "Vigorous",
    whyItHelps: "Provides an immediate, healthy physical outlet for built-up cortisol, adrenaline, and internal frustration.",
    steps: [
      "Bounce lightly on the balls of your feet, shaking out wrist tension.",
      "Throw 1-2 jab-cross combinations with sharp exhales on each strike.",
      "Mix in hooks, body slips, and fast footwork for 2-minute rounds.",
      "Rest 30 seconds, hydrate, and finish with a full-body forward fold."
    ],
  },
  {
    id: "ex-6",
    title: "Cold-Water Contrast Splash & Dopamine Reset",
    category: "Grounding",
    targetVerdict: "sad",
    durationMins: 3,
    intensity: "Moderate",
    whyItHelps: "Cold exposure to facial thermoreceptors activates the mammalian dive reflex, providing up to a 250% sustained baseline dopamine elevation.",
    steps: [
      "Turn the faucet or shower to cool/cold water.",
      "Splash cold water over face and nape of neck for 30 seconds.",
      "Take 3 deep, steady breaths while experiencing the cool sensation.",
      "Dry with a warm towel and feel the instant clarity and alertness."
    ],
  },
  {
    id: "ex-7",
    title: "Joyful Movement & Victory Calisthenics",
    category: "High-Intensity Release",
    targetVerdict: "happy",
    durationMins: 10,
    intensity: "Moderate",
    whyItHelps: "Capitalizes on high energy and joyful mood to build physical confidence, testosterone, and positive neuromuscular feedback loops.",
    steps: [
      "Put on your favorite upbeat, energizing music track.",
      "10 jumping jacks into 10 explosive bodyweight jump squats.",
      "15 dynamic pushups focusing on crisp lockout speed.",
      "End in a strong power pose (hands on hips, chest lifted) for 60 seconds."
    ],
  },
];

export const MentalWellnessView: React.FC = () => {
  // Input State
  const [mood, setMood] = useState(7); // 1-10
  const [stress, setStress] = useState(3); // 1-10
  const [energy, setEnergy] = useState(8); // 1-10
  const [motivation, setMotivation] = useState(7); // 1-10
  const [burnout, setBurnout] = useState(2); // 1-10
  const [calmness, setCalmness] = useState(8); // 1-10
  const [userNote, setUserNote] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Active Suggested Exercise
  const [selectedExercise, setSelectedExercise] = useState<MoodExercise>(MENTAL_HEALTH_EXERCISES[0]);
  const [exerciseTimer, setExerciseTimer] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  // Calculate Dynamic Mental Wellness Score (0 - 100)
  // Positive factors: Mood (25%), Energy (20%), Motivation (15%), Calmness (15%)
  // Negative factors: Stress (15%), Burnout (10%)
  const calculateMentalScore = () => {
    const positiveComponent = (mood * 2.5) + (energy * 2.0) + (motivation * 1.5) + (calmness * 1.5); // Max 75
    const invertedStress = (11 - stress) * 1.5; // Max 15
    const invertedBurnout = (11 - burnout) * 1.0; // Max 10
    const raw = positiveComponent + invertedStress + invertedBurnout;
    return Math.min(99, Math.max(20, Math.round(raw)));
  };

  const mentalScore = calculateMentalScore();

  // Determine Detailed Verdict (Happy, Sad, Stressed, Burned Out, Content)
  const getVerdictDetails = () => {
    if (burnout >= 7 || (energy <= 3 && stress >= 7)) {
      return {
        verdict: "Overwhelmed & Burned Out",
        state: "burned_out" as const,
        icon: AlertTriangle,
        color: "rose",
        badge: "High Burnout Risk",
        summary: "Your physical and psychological recovery reserves are severely taxed. Chronic strain has outpaced restoration.",
        prescription: "Cancel high-intensity training today. Prioritize sleep, restorative somatic stretching, and zero-demand rest.",
      };
    }

    if (mood <= 4 || (energy <= 4 && motivation <= 4)) {
      return {
        verdict: "Low Spirits & Melancholic (Sad)",
        state: "sad" as const,
        icon: Frown,
        color: "amber",
        badge: "Low Emotional Tone",
        summary: "You are experiencing low mood, lethargy, or feeling down. Your dopamine and serotonin signaling appear sluggish today.",
        prescription: "Light outdoor locomotion, natural morning sunlight, and gentle aerobic movement are scientifically proven to elevate mood.",
      };
    }

    if (stress >= 7) {
      return {
        verdict: "High Stress & Sympathetic Overdrive",
        state: "stressed" as const,
        icon: Zap,
        color: "amber",
        badge: "Acute Stress Load",
        summary: "Your sympathetic nervous system is hyper-activated with elevated cortisol cues. Restlessness or tension is evident.",
        prescription: "Engage in vagal nerve box breathing or tension-release striking to down-regulate your nervous system.",
      };
    }

    if (mood >= 7 && energy >= 7 && stress <= 4) {
      return {
        verdict: "Joyful, Thriving & Optimistic (Happy)",
        state: "happy" as const,
        icon: Smile,
        color: "emerald",
        badge: "Vibrant Mental State",
        summary: "Your psychological state is exceptionally buoyant, joyful, and resilient! Neurochemical readiness is primed for high achievement.",
        prescription: "Channel your positive momentum into progressive strength workouts, creative pursuits, or joyful celebration!",
      };
    }

    return {
      verdict: "Balanced, Grounded & Stable",
      state: "all" as const,
      icon: Meh,
      color: "blue",
      badge: "Grounded Equilibrium",
      summary: "Your mental state is in steady physiological balance. Energy and emotional tone are calm and functional.",
      prescription: "Maintain your daily consistency with balanced training, mindful hydration, and positive social connection.",
    };
  };

  const verdict = getVerdictDetails();

  // Suggest Random Exercise (either matching verdict or completely fresh)
  const handlePickRandomExercise = () => {
    const candidateList = MENTAL_HEALTH_EXERCISES.filter(
      (e) => e.targetVerdict === verdict.state || e.targetVerdict === "all" || Math.random() > 0.4
    );
    const chosen = candidateList[Math.floor(Math.random() * candidateList.length)] || MENTAL_HEALTH_EXERCISES[0];
    setSelectedExercise(chosen);
    setExerciseTimer(chosen.durationMins * 60);
    setTimerActive(false);
  };

  // Set initial exercise aligned with verdict
  useEffect(() => {
    const matching = MENTAL_HEALTH_EXERCISES.find((e) => e.targetVerdict === verdict.state);
    if (matching) {
      setSelectedExercise(matching);
      setExerciseTimer(matching.durationMins * 60);
    }
  }, [verdict.state]);

  // Exercise Timer Countdown
  useEffect(() => {
    let interval: any = null;
    if (timerActive && exerciseTimer !== null && exerciseTimer > 0) {
      interval = setInterval(() => {
        setExerciseTimer((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (exerciseTimer === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, exerciseTimer]);

  const handleSaveLog = () => {
    try {
      const dataToSave = {
        score: mentalScore,
        verdict: verdict.verdict,
        mood,
        stress,
        energy,
        motivation,
        burnout,
        calmness,
        date: new Date().toISOString(),
      };
      localStorage.setItem("athena_mental_wellness_data", JSON.stringify(dataToSave));
      window.dispatchEvent(new Event("athena_mental_updated"));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch {}
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const VerdictIcon = verdict.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold tracking-wider text-purple-400 uppercase flex items-center gap-1.5 font-mono">
            <Brain className="w-3.5 h-3.5" />
            Neurochemical Telemetry &bull; Somatic Balance Engine
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Mental Wellness &amp; Mood Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time psychological scoring, emotional state verdict (Happy, Sad, Stressed, Thriving), and adaptive mood-boosting exercises.
          </p>
        </div>

        {/* Suggest Random Exercise Button */}
        <button
          onClick={handlePickRandomExercise}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-600/30 flex items-center gap-2 shrink-0"
        >
          <Shuffle className="w-4 h-4" />
          Suggest Random Mood Exercise
        </button>
      </div>

      {/* DYNAMIC SCORE & VERDICT BANNER */}
      <div
        className={`athena-card p-6 border transition-all ${
          verdict.color === "emerald"
            ? "border-emerald-500/40 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900"
            : verdict.color === "amber"
            ? "border-amber-500/40 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900"
            : verdict.color === "rose"
            ? "border-rose-500/40 bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900"
            : "border-blue-500/40 bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900"
        }`}
      >
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
                  className={`transition-all duration-1000 ease-out ${
                    verdict.color === "emerald"
                      ? "stroke-emerald-400"
                      : verdict.color === "amber"
                      ? "stroke-amber-400"
                      : verdict.color === "rose"
                      ? "stroke-rose-400"
                      : "stroke-blue-400"
                  }`}
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * mentalScore) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold font-mono text-white">{mentalScore}</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Score</span>
              </div>
            </div>

            {/* Verdict Text */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                    verdict.color === "emerald"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : verdict.color === "amber"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : verdict.color === "rose"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  }`}
                >
                  {verdict.badge}
                </span>
                <span className="text-xs text-slate-400 font-mono">Dynamic Diagnostic Verdict</span>
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <VerdictIcon
                  className={`w-5 h-5 ${
                    verdict.color === "emerald"
                      ? "text-emerald-400"
                      : verdict.color === "amber"
                      ? "text-amber-400"
                      : verdict.color === "rose"
                      ? "text-rose-400"
                      : "text-blue-400"
                  }`}
                />
                PRANA Verdict: {verdict.verdict}
              </h2>

              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {verdict.summary}
              </p>

              <div className="text-xs text-slate-300 pt-1">
                <strong className="text-white">Prescription:</strong> {verdict.prescription}
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveLog}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 shadow-sm"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Brain className="w-4 h-4 text-purple-400" />}
            {isSaved ? "Saved to Digital Twin!" : "Save Wellness Log"}
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive User Input Sliders (6 cols) */}
        <div className="lg:col-span-6 athena-card p-5 space-y-4 border-slate-800 bg-slate-950">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Calibrate Your Current Mental Telemetry
            </h3>
            <span className="text-[11px] text-purple-400 font-mono">Dynamic Sliders</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Mood (Happy / Sad) */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-emerald-400" />
                  Overall Mood &amp; Emotional State (Happy vs Sad)
                </span>
                <span className="font-mono text-emerald-400 font-bold text-sm">{mood} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 (Very Sad / Depressed)</span>
                <span>5 (Neutral)</span>
                <span>10 (Extremely Happy / Elated)</span>
              </div>
            </div>

            {/* Psychological Stress */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Perceived Psychological Stress
                </span>
                <span className="font-mono text-amber-400 font-bold text-sm">{stress} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stress}
                onChange={(e) => setStress(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 (Completely Relaxed)</span>
                <span>5 (Moderate Pressure)</span>
                <span>10 (Severe Stress / Overwhelmed)</span>
              </div>
            </div>

            {/* Subjective Energy */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-blue-400" />
                  Subjective Physical &amp; Mental Energy
                </span>
                <span className="font-mono text-blue-400 font-bold text-sm">{energy} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 (Exhausted / Drained)</span>
                <span>5 (Functional)</span>
                <span>10 (Peak Vitality &amp; Buzzing)</span>
              </div>
            </div>

            {/* Training Motivation */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Motivation &amp; Drive
                </span>
                <span className="font-mono text-purple-400 font-bold text-sm">{motivation} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={motivation}
                onChange={(e) => setMotivation(parseInt(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 (Apathetic / Zero Drive)</span>
                <span>5 (Moderate)</span>
                <span>10 (Relentless Hunger)</span>
              </div>
            </div>

            {/* Perceived Burnout & Calmness (2 cols) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-300 font-medium text-[11px]">
                  <span>Burnout Level</span>
                  <span className="font-mono text-rose-400 font-bold">{burnout} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={burnout}
                  onChange={(e) => setBurnout(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-300 font-medium text-[11px]">
                  <span>Inner Calmness</span>
                  <span className="font-mono text-teal-400 font-bold">{calmness} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={calmness}
                  onChange={(e) => setCalmness(parseInt(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Suggested Mood-Boosting Exercise & Guided Timer (6 cols) */}
        <div className="lg:col-span-6 athena-card p-5 space-y-4 border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Prescribed Mental Health Routine
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeted exercise tailored to lift your mood and reduce stress
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-950 text-purple-400 border border-purple-800">
              {selectedExercise.category}
            </span>
          </div>

          {/* Exercise Hero Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  {selectedExercise.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                  <span>⏱️ {selectedExercise.durationMins} Minutes</span>
                  <span>⚡ Intensity: {selectedExercise.intensity}</span>
                </div>
              </div>

              {/* Timer Display */}
              {exerciseTimer !== null && (
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-purple-400">
                    {formatTime(exerciseTimer)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Timer</div>
                </div>
              )}
            </div>

            {/* Why It Helps */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong className="text-purple-300">Why It Works: </strong>
              {selectedExercise.whyItHelps}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  timerActive
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30"
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                {timerActive ? "Pause Exercise Timer" : "Start Guided Exercise"}
              </button>
              <button
                onClick={() => {
                  setExerciseTimer(selectedExercise.durationMins * 60);
                  setTimerActive(false);
                }}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase font-mono">
              Step-by-Step Execution Guide:
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              {selectedExercise.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/40 border border-slate-800/60">
                  <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-purple-800">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick List of Other Mood Exercises */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono mb-2">
              Browse All Mental Health Exercises:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MENTAL_HEALTH_EXERCISES.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setSelectedExercise(ex);
                    setExerciseTimer(ex.durationMins * 60);
                    setTimerActive(false);
                  }}
                  className={`p-2 rounded-lg text-left text-xs transition-all border ${
                    selectedExercise.id === ex.id
                      ? "bg-purple-950/60 border-purple-500/60 text-white font-semibold"
                      : "bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="truncate">{ex.title}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {ex.durationMins}m &bull; {ex.category}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 24/7 URGENT CRISIS & SERIOUS MENTAL HEALTH SUPPORT (TOLL-FREE NUMBERS)    */}
      {/* ========================================================================= */}
      <div className="mt-8 p-6 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-[#190F12] via-[#120D10] to-[#0B100E] space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                  24/7 Crisis &amp; Serious Mental Health Support
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Immediate Toll-Free Confidential Helplines
              </h3>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono">
            <LifeBuoy className="w-3.5 h-3.5 text-rose-400" />
            <span>100% Free &bull; Anonymous &bull; Available 24/7</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          If you or someone you know is undergoing acute emotional distress, intense anxiety, severe depression, panic attacks, or thoughts of self-harm, please connect with certified counselors immediately. You are not alone and compassionate help is one tap away.
        </p>

        {/* Helpline Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {/* 1. Tele-MANAS */}
          <div className="p-4 rounded-xl border border-rose-500/30 bg-[#0B100E]/80 space-y-3 flex flex-col justify-between hover:border-rose-400/60 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                  National Tele-MANAS
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Govt. 24/7</span>
              </div>
              <div className="text-xl font-mono font-extrabold text-white tracking-tight pt-1">
                14416
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Alt: 1800-891-4416
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Ministry of Health (India) 24/7 comprehensive psychological counseling across 20+ regional languages.
              </p>
            </div>
            <a
              href="tel:14416"
              className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-rose-600/20 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call 14416 (Toll-Free)</span>
            </a>
          </div>

          {/* 2. KIRAN Helpline */}
          <div className="p-4 rounded-xl border border-rose-500/30 bg-[#0B100E]/80 space-y-3 flex flex-col justify-between hover:border-rose-400/60 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                  KIRAN Helpline
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">24/7 Active</span>
              </div>
              <div className="text-lg font-mono font-extrabold text-white tracking-tight pt-1">
                1800-599-0019
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Govt. Rehabilitation
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Department of Empowerment of Persons with Disabilities. Specialized crisis intervention, stress, and anxiety support.
              </p>
            </div>
            <a
              href="tel:18005990019"
              className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-rose-600/20 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call 1800-599-0019</span>
            </a>
          </div>

          {/* 3. Vandrevala Foundation */}
          <div className="p-4 rounded-xl border border-rose-500/30 bg-[#0B100E]/80 space-y-3 flex flex-col justify-between hover:border-rose-400/60 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                  Vandrevala Trust
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Free 24/7</span>
              </div>
              <div className="text-lg font-mono font-extrabold text-white tracking-tight pt-1">
                9999 666 555
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                +91 9999 666 555
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Experienced clinical psychologists providing confidential de-escalation, panic stabilization, and counseling.
              </p>
            </div>
            <a
              href="tel:+919999666555"
              className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-rose-600/20 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call 9999 666 555</span>
            </a>
          </div>

          {/* 4. Emergency & International */}
          <div className="p-4 rounded-xl border border-rose-500/30 bg-[#0B100E]/80 space-y-3 flex flex-col justify-between hover:border-rose-400/60 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                  Emergency &amp; Global
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">Emergency</span>
              </div>
              <div className="text-lg font-mono font-extrabold text-white tracking-tight pt-1">
                112 / 988
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                National Emergency
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Dial <strong>112</strong> in India &amp; Europe for emergency services. Dial <strong>988</strong> in the US &amp; Canada for the Suicide &amp; Crisis Lifeline.
              </p>
            </div>
            <a
              href="tel:112"
              className="w-full py-2 px-3 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-red-700/20 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Emergency (112)</span>
            </a>
          </div>
        </div>

        {/* Disclaimer Notice */}
        <div className="p-3 bg-black/40 rounded-xl border border-rose-500/20 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>
            <strong>Disclaimer:</strong> PRANA Mental Wellness is designed for athletic mindfulness and performance self-regulation. If you or someone you know is in acute danger or experiencing psychiatric crises, please contact emergency responders or call the toll-free helplines above without delay.
          </span>
        </div>
      </div>
    </div>
  );
};
