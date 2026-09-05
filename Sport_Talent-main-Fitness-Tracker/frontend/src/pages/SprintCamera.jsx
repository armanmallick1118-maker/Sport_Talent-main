import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SprintCamera() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');

  // Setup Camera
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: false, // AI only needs video
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setError('Camera permission denied or camera not found. Please allow access and reload.');
      }
    }

    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startTest = () => {
    if (!videoRef.current?.srcObject) return;
    
    setIsRecording(true);
    setProgressStatus('Recording 5s video...');
    
    const stream = videoRef.current.srcObject;
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = handleRecordingStop;
    
    mediaRecorder.start();
    
    setTimeout(() => {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }, 5000);
  };

  const handleRecordingStop = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    setProgressStatus('Uploading to MediaPipeline...');

    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    const formData = new FormData();
    formData.append('file', blob, 'sprint.webm');

    try {
      let aiBaseUrl = import.meta.env.VITE_AI_API_URL || 'https://sporttalent-production-5756.up.railway.app';
      if (!aiBaseUrl.startsWith('http')) {
        aiBaseUrl = `https://${aiBaseUrl}`;
      }
      const uploadRes = await axios.post(`${aiBaseUrl}/api/v1/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const sessionId = uploadRes.data.session_id;

      if (!sessionId) throw new Error("No session ID returned from upload");

      setProgressStatus('AI analyzing motion (this may take a few seconds)...');
      await axios.post(`${aiBaseUrl}/api/v1/process?session_id=${sessionId}`);

      setProgressStatus('Analysis complete! Redirecting...');
      setTimeout(() => {
        navigate(`/test/sprint/result/${sessionId}`);
      }, 500);
      
    } catch (err) {
      console.error("MediaPipeline Error:", err);
      setIsProcessing(false);
      setError("Failed to process video with AI. Ensure MediaPipeline is running on port 8001.");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgressStatus('Uploading video to MediaPipeline...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      let aiBaseUrl = import.meta.env.VITE_AI_API_URL || 'https://sporttalent-production-5756.up.railway.app';
      if (!aiBaseUrl.startsWith('http')) {
        aiBaseUrl = `https://${aiBaseUrl}`;
      }
      const uploadRes = await axios.post(`${aiBaseUrl}/api/v1/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const sessionId = uploadRes.data.session_id;

      if (!sessionId) throw new Error("No session ID returned from upload");

      setProgressStatus('AI analyzing uploaded motion (this may take a few seconds)...');
      await axios.post(`${aiBaseUrl}/api/v1/process?session_id=${sessionId}`);

      setProgressStatus('Analysis complete! Redirecting...');
      setTimeout(() => {
        navigate(`/test/sprint/result/${sessionId}`);
      }, 500);
    } catch (err) {
      console.error("MediaPipeline Error:", err);
      setIsProcessing(false);
      setError("Failed to process uploaded video with AI. Ensure MediaPipeline is running on port 8001.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 mb-1">10m Sprint — Camera Viewfinder</h2>
        <p className="text-slate-500 text-sm">
          Align yourself within the bounding box. When you click start, we will record a 5-second video for AI processing.
        </p>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center">
          <p className="font-semibold">{error}</p>
        </div>
      ) : (
        <div className="relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center min-h-[420px]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-auto max-h-[500px] object-cover -scale-x-100 ${isProcessing ? 'opacity-30 blur-sm' : ''}`}
          />

          {cameraReady && !isRecording && !isProcessing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="border-2 border-dashed border-blue-500/70 rounded-3xl w-48 h-80 flex items-center justify-center bg-blue-500/5">
                <span className="text-blue-400 text-xs font-semibold bg-slate-950/80 px-3 py-1 rounded-full border border-blue-500/30">
                  Stand Here
                </span>
              </div>
            </div>
          )}

          {isRecording && (
            <div className="absolute top-6 right-6 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-rose-500/30">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-rose-400 text-sm font-semibold tracking-wide uppercase">Recording 5s...</span>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm z-10">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-white font-semibold text-lg drop-shadow-md">{progressStatus}</p>
            </div>
          )}
        </div>
      )}

      {cameraReady && !isRecording && !isProcessing && !error && (
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={startTest}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            Record 5s Sprint
          </button>

          <div className="flex items-center justify-center">
            <span className="text-slate-400 text-sm mx-2">OR</span>
          </div>

          <input 
            type="file" 
            accept="video/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold text-lg px-8 py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload Video
          </button>
        </div>
      )}
    </div>
  );
}
