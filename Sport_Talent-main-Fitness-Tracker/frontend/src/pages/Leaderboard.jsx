import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [filterSport, setFilterSport] = useState('All');

  useEffect(() => {
    // Combine mock athletes with any locally stored current athlete result
    const storedProfile = JSON.parse(localStorage.getItem('athleteProfile') || '{}');
    const overallAIScore = Number(localStorage.getItem('overallAIScore')) || 85;

    const mockAthletes = [
      { id: 1, name: 'Priya Sharma', sport: 'Football', position: 'Midfielder', score: 92, badge: '👑 Elite' },
      { id: 2, name: 'Sneha Verma', sport: 'Athletics', position: 'Sprinter', score: 90, badge: '⚡ Pro' },
      { id: 3, name: storedProfile.name || 'You (Athlete)', sport: storedProfile.primarySport || 'Football', position: storedProfile.position || 'Winger', score: overallAIScore, badge: '🔥 Rising Star' },
      { id: 4, name: 'Rahul Das', sport: 'Football', position: 'Forward', score: 82, badge: '⭐ Verified' },
      { id: 5, name: 'Amit Patel', sport: 'Cricket', position: 'Bowler', score: 79, badge: '⭐ Verified' },
    ];

    // Sort descending by score
    mockAthletes.sort((a, b) => b.score - a.score);
    setLeaderboardData(mockAthletes);
  }, []);

  const filteredList = leaderboardData.filter(
    (item) => filterSport === 'All' || item.sport === filterSport
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm text-center">
        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full inline-block mb-3">
          🏆 National Talent Rankings
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Athlete Leaderboard</h1>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          Compare your verified AI fitness index and physical test scores against top regional performers.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {['All', 'Football', 'Cricket', 'Athletics'].map((sport) => (
          <button
            key={sport}
            onClick={() => setFilterSport(sport)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              filterSport === sport
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Rankings List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-8">
        <div className="divide-y divide-slate-100">
          {filteredList.map((athlete, index) => (
            <div
              key={athlete.id}
              className={`p-5 flex items-center justify-between transition-colors ${
                athlete.name.includes('You') ? 'bg-blue-600/10 border-l-4 border-blue-500' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm ${
                    index === 0
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-400'
                      : index === 1
                      ? 'bg-slate-300/20 border border-slate-300 text-slate-700'
                      : index === 2
                      ? 'bg-amber-700/20 border border-amber-600 text-amber-500'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  #{index + 1}
                </div>
                <div>
                  <h3 className="text-slate-900 font-semibold text-base flex items-center gap-2">
                    {athlete.name}
                    <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      {athlete.badge}
                    </span>
                  </h3>
                  <p className="text-slate-500 text-xs">
                    {athlete.sport} • {athlete.position}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-semibold text-blue-400">{athlete.score}</span>
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">AI Index</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => navigate('/athlete/dashboard')}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          ← Return to Dashboard
        </button>
      </div>
    </div>
  );
}