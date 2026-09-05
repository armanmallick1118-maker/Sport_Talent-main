import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as tf from "@tensorflow/tfjs";

export default function LivePoseCamera() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const animationFrameRef = useRef(null);
  const processingRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [poseCount, setPoseCount] = useState(0);
  const [backend, setBackend] = useState("");

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        console.log("Starting TensorFlow.js...");

        // -----------------------------------------
        // 1. INITIALIZE TENSORFLOW
        // -----------------------------------------

        await tf.ready();

        console.log("TensorFlow.js ready");
        console.log("Current backend:", tf.getBackend());

        // Try WebGL first
        try {
          await tf.setBackend("webgl");
          await tf.ready();

          console.log("Using backend:", tf.getBackend());

          if (mounted) {
            setBackend(tf.getBackend());
          }
        } catch (webglError) {
          console.warn(
            "WebGL failed. Trying CPU backend...",
            webglError
          );

          await tf.setBackend("cpu");
          await tf.ready();

          console.log("Using backend:", tf.getBackend());

          if (mounted) {
            setBackend(tf.getBackend());
          }
        }

        // -----------------------------------------
        // 2. LOAD MOVENET
        // -----------------------------------------

        const MODEL_URL =
          "https://tfhub.dev/tensorflow/tfjs-model/movenet/singlepose/lightning/4/model.json";

        console.log("Loading MoveNet...");

        const detector = await tf.loadGraphModel(
          MODEL_URL,
          {
            fromTFHub: true,
          }
        );

        detectorRef.current = detector;

        console.log("MoveNet loaded successfully");

        if (!mounted) {
          detector.dispose();
          return;
        }

        // -----------------------------------------
        // 3. REQUEST CAMERA
        // -----------------------------------------

        console.log("Requesting camera permission...");

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: 640,
              height: 480,
              facingMode: "user",
            },
            audio: false,
          });

        streamRef.current = stream;

        if (!videoRef.current || !mounted) {
          stream
            .getTracks()
            .forEach((track) => track.stop());

          return;
        }

        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = async () => {
          if (!mounted) return;

          try {
            await videoRef.current.play();

            console.log("Camera started");

            setLoading(false);

            startDetection();
          } catch (playError) {
            console.error(
              "Video playback error:",
              playError
            );

            setErrorMsg(
              "The camera opened, but the video could not be started."
            );

            setLoading(false);
          }
        };
      } catch (error) {
        console.error(
          "Initialization failed:",
          error
        );

        if (mounted) {
          setErrorMsg(
            error?.message ||
              "Camera or MoveNet initialization failed."
          );

          setLoading(false);
        }
      }
    };

    // -----------------------------------------
    // 4. POSE DETECTION
    // -----------------------------------------

    const startDetection = () => {
      if (!mounted) return;

      animationFrameRef.current =
        requestAnimationFrame(detectFrame);
    };

    const detectFrame = async () => {
      if (!mounted) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const detector = detectorRef.current;

      if (
        !video ||
        !canvas ||
        !detector ||
        video.readyState < 2
      ) {
        animationFrameRef.current =
          requestAnimationFrame(detectFrame);

        return;
      }

      // Prevent multiple model executions at once
      if (processingRef.current) {
        animationFrameRef.current =
          requestAnimationFrame(detectFrame);

        return;
      }

      processingRef.current = true;

      try {
        const ctx = canvas.getContext("2d");

        canvas.width =
          video.videoWidth || 640;

        canvas.height =
          video.videoHeight || 480;

        // -----------------------------------------
        // CONVERT VIDEO → TENSOR
        // -----------------------------------------

        const imageTensor =
          tf.browser.fromPixels(video);

        // MoveNet Lightning uses 192 × 192 input
        const resized =
          tf.image.resizeBilinear(
            imageTensor,
            [192, 192]
          );

        const input =
          resized
            .toInt()
            .expandDims(0);

        // -----------------------------------------
        // RUN MOVENET
        // -----------------------------------------

        const prediction =
          await detector.executeAsync(input);

        const output =
          Array.isArray(prediction)
            ? prediction[0]
            : prediction;

        const data =
          await output.data();

        // -----------------------------------------
        // EXTRACT 17 KEYPOINTS
        // -----------------------------------------

        const keypoints = [];

        for (let i = 0; i < 17; i++) {
          const y =
            data[i * 3] *
            canvas.height;

          const x =
            data[i * 3 + 1] *
            canvas.width;

          const score =
            data[i * 3 + 2];

          keypoints.push({
            x,
            y,
            score,
          });
        }

        // -----------------------------------------
        // COUNT DETECTED KEYPOINTS
        // -----------------------------------------

        const visiblePoints =
          keypoints.filter(
            (point) =>
              point.score > 0.3
          ).length;

        if (mounted) {
          setPoseCount(
            visiblePoints
          );
        }

        // -----------------------------------------
        // CLEAR CANVAS
        // -----------------------------------------

        ctx.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // -----------------------------------------
        // DRAW SKELETON
        // -----------------------------------------

        drawSkeleton(
          keypoints,
          ctx
        );

        // -----------------------------------------
        // DRAW KEYPOINTS
        // -----------------------------------------

        drawKeypoints(
          keypoints,
          ctx
        );

        // -----------------------------------------
        // CLEAN TENSORS
        // -----------------------------------------

        tf.dispose([
          imageTensor,
          resized,
          input,
        ]);

        if (Array.isArray(prediction)) {
          prediction.forEach(
            (tensor) => {
              if (
                tensor &&
                typeof tensor.dispose ===
                  "function"
              ) {
                tensor.dispose();
              }
            }
          );
        } else if (
          prediction &&
          typeof prediction.dispose ===
            "function"
        ) {
          prediction.dispose();
        }
      } catch (error) {
        console.error(
          "Pose detection error:",
          error
        );
      } finally {
        processingRef.current = false;
      }

      if (mounted) {
        animationFrameRef.current =
          requestAnimationFrame(
            detectFrame
          );
      }
    };

    // -----------------------------------------
    // START
    // -----------------------------------------

    setup();

    // -----------------------------------------
    // CLEANUP
    // -----------------------------------------

    return () => {
      mounted = false;

      if (animationFrameRef.current) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current = null;
      }

      if (detectorRef.current) {
        try {
          detectorRef.current.dispose();
        } catch (error) {
          console.warn(
            "Detector cleanup failed:",
            error
          );
        }

        detectorRef.current = null;
      }
    };
  }, []);

  // -----------------------------------------
  // DRAW KEYPOINTS
  // -----------------------------------------

  const drawKeypoints = (
    keypoints,
    ctx
  ) => {
    keypoints.forEach(
      (point) => {
        if (point.score > 0.3) {
          ctx.beginPath();

          ctx.arc(
            point.x,
            point.y,
            6,
            0,
            2 * Math.PI
          );

          ctx.fillStyle =
            "#3b82f6";

          ctx.fill();
        }
      }
    );
  };

  // -----------------------------------------
  // MOVENET EDGES
  // -----------------------------------------

  const EDGES = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],

    [5, 6],

    [5, 7],
    [7, 9],

    [6, 8],
    [8, 10],

    [5, 11],
    [6, 12],

    [11, 12],

    [11, 13],
    [13, 15],

    [12, 14],
    [14, 16],
  ];

  // -----------------------------------------
  // DRAW SKELETON
  // -----------------------------------------

  const drawSkeleton = (
    keypoints,
    ctx
  ) => {
    EDGES.forEach(
      ([first, second]) => {
        const pointA =
          keypoints[first];

        const pointB =
          keypoints[second];

        if (
          pointA &&
          pointB &&
          pointA.score > 0.3 &&
          pointB.score > 0.3
        ) {
          ctx.beginPath();

          ctx.moveTo(
            pointA.x,
            pointA.y
          );

          ctx.lineTo(
            pointB.x,
            pointB.y
          );

          ctx.strokeStyle =
            "#10b981";

          ctx.lineWidth = 3;

          ctx.stroke();
        }
      }
    );
  };

  // -----------------------------------------
  // USER INTERFACE
  // -----------------------------------------

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* HEADER */}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 flex justify-between items-center">

        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-1">
            Phase 12 — Live Pose Detection
          </h2>

          <p className="text-slate-500 text-sm">
            Real-time body tracking using
            TensorFlow.js and MoveNet.
          </p>
        </div>

        <div className="text-right">

          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
            Keypoints: {poseCount}
          </div>

          {backend && (
            <p className="text-xs text-slate-500 mt-2">
              Backend: {backend}
            </p>
          )}

        </div>

      </div>

      {/* CAMERA AREA */}

      <div className="relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center min-h-[440px]">

        {/* LOADING */}

        {loading && !errorMsg && (
          <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center gap-3">

            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />

            <p className="text-slate-600 font-medium text-sm">
              Loading MoveNet and camera...
            </p>

            <p className="text-slate-500 text-xs">
              This may take a few seconds.
            </p>

          </div>
        )}

        {/* ERROR */}

        {errorMsg && (
          <div className="absolute inset-0 z-30 bg-slate-950 p-6 flex flex-col items-center justify-center text-center">

            <div className="text-red-400 text-3xl mb-3">
              ⚠️
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Camera / Model Error
            </h3>

            <p className="text-red-300 text-sm max-w-lg break-words">
              {errorMsg}
            </p>

          </div>
        )}

        {/* VIDEO */}

        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
          playsInline
          muted
        />

        {/* CANVAS */}

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover z-10 -scale-x-100 pointer-events-none"
        />

      </div>

      {/* STATUS */}

      <div className="mt-4 text-center">

        {poseCount >= 10 && (
          <p className="text-green-400 text-sm font-medium">
            ✓ Full body detected
          </p>
        )}

        {poseCount > 0 &&
          poseCount < 10 && (
            <p className="text-yellow-400 text-sm font-medium">
              ⚠ Move so more of your body is visible
            </p>
          )}

        {poseCount === 0 &&
          !loading &&
          !errorMsg && (
            <p className="text-slate-500 text-sm">
              Waiting for a person...
            </p>
          )}

      </div>

      {/* RETURN BUTTON */}

      <div className="mt-6 flex justify-center">

        <button
          type="button"
          onClick={() =>
            navigate(
              "/athlete/dashboard"
            )
          }
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          ← Return to Dashboard
        </button>

      </div>

    </div>
  );
}