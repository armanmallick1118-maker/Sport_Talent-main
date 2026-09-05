"use client";
import React, { useState } from 'react';
import CameraStream from '../../components/CameraStream';

export default function HealthHub() {
  const [activeTab, setActiveTab] = useState('labs');

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-8">
      {/* HEADER */}
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Health & Biomechanics Hub
          </h1>
          <p className="text-slate-400 mt-1">Unified Tracking & Live AI Analysis</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 flex items-center justify-center font-bold shadow-lg border-2 border-white/10">
          U
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('labs')}
          className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${activeTab === 'labs' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
        >
          Lab Reports
        </button>
        <button 
          onClick={() => setActiveTab('motion')}
          className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${activeTab === 'motion' ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/50' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
        >
          Live Motion Tracker
        </button>
      </div>

      {/* CONTENT */}
      {activeTab === 'motion' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CameraStream />
        </div>
      )}

      {activeTab === 'labs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Mock Lab Report Submission */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white mb-6">Add New Lab Report</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Test Date</label>
                <input type="date" className="w-full bg-[#111827] border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Panel</label>
                <select className="w-full bg-[#111827] border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none">
                  <option>Hematology (CBC)</option>
                  <option>Lipid Panel</option>
                  <option>Thyroid</option>
                </select>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-left">
                      <th className="pb-2">Biomarker</th>
                      <th className="pb-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2">Hemoglobin <span className="text-xs text-slate-500 block">g/dL</span></td>
                      <td><input type="text" className="w-full bg-transparent border-b border-slate-700 p-1 outline-none text-white focus:border-blue-500" placeholder="e.g. 14.5" /></td>
                    </tr>
                    <tr>
                      <td className="py-2">WBC <span className="text-xs text-slate-500 block">x10^9/L</span></td>
                      <td><input type="text" className="w-full bg-transparent border-b border-slate-700 p-1 outline-none text-white focus:border-blue-500" placeholder="e.g. 6.2" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all">
                Save Report
              </button>
            </div>
          </div>

          {/* History */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl">
             <h2 className="text-xl font-bold text-white mb-6">Recent History</h2>
             <div className="space-y-4">
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-blue-300">Hematology (CBC)</h3>
                    <p className="text-xs text-slate-400 mt-1">Oct 24, 2023</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">Normal</span>
                </div>
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-blue-300">Lipid Panel</h3>
                    <p className="text-xs text-slate-400 mt-1">Aug 15, 2023</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/30">1 Issue</span>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
