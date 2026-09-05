"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, ViewType } from "@/components/Sidebar";
import { DashboardView } from "@/components/DashboardView";
import { DigitalTwinView } from "@/components/DigitalTwinView";
import { FitnessEngineView } from "@/components/FitnessEngineView";
import { AICoachView } from "@/components/AICoachView";
import { NutritionView } from "@/components/NutritionView";
import { RecoveryView } from "@/components/RecoveryView";
import { MentalWellnessView } from "@/components/MentalWellnessView";
import { ProgressView } from "@/components/ProgressView";
import { GoalsView } from "@/components/GoalsView";
import { CVExerciseView } from "@/components/CVExerciseView";
import { HealthHubView } from "@/components/HealthHubView";
import { SpecializedHubView } from "@/components/SpecializedHubView";
import { ProfileView } from "@/components/ProfileView";
import { GeospatialRadarView } from "@/components/GeospatialRadarView";
import { ThemeCustomizerModal } from "@/components/ThemeEngine";
import { Menu, X, LogOut, Palette, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Strict Authentication Guard
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      if (!token && isLoggedIn !== "true") {
        window.location.replace("/login");
        return false;
      }
      return true;
    };

    if (!checkAuth()) return;

    // Handle bfcache / back-forward navigation after logout
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        checkAuth();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    try {
      const saved = localStorage.getItem("prana_sidebar_collapsed") || localStorage.getItem("athena_sidebar_collapsed");
      if (saved !== null) {
        setIsSidebarCollapsed(saved === "true");
      }

      // Check if user was directed to a specific view (e.g. from circular feature node on homepage)
      const urlParams = new URLSearchParams(window.location.search);
      const requestedView = urlParams.get("view") as ViewType | null;
      const initialView = localStorage.getItem("prana_initial_view") as ViewType | null;
      if (requestedView) {
        setCurrentView(requestedView);
      } else if (initialView) {
        setCurrentView(initialView);
        localStorage.removeItem("prana_initial_view");
      }
    } catch {}

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("prana_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("user");
    } catch {}
    // Use replace so current page is removed from history stack, preventing Back button return
    window.location.replace("/login");
  };

  // Live state synchronized from FastAPI backend (with immediate mock fallback)
  const [twinData, setTwinData] = useState<any>({
    version: "Twin v1",
    version_number: 1,
    scores: {
      strength: 72,
      endurance: 70,
      cardio: 68,
      mobility: 64,
      flexibility: 62,
      balance: 74,
      agility: 66,
      consistency: 76,
    },
  });

  const [recommendation, setRecommendation] = useState<any>({
    title: "20 Min Moderate Kinetic Workout",
    summary: "Controlled bodyweight circuit with dynamic mobility warmup.",
    reasoning_why:
      "Your recovery is good, but activity has been lower than your normal baseline.",
    duration_minutes: 20,
    intensity: "MODERATE",
  });

  const [readinessData, setReadinessData] = useState<any>({
    readiness_score: 74,
    state: "GOOD",
    recommended_intensity: "MODERATE",
  });

  // Fetch telemetry on load
  useEffect(() => {
    async function loadBackendData() {
      try {
        const twinRes = await fetch("http://127.0.0.1:8000/api/v1/twin");
        if (twinRes.ok) setTwinData(await twinRes.json());
      } catch (e) {
        // Fallback already pre-set
      }

      try {
        const recRes = await fetch("http://127.0.0.1:8000/api/v1/coach/recommendation");
        if (recRes.ok) setRecommendation(await recRes.json());
      } catch (e) {}

      try {
        const readRes = await fetch("http://127.0.0.1:8000/api/v1/recovery/readiness");
        if (readRes.ok) setReadinessData(await readRes.json());
      } catch (e) {}
    }
    loadBackendData();
  }, []);

  const handleAssessmentSubmitted = (scores: any) => {
    setTwinData((prev: any) => ({
      ...prev,
      version: "Twin v2",
      scores: scores,
    }));
  };

  const renderActiveView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <DashboardView
            onNavigate={(v) => setCurrentView(v)}
            twinData={twinData}
            recommendation={recommendation}
            readinessData={readinessData}
          />
        );
      case "twin":
        return <DigitalTwinView twinData={twinData} />;
      case "fitness":
        return <FitnessEngineView onAssessmentSubmitted={handleAssessmentSubmitted} />;
      case "coach":
        return (
          <AICoachView
            recommendation={recommendation}
            readinessData={readinessData}
            twinData={twinData}
            onNavigate={(v) => setCurrentView(v)}
          />
        );
      case "nutrition":
        return <NutritionView />;
      case "recovery":
        return <RecoveryView readinessData={readinessData} />;
      case "mental":
        return <MentalWellnessView />;
      case "progress":
        return <ProgressView />;
      case "goals":
        return <GoalsView />;
      case "cv":
        return <CVExerciseView />;
      case "health":
        return <HealthHubView />;
      case "specialized":
        return <SpecializedHubView />;
      case "profile":
        return <ProfileView />;
      case "georadar":
        return <GeospatialRadarView />;
      default:
        return <DashboardView onNavigate={(v) => setCurrentView(v)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased font-sans transition-colors duration-200">
      {/* Desktop Sticky Sidebar (Gemini Style Collapsible) */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 z-30 transition-all duration-300 ease-in-out shrink-0 ${
          isSidebarCollapsed
            ? "w-0 opacity-0 pointer-events-none -translate-x-full overflow-hidden"
            : "w-64 opacity-100 translate-x-0"
        }`}
      >
        <Sidebar
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          twinVersion={twinData?.version}
          readinessScore={readinessData?.readiness_score}
          onToggleCollapse={toggleSidebar}
        />
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="relative z-10 w-64 bg-[var(--surface)] h-full shadow-2xl border-r border-[var(--border)]">
            <Sidebar
              currentView={currentView}
              onSelectView={(v) => {
                setCurrentView(v);
                setMobileMenuOpen(false);
              }}
              twinVersion={twinData?.version}
              readinessScore={readinessData?.readiness_score}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden transition-all duration-300">
        {/* Universal Persistent Header across all pages */}
        <header className="sticky top-0 z-20 w-full h-14 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between transition-colors duration-200">
          {/* Left: View Breadcrumb / Collapse Trigger with Global Home Link */}
          <div className="flex items-center gap-3">
            {isSidebarCollapsed ? (
              <button
                onClick={toggleSidebar}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)] flex items-center gap-2 text-xs font-semibold transition-all group"
                title="Expand sidebar"
              >
                <Menu className="w-4 h-4 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                <img src="/prana-logo.jpg" alt="PRANA" className="w-4 h-4 rounded-md object-cover border border-[var(--primary)]/30" />
                <span className="font-mono font-bold text-[var(--foreground)]">PRANA</span>
                <span className="text-[10px] text-[var(--muted)] font-mono bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)]">Expand</span>
              </button>
            ) : (
              <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
                <Link
                  href="/"
                  className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--primary)] transition-colors group cursor-pointer"
                  aria-label="Go to PRANA home"
                  title="Go to PRANA home"
                >
                  <img src="/prana-logo.jpg" alt="PRANA" className="w-4 h-4 rounded object-cover border border-[var(--primary)]/30" />
                  <span className="font-bold uppercase tracking-wider group-hover:text-[var(--primary)]">PRANA</span>
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--border)]" />
                <span className="text-[var(--foreground)] font-semibold capitalize">
                  {currentView === "georadar" ? "Sports Facilities Radar" : currentView.replace(/([A-Z])/g, " $1")}
                </span>
              </div>
            )}

            {/* Mobile View Title & Burger */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)]"
                title="Open menu"
              >
                <Menu className="w-4 h-4 text-[var(--primary)]" />
              </button>
              <Link href="/" className="flex items-center gap-2" aria-label="Go to PRANA home">
                <img src="/prana-logo.jpg" alt="PRANA" className="w-5 h-5 rounded-md object-cover border border-[var(--primary)]/40" />
                <div className="flex flex-col">
                  <span className="font-mono font-bold text-xs text-[var(--foreground)] leading-none">PRANA</span>
                  <span className="text-[9px] text-[var(--muted)] font-mono capitalize">{currentView}</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Right: Home Link, Theme Customizer & Persistent Upper Right Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all flex items-center gap-1.5 text-xs font-medium"
              title="Return to PRANA Home"
            >
              <span className="hidden sm:inline">Home</span>
            </Link>

            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--secondary)] transition-all flex items-center gap-1.5 text-xs font-medium"
              title="Customize PRANA Theme"
            >
              <Palette className="w-3.5 h-3.5 text-[var(--secondary)]" />
              <span className="hidden sm:inline">Theme</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
              title="Log Out of PRANA"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {renderActiveView()}
        </main>
      </div>

      {/* Theme Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
}
