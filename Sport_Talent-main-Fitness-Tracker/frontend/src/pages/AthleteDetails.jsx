import React from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function AthleteDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  // TEMPORARY MOCK DATA
  // Later this will come from Arman's backend.
  const athlete = {
    id: id || "rahul-das",
    name: "Rahul Das",
    sport: "Football",
    ageGroup: "U18",
    location: "Kolkata",
    overall: 87,

    stats: {
      speed: 91,
      agility: 84,
      jump: 88,
    },

    verified: true,

    performanceHistory: [
      {
        test: "Sprint",
        score: 91,
        date: "17 Aug 2026",
      },
      {
        test: "Agility",
        score: 84,
        date: "15 Aug 2026",
      },
      {
        test: "Vertical Jump",
        score: 88,
        date: "12 Aug 2026",
      },
    ],

    videos: [
      {
        title: "Sprint Assessment",
        date: "17 Aug 2026",
        type: "Speed Test",
      },
      {
        title: "Agility Assessment",
        date: "15 Aug 2026",
        type: "Agility Test",
      },
      {
        title: "Vertical Jump Assessment",
        date: "12 Aug 2026",
        type: "Jump Test",
      },
    ],
  };

  return (
    <div className="px-6 py-8">
      <div className="max-w-6xl mx-auto">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate("/scout/athletes")}
          className="mb-6 text-slate-500 hover:text-slate-900 transition"
        >
          ← Back to Athletes
        </button>

        {/* PROFILE HEADER */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            {/* ATHLETE INFORMATION */}
            <div className="flex items-center gap-5">

              {/* AVATAR */}
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-semibold text-white">
                RD
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">
                    {athlete.name}
                  </h1>

                  {athlete.verified && (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <p className="text-slate-500 mt-2">
                  {athlete.sport} • {athlete.ageGroup} • {athlete.location}
                </p>
              </div>
            </div>

            {/* OVERALL SCORE */}
            <div className="text-center bg-slate-50 border border-slate-200 rounded-xl px-8 py-5">
              <p className="text-sm text-slate-500">
                Overall Score
              </p>

              <p className="text-5xl font-bold text-blue-400 mt-1">
                {athlete.overall}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                / 100
              </p>
            </div>

          </div>
        </div>

        {/* PERFORMANCE STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

          <StatCard
            title="Speed"
            value={athlete.stats.speed}
          />

          <StatCard
            title="Agility"
            value={athlete.stats.agility}
          />

          <StatCard
            title="Jump"
            value={athlete.stats.jump}
          />

        </div>

        {/* PERFORMANCE HISTORY */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold">
                Performance History
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Previous athletic assessments
              </p>
            </div>
          </div>

          <div className="space-y-3">

            {athlete.performanceHistory.map((item, index) => (

              <div
                key={index}
                className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4"
              >

                <div>
                  <p className="font-semibold">
                    {item.test}
                  </p>

                  <p className="text-sm text-slate-500">
                    {item.date}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-400">
                    {item.score}
                  </p>

                  <p className="text-xs text-slate-500">
                    Score
                  </p>
                </div>

              </div>

            ))}

          </div>
        </section>

        {/* ASSESSMENT VIDEOS */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Assessment Videos
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Recorded performance assessments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {athlete.videos.map((video, index) => (

              <div
                key={index}
                className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:border-slate-200 transition"
              >

                {/* VIDEO PLACEHOLDER */}
                <div className="h-40 bg-slate-100 flex items-center justify-center">

                  <button
                    className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition"
                  >
                    ▶
                  </button>

                </div>

                <div className="p-4">

                  <h3 className="font-semibold">
                    {video.title}
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    {video.type}
                  </p>

                  <p className="text-xs text-slate-600 mt-2">
                    {video.date}
                  </p>

                </div>

              </div>

            ))}

          </div>
        </section>

      </div>
    </div>
  );
}


/* STAT CARD */

function StatCard({ title, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">

      <div className="flex items-center justify-between">

        <p className="text-slate-500">
          {title}
        </p>

        <span className="text-xs text-slate-500">
          / 100
        </span>

      </div>

      <div className="flex items-end gap-3 mt-3">

        <p className="text-4xl font-bold">
          {value}
        </p>

        <p className="text-green-400 text-sm mb-1">
          Strong
        </p>

      </div>

      {/* PROGRESS BAR */}
      <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">

        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${value}%` }}
        />

      </div>

    </div>
  );
}