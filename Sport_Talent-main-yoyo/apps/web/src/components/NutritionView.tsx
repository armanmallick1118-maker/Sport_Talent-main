"use client";

import React, { useState, useEffect } from "react";
import {
  Utensils,
  Droplets,
  Plus,
  Flame,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
  PieChart,
  Trash2,
  Calculator,
  Search,
  Filter,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Scale,
} from "lucide-react";

export interface LoggedFoodItem {
  id: string;
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "post_workout";
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  timestamp: string;
}

const COMMON_ATHLETIC_FOODS = [
  // Proteins
  { name: "Grilled Chicken Breast", defaultServing: "150g", cal: 248, p: 46, c: 0, f: 5, fib: 0, category: "Protein" },
  { name: "Lean Ground Beef 95/5", defaultServing: "150g", cal: 205, p: 32, c: 0, f: 7.5, fib: 0, category: "Protein" },
  { name: "Wild Caught Salmon", defaultServing: "150g", cal: 312, p: 30, c: 0, f: 19, fib: 0, category: "Protein" },
  { name: "Whole Eggs", defaultServing: "2 large", cal: 144, p: 12.6, c: 0.8, f: 9.6, fib: 0, category: "Protein" },
  { name: "Egg Whites", defaultServing: "1 cup (240g)", cal: 126, p: 26, c: 2, f: 0, fib: 0, category: "Protein" },
  { name: "Whey Protein Isolate", defaultServing: "1 scoop (30g)", cal: 110, p: 25, c: 2, f: 0.5, fib: 0, category: "Protein" },
  { name: "Fresh Paneer", defaultServing: "100g", cal: 265, p: 18, c: 3.5, f: 20, fib: 0, category: "Protein" },
  { name: "Tofu Firm", defaultServing: "150g", cal: 120, p: 14, c: 3, f: 6, fib: 2, category: "Protein" },
  { name: "Greek Yogurt 0%", defaultServing: "200g", cal: 118, p: 20, c: 8, f: 0, fib: 0, category: "Protein" },

  // Carbs & Grains
  { name: "Steamed White Rice", defaultServing: "1 cup (160g)", cal: 205, p: 4, c: 45, f: 0.5, fib: 1, category: "Carbs" },
  { name: "Whole Wheat Roti", defaultServing: "2 pieces", cal: 170, p: 6, c: 36, f: 1, fib: 5, category: "Carbs" },
  { name: "Rolled Oats", defaultServing: "50g dry", cal: 190, p: 6.5, c: 34, f: 3.5, fib: 5, category: "Carbs" },
  { name: "Sweet Potato", defaultServing: "150g", cal: 130, p: 2, c: 30, f: 0.1, fib: 4, category: "Carbs" },
  { name: "Yellow Moong Dal", defaultServing: "1 bowl (200g)", cal: 140, p: 8.5, c: 20, f: 3.2, fib: 4.5, category: "Carbs" },
  { name: "Brown Rice", defaultServing: "1 cup (160g)", cal: 216, p: 5, c: 45, f: 1.8, fib: 3.5, category: "Carbs" },

  // Fats & Extras
  { name: "Peanut Butter", defaultServing: "2 tbsp (32g)", cal: 190, p: 8, c: 7, f: 16, fib: 2, category: "Fats" },
  { name: "Almonds Raw", defaultServing: "1 oz (28g)", cal: 164, p: 6, c: 6, f: 14, fib: 3.5, category: "Fats" },
  { name: "Avocado", defaultServing: "1/2 medium (100g)", cal: 160, p: 2, c: 8, f: 15, fib: 7, category: "Fats" },
  { name: "Olive Oil", defaultServing: "1 tbsp (14ml)", cal: 119, p: 0, c: 0, f: 14, fib: 0, category: "Fats" },

  // Fruits & Veggies
  { name: "Banana", defaultServing: "1 medium", cal: 105, p: 1.3, c: 27, f: 0.3, fib: 3.1, category: "Fruits" },
  { name: "Apple", defaultServing: "1 medium", cal: 95, p: 0.5, c: 25, f: 0.3, fib: 4.4, category: "Fruits" },
  { name: "Steamed Broccoli", defaultServing: "1 cup (150g)", cal: 45, p: 3.7, c: 9, f: 0.6, fib: 3.8, category: "Veggies" },
  { name: "Mixed Vegetable Sabzi", defaultServing: "1 bowl (180g)", cal: 120, p: 3.5, c: 14, f: 5.5, fib: 4, category: "Veggies" },
];

export const NutritionView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"estimator" | "custom_food" | "logs">("estimator");

  // Natural Language State
  const [naturalText, setNaturalText] = useState("2 roti + dal + sabzi + curd");
  const [parsedData, setParsedData] = useState<any>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Custom Food Form State
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [selectedFoodCategory, setSelectedFoodCategory] = useState("ALL");
  const [customFoodName, setCustomFoodName] = useState("");
  const [customServing, setCustomServing] = useState("1 serving");
  const [customMealType, setCustomMealType] = useState<LoggedFoodItem["mealType"]>("lunch");
  const [customProtein, setCustomProtein] = useState<string>("");
  const [customCarbs, setCustomCarbs] = useState<string>("");
  const [customFat, setCustomFat] = useState<string>("");
  const [customFiber, setCustomFiber] = useState<string>("");
  const [customCalories, setCustomCalories] = useState<string>("");
  const [multiplier, setMultiplier] = useState<number>(1);
  const [addSuccess, setAddSuccess] = useState(false);

  // Daily Totals & Food Logs
  const [loggedFoods, setLoggedFoods] = useState<LoggedFoodItem[]>([]);
  const [waterMl, setWaterMl] = useState(1750);
  const waterTarget = 2500;

  // Preset Indian meals for quick test
  const quickDishes = [
    "2 roti + dal + sabzi + curd",
    "3 idli + sambar + coconut chutney",
    "1 bowl moong dal khichdi + curd",
    "2 eggs + 1 banana + 50g oats",
    "150g chicken breast + 1 cup rice + salad",
  ];

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem("athena_nutrition_log");
      if (savedLogs) {
        setLoggedFoods(JSON.parse(savedLogs));
      } else {
        // Initial mock breakfast
        const initialLogs: LoggedFoodItem[] = [
          {
            id: "food-1",
            name: "Whole Wheat Roti",
            mealType: "breakfast",
            quantity: "2 pieces",
            calories: 170,
            protein: 6,
            carbs: 36,
            fat: 1,
            fiber: 5,
            timestamp: "08:30 AM",
          },
          {
            id: "food-2",
            name: "Yellow Moong Dal",
            mealType: "breakfast",
            quantity: "1 bowl",
            calories: 140,
            protein: 8.5,
            carbs: 20,
            fat: 3.2,
            fiber: 4.5,
            timestamp: "08:35 AM",
          },
          {
            id: "food-3",
            name: "Plain Curd / Dahi",
            mealType: "breakfast",
            quantity: "1 cup",
            calories: 95,
            protein: 4.5,
            carbs: 6,
            fat: 5,
            fiber: 0,
            timestamp: "08:35 AM",
          },
        ];
        setLoggedFoods(initialLogs);
      }
      const savedWater = localStorage.getItem("athena_water_ml");
      if (savedWater) setWaterMl(parseInt(savedWater));
    } catch {}
  }, []);

  // Save logs to localStorage
  const persistLogs = (newLogs: LoggedFoodItem[]) => {
    setLoggedFoods(newLogs);
    try {
      localStorage.setItem("athena_nutrition_log", JSON.stringify(newLogs));
      window.dispatchEvent(new Event("athena_nutrition_updated"));
    } catch {}
  };

  // Compute live daily totals from logged items
  const dailyTotals = loggedFoods.reduce(
    (acc, cur) => ({
      calories: acc.calories + cur.calories,
      protein: Math.round(acc.protein + cur.protein),
      carbs: Math.round(acc.carbs + cur.carbs),
      fat: Math.round(acc.fat + cur.fat),
      fiber: Math.round(acc.fiber + cur.fiber),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  // Auto calculate exact calories from macros: (P*4) + (C*4) + (F*9)
  const handleAutoComputeCalories = () => {
    const p = parseFloat(customProtein) || 0;
    const c = parseFloat(customCarbs) || 0;
    const f = parseFloat(customFat) || 0;
    const exactCal = Math.round(p * 4 + c * 4 + f * 9);
    setCustomCalories(String(exactCal));
  };

  // Select item from Common Foods list
  const handleSelectPredefinedFood = (food: typeof COMMON_ATHLETIC_FOODS[0]) => {
    setCustomFoodName(food.name);
    setCustomServing(food.defaultServing);
    setCustomProtein(String(Math.round(food.p * multiplier)));
    setCustomCarbs(String(Math.round(food.c * multiplier)));
    setCustomFat(String(Math.round(food.f * multiplier)));
    setCustomFiber(String(Math.round(food.fib * multiplier)));
    setCustomCalories(String(Math.round(food.cal * multiplier)));
  };

  // When multiplier changes, update macro fields if food exists in DB
  const handleMultiplierChange = (newMult: number) => {
    setMultiplier(newMult);
    const found = COMMON_ATHLETIC_FOODS.find((f) => f.name === customFoodName);
    if (found) {
      setCustomProtein(String(Math.round(found.p * newMult)));
      setCustomCarbs(String(found.c * newMult));
      setCustomFat(String(Math.round(found.f * newMult)));
      setCustomFiber(String(Math.round(found.fib * newMult)));
      setCustomCalories(String(Math.round(found.cal * newMult)));
    }
  };

  // Submit custom food to plate
  const handleAddCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFoodName.trim()) {
      alert("Please enter a food name.");
      return;
    }

    let cal = parseFloat(customCalories);
    const p = parseFloat(customProtein) || 0;
    const c = parseFloat(customCarbs) || 0;
    const f = parseFloat(customFat) || 0;
    const fib = parseFloat(customFiber) || 0;

    if (isNaN(cal) || cal <= 0) {
      cal = Math.round(p * 4 + c * 4 + f * 9);
      if (cal === 0) cal = 150;
    }

    const newItem: LoggedFoodItem = {
      id: `food-${Date.now()}`,
      name: customFoodName,
      mealType: customMealType,
      quantity: customServing,
      calories: cal,
      protein: p,
      carbs: c,
      fat: f,
      fiber: fib,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    persistLogs([newItem, ...loggedFoods]);
    setAddSuccess(true);
    setCustomFoodName("");
    setCustomCalories("");
    setCustomProtein("");
    setCustomCarbs("");
    setCustomFat("");
    setCustomFiber("");
    setTimeout(() => setAddSuccess(false), 2500);
  };

  // Natural language meal parser (Dual-layer: Backend Groq AI + Client Fallback)
  const handleParseMeal = async (textToParse?: string) => {
    const text = textToParse || naturalText;
    if (!text.trim()) return;
    setIsParsing(true);
    setParseError(null);

    try {
      const endpoints = [
        "http://localhost:8000/api/v1/nutrition/parse",
        "http://127.0.0.1:8000/api/v1/nutrition/parse",
      ];
      let successData = null;

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          if (res.ok) {
            successData = await res.json();
            break;
          }
        } catch {}
      }

      if (successData && successData.items && successData.items.length > 0) {
        setParsedData(successData);
      } else {
        throw new Error("Local fallback required");
      }
    } catch {
      // Local fallback parsing
      const parts = text.toLowerCase().split(/[\+,\n]| and /gi).map((p) => p.trim()).filter(Boolean);
      const items: any[] = [];

      parts.forEach((p) => {
        const qtyMatch = p.match(/^([\d\.]+)\s*(g|gm|grams|ml|cup|bowl|scoop|piece|slice|plate)?\s*(.*)$/i);
        let qty = 1;
        let query = p;
        if (qtyMatch) {
          const num = parseFloat(qtyMatch[1]);
          if (!isNaN(num) && num > 0) {
            qty = num;
            query = qtyMatch[3] || p;
          }
        }

        const match = COMMON_ATHLETIC_FOODS.find((f) =>
          query.includes(f.name.toLowerCase().split(" ")[0])
        );

        if (match) {
          items.push({
            item_name: match.name,
            quantity: qty,
            calories: Math.round(match.cal * qty),
            protein: +(match.p * qty).toFixed(1),
            carbs: +(match.c * qty).toFixed(1),
            fat: +(match.f * qty).toFixed(1),
            fiber: +(match.fib * qty).toFixed(1),
          });
        } else {
          items.push({
            item_name: query.charAt(0).toUpperCase() + query.slice(1),
            quantity: qty,
            calories: Math.round(140 * qty),
            protein: +(6 * qty).toFixed(1),
            carbs: +(20 * qty).toFixed(1),
            fat: +(4 * qty).toFixed(1),
            fiber: +(2 * qty).toFixed(1),
          });
        }
      });

      const totals = items.reduce(
        (acc, cur) => ({
          calories: acc.calories + cur.calories,
          protein_g: +(acc.protein_g + cur.protein).toFixed(1),
          carbs_g: +(acc.carbs_g + cur.carbs).toFixed(1),
          fat_g: +(acc.fat_g + cur.fat).toFixed(1),
          fiber_g: +(acc.fiber_g + cur.fiber).toFixed(1),
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
      );

      setParsedData({
        raw_input: text,
        items,
        totals,
        is_estimated: true,
        estimation_label: "Portion-calibrated client nutritional estimation",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddParsedMealToLog = () => {
    if (!parsedData || !parsedData.items) return;

    const newEntries: LoggedFoodItem[] = parsedData.items.map((item: any, idx: number) => ({
      id: `parsed-${Date.now()}-${idx}`,
      name: item.item_name,
      mealType: "lunch",
      quantity: `${item.quantity}x serving`,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));

    persistLogs([...newEntries, ...loggedFoods]);
    setParsedData(null);
    setActiveTab("logs");
  };

  const handleDeleteFood = (id: string) => {
    const updated = loggedFoods.filter((f) => f.id !== id);
    persistLogs(updated);
  };

  const handleAddWater = (amount: number) => {
    const next = Math.min(4000, waterMl + amount);
    setWaterMl(next);
    try {
      localStorage.setItem("athena_water_ml", String(next));
    } catch {}
  };

  const handleResetWater = () => {
    setWaterMl(0);
    try {
      localStorage.setItem("athena_water_ml", "0");
    } catch {}
  };

  const filteredFoods = COMMON_ATHLETIC_FOODS.filter((f) => {
    const matchesCat = selectedFoodCategory === "ALL" || f.category === selectedFoodCategory;
    const matchesQuery = f.name.toLowerCase().includes(foodSearchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold tracking-wider text-blue-500 uppercase flex items-center gap-1.5 font-mono">
            <Utensils className="w-3.5 h-3.5" />
            Nutritional Intelligence &amp; Calorie Analysis
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Nutrition, Energy &amp; Hydration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time AI decomposition, custom exact calorie &amp; macro calculator, and hydration pacing.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("estimator")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "estimator"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Meal Estimator
          </button>
          <button
            onClick={() => setActiveTab("custom_food")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "custom_food"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Food
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "logs"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Today&apos;s Plate ({loggedFoods.length})
          </button>
        </div>
      </div>

      {/* Daily Top Macros Ribbon */}
      <div className="athena-card p-4 border-slate-800 bg-slate-950">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Calories Logged</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{dailyTotals.calories} kcal</div>
            <div className="text-[10px] text-slate-500">Target: 2,300 kcal</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Protein</div>
            <div className="text-xl font-bold font-mono text-blue-400 mt-1">{dailyTotals.protein}g</div>
            <div className="text-[10px] text-slate-500">Target: 140g</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Carbohydrates</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">{dailyTotals.carbs}g</div>
            <div className="text-[10px] text-slate-500">Target: 240g</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Healthy Fats</div>
            <div className="text-xl font-bold font-mono text-purple-400 mt-1">{dailyTotals.fat}g</div>
            <div className="text-[10px] text-slate-500">Target: 65g</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Dietary Fiber</div>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">{dailyTotals.fiber}g</div>
            <div className="text-[10px] text-slate-500">Target: 30g</div>
          </div>
        </div>
      </div>

      {/* TAB 1: AI NATURAL MEAL ESTIMATOR */}
      {activeTab === "estimator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 athena-card p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                  Natural Language Meal Decomposition
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Type meals naturally (Indian &amp; Western foods). Powered by Groq AI and physiological nutrient tables.
                </p>
              </div>
              <span className="badge-clean badge-emerald text-[10px]">
                Active Engine
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={naturalText}
                onChange={(e) => setNaturalText(e.target.value)}
                placeholder="e.g., 2 roti + dal + sabzi + curd or 2 eggs + 1 banana + 50g oats"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />

              {/* Quick Preset Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickDishes.map((dish, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setNaturalText(dish);
                      handleParseMeal(dish);
                    }}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {dish}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleParseMeal()}
                disabled={isParsing || !naturalText.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-600/30 flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isParsing ? "animate-spin" : ""}`} />
                {isParsing ? "Decomposing Nutrition..." : "Estimate Nutrition"}
              </button>
            </div>

            {/* Parsed Output Card */}
            {parsedData && (
              <div className="p-4 bg-slate-950 rounded-xl border border-blue-500/30 space-y-3 mt-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Decomposed Meal Components
                  </div>
                  <span className="text-[10px] text-blue-400 font-mono">
                    {parsedData.estimation_label}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {parsedData.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900"
                    >
                      <span className="text-slate-200 font-medium">
                        {item.quantity}x {item.item_name}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ~{item.calories} kcal • {item.protein}g P • {item.carbs}g C • {item.fat}g F
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800 font-medium">
                  <span className="text-white font-semibold">Total Estimated Calories:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {parsedData.totals.calories} kcal
                  </span>
                </div>

                <button
                  onClick={handleAddParsedMealToLog}
                  className="w-full py-2.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-white rounded-xl transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm"
                >
                  <Plus className="w-4 h-4 text-blue-400" />
                  Add to Today&apos;s Plate &amp; Update Totals
                </button>
              </div>
            )}
          </div>

          {/* Hydration & Nutrient Distribution */}
          <div className="lg:col-span-5 space-y-4">
            <div className="athena-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  Hydration Pacing
                </h3>
                <span className="text-xs font-mono text-blue-400 font-bold">
                  {waterMl} / {waterTarget} ml
                </span>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (waterMl / waterTarget) * 100)}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => handleAddWater(250)}
                  className="py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 font-medium transition-colors text-center"
                >
                  +250 ml (Glass)
                </button>
                <button
                  onClick={() => handleAddWater(500)}
                  className="py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 font-medium transition-colors text-center"
                >
                  +500 ml (Bottle)
                </button>
                <button
                  onClick={handleResetWater}
                  className="py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-rose-400 transition-colors text-center"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="athena-card p-4 space-y-2 border-slate-800 bg-slate-950 text-xs text-slate-400">
              <div className="text-[11px] font-semibold text-white uppercase font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Dietitian Scientific Standard
              </div>
              <p className="leading-relaxed">
                Calculations follow clinical physiological Atwater factors: <strong className="text-slate-300">4 kcal per 1g Protein, 4 kcal per 1g Carbohydrates, and 9 kcal per 1g Fat</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADD CUSTOM FOOD WITH EXACT CALORIES */}
      {activeTab === "custom_food" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Quick Food Database Picker (7 cols) */}
          <div className="lg:col-span-7 athena-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                  Verified Food Database
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Click any food to auto-populate exact portion and macros</p>
              </div>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-1">
                {["ALL", "Protein", "Carbs", "Fats", "Fruits", "Veggies"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedFoodCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      selectedFoodCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={foodSearchQuery}
                onChange={(e) => setFoodSearchQuery(e.target.value)}
                placeholder="Search food (e.g. chicken, egg, rice, paneer, oats)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Serving Multiplier Selector */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Portion Multiplier:</span>
              {[0.5, 1, 1.5, 2].map((m) => (
                <button
                  key={m}
                  onClick={() => handleMultiplierChange(m)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                    multiplier === m ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {m}x
                </button>
              ))}
            </div>

            {/* Food Grid */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredFoods.map((food, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPredefinedFood(food)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    customFoodName === food.name
                      ? "bg-blue-950/40 border-blue-500/60"
                      : "bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{food.name}</div>
                    <div className="text-[11px] text-slate-400">Serving: {food.defaultServing}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-emerald-400">{Math.round(food.cal * multiplier)} kcal</div>
                    <div className="text-[10px] text-slate-400">
                      {Math.round(food.p * multiplier)}g P • {Math.round(food.c * multiplier)}g C • {Math.round(food.f * multiplier)}g F
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Manual Exact Custom Food Form (5 cols) */}
          <div className="lg:col-span-5 athena-card p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Exact Custom Food Entry
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Input your custom recipe, packaged meal, or protein shake
              </p>
            </div>

            {addSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Custom food added to today&apos;s plate!
              </div>
            )}

            <form onSubmit={handleAddCustomFood} className="space-y-3.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Food / Dish Name</label>
                <input
                  type="text"
                  placeholder="e.g. Homemade High-Protein Bowl"
                  value={customFoodName}
                  onChange={(e) => setCustomFoodName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Serving / Portion</label>
                  <input
                    type="text"
                    placeholder="e.g. 150g, 1 bar"
                    value={customServing}
                    onChange={(e) => setCustomServing(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Meal Timing</label>
                  <select
                    value={customMealType}
                    onChange={(e) => setCustomMealType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none capitalize"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="snack">Snack</option>
                    <option value="dinner">Dinner</option>
                    <option value="post_workout">Post-Workout</option>
                  </select>
                </div>
              </div>

              {/* Exact Macros */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-300 font-mono flex items-center justify-between">
                  <span>Macronutrient Breakdown (g)</span>
                  <button
                    type="button"
                    onClick={handleAutoComputeCalories}
                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 font-sans"
                  >
                    <Calculator className="w-3 h-3" />
                    Auto-Calculate Calories
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 font-mono">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Protein</label>
                    <input
                      type="number"
                      placeholder="g"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Carbs</label>
                    <input
                      type="number"
                      placeholder="g"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Fat</label>
                    <input
                      type="number"
                      placeholder="g"
                      value={customFat}
                      onChange={(e) => setCustomFat(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Fiber</label>
                    <input
                      type="number"
                      placeholder="g"
                      value={customFiber}
                      onChange={(e) => setCustomFiber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Total Exact Calories (kcal)</label>
                  <input
                    type="number"
                    placeholder="e.g. 350"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-bold font-mono focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Log Custom Food to Plate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: TODAY'S PLATE & DETAILED LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-5">
          <div className="athena-card p-5 border-slate-800 bg-slate-950 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                  Today&apos;s Meal Diary ({loggedFoods.length} Items Logged)
                </h3>
                <p className="text-xs text-slate-400">Total: {dailyTotals.calories} kcal consumed today</p>
              </div>
              <button
                onClick={() => persistLogs([])}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
              >
                Clear Day&apos;s Log
              </button>
            </div>

            {loggedFoods.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No foods logged yet today. Use the AI Meal Estimator or Add Custom Food to log meals.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 font-mono">
                      <th className="pb-2.5">Time</th>
                      <th className="pb-2.5">Meal Timing</th>
                      <th className="pb-2.5">Food Item</th>
                      <th className="pb-2.5">Portion</th>
                      <th className="pb-2.5">Calories</th>
                      <th className="pb-2.5">Macros (P / C / F)</th>
                      <th className="pb-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-mono">
                    {loggedFoods.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 text-slate-400">{item.timestamp}</td>
                        <td className="py-2.5 capitalize text-blue-400 font-sans">{item.mealType.replace("_", " ")}</td>
                        <td className="py-2.5 font-medium text-white font-sans">{item.name}</td>
                        <td className="py-2.5 text-slate-400">{item.quantity}</td>
                        <td className="py-2.5 font-bold text-emerald-400">{item.calories} kcal</td>
                        <td className="py-2.5 text-slate-300">
                          {item.protein}g P • {item.carbs}g C • {item.fat}g F
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteFood(item.id)}
                            className="p-1 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded transition-colors"
                            title="Delete food"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
