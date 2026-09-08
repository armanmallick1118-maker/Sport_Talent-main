import React, { useEffect, useState } from 'react';
import { getScore, generateScore } from '../services/healthApi';
import CircularProgress from '../components/CircularProgress';
import AlertBanner from '../components/AlertBanner';
import { Bot, RefreshCw, CheckCircle2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AIHealthReport() {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [timeframe, setTimeframe] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const userId = localStorage.getItem('healthUserId');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const s = await getScore(userId);
      setScore(s.score);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

  if (analyzing) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: 20 }}>
        <Bot size={48} color="var(--accent-purple)" className="animate-pulse" />
        <div style={{ color: 'white', fontWeight: 600 }}>AI is analyzing your health data...</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>This takes ~5 seconds</div>
      </div>
    );
  }

  const strengths = score?.strengths ? JSON.parse(score.strengths) : [];
  const weaknesses = score?.weaknesses ? JSON.parse(score.weaknesses) : [];
  const alerts = score?.critical_alerts ? JSON.parse(score.critical_alerts) : [];
  let plan = {};
  try { plan = JSON.parse(score?.seven_day_plan || '{}'); } catch(e){}
  
  // PARSE HISTORY
  let history = [];
  try { history = JSON.parse(score?.score_history || '[]'); } catch(e){}

  // Aggregate by day (average if multiple per day)
  const dailyData = {};
  history.forEach(entry => {
    const d = new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!dailyData[d]) {
      dailyData[d] = { count: 0, overall: 0, workout: 0, nutrition: 0, health: 0, date: d };
    }
    dailyData[d].count += 1;
    dailyData[d].overall += entry.overall;
    dailyData[d].workout += entry.workout;
    dailyData[d].nutrition += entry.nutrition;
    dailyData[d].health += entry.health;
  });

  let chartData = Object.values(dailyData).map(d => ({
    date: d.date,
    overall: Math.round(d.overall / d.count),
    workout: Math.round(d.workout / d.count),
    nutrition: Math.round(d.nutrition / d.count),
    health: Math.round(d.health / d.count),
  }));

  // Filter based on timeframe
  if (timeframe === 'daily') {
    chartData = chartData.slice(-7); // Last 7 days
  } else if (timeframe === 'weekly') {
    // For weekly, we would ideally group by week, but since this is a demo, 
    // we'll just show the last 4 weeks (or 28 days) if available
    chartData = chartData.slice(-28);
  } else if (timeframe === 'monthly') {
    // Show up to the last 12 months (or 365 days grouped)
    // For simplicity, we just show all available points 
    chartData = chartData.slice(-365);
  }

  // Calculate Trend
  let trendText = "No trend data yet";
  let trendType = "neutral";
  
  if (chartData.length >= 2) {
    let current, previous;
    
      if (timeframe === 'daily') {
      current = chartData[chartData.length - 1].overall;
      previous = chartData[chartData.length - 2].overall;
    } else if (timeframe === 'weekly') {
      const last7 = chartData.slice(-7);
      const prev7 = chartData.slice(-14, -7);
      if (prev7.length > 0) {
        current = last7.reduce((sum, d) => sum + d.overall, 0) / last7.length;
        previous = prev7.reduce((sum, d) => sum + d.overall, 0) / prev7.length;
      } else {
        current = chartData[chartData.length - 1].overall;
        previous = current; // Fallback
      }
    } else if (timeframe === 'monthly') {
      const last30 = chartData.slice(-30);
      const prev30 = chartData.slice(-60, -30);
      if (prev30.length > 0) {
        current = last30.reduce((sum, d) => sum + d.overall, 0) / last30.length;
        previous = prev30.reduce((sum, d) => sum + d.overall, 0) / prev30.length;
      } else {
        current = chartData[chartData.length - 1].overall;
        previous = current; // Fallback
      }
    }

    const diff = current - previous;
    if (diff > 0) {
      trendText = `Up ${diff.toFixed(1)} pts this ${timeframe.replace('ly','')}`;
      trendType = "positive";
    } else if (diff < 0) {
      trendText = `Down ${Math.abs(diff).toFixed(1)} pts this ${timeframe.replace('ly','')}`;
      trendType = "negative";
    } else {
      trendText = "Holding steady";
      trendType = "neutral";
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-elevated)', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: 'white' }}>{label}</p>
          {payload.map((p, index) => (
            <div key={index} style={{ color: p.color, marginBottom: '4px' }}>
              {p.name}: {p.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '24px 20px', paddingBottom: 100 }}>
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot color="var(--accent-purple)" /> AI Health Report
        </h1>
        <button onClick={handleAnalyze} style={{ background: 'none', color: 'var(--accent-purple)' }}>
          <RefreshCw size={20} />
        </button>
      </div>

      <AlertBanner alerts={alerts} />

      <div className="card" style={{ marginBottom: 20, textAlign: 'center', background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, var(--bg-secondary) 100%)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
        <h2 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, textTransform: 'uppercase' }}>Overall Fitness Score</h2>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <CircularProgress score={score?.overall_score || 0} size={160} />
        </div>

        <p style={{ fontSize: 16, color: 'var(--text-primary)' }}>
          Grade: <strong style={{ color: 'var(--accent-purple)', fontSize: 24 }}>{score?.grade || '-'}</strong>
        </p>
      </div>

      {/* TREND GRAPH SECTION */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            Performance Trend
          </h2>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-primary)', padding: 4, borderRadius: 8 }}>
            {['daily', 'weekly', 'monthly'].map(t => (
              <button 
                key={t}
                onClick={() => setTimeframe(t)}
                style={{ 
                  background: timeframe === t ? 'var(--accent-purple)' : 'transparent', 
                  color: timeframe === t ? 'white' : 'var(--text-secondary)',
                  border: 'none', padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize'
                }}
              >
                {t === 'daily' ? 'D' : t === 'weekly' ? 'W' : 'M'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {trendType === 'positive' && <div style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--accent-green)', padding: '4px 8px', borderRadius: 8 }}><TrendingUp size={16} /></div>}
          {trendType === 'negative' && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)', padding: '4px 8px', borderRadius: 8 }}><TrendingDown size={16} /></div>}
          {trendType === 'neutral' && <div style={{ background: 'rgba(156, 163, 175, 0.2)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 8 }}><Minus size={16} /></div>}
          
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{trendText}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Based on {timeframe} averages</div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div style={{ height: 220, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="overall" name="Overall Score" stroke="var(--accent-purple)" strokeWidth={2} fillOpacity={1} fill="url(#colorOverall)" />
                <Area type="monotone" dataKey="workout" name="Workout" stroke="var(--accent-orange)" strokeWidth={1} fill="none" opacity={0.6} />
                <Area type="monotone" dataKey="nutrition" name="Nutrition" stroke="var(--accent-blue)" strokeWidth={1} fill="none" opacity={0.6} />
                <Area type="monotone" dataKey="health" name="Health" stroke="var(--accent-green)" strokeWidth={1} fill="none" opacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            Not enough data yet. <br/> Re-analyze a few times to generate a trend!
          </div>
        )}
      </div>

      {strengths.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-green)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} /> What you're doing great
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {strengths.map((s, i) => <li key={i}>✓ {s}</li>)}
          </ul>
        </div>
      )}

      {weaknesses.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-orange)', marginBottom: 12 }}>
            ⚠️ Areas to Improve
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
          </ul>
        </div>
      )}

      {Object.keys(plan).length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📅 7-Day Improvement Plan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.keys(plan).map((dayKey) => {
              const day = plan[dayKey];
              return (
                <div key={dayKey} style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent-blue)', marginBottom: 8 }}>
                    {day.title || dayKey.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div><strong>🏋️:</strong> {day.workout}</div>
                    <div><strong>🥗:</strong> {day.nutrition}</div>
                    <div><strong>💊:</strong> {day.health}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {score?.full_analysis && (
        <div className="card" style={{ marginBottom: 20 }}>
          <button 
            className="flex-between" 
            style={{ width: '100%', background: 'none', color: 'white', fontWeight: 600, fontSize: 14 }}
            onClick={() => setExpanded(!expanded)}
          >
            📋 Full AI Analysis {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {expanded && (
            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {score.full_analysis}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
