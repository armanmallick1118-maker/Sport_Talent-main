import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function VerticalJumpInstructions() {
  const navigate = useNavigate();

  const handleStart = () => {
    localStorage.setItem('currentTest', 'Vertical Jump');
    navigate('/test/vertical-jump/camera');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
            Test 2 of 4 • Explosive Power
          </span>
          <span className="text-slate-500 text-sm font-medium">Est. Time: 2 Mins</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Vertical Jump Assessment</h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Measures your vertical leap height and explosive leg power using real-time pose estimation tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">1</div>
          <div>
            <h3 className="text-slate-900 font-semibold text-base mb-1">Side Profile Setup</h3>
            <p className="text-slate-500 text-sm">Position your phone 3–5 metres away facing your side profile.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">2</div>
          <div>
            <h3 className="text-slate-900 font-semibold text-base mb-1">Full Body Frame</h3>
            <p className="text-slate-500 text-sm">Ensure your head and feet remain fully visible during your max jump.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">3</div>
          <div>
            <h3 className="text-slate-900 font-semibold text-base mb-1">Standing Stretch</h3>
            <p className="text-slate-500 text-sm">Reach up fully before jumping to record your baseline standing height.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">4</div>
          <div>
            <h3 className="text-slate-900 font-semibold text-base mb-1">Max Explosive Jump</h3>
            <p className="text-slate-500 text-sm">Squat and leap straight up into the air with maximum effort.</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-slate-900 font-semibold text-sm font-medium">Ready for vertical jump tracking?</h4>
          <p className="text-slate-500 text-xs">Ensure good lighting and stable ground.</p>
        </div>
        <button
          onClick={handleStart}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors cursor-pointer"
        >
          Check Camera →
        </button>
      </div>
    </div>
  );
}