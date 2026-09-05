import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssessmentHistory } from '../utils/assessmentStorage';

const TABS = [
  { id: 'tests',   label: '📋 Available Tests' },
  { id: 'history', label: '⏱️ My History' },
];

export default function SportSelection() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tests');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (activeTab === 'history') {
      setHistory(getAssessmentHistory());
    }
  }, [activeTab]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">AI Assessments</h1>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          Take physical evaluation tests verified by MediaPipeline to update your talent scorecard.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test 1: 10m Sprint */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-500 text-2xl">
                ⚡
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">10m Sprint</h2>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mt-0.5">MediaPipeline Powered</p>
              </div>
            </div>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Records a 5-second video and uses our AI computer vision model to extract max sprint velocity and acceleration.
            </p>
            <button
              onClick={() => navigate('/test/sprint')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Start Sprint Assessment →
            </button>
          </div>

          {/* Test 2: Vertical Jump */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all opacity-80">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 text-2xl">
                🚀
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Vertical Jump</h2>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mt-0.5">Coming Soon</p>
              </div>
            </div>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Measures maximum leap height, flight hang time, and explosive takeoff power using MediaPipeline.
            </p>
            <button
              disabled
              className="w-full bg-slate-100 text-slate-400 font-semibold py-2.5 rounded-xl cursor-not-allowed"
            >
              Start Vertical Jump →
            </button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl mb-3 block">📭</span>
              <h3 className="text-lg font-semibold text-slate-900">No Assessments Yet</h3>
              <p className="text-slate-500 text-sm mt-1">Take your first AI test to see your history here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-slate-900">{record.testName}</h4>
                    <p className="text-xs text-slate-500 mt-1">{new Date(record.date).toLocaleString()}</p>
                  </div>
                  <div className="mt-3 sm:mt-0 flex gap-4 text-sm font-semibold">
                    {record.metrics && Object.entries(record.metrics).map(([key, val]) => (
                      <div key={key} className="text-right">
                        <span className="block text-[10px] text-slate-400 uppercase">{key}</span>
                        <span className="text-slate-900">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
