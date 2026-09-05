import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SprintTestInstructions() {
  const navigate = useNavigate();

  const handleStartCamera = () => {
    localStorage.setItem('currentTest', 'Sprint Test');
    navigate('/test/sprint/camera');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
            Test 1 of 4 • Speed & Acceleration
          </span>
          <span className="text-slate-500 text-sm font-medium">Est. Time: 2 Mins</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">10m Sprint Assessment</h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          This test measures your acceleration, stride velocity, and sprint time using real-time pose tracking. Follow the camera positioning guidelines carefully for valid AI scoring.
        </p>
      </div>

      {/* Instructions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
            1
          </div>
          <div>
            <h3 className="text-slate-900 font-semibold text-base mb-1">Set Up Camera Distance</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Place your phone or laptop approximately <strong className="text-slate-700">5–10 metres away</strong> from your running path on a stable surface.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
            2
          </div>
          <div>
            <h3 className="text-slate-900 font-semibold text-base mb-1">Full Body Visibility</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Ensure your <strong className="text-slate-700">entire body is visible</strong> in the camera frame from head to toe before starting.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
            3
          </div>
          <div>
            <h3 className="text-slate-900 font-semibold text-base mb-1">Single Person Frame</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Make sure <strong className="text-slate-700">only you are in the frame</strong>. Other people moving in the background may throw off pose estimation.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
            4
          </div>
          <div>
            <h3 className="text-slate-900 font-semibold text-base mb-1">Position Behind Start Line</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Stand <strong className="text-slate-700">behind the designated starting line</strong> and wait for the AI 3-second countdown before sprinting.
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-slate-900 font-semibold text-sm">Ready to check your camera stream?</h4>
          <p className="text-slate-500 text-xs">Grant camera permissions on the next screen.</p>
        </div>
        <button
          onClick={handleStartCamera}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
        >
          Check Camera →
        </button>
      </div>
    </div>
  );
}