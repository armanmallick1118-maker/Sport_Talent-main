"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  X,
  Dumbbell,
  Heart,
  Save,
  Check,
} from "lucide-react";

export const ProfileView: React.FC = () => {
  // Fields (initialized clean for new users, only name auto-populated)
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "CUSTOM">("MALE");
  const [customGender, setCustomGender] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("BEGINNER");
  const [activityLevel, setActivityLevel] = useState("MODERATE");

  // Optional fields
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [dietaryPref, setDietaryPref] = useState("INDIAN_STANDARD");
  const [equipment, setEquipment] = useState("");

  // Dynamic & Interactive Sports / Fitness Interests
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [customSportInput, setCustomSportInput] = useState("");

  const presetSports = [
    "Sprinting",
    "Distance Running",
    "Strength / Powerlifting",
    "Crossfit",
    "Football",
    "Cricket",
    "Basketball",
    "Swimming",
    "Calisthenics",
    "Yoga & Mobility",
    "Badminton",
    "Combat Sports / MMA",
  ];

  // Sensitive fields (Guarded)
  const [limitations, setLimitations] = useState("");
  const [healthNotes, setHealthNotes] = useState("");

  const [isSaved, setIsSaved] = useState(false);

  // Load profile from localStorage on mount
  useEffect(() => {
    try {
      // 1. Check for registered user's name from session
      let registeredName = "";
      const directName = localStorage.getItem("userName");
      if (directName) {
        registeredName = directName;
      } else {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          const u = JSON.parse(rawUser);
          if (u.fullName) registeredName = u.fullName;
        }
      }

      // 2. Check saved profile
      const saved = localStorage.getItem("prana_user_profile") || localStorage.getItem("athena_user_profile");
      if (saved) {
        const data = JSON.parse(saved);
        setFullName(data.fullName || registeredName || "");
        if (data.age !== undefined) setAge(data.age);
        if (data.gender !== undefined) setGender(data.gender);
        if (data.customGender !== undefined) setCustomGender(data.customGender);
        if (data.fitnessLevel !== undefined) setFitnessLevel(data.fitnessLevel);
        if (data.activityLevel !== undefined) setActivityLevel(data.activityLevel);
        if (data.heightCm !== undefined) setHeightCm(data.heightCm);
        if (data.weightKg !== undefined) setWeightKg(data.weightKg);
        if (data.dietaryPref !== undefined) setDietaryPref(data.dietaryPref);
        if (data.equipment !== undefined) setEquipment(data.equipment);
        if (data.selectedSports !== undefined && Array.isArray(data.selectedSports)) setSelectedSports(data.selectedSports);
        if (data.limitations !== undefined) setLimitations(data.limitations);
        if (data.healthNotes !== undefined) setHealthNotes(data.healthNotes);
      } else if (registeredName) {
        // New user: ONLY the name is pre-filled, everything else stays clean
        setFullName(registeredName);
      }
    } catch {
      // fallback
    }
  }, []);

  // Compute dynamic completion percentage
  const calculateCompletion = () => {
    let score = 0;
    const missing: string[] = [];

    // Full Name (15%)
    if (fullName.trim().length > 0) score += 15;
    else missing.push("Full Name");

    // Age (10%)
    if (typeof age === "number" && age > 0) score += 10;
    else missing.push("Age");

    // Gender (15%)
    if (gender === "MALE" || gender === "FEMALE" || (gender === "CUSTOM" && customGender.trim().length > 0)) {
      score += 15;
    } else {
      missing.push("Gender / Sex");
    }

    // Fitness Level (15%)
    if (fitnessLevel) score += 15;
    else missing.push("Fitness Level");

    // Activity Level (15%)
    if (activityLevel) score += 15;
    else missing.push("Activity Level");

    // Height (10%)
    if (typeof heightCm === "number" && heightCm > 0) score += 10;
    else missing.push("Height");

    // Weight (10%)
    if (typeof weightKg === "number" && weightKg > 0) score += 10;
    else missing.push("Weight");

    // Sports Interests (10%)
    if (selectedSports.length > 0) score += 10;
    else missing.push("Sports / Fitness Interests");

    return { percentage: Math.min(100, score), missing };
  };

  const { percentage, missing } = calculateCompletion();
  const isProfileComplete = percentage === 100;

  const handleToggleSport = (sport: string) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter((s) => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const handleAddCustomSport = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSportInput.trim();
    if (!trimmed) return;
    if (!selectedSports.includes(trimmed)) {
      setSelectedSports([...selectedSports, trimmed]);
    }
    setCustomSportInput("");
  };

  const handleRemoveSport = (sport: string) => {
    setSelectedSports(selectedSports.filter((s) => s !== sport));
  };

  const handleSave = () => {
    const profileData = {
      fullName,
      age,
      gender,
      customGender,
      fitnessLevel,
      activityLevel,
      heightCm,
      weightKg,
      dietaryPref,
      equipment,
      selectedSports,
      limitations,
      healthNotes,
      completionPercentage: percentage,
      isComplete: isProfileComplete,
    };

    localStorage.setItem("prana_user_profile", JSON.stringify(profileData));
    localStorage.setItem("athena_user_profile", JSON.stringify(profileData));
    localStorage.setItem("prana_profile_completion", percentage.toString());
    localStorage.setItem("athena_profile_completion", percentage.toString());
    if (fullName) {
      localStorage.setItem("userName", fullName);
      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          const u = JSON.parse(rawUser);
          u.fullName = fullName;
          localStorage.setItem("user", JSON.stringify(u));
        }
      } catch {}
    }

    // Dispatch custom event for dashboard/sidebar reactivity
    window.dispatchEvent(new Event("prana_profile_updated"));
    window.dispatchEvent(new Event("athena_profile_updated"));

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold tracking-wider text-blue-500 uppercase flex items-center gap-1.5 font-mono">
            <User className="w-3.5 h-3.5" />
            Personal Fitness Profile &bull; Identity Architecture
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Athlete Profile &amp; Biometrics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Calibrates your Digital Twin, Coach Jack mentorship, and customized kinematic benchmarks.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 w-fit"
        >
          {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          {isSaved ? "Saved Successfully" : "Save Profile Changes"}
        </button>
      </div>

      {/* DYNAMIC PROFILE COMPLETION TRACKER */}
      <div
        className={`athena-card p-5 border transition-all ${
          isProfileComplete
            ? "border-emerald-500/40 bg-emerald-950/20"
            : "border-amber-500/40 bg-amber-950/20"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                isProfileComplete
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              }`}
            >
              {percentage}%
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                {isProfileComplete ? "Profile Active & Verified" : "Profile Setup Incomplete"}
                {isProfileComplete ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    100% COMPLETE &bull; ACTIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    ACTION REQUIRED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isProfileComplete
                  ? "All required and optional parameters calibrated. Digital Twin running at maximum fidelity."
                  : `Complete remaining fields to unlock high-precision metabolic and kinematic AI diagnostics.`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-white">{percentage} / 100 PTS</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isProfileComplete ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-blue-500"
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        {/* Missing Fields Pill List */}
        {!isProfileComplete && missing.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-amber-500/20 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-amber-400 uppercase font-mono">
              Missing Fields:
            </span>
            {missing.map((field, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 bg-slate-900 border border-amber-500/30 text-amber-300 rounded-full text-[10px] font-mono"
              >
                &bull; {field}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. REQUIRED INFORMATION (4 cols) */}
        <div className="lg:col-span-4 athena-card p-5 space-y-4 border-blue-900/40 bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Required Information
            </h2>
            <span className="text-[10px] text-blue-400 font-mono font-bold">Mandatory</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Full Name *</label>
              <input
                type="text"
                value={fullName}
                placeholder="Enter athlete full name"
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Age *</label>
              <input
                type="number"
                value={age}
                placeholder="e.g. 24"
                onChange={(e) => setAge(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
              />
            </div>

            {/* MALE / FEMALE / CUSTOM GENDER SELECTOR */}
            <div>
              <label className="text-slate-300 font-medium block mb-1.5">
                Biological Sex / Gender *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setGender("MALE")}
                  className={`py-2 px-2 text-center rounded-xl border text-xs font-bold uppercase transition-all ${
                    gender === "MALE"
                      ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender("FEMALE")}
                  className={`py-2 px-2 text-center rounded-xl border text-xs font-bold uppercase transition-all ${
                    gender === "FEMALE"
                      ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/20"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Female
                </button>
                <button
                  type="button"
                  onClick={() => setGender("CUSTOM")}
                  className={`py-2 px-2 text-center rounded-xl border text-xs font-bold uppercase transition-all ${
                    gender === "CUSTOM"
                      ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-500/20"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Custom Gender Input */}
              {gender === "CUSTOM" && (
                <div className="mt-2 animate-in fade-in duration-200">
                  <input
                    type="text"
                    placeholder="Specify custom gender / identity..."
                    value={customGender}
                    onChange={(e) => setCustomGender(e.target.value)}
                    className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Fitness Level *</label>
              <select
                value={fitnessLevel}
                onChange={(e) => setFitnessLevel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
              >
                <option value="BEGINNER">Beginner (Foundation Stage)</option>
                <option value="INTERMEDIATE">Intermediate (Consistent Training)</option>
                <option value="ATHLETE">Advanced Athlete (Competitive)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Activity Level *</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
              >
                <option value="SEDENTARY">Sedentary (&lt; 3,000 steps)</option>
                <option value="LIGHT">Light Movement (3-5k steps)</option>
                <option value="MODERATE">Moderate Activity (6-10k steps + gym)</option>
                <option value="VERY_ACTIVE">Very Active (High Training Volume)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. OPTIONAL INFORMATION & DYNAMIC SPORTS INTERESTS (8 cols) */}
        <div className="lg:col-span-8 athena-card p-5 space-y-5 bg-slate-950 border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Biometrics &amp; Dynamic Fitness Interests
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">Interactive Setup</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                placeholder="e.g. 178"
                onChange={(e) => setHeightCm(e.target.value === "" ? "" : parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Weight (kg)</label>
              <input
                type="number"
                value={weightKg}
                placeholder="e.g. 74.5"
                onChange={(e) => setWeightKg(e.target.value === "" ? "" : parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* DYNAMIC & INTERACTIVE SPORTS / FITNESS INTERESTS */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white block">
                  Sports &amp; Fitness Interests ({selectedSports.length} Selected)
                </label>
                <p className="text-[11px] text-slate-400">
                  Select predefined sports or add your own custom fitness disciplines.
                </p>
              </div>
            </div>

            {/* Selected Tags Chips Display */}
            <div className="flex flex-wrap gap-2 p-3 bg-slate-900/80 rounded-xl border border-slate-800 min-h-[46px] items-center">
              {selectedSports.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No sports selected yet. Tap tags below to add.</span>
              ) : (
                selectedSports.map((sport, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/40 animate-in fade-in duration-200"
                  >
                    {sport}
                    <button
                      type="button"
                      onClick={() => handleRemoveSport(sport)}
                      className="hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Predefined Interactive Tags */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
                Popular Sport Profiles (Click to toggle):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presetSports.map((sport, idx) => {
                  const isSelected = selectedSports.includes(sport);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleSport(sport)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {sport}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Fitness Interest Input */}
            <form onSubmit={handleAddCustomSport} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add custom fitness discipline (e.g. Rock Climbing, Rowing, Pilates)..."
                value={customSportInput}
                onChange={(e) => setCustomSportInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Custom Tag
              </button>
            </form>
          </div>

          {/* Dietary Style & Equipment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800/80">
            <div>
              <label className="text-slate-400 block mb-1">Dietary Preference</label>
              <select
                value={dietaryPref}
                onChange={(e) => setDietaryPref(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
              >
                <option value="INDIAN_STANDARD">Indian Standard (Balanced)</option>
                <option value="HIGH_PROTEIN">High Protein / Athlete Fuel</option>
                <option value="VEGETARIAN">Vegetarian</option>
                <option value="VEGAN">Plant-Based / Vegan</option>
                <option value="MEDITERRANEAN">Mediterranean</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Available Equipment</label>
              <input
                type="text"
                value={equipment}
                placeholder="e.g. Barbell, Dumbbells, Turf"
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
