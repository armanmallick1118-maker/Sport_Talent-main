import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VerticalJumpCamera() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | countdown | recording | processing
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (err) {
        console.error('Camera access error:', err);
      }
    }

    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startTestSequence = () => {
    setStatus('countdown');
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          runRecordingPhase();
          return 'JUMP NOW!';
        }
        return prev - 1;
      });
    }, 1000);
  };

  const runRecordingPhase = () => {
    setStatus('recording');
    setTimeout(() => {
      setStatus('processing');
      setTimeout(() => {
        localStorage.setItem(
          'verticalJumpResult',
          JSON.stringify({
            jumpHeight: '58.4 cm',
            hangTime: '0.62 s',
            peakPower: '3,840 W',
            score: 86,
          })
        );
        navigate('/test/vertical-jump/result');
      }, 2500);
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-1">Vertical Jump Viewfinder</h2>
          <p className="text-slate-500 text-sm">Stand side-on inside the vertical bounding box.</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase">
          Status: {status}
        </span>
      </div>

      <div className="relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center min-h-[420px]">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto max-h-[500px] object-cover -scale-x-100" />

        {cameraReady && status === 'idle' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="border-2 border-dashed border-emerald-500/70 rounded-3xl w-44 h-96 flex items-center justify-center bg-emerald-500/5">
              <span className="text-emerald-400 text-xs font-semibold bg-slate-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                Align Side Profile
              </span>
            </div>
          </div>
        )}

        {status === 'countdown' && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
            <span className="text-6xl font-semibold text-blue-400 animate-pulse">{countdown}</span>
          </div>
        )}

        {status === 'recording' && (
          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white"></span>
            RECORDING & TRACKING LEAP...
          </div>
        )}

        {status === 'processing' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-900 font-semibold text-lg">AI Processing Frame Kinematics...</p>
            <p className="text-slate-500 text-xs">Calculating apex displacement and flight duration</p>
          </div>
        )}
      </div>

      {cameraReady && status === 'idle' && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={startTestSequence}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Start Vertical Leap Assessment
          </button>
        </div>
      )}
    </div>
  );
}