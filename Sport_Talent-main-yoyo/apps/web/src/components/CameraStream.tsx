"use client";
import React from 'react';

export default function CameraStream() {
  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/40 backdrop-blur-md">
      <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-900 flex justify-between items-center border-b border-white/10">
        <h2 className="text-white font-bold tracking-wider text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          LIVE KINEMATIC STREAM
        </h2>
        <span className="text-xs text-cyan-300 font-mono">PRANA-MOTION TRACKER</span>
      </div>
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <img 
          src="http://127.0.0.1:8002/video_feed" 
          alt="OpenCV Camera Stream" 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            document.getElementById('fallback-msg')!.style.display = 'block';
          }}
        />
        <div id="fallback-msg" className="absolute text-slate-500 hidden text-sm font-mono">
          [Camera stream offline. Start plugin-cv_model/server.py]
        </div>
      </div>
    </div>
  );
}
