import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAssessmentResult } from '../utils/assessmentStorage';

export default function VerticalJumpResult() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('verticalJumpResult');
    if (data) {
      const parsed = JSON.parse(data);
      setResult(parsed);
      // Save permanently to history helper
      saveAssessmentResult('Vertical Jump Assessment', {
        jumpHeight: parsed.jumpHeight,
        hangTime: parsed.hangTime,
        score: parsed.score,
        badge: '🚀 Power Verified',
      });
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm text-center">
        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full inline-block mb-3">
          ✓ Verified by AI Vision
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">Vertical Jump Scorecard</h1>
        <p className="text-slate-500 text-sm">Assessment successfully recorded and synced.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Max Leap Height</span>
          <span className="text-4xl font-semibold text-slate-900">{result?.jumpHeight || '--'}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Flight Hang Time</span>
          <span className="text-4xl font-semibold text-slate-900">{result?.hangTime || '--'}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Overall AI Rating</span>
          <span className="text-4xl font-semibold text-blue-400">{result?.score || '--'} / 100</span>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => navigate('/athlete/dashboard')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-all cursor-pointer"
        >
          View Dashboard & History →
        </button>
      </div>
    </div>
  );
}
