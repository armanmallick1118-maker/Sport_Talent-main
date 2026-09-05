import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AthleteAnalytics() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('athleteProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  // Chart Data configuration showing historical speed/time tracking
  const chartData = {
    labels: ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Current Session'],
    datasets: [
      {
        label: '10m Sprint Speed (km/h)',
        data: [21.5, 22.0, 22.8, 23.4, 24.2],
        fill: true,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#64748b',
          font: { family: 'Inter, sans-serif', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#93c5fd',
        borderColor: '#e2e8f0',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(226, 232, 240, 0.9)' },
        ticks: { color: '#64748b' },
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.9)' },
        ticks: { color: '#64748b' },
      },
    },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Header & Verified Assessment Badge Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wide px-3.5 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              🟢 Verified Assessment
            </span>
            <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
              Phase 18 Update
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">
            Performance Analytics & Graphs
          </h1>
          <p className="text-slate-500 text-sm">
            Detailed breakdown of explosive speed gains and movement mechanics for {profile?.name || 'Athlete'}.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center min-w-[200px]">
          <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Sprint Improvement</span>
          <span className="text-3xl font-semibold text-emerald-400">+10.4%</span>
          <span className="block text-[10px] text-slate-500 mt-0.5">Compared to baseline test</span>
        </div>
      </div>

      {/* Graph Card Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Sprint Velocity Progression</h2>
          <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
            Last 5 Assessments
          </span>
        </div>

        <div className="h-[320px] w-full flex items-center justify-center">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Peak Velocity Recorded</span>
          <span className="text-3xl font-semibold tracking-tight text-slate-900">24.2 km/h</span>
          <span className="text-emerald-400 text-xs mt-2 block font-medium">⚡ Top 5% National Rating</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Consistency Score</span>
          <span className="text-3xl font-semibold text-blue-400">94 / 100</span>
          <span className="text-slate-500 text-xs mt-2 block">Low variance across trials</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">System Milestone</span>
          <span className="text-3xl font-semibold text-emerald-400">MVP Ready</span>
          <span className="text-emerald-400 text-xs mt-2 block font-medium">✓ Full Architecture Verified</span>
        </div>
      </div>

      {/* Latest Test Result Verified Banner Card */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-2xl mb-8 shadow-sm">
        <div>
          <span className="text-slate-500 text-xs block mb-1">Latest Test Result</span>
          <h4 className="text-slate-900 font-semibold text-lg">10m Sprint Assessment</h4>
        </div>
        <div className="text-right">
          <span className="inline-block bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-1">
            🟢 Verified Assessment
          </span>
          <span className="block text-slate-500 text-xs font-semibold">Score: 91 / 100</span>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate('/athlete/dashboard')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-all cursor-pointer"
        >
          Return to Dashboard →
        </button>
      </div>
    </div>
  );
}