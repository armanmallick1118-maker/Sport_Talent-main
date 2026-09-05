import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScore, getUser, generateScore, getGoals, trackGoal } from '../services/healthApi';
import CircularProgress from '../components/CircularProgress';
import AlertBanner from '../components/AlertBanner';
import { Activity, Apple, ActivitySquare, RefreshCw, Bot, TrendingUp, TrendingDown, Minus, Target, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import WorkoutTracker from './WorkoutTracker';
import NutritionLogger from './NutritionLogger';
import LabReportManager from './LabReportManager';

export default function HealthHub() {
  const [user, setUser] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('workout');
  const [trendPeriod, setTrendPeriod] = useState('week');
  const [goalTracking, setGoalTracking] = useState({ workout_completed: false, nutrition_completed: false });
  const userId = localStorage.getItem('healthUserId');

  useEffect(() => {
    async function load() {
      try {
        const u = await getUser(userId);
        setUser(u.user);
        const s = await getScore(userId);
        setScore(s.score);
        
        const today = new Date().toISOString().split('T')[0];
        const g = await getGoals(userId, today);
        if (g.goals && g.goals.length > 0) {
          setGoalTracking({
            workout_completed: g.goals[0].workout_completed,
            nutrition_completed: g.goals[0].nutrition_completed
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (userId) load();
  }, [userId]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await generateScore(userId);
      setScore(res.score);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleGoal = async (type) => {
    const updated = { ...goalTracking, [type]: !goalTracking[type] };
    setGoalTracking(updated);
    try {
      await trackGoal({
        user_id: userId,
        date: new Date().toISOString(),
        workout_completed: updated.workout_completed,
        nutrition_completed: updated.nutrition_completed
      });
    } catch (err) {
      console.error('Failed to track goal:', err);
    }
  };

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

  const alerts = score?.critical_alerts ? JSON.parse(score.critical_alerts) : [];

  // ─── CHART DATA LOGIC ────────────────────────────────────────────────────
  let history = [];
  try { history = JSON.parse(score?.score_history || '[]'); } catch(e){}

  // Aggregate by day, preserving workout & nutrition scores
  const dayMap = {};
  history.forEach(entry => {
    const dateObj = new Date(entry.date);
    let key;
    if (trendPeriod === 'day') {
      // Last 7 individual sync entries — show each by time
      key = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } else if (trendPeriod === 'week') {
      // Group by calendar day, show last 7 days
      key = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      // Month: group by week number
      const weekStart = new Date(dateObj);
      weekStart.setDate(dateObj.getDate() - dateObj.getDay());
      key = `Wk ${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
    if (!dayMap[key]) dayMap[key] = { count: 0, overall: 0, workout: 0, nutrition: 0, label: key };
    dayMap[key].count++;
    dayMap[key].overall += entry.overall || 0;
    dayMap[key].workout += entry.workout || 0;
    dayMap[key].nutrition += entry.nutrition || 0;
  });

  let chartData = Object.values(dayMap).map(d => ({
    label: d.label,
    overall: Math.round(d.overall / d.count),
    workout: Math.round(d.workout / d.count),
    nutrition: Math.round(d.nutrition / d.count),
  }));

  // Slice based on period
  if (trendPeriod === 'day') chartData = chartData.slice(-7);
  else if (trendPeriod === 'week') chartData = chartData.slice(-7);
  else chartData = chartData.slice(-12); // ~3 months of weeks

  // Pad with a baseline point if only 1 entry so recharts draws a line
  if (chartData.length === 1) {
    const s = chartData[0];
    chartData.unshift({
      label: 'Start',
      overall: Math.max(0, s.overall - 5),
      workout: Math.max(0, s.workout - 5),
      nutrition: Math.max(0, s.nutrition - 5),
    });
  }

  // Calculate trend direction from first → last point
  let trendType = 'neutral';
  let trendText = 'No trend data';
  if (chartData.length >= 2) {
    const diff = chartData[chartData.length - 1].overall - chartData[0].overall;
    if (diff > 0)      { trendType = 'positive'; trendText = `Up ${diff} pts`; }
    else if (diff < 0) { trendType = 'negative'; trendText = `Down ${Math.abs(diff)} pts`; }
    else               { trendText = 'Steady'; }
  }

  // Daily plan / improvement parsing
  let plan = null;
  if (score && score.seven_day_plan) {
    try {
      const parsed = JSON.parse(score.seven_day_plan);
      plan = parsed.day1;
    } catch (e) {}
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(10, 14, 26, 0.96)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', fontSize: '12px', minWidth: 130 }}>
          <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 11 }}>{label}</p>
          {payload.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: p.color, marginBottom: 3 }}>
              <span style={{ opacity: 0.85 }}>{p.name}</span>
              <strong>{p.value}</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '24px 20px', paddingBottom: 100 }}>
      {/* HEADER */}
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: 24, fontWeight: 800 }}>Hello, {user?.name?.split(' ')[0] || 'Athlete'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Let's crush your goals today.</p>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: user?.avatar_color || 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.1)' }}>
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>


      {/* TOP SECTION: AI SCORE & GRAPH */}
      <div className="glass-panel" style={{ marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <button 
          onClick={handleAnalyze} 
          disabled={analyzing}
          style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 12px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, backdropFilter: 'blur(4px)' }}
        >
          <RefreshCw size={12} className={analyzing ? 'animate-spin' : ''} />
          {analyzing ? 'Analyzing...' : 'AI Sync'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ flexShrink: 0 }}>
            <CircularProgress score={score?.overall_score || 0} size={110} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Overall Health</h2>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 2 }}>{score?.grade || '-'}</div>
            <div style={{ fontSize: 12, color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={14} /> AI Evaluated
            </div>
          </div>
        </div>

        {/* ── PERFORMANCE TREND SECTION ── */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>

          {/* Header row: title + trend badge + pill tabs */}
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} /> Performance Trend
              {trendType === 'positive' && <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>↑ {trendText}</span>}
              {trendType === 'negative' && <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>↓ {trendText}</span>}
              {trendType === 'neutral' && chartData.length >= 2 && <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>– {trendText}</span>}
            </h3>

            {/* Pill Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.25)', borderRadius: 20, padding: 3 }}>
              {['day', 'week', 'month'].map(p => (
                <button
                  key={p}
                  onClick={() => setTrendPeriod(p)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 16,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: trendPeriod === p
                      ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))'
                      : 'transparent',
                    color: trendPeriod === p ? 'white' : 'var(--text-muted)',
                    boxShadow: trendPeriod === p ? '0 2px 8px rgba(59,130,246,0.4)' : 'none',
                  }}
                >{p}</button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            {[['Overall', '#3B82F6'], ['Workout', '#00D68F'], ['Nutrition', '#F97316']].map(([name, color]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                {name}
              </div>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 0 ? (
            <div style={{ height: 180, width: '100%', borderRadius: 12, padding: '8px 0 0 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradOverall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradWorkout" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D68F" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#00D68F" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradNutrition" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickCount={5}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="overall" name="Overall" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#gradOverall)" dot={false} activeDot={{ r: 5, fill: '#3B82F6', stroke: 'white', strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="workout" name="Workout" stroke="#00D68F" strokeWidth={2} fillOpacity={1} fill="url(#gradWorkout)" dot={false} activeDot={{ r: 4, fill: '#00D68F', stroke: 'white', strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="nutrition" name="Nutrition" stroke="#F97316" strokeWidth={2} fillOpacity={1} fill="url(#gradNutrition)" dot={false} activeDot={{ r: 4, fill: '#F97316', stroke: 'white', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No data yet — click AI Sync to generate your first analysis.
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE SECTION: TABS */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div className={`glass-tab ${activeTab === 'workout' ? 'active' : ''}`} onClick={() => setActiveTab('workout')}>
          <Activity size={20} /> Workout
        </div>
        <div className={`glass-tab ${activeTab === 'nutrition' ? 'active' : ''}`} onClick={() => setActiveTab('nutrition')}>
          <Apple size={20} /> Food
        </div>
        <div className={`glass-tab ${activeTab === 'labs' ? 'active' : ''}`} onClick={() => setActiveTab('labs')}>
          <ActivitySquare size={20} /> Lab Test
        </div>
      </div>

      {/* LOWER SECTION: DYNAMIC CONTENT */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '20px' }}>
          {activeTab === 'workout' && <WorkoutTracker />}
          {activeTab === 'nutrition' && <NutritionLogger />}
          {activeTab === 'labs' && <LabReportManager />}
        </div>
      </div>

      {/* BOTTOM SECTION: DAILY GOALS & IMPROVEMENTS */}
      <div className="glass-panel" style={{ position: 'relative', borderTop: '2px solid var(--accent-purple)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Target size={20} color="var(--accent-purple)" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>Daily Goal & Next Steps</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Calories</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{user?.daily_cal_target} kcal</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Protein</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{user?.daily_protein_target}g</div>
          </div>
        </div>

        {plan && (
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: 16, borderRadius: 12, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-purple)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bot size={14} /> Today's AI Goals
            </h3>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={goalTracking.workout_completed} 
                  onChange={() => handleToggleGoal('workout_completed')}
                  style={{ marginTop: 4, accentColor: 'var(--accent-purple)', width: 16, height: 16 }}
                />
                <span style={{ textDecoration: goalTracking.workout_completed ? 'line-through' : 'none', opacity: goalTracking.workout_completed ? 0.6 : 1 }}>
                  <strong>🏋️ Workout:</strong> {plan.workout}
                </span>
              </label>

              <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={goalTracking.nutrition_completed} 
                  onChange={() => handleToggleGoal('nutrition_completed')}
                  style={{ marginTop: 4, accentColor: 'var(--accent-purple)', width: 16, height: 16 }}
                />
                <span style={{ textDecoration: goalTracking.nutrition_completed ? 'line-through' : 'none', opacity: goalTracking.nutrition_completed ? 0.6 : 1 }}>
                  <strong>🥗 Nutrition:</strong> {plan.nutrition}
                </span>
              </label>

              <div style={{ paddingLeft: 28, opacity: 0.9 }}>
                <strong>💊 Focus:</strong> {plan.health}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
