import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { saveAssessmentResult } from '../utils/assessmentStorage';

export default function SprintResult() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchResults() {
      // If we have state from the Gemini pipeline, use it immediately!
      if (location.state && location.state.scores) {
        const scores = location.state.scores;
        const sprintData = {
          time: 'N/A', // Gemini might not give exact time, but let's mock or calculate based on speed
          topSpeed: `${scores.speed} km/h`,
          score: scores.overall_score || scores.speed,
        };
        
        setResult(sprintData);
        saveAssessmentResult('10m Sprint Assessment (AI)', {
          time: sprintData.time,
          topSpeed: sprintData.topSpeed,
          score: sprintData.score,
          badge: '🟢 AI Verified',
        });
        setLoading(false);
        return;
      }

      if (!sessionId) {
        setError('No session ID provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const aiBaseUrl = import.meta.env.VITE_AI_API_URL || '/ml';
        const res = await axios.get(`${aiBaseUrl}/api/v1/results/${sessionId}`);
        const data = res.data;
        
        if (data.status !== 'completed') {
          setError(`Analysis not ready. Status: ${data.status}`);
          setLoading(false);
          return;
        }

        const metrics = data.summary || {};
        const avgSpeed = metrics.average_speed || 0;
        const timeCalc = avgSpeed > 0 ? (10 / (avgSpeed * (1000/3600))).toFixed(2) : 'N/A';
        const scoreCalc = Math.min(100, Math.round((avgSpeed / 30) * 100));

        const sprintData = {
          time: timeCalc !== 'N/A' ? `${timeCalc}s` : '--',
          topSpeed: `${avgSpeed.toFixed(1)} km/h`,
          score: scoreCalc > 0 ? scoreCalc : '--',
        };

        setResult(sprintData);

        saveAssessmentResult('10m Sprint Assessment (AI)', {
          time: sprintData.time,
          topSpeed: sprintData.topSpeed,
          score: sprintData.score,
          badge: '🟢 AI Verified',
        });
      } catch (err) {
        console.error('Failed to fetch results:', err);
        setError('Could not retrieve results from MediaPipeline. It might have failed processing.');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [sessionId, location.state]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">Loading AI Results...</h2>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center mb-8">
          <p className="font-semibold text-lg mb-2">Analysis Failed</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => navigate('/sports')}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium"
          >
            Go Back
          </button>
        </div>
      )}

      {!loading && result && !error && (
        <>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm text-center">
            <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wide px-4 py-1.5 rounded-full mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              🟢 AI Verified Assessment
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">10m Sprint Scorecard</h1>
            <p className="text-slate-500 text-sm">Assessment processed directly by MediaPipeline.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
              <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Estimated Time</span>
              <span className="text-4xl font-semibold text-slate-900">{result.time}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
              <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Avg Speed</span>
              <span className="text-4xl font-semibold text-slate-900">{result.topSpeed}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
              <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">AI Rating</span>
              <span className="text-4xl font-semibold text-emerald-400">{result.score} / 100</span>
              <span className="block text-[10px] text-emerald-400 font-semibold mt-1">✓ Verified Score</span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => navigate('/sports')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-all cursor-pointer"
            >
              View Assessment History →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
