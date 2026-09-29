"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PranaOrbit } from "./PranaOrbit";
import { ThemeCustomizerModal } from "@/components/ThemeEngine";
import {
  Palette,
  ArrowRight,
  Cpu,
  Zap,
  Camera,
  Compass,
  Repeat,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Layers,
  ArrowDown,
  Activity,
  Award,
  LogOut,
} from "lucide-react";

export const PranaHome: React.FC = () => {
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("user");
    } catch {}
    window.location.replace("/login");
  };

  const scrollToOrbit = () => {
    const el = document.getElementById("prana-orbit-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B100E] text-[#F3F5F0] antialiased selection:bg-[var(--primary)] selection:text-[#0B100E]">
      {/* =================================================== */}
      {/* A. MINIMAL HEADER                                   */}
      {/* =================================================== */}
      <header className="sticky top-0 z-40 w-full h-16 bg-[#0B100E]/90 backdrop-blur-md border-b border-[#27332D] px-4 sm:px-8 flex items-center justify-between">
        {/* Left: Clickable PRANA Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 group cursor-pointer"
          aria-label="Go to PRANA home"
          title="PRANA - Home"
        >
          <img
            src="/prana-logo.jpg"
            alt="PRANA Official Emblem"
            className="w-9 h-9 rounded-xl object-cover border border-[#B7F34A]/50 shadow-sm shadow-[#B7F34A]/20 group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <div className="text-base sm:text-lg font-bold tracking-wider font-mono text-white flex items-center gap-1.5 leading-none group-hover:text-[#B7F34A] transition-colors">
              PRANA
              <span className="w-1.5 h-1.5 rounded-full bg-[#B7F34A]"></span>
            </div>
            <span className="text-[9px] font-medium text-[#A4AEA8] lowercase tracking-tight mt-0.5 hidden sm:block">
              personal responsive adaptive network &amp; analytics
            </span>
          </div>
        </Link>

        {/* Right: Theme Customizer, Enter Workspace & Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-[#27332D] bg-[#111815] text-[#A4AEA8] hover:text-[#F3F5F0] hover:border-[#25D9D0] transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer"
            title="Theme Engine"
          >
            <Palette className="w-3.5 h-3.5 text-[#25D9D0]" />
            <span className="hidden sm:inline">Theme</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl border border-red-500/40 bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:text-red-300 hover:border-red-500/60 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer"
            title="Log Out of PRANA"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Log Out</span>
          </button>

          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-[#B7F34A] text-[#0B100E] font-bold text-xs font-mono flex items-center gap-1.5 hover:bg-[#cbf774] shadow-md shadow-[#B7F34A]/20 transition-all cursor-pointer"
          >
            <span>ENTER DASHBOARD</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* =================================================== */}
      {/* B. HERO & STATEMENT                                */}
      {/* =================================================== */}
      <section className="pt-12 sm:pt-16 pb-6 px-4 sm:px-6 text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#27332D] bg-[#111815] text-[11px] font-mono text-[#B7F34A] uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#B7F34A] animate-ping"></span>
          <span>A Personal Intelligence System</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight font-sans">
          YOUR BODY. <br className="sm:hidden" />
          YOUR DATA. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B7F34A] via-[#25D9D0] to-[#55B9FF]">
            YOUR FUTURE.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-[#A4AEA8] max-w-2xl mx-auto font-normal leading-relaxed">
          PRANA continuously learns how you move, train, recover, eat and respond — creating a living digital model of your physical and metabolic potential.
        </p>
      </section>

      {/* =================================================== */}
      {/* C. 13 FEATURE ORBIT SYSTEM (MAIN VISUAL FOCUS)       */}
      {/* =================================================== */}
      <section id="prana-orbit-section" className="px-4 overflow-hidden">
        <PranaOrbit />
      </section>

      {/* =================================================== */}
      {/* D. USP & CLOSED LOOP ARCHITECTURE                   */}
      {/* =================================================== */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto border-t border-[#27332D]/70 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#B7F34A]">
            Fundamental Philosophy
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            NOT ANOTHER FITNESS TRACKER. <br />
            <span className="text-[#25D9D0]">PRANA BUILDS A LIVING MODEL OF YOU.</span>
          </h2>
          <p className="text-sm text-[#A4AEA8] leading-relaxed pt-2">
            Your fitness isn&apos;t static. Your training changes. Your recovery changes. Your nutrition changes. Your sleep changes. Your body responds differently over time. PRANA learns these dynamics and continuously updates your personal intelligence model.
          </p>
        </div>

        {/* Closed Loop Horizontal Flow */}
        <div className="p-6 sm:p-8 rounded-2xl border border-[#27332D] bg-[#111815] space-y-6">
          <div className="flex items-center justify-between border-b border-[#27332D] pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F3F5F0]">
              The Closed-Loop Intelligence Architecture
            </span>
            <span className="text-[10px] font-mono text-[#B7F34A] bg-[#B7F34A]/10 px-2 py-0.5 rounded border border-[#B7F34A]/30">
              Deterministic Loop
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center">
            {[
              { step: "01", name: "DATA", desc: "Wearables & CV" },
              { step: "02", name: "DIGITAL TWIN", desc: "Physiological Model" },
              { step: "03", name: "CURRENT STATE", desc: "Readiness Index" },
              { step: "04", name: "ANALYSIS", desc: "Diagnostic Logic" },
              { step: "05", name: "SIMULATION", desc: "Scenario Modeling" },
              { step: "06", name: "ACTION", desc: "Calibrated Work" },
              { step: "07", name: "NEW DATA", desc: "Biometric Shift" },
              { step: "08", name: "LEARNING", desc: "Model Adaptation" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-[#27332D] bg-[#17201B] flex flex-col items-center justify-center space-y-1"
              >
                <span className="text-[10px] font-mono font-bold text-[#B7F34A]">{item.step}</span>
                <span className="text-xs font-bold text-white tracking-tight">{item.name}</span>
                <span className="text-[9px] text-[#A4AEA8] font-mono">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================== */}
      {/* E. 5 MAJOR USP HIGHLIGHTS                           */}
      {/* =================================================== */}
      <section className="py-12 sm:py-20 px-4 sm:px-8 max-w-6xl mx-auto space-y-10 border-t border-[#27332D]/70">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#55B9FF]">
            Architectural Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Five Pillars of Athletic Intelligence
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Pillar 01 */}
          <div className="p-6 rounded-2xl border border-[#27332D] bg-[#111815] space-y-3 hover:border-[#B7F34A]/40 transition-colors">
            <div className="text-xs font-mono font-bold text-[#B7F34A]">01 // ARCHITECTURE</div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#B7F34A]" />
              Personal Digital Twin
            </h3>
            <p className="text-xs text-[#A4AEA8] leading-relaxed">
              A continuously evolving, versioned digital model of your physical strength, autonomic recovery, metabolic nutrition, and movement biomechanics.
            </p>
          </div>

          {/* Pillar 02 */}
          <div className="p-6 rounded-2xl border border-[#27332D] bg-[#111815] space-y-3 hover:border-[#25D9D0]/40 transition-colors">
            <div className="text-xs font-mono font-bold text-[#25D9D0]">02 // ADAPTATION</div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#25D9D0]" />
              Adaptive Intelligence
            </h3>
            <p className="text-xs text-[#A4AEA8] leading-relaxed">
              Learns from longitudinal data rather than handing out one-size-fits-all routines. Your training stimuli recalibrate automatically as your fatigue shifts.
            </p>
          </div>

          {/* Pillar 03 */}
          <div className="p-6 rounded-2xl border border-[#27332D] bg-[#111815] space-y-3 hover:border-[#55B9FF]/40 transition-colors">
            <div className="text-xs font-mono font-bold text-[#55B9FF]">03 // BIOMECHANICS</div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#55B9FF]" />
              Computer Vision Coach
            </h3>
            <p className="text-xs text-[#A4AEA8] leading-relaxed">
              Zero wearable hardware required: use your device camera for real-time 3D joint angle detection, barbell path tracking, and instant kinematic form corrections.
            </p>
          </div>

          {/* Pillar 04 */}
          <div className="p-6 rounded-2xl border border-[#27332D] bg-[#111815] space-y-3 hover:border-amber-400/40 transition-colors">
            <div className="text-xs font-mono font-bold text-amber-400">04 // SIMULATION</div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Future What-If Modeling
            </h3>
            <p className="text-xs text-[#A4AEA8] leading-relaxed">
              &quot;What happens if I train 4 days instead of 2?&quot; &quot;What if my recovery improves by 15%?&quot; PRANA projects deterministic physiological trajectories before you commit.
            </p>
          </div>

          {/* Pillar 05 */}
          <div className="p-6 rounded-2xl border border-[#27332D] bg-[#111815] space-y-3 hover:border-emerald-400/40 transition-colors md:col-span-2 lg:col-span-2">
            <div className="text-xs font-mono font-bold text-emerald-400">05 // HYPERLOCAL</div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              Geo-Fitness Radar
            </h3>
            <p className="text-xs text-[#A4AEA8] leading-relaxed">
              Understands the physical sports geography around you across a 20+ km radius: Olympic tracks, open grounds, powerlifting gyms, badminton courts, and certified coaches, mapped directly to your training goals.
            </p>
          </div>
        </div>
      </section>

      {/* =================================================== */}
      {/* F. "WHY PRANA?" SYSTEMIC COMPARISON                 */}
      {/* =================================================== */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 max-w-5xl mx-auto border-t border-[#27332D]/70 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#B7F34A]">
            The Paradigmatic Shift
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Traditional Fitness Apps vs. PRANA
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional Card */}
          <div className="p-6 rounded-2xl border border-[#27332D] bg-[#111815]/60 space-y-4 opacity-75">
            <div className="text-xs font-mono font-bold uppercase text-[#A4AEA8]">
              Traditional Fitness Trackers
            </div>
            <div className="text-lg font-bold text-[#A4AEA8] font-mono flex items-center gap-2">
              <span>TRACK</span> &rarr; <span>DISPLAY</span> &rarr; <span>REPEAT</span>
            </div>
            <ul className="text-xs text-[#A4AEA8] space-y-2 font-mono">
              <li>&bull; Logs what you did yesterday (past oriented)</li>
              <li>&bull; Static cookie-cutter exercise programs</li>
              <li>&bull; Ignores physiological sleep deficit &amp; stress</li>
              <li>&bull; Disconnected silos of step counts and calories</li>
            </ul>
          </div>

          {/* PRANA Card */}
          <div className="p-6 rounded-2xl border-2 border-[#B7F34A]/50 bg-[#17201B] space-y-4 shadow-xl shadow-[#B7F34A]/5 relative">
            <span className="absolute top-4 right-4 text-[9px] font-mono font-bold bg-[#B7F34A] text-[#0B100E] px-2 py-0.5 rounded">
              PRANA INTELLIGENCE
            </span>
            <div className="text-xs font-mono font-bold uppercase text-[#B7F34A]">
              Personal Responsive Network
            </div>
            <div className="text-sm sm:text-base font-bold text-white font-mono flex flex-wrap items-center gap-1.5 text-[#B7F34A]">
              <span>OBSERVE</span> &rarr; <span>UNDERSTAND</span> &rarr; <span>MODEL</span> &rarr; <span>SIMULATE</span> &rarr; <span>ADAPT</span> &rarr; <span>LEARN</span>
            </div>
            <ul className="text-xs text-[#F3F5F0] space-y-2 font-mono">
              <li>&bull; Builds an immutable, living Digital Twin of your body</li>
              <li>&bull; Deterministic stimulus based on daily morning readiness</li>
              <li>&bull; Integrated biomechanics, nutrition, mental health &amp; sleep</li>
              <li>&bull; Continuous closed-loop learning from every repetition</li>
            </ul>
          </div>
        </div>
      </section>

      {/* =================================================== */}
      {/* G. CALL TO ACTION                                   */}
      {/* =================================================== */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 text-center max-w-4xl mx-auto border-t border-[#27332D]/70 space-y-6">
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          KNOW YOUR STATE. <br />
          <span className="text-[#B7F34A]">SHAPE YOUR FUTURE.</span>
        </h2>

        <p className="text-sm sm:text-base text-[#A4AEA8] max-w-xl mx-auto">
          PRANA turns your everyday fitness and biometric data into actionable personal intelligence.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#B7F34A] text-[#0B100E] font-bold text-sm font-mono flex items-center justify-center gap-2 hover:bg-[#cbf774] shadow-lg shadow-[#B7F34A]/25 transition-all cursor-pointer"
          >
            <span>ENTER PRANA DASHBOARD</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={scrollToOrbit}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-[#27332D] bg-[#111815] text-[#F3F5F0] font-semibold text-sm font-mono hover:border-[#25D9D0] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>EXPLORE THE 13 NODES</span>
            <ArrowDown className="w-4 h-4 text-[#25D9D0]" />
          </button>
        </div>
      </section>

      {/* =================================================== */}
      {/* H. FOOTER                                           */}
      {/* =================================================== */}
      <footer className="border-t border-[#27332D] py-8 px-4 sm:px-8 bg-[#0B100E] text-xs font-mono text-[#A4AEA8]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/prana-logo.jpg"
              alt="PRANA Logo"
              className="w-6 h-6 rounded-lg object-cover border border-[#B7F34A]/40"
            />
            <span className="font-bold text-white">PRANA</span>
            <span className="text-[10px] text-[#A4AEA8]">
              — Personal Responsive Adaptive Network &amp; Analytics
            </span>
          </div>

          <div className="flex items-center gap-5 sm:gap-6 flex-wrap justify-center">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Workspace
            </Link>
            <Link href="/dashboard?view=goals" className="hover:text-white transition-colors">
              Goals Engine
            </Link>
            <Link href="/dashboard?view=twin" className="hover:text-white transition-colors">
              Digital Twin
            </Link>
            <Link href="/dashboard?view=profile" className="hover:text-white transition-colors">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer"
              title="Sign out of PRANA"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Theme Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
};
