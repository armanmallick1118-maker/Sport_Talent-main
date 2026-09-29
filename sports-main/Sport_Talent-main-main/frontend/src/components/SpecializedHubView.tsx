"use client";

import React, { useState } from "react";
import {
  Heart,
  Shield,
  Clock,
  Users,
  Share2,
  CheckCircle2,
  AlertCircle,
  Network,
  Info,
  ChevronRight,
  Flame,
  Award,
} from "lucide-react";

export const SpecializedHubView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "womens" | "pcos" | "age_plus" | "sedentary" | "competition" | "graph"
  >("womens");

  // Women's Wellness State
  const [cycleDay, setCycleDay] = useState(14);
  const [isIrregular, setIsIrregular] = useState(false);

  // Age+ Caregiver Mode Consent
  const [caregiverConsented, setCaregiverConsented] = useState(false);

  // Sedentary Inactivity State
  const [sedentaryMinutes, setSedentaryMinutes] = useState(120);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="text-xs font-semibold tracking-wider text-blue-500 uppercase flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5" />
          Specialized Wellness Intelligence
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
          Specialized Wellness Hub
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Dedicated modules for Women&apos;s Wellness, PCOS/PCOD Support, PRANA AGE+, Sedentary Inactivity, Healthy Peer Challenges, and the Wellness Knowledge Graph.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "womens", label: "Women's Wellness" },
          { id: "pcos", label: "PCOS / PCOD Support" },
          { id: "age_plus", label: "PRANA AGE+" },
          { id: "sedentary", label: "Sedentary Intelligence" },
          { id: "competition", label: "Healthy Challenges" },
          { id: "graph", label: "Wellness Knowledge Graph" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === t.id
                ? "bg-slate-900 border border-slate-700 text-white font-bold"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. WOMEN'S WELLNESS MODULE */}
      {activeTab === "womens" && (
        <div className="athena-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">
                Cycle-Aware Wellness &amp; Phase Adaptation
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Adapts training and nutrition recommendations to physiological cycle phases. Supports irregular cycles.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium">Irregular Cycle Support:</label>
              <input
                type="checkbox"
                checked={isIrregular}
                onChange={(e) => setIsIrregular(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 font-medium">Current Phase</div>
              <div className="text-lg font-bold text-white font-mono">
                {isIrregular ? "Adaptive Cadence" : cycleDay <= 5 ? "Menstrual" : cycleDay <= 13 ? "Follicular" : cycleDay <= 16 ? "Ovulatory" : "Luteal"}
              </div>
              <div className="text-xs text-slate-400">
                Day {cycleDay} of cycle
              </div>
              <input
                type="range"
                min="1"
                max="32"
                value={cycleDay}
                onChange={(e) => setCycleDay(parseInt(e.target.value))}
                className="w-full accent-blue-600 mt-2"
              />
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 font-medium">Phase Exercise Recommendation</div>
              <div className="text-sm font-semibold text-emerald-400">
                {cycleDay <= 14 ? "Progressive Strength & Skills" : "Steady-State Aerobic & Mobility"}
              </div>
              <div className="text-xs text-slate-300 leading-relaxed">
                Estrogen supports neuromuscular resilience. Solid window for progressive resistance sets.
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 font-medium">Nutritional Focus</div>
              <div className="text-sm font-semibold text-blue-400">
                Iron &amp; Complex Carbohydrates
              </div>
              <div className="text-xs text-slate-300 leading-relaxed">
                Prioritize lentils, leafy vegetables, warm stews, and adequate magnesium for cellular energy.
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400">
            PRANA Women&apos;s Wellness provides educational, supportive lifestyle suggestions. Does not make medical diagnosis or prescribe clinical treatments.
          </div>
        </div>
      )}

      {/* 2. PCOS / PCOD SUPPORT MODULE */}
      {activeTab === "pcos" && (
        <div className="athena-card p-6 space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <span className="badge-clean badge-amber text-[10px] uppercase font-mono">
              Wellness Support • Not Diagnostic
            </span>
            <h2 className="text-base font-bold text-white mt-1">
              PCOS / PCOD Lifestyle Support Module
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Empowering metabolic and daily movement habits. PRANA never diagnoses PCOS or hormonal disease.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-white uppercase tracking-wider">
                Lifestyle &amp; Metabolic Habits
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Post-meal 10–15 minute gentle walking to assist natural insulin sensitivity.</li>
                <li>Favor low-glycemic complex carbohydrates (millets, oats, lentils, green vegetables).</li>
                <li>Avoid chronic exhaustive high-intensity overtraining that spikes cortisol.</li>
                <li>Maintain a consistent 8-hour sleep window in a dark, cool environment.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-white uppercase tracking-wider">
                Supportive Pattern Insights
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                &ldquo;Your activity and sleep patterns have remained steady over the last 14 days. Consistent low-impact movement and balanced fiber intake support long-term metabolic health.&rdquo;
              </p>
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[11px] text-amber-300/90 leading-relaxed mt-2">
                <strong>Professional Advisory:</strong> If you observe persistent irregular cycles, unexplained fatigue, or metabolic changes, please consult a qualified gynecologist or endocrinologist.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PRANA AGE+ MODULE */}
      {activeTab === "age_plus" && (
        <div className="athena-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">
                PRANA AGE+ (Older Adult Fitness &amp; Vitality)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Focus on safe functional strength, mobility, balance, fall prevention, and low-impact chair exercises.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Caregiver Mode:</span>
              <button
                onClick={() => setCaregiverConsented(!caregiverConsented)}
                className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                  caregiverConsented
                    ? "bg-emerald-950 border-emerald-700 text-emerald-400 font-semibold"
                    : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                {caregiverConsented ? "Consented (Active)" : "Consent Disabled"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <div className="text-xs font-bold text-white">Chair Sit-to-Stand</div>
              <div className="text-xs text-slate-400">8–10 reps • Functional Lower Strength</div>
              <div className="text-[11px] text-slate-500 pt-1">Press through whole feet with chest tall.</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <div className="text-xs font-bold text-white">Tandem Heel-to-Toe Stance</div>
              <div className="text-xs text-slate-400">15–20 sec • Fall Prevention &amp; Balance</div>
              <div className="text-[11px] text-slate-500 pt-1">Keep one hand resting lightly near a wall.</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <div className="text-xs font-bold text-white">Seated Spinal Rotation</div>
              <div className="text-xs text-slate-400">5 gentle reps • Thoracic Freedom</div>
              <div className="text-[11px] text-slate-500 pt-1">Gentle exhale on turn; never force through pain.</div>
            </div>
          </div>

          {caregiverConsented && (
            <div className="p-3.5 bg-slate-950 rounded-lg border border-emerald-900/50 text-xs text-slate-300">
              <strong className="text-emerald-400">Caregiver Consent Enabled:</strong> Designated family contact can view exercise completion status and mobility check-ins. Private personal logs remain protected.
            </div>
          )}
        </div>
      )}

      {/* 4. SEDENTARY ACTIVITY INTELLIGENCE */}
      {activeTab === "sedentary" && (
        <div className="athena-card p-6 space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white">
              Sedentary Activity Intelligence
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracks continuous desk sitting and suggests short, non-guilt mobility breaks.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">Continuous Inactivity Logged</span>
              <span className="font-mono text-amber-400 font-semibold">{sedentaryMinutes} minutes (~2 hrs)</span>
            </div>
            <input
              type="range"
              min="0"
              max="240"
              step="15"
              value={sedentaryMinutes}
              onChange={(e) => setSedentaryMinutes(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Gentle Movement Prompt (Non-Guilt)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              &ldquo;You&apos;ve been focused at your desk for approximately {Math.floor(sedentaryMinutes / 60)} hours. Want to take a short 2-minute movement break?&rdquo;
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <span className="badge-clean badge-blue">10 shoulder rolls</span>
              <span className="badge-clean badge-emerald">5 neck stretches</span>
              <span className="badge-clean badge-amber">Refill water glass (250ml)</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. HEALTHY COMPETITION / CHALLENGES */}
      {activeTab === "competition" && (
        <div className="athena-card p-6 space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white">
              Healthy Peer Challenges &amp; Achievements
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Focuses on habit consistency and athletic progress. Strictly avoids body weight or appearance comparisons.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="badge-clean badge-blue text-[10px]">Consistency</span>
                <span className="text-[10px] text-slate-500">284 joined</span>
              </div>
              <div className="text-sm font-bold text-white">100 Min Weekly Movement</div>
              <div className="text-xs text-slate-400 leading-relaxed">
                Accumulate 100 minutes of distributed walking or cardio across 7 days.
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: "72%" }}></div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="badge-clean badge-emerald text-[10px]">Mobility</span>
                <span className="text-[10px] text-slate-500">196 joined</span>
              </div>
              <div className="text-sm font-bold text-white">30-Day Mobility Continuity</div>
              <div className="text-xs text-slate-400 leading-relaxed">
                Complete at least 5 minutes of hip and thoracic mobility daily.
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: "55%" }}></div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="badge-clean badge-amber text-[10px]">Strength</span>
                <span className="text-[10px] text-slate-500">145 joined</span>
              </div>
              <div className="text-sm font-bold text-white">Improve Push-Up Reps by 20%</div>
              <div className="text-xs text-slate-400 leading-relaxed">
                Upper body stamina progression over 6 weeks.
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2">
                <div className="bg-amber-600 h-full rounded-full" style={{ width: "80%" }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. PERSONAL WELLNESS KNOWLEDGE GRAPH */}
      {activeTab === "graph" && (
        <div className="athena-card p-6 space-y-5">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-400" />
                Personal Wellness Correlation Graph
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Maps associative relationships across Sleep, Readiness, Performance, and Training without claiming false causation.
              </p>
            </div>
            <span className="badge-clean badge-blue text-[10px]">
              Associative Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-white uppercase tracking-wider">
                Discovered Associations (Longitudinal)
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="text-slate-200 font-medium">Sleep Duration &harr; Morning Readiness</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Nights with &gt;=7.5h sleep correlate strongly (r &approx; +0.88) with +18pt readiness score increases.
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="text-slate-200 font-medium">Readiness &harr; Workout Repetition Volume</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Readiness &gt;70 is associated with lower perceived exertion (RPE 6 vs 8) for identical sets.
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="text-slate-200 font-medium">Hydration &harr; Afternoon Energy Stability</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Days meeting 2,500ml water target correlate with reported higher afternoon mental focus.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-white uppercase tracking-wider">
                Scientific Non-Causal Guardrail
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                PRANA strictly utilizes relational language (&ldquo;associated with&rdquo;, &ldquo;correlates with&rdquo;, &ldquo;appears related to&rdquo;) rather than claiming deterministic causation. Physiological data reflects interrelated systems.
              </p>
              <div className="p-3 bg-slate-900 rounded border border-slate-800 text-xs text-slate-400">
                Nodes: User &bull; Fitness &bull; Training &bull; Recovery &bull; Sleep &bull; Nutrition &bull; Performance &bull; Goals
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
