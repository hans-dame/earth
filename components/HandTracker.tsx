import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { MEDIAPIPE_WASM_PATH } from '../constants';
import { GestureState } from '../types';
import { Camera, ScanEye } from 'lucide-react';

interface HandTrackerProps {
  onGestureUpdate: (state: GestureState) => void;
  isActive: boolean;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onGestureUpdate, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<number | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const lastHandPos = useRef<{ x: number, y: number } | null>(null);

  // Initialize MediaPipe
  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setIsLoaded(true);
      } catch (err) {
        setError("Failed to load AI Vision models.");
        console.error(err);
      }
    };

    initMediaPipe();
    return () => {
      if (landmarkerRef.current) landmarkerRef.current.close();
    };
  }, []);

  // Handle Camera & Detection Loop
  useEffect(() => {
    if (!isActive || !isLoaded || !videoRef.current) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
        }
      } catch (err) {
        setError("Camera permission denied.");
      }
    };

    const predictWebcam = () => {
      if (!landmarkerRef.current || !videoRef.current) return;
      
      const startTimeMs = performance.now();
      const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      let isPinching = false;
      let deltaX = 0;
      let deltaY = 0;
      let handDetected = false;

      if (results.landmarks.length > 0) {
        handDetected = true;
        const landmarks = results.landmarks[0];
        
        // Index finger tip (8) and Thumb tip (4)
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        
        // Calculate distance for pinch detection
        const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
        
        // Threshold for pinch (adjust based on real-world testing)
        if (distance < 0.08) {
          isPinching = true;
          
          // Calculate center of pinch
          const centerX = (indexTip.x + thumbTip.x) / 2;
          const centerY = (indexTip.y + thumbTip.y) / 2;

          if (lastHandPos.current) {
            // MediaPipe coordinates are normalized 0-1. Invert X for mirroring effect.
            deltaX = (centerX - lastHandPos.current.x) * 5; 
            deltaY = (centerY - lastHandPos.current.y) * 5;
          }
          
          lastHandPos.current = { x: centerX, y: centerY };
        } else {
          lastHandPos.current = null;
        }
      } else {
        lastHandPos.current = null;
      }

      onGestureUpdate({ isPinching, deltaX, deltaY, handDetected });
      requestRef.current = requestAnimationFrame(predictWebcam);
    };

    startCamera();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isActive, isLoaded, onGestureUpdate]);

  if (!isActive) return null;

  return (
    <div className="absolute bottom-4 right-4 z-50 overflow-hidden rounded-lg border border-cyan-500/50 bg-black/80 shadow-[0_0_15px_rgba(0,243,255,0.3)] w-48 h-36">
      <div className="absolute top-0 left-0 flex items-center gap-2 p-1 text-[10px] text-cyan-400 font-bold bg-black/60 w-full">
        <ScanEye size={12} />
        {isLoaded ? "SENSORS ONLINE" : "INITIALIZING..."}
      </div>
      
      {error ? (
         <div className="flex h-full items-center justify-center text-red-500 text-xs text-center p-2">
           {error}
         </div>
      ) : (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline
          className="w-full h-full object-cover opacity-80 mix-blend-screen"
          style={{ transform: 'scaleX(-1)' }} // Mirror effect
        />
      )}
      
      {/* HUD Overlay on Video */}
      <div className="absolute inset-0 pointer-events-none border border-cyan-500/20">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-cyan-500/50 rounded-full opacity-50" />
         <div className="absolute bottom-2 right-2 text-[8px] text-cyan-300 animate-pulse">
           SYSTEM::TRACKING
         </div>
      </div>
    </div>
  );
};

export default HandTracker;