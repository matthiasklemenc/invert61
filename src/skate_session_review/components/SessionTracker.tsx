
import React, { useState, useEffect, useRef } from 'react';
import { Session, SessionDataPoint, Motion, GpsPoint } from '../types';

interface SessionTrackerProps {
  onSessionComplete: (session: Session) => void;
  previousSessions: Session[];
  onBack: () => void;
  motions: Motion[];
}

const CALIBRATION_DURATION_SEC = 10;
const SLAP_THRESHOLD = 3.2; // G-Force magnitude spike (Lowered for sensitivity)
const SLAP_WINDOW_MS = 1000; // Time allowed between two slaps (Increased window)

const SessionTracker: React.FC<SessionTrackerProps> = ({ onSessionComplete, previousSessions, onBack, motions }) => {
  const [status, setStatus] = useState<'uninitialized' | 'calibrating' | 'armed' | 'tracking'>('uninitialized');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [calibrationLeft, setCalibrationLeft] = useState(CALIBRATION_DURATION_SEC);
  
  const [currentG, setCurrentG] = useState(1.0);
  const [liveYaw, setLiveYaw] = useState(0); 
  const [pointsRecorded, setPointsRecorded] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  
  const timelineRef = useRef<SessionDataPoint[]>([]);
  const speedReadingsRef = useRef<number[]>([]);
  const pathRef = useRef<GpsPoint[]>([]);
  
  const startTimeRef = useRef(0);
  const lastPositionRef = useRef<GpsPoint | null>(null);
  const lastSlapTimeRef = useRef<number>(0);
  const sampleIntervalRef = useRef<number | null>(null);

  const sensorDataRef = useRef({
      gForce: 1.0,
      rotRate: 0,
      alpha: 0, 
      hasOrientation: false
  });

  const trackingStateRef = useRef({
      lastAlpha: 0,
      accumulatedTurn: 0,
      lastRecordTime: 0,
      lastStableAngle: 0,
      isRotating: false,
      rotationStartValue: 0,
      lastG: 1.0,
      isFirstSample: true,
      lastDeltaSign: 0 
  });

  const handleMotion = (event: DeviceMotionEvent) => {
    const { x, y, z } = event.accelerationIncludingGravity || {x:0,y:0,z:0};
    const { alpha, beta, gamma } = event.rotationRate || {alpha:0, beta:0, gamma:0};
    
    // Calculate total G-force (including gravity)
    const gForce = Math.sqrt((x||0)**2 + (y||0)**2 + (z||0)**2) / 9.81;
    const rotMag = Math.sqrt((alpha||0)**2 + (beta||0)**2 + (gamma||0)**2); 

    sensorDataRef.current.gForce = gForce;
    sensorDataRef.current.rotRate = rotMag;
    setCurrentG(gForce);

    // SLAP DETECTION (Active only while Armed)
    if (status === 'armed') {
        if (gForce > SLAP_THRESHOLD) {
            const now = Date.now();
            const diff = now - lastSlapTimeRef.current;
            
            // Look for second slap within 100ms - 1000ms window
            if (diff < SLAP_WINDOW_MS && diff > 100) {
                // Double slap detected!
                startRecording();
            }
            lastSlapTimeRef.current = now;
        }
    }
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
          if (trackingStateRef.current.isFirstSample) {
              trackingStateRef.current.lastAlpha = event.alpha;
              trackingStateRef.current.isFirstSample = false;
          }
          sensorDataRef.current.alpha = event.alpha;
          sensorDataRef.current.hasOrientation = true;
      }
  };

  const sampleSensors = () => {
      // Sampling loop for Live UI + Recording
      const now = Date.now();
      const data = sensorDataRef.current;
      const track = trackingStateRef.current;

      // 1. Calculate Rotation Delta (Yaw)
      if (data.hasOrientation) {
          let delta = track.lastAlpha - data.alpha;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;

          const absDelta = Math.abs(delta);
          const currentDeltaSign = delta > 0.6 ? 1 : (delta < -0.6 ? -1 : 0);

          if (absDelta > 0.6) {
              track.accumulatedTurn += delta;
          } else if (!track.isRotating) {
              track.accumulatedTurn = track.lastStableAngle;
          }
          
          track.lastAlpha = data.alpha;
          setLiveYaw(Math.round(track.accumulatedTurn));
      }

      // 2. Data Persistence (Recording)
      if (status !== 'tracking') return;

      const timeSec = (now - startTimeRef.current) / 1000;
      let shouldRecord = false;
      let turnAngle: number | undefined = undefined;
      let isGroupStart = false;

      // TRICK DETECTION (Rotation & Impact)
      if (!track.isRotating) {
          const diffFromStable = Math.abs(track.accumulatedTurn - track.lastStableAngle);
          if (diffFromStable > 12) { 
              track.isRotating = true;
              track.rotationStartValue = track.lastStableAngle;
              track.lastDeltaSign = 0;
              shouldRecord = true;
              isGroupStart = true;
          }
      } else {
          // Keep recording every 200ms during rotation
          if (now - track.lastRecordTime > 200) shouldRecord = true;

          const absDelta = Math.abs(track.lastAlpha - data.alpha);
          if (absDelta < 3.0) { // Rotation stopped
              track.isRotating = false;
              shouldRecord = true;
              turnAngle = Math.round(track.accumulatedTurn - track.rotationStartValue);
              track.lastStableAngle = track.accumulatedTurn;
          }
      }

      // High G-Force Impact
      const gDiff = Math.abs(data.gForce - track.lastG);
      if (gDiff > 0.3 || data.gForce > 2.0) {
          shouldRecord = true;
      }
      track.lastG = data.gForce;

      // Pulse record (Keep data alive)
      if (now - track.lastRecordTime > 2000) {
          shouldRecord = true;
      }

      if (shouldRecord) {
          const newPoint: SessionDataPoint = {
              timestamp: parseFloat(timeSec.toFixed(2)),
              intensity: parseFloat(data.gForce.toFixed(2)),
              rotation: parseFloat(data.rotRate.toFixed(2)),
              turnAngle,
              isGroupStart,
              groupId: track.isRotating ? `rot-${track.rotationStartValue}` : undefined
          };

          timelineRef.current.push(newPoint);
          setPointsRecorded(timelineRef.current.length);
          track.lastRecordTime = now;
      }
  };

  // Calibration Countdown
  useEffect(() => {
      if (status === 'calibrating' && calibrationLeft > 0) {
          const timer = setTimeout(() => setCalibrationLeft(l => l - 1), 1000);
          return () => clearTimeout(timer);
      } else if (status === 'calibrating' && calibrationLeft === 0) {
          setStatus('armed');
      }
  }, [status, calibrationLeft]);

  // Session Loop
  useEffect(() => {
    let watchId: number;
    let timerInterval: number;

    if (status === 'tracking') {
      startTimeRef.current = Date.now();
      timelineRef.current = []; 
      speedReadingsRef.current = [];
      pathRef.current = [];
      lastPositionRef.current = null;
      
      setPointsRecorded(0);
      setElapsedTime(0);
      
      timerInterval = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // GPS
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, speed } = position.coords;
            const speedKmh = (speed || 0) * 3.6;
            if (speedKmh > 0.5) {
                setCurrentSpeed(speedKmh);
                speedReadingsRef.current.push(speedKmh);
            }
            const newPoint = { lat: latitude, lon: longitude, timestamp: position.timestamp, speed: speedKmh };
            pathRef.current.push(newPoint);
          },
          (err) => console.warn('GPS Error', err),
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      }

      return () => {
        clearInterval(timerInterval);
        if (watchId) navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [status]);
  
  const initSensors = async () => {
    // Attempt screen WakeLock
    if ('wakeLock' in navigator) {
        try { (navigator as any).wakeLock.request('screen'); } catch(e){}
    }

    const startLifecycle = () => {
        window.addEventListener('devicemotion', handleMotion, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
        if (!sampleIntervalRef.current) {
            sampleIntervalRef.current = window.setInterval(sampleSensors, 100);
        }
        setStatus('calibrating');
        setCalibrationLeft(CALIBRATION_DURATION_SEC);
    };

    // Permission handling (iOS specific)
    const motionPerm = (DeviceMotionEvent as any).requestPermission;
    const orientPerm = (DeviceOrientationEvent as any).requestPermission;

    if (typeof motionPerm === 'function') {
      try {
        const mRes = await motionPerm();
        if (mRes === 'granted') {
           if (typeof orientPerm === 'function') await orientPerm();
           startLifecycle();
        } else {
          alert("Motion permissions are required for tracking.");
        }
      } catch (e) {
        startLifecycle(); // Fallback for browsers that error on check
      }
    } else {
      startLifecycle();
    }
  };

  const startRecording = () => {
      setStatus('tracking');
      startTimeRef.current = Date.now();
      trackingStateRef.current.lastRecordTime = Date.now();
      
      // Haptic feedback for slap confirmation
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  };

  const stopSession = () => {
    if (sampleIntervalRef.current) {
        clearInterval(sampleIntervalRef.current);
        sampleIntervalRef.current = null;
    }
    window.removeEventListener('devicemotion', handleMotion);
    window.removeEventListener('deviceorientation', handleOrientation);

    const processedTimeline = [...timelineRef.current];
    const summary: Record<string, number> = {};
    motions.forEach(m => summary[m.name] = 0);
    
    let totalTricks = 0;
    processedTimeline.forEach(p => {
        if (p.label && p.isGroupStart) {
            summary[p.label] = (summary[p.label] || 0) + 1;
            totalTricks++;
        }
    });

    const speeds = speedReadingsRef.current;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

    const newSession: Session = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString(),
      duration: elapsedTime,
      trickSummary: summary,
      totalTricks: totalTricks,
      maxSpeed: parseFloat(maxSpeed.toFixed(1)), 
      avgSpeed: parseFloat(avgSpeed.toFixed(1)),
      timelineData: processedTimeline,
      path: pathRef.current.length > 1 ? [...pathRef.current] : undefined
    };
    onSessionComplete(newSession);
    setStatus('uninitialized');
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg shadow-lg min-h-[480px]">
      <h2 className="text-2xl font-bold mb-4 text-cyan-300">Session Tracker</h2>
      
      {status === 'uninitialized' && (
        <div className="w-full mb-6 text-center">
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
               Calibration ensures high precision.<br/>
               Place phone on a flat surface or in pocket.
            </p>
            <button
              onClick={initSensors}
              className="w-full bg-blue-600 text-white font-bold py-5 text-xl rounded-xl hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95"
            >
              INITIALIZE SENSORS
            </button>
        </div>
      )}

      {status === 'calibrating' && (
        <div className="text-center w-full">
            <div className="relative w-36 h-36 mx-auto mb-8">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="72" cy="72" r="64"
                        stroke="currentColor" strokeWidth="10" fill="transparent"
                        className="text-gray-700"
                    />
                    <circle
                        cx="72" cy="72" r="64"
                        stroke="currentColor" strokeWidth="10" fill="transparent"
                        strokeDasharray={402}
                        strokeDashoffset={402 - (402 * (CALIBRATION_DURATION_SEC - calibrationLeft)) / CALIBRATION_DURATION_SEC}
                        className="text-cyan-400 transition-all duration-1000 ease-linear"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white tabular-nums">
                    {calibrationLeft}
                </div>
            </div>
            <p className="text-cyan-400 animate-pulse font-bold tracking-widest text-lg">STAY STILL</p>
            <p className="text-[10px] text-gray-500 mt-4 uppercase tracking-[0.2em]">Zeroing Gyroscope...</p>
            
            <div className="mt-10">
                <button disabled className="w-full bg-gray-700 text-gray-500 font-bold py-4 text-xl rounded-lg cursor-not-allowed border border-gray-600">
                    RECORD SESSION
                </button>
            </div>
        </div>
      )}

      {status === 'armed' && (
        <div className="text-center w-full">
            <div className="w-28 h-28 bg-red-600/10 border-4 border-red-600 rounded-full mx-auto flex items-center justify-center mb-8 animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                <div className="w-14 h-14 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.8)]"></div>
            </div>
            <h3 className="text-2xl font-black text-red-500 mb-2 tracking-tighter">READY TO START</h3>
            <p className="text-gray-300 text-sm mb-8 px-4 leading-relaxed">
                Put phone in your pocket now.<br/>
                <span className="text-white font-bold underline decoration-red-500 decoration-2">Double-slap your pocket</span><br/>
                to start hands-free.
            </p>

            <div className="grid grid-cols-2 gap-4 text-center mb-8">
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Angle</p>
                    <p className="text-xl font-bold text-white tabular-nums">{liveYaw}°</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Ambient</p>
                    <p className="text-xl font-bold text-white tabular-nums">{currentG.toFixed(1)} <span className="text-[10px] opacity-50">G</span></p>
                </div>
            </div>

            <button
              onClick={startRecording}
              className="w-full bg-green-500 text-gray-900 font-black py-5 text-2xl rounded-xl hover:bg-green-400 transition-all shadow-lg active:scale-95 mb-4"
            >
              START NOW
            </button>
        </div>
      )}

      {status === 'tracking' && (
        <div className="text-center w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] text-white font-black mb-6 bg-red-900 border border-red-500 animate-pulse uppercase tracking-widest">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span> RECORDING LIVE
            </div>
            <div className="text-7xl font-black text-cyan-400 my-6 tabular-nums tracking-tighter">{formatTime(elapsedTime)}</div>
            
            <div className="grid grid-cols-2 gap-4 text-center mb-8">
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Heading</p>
                    <p className="text-2xl font-black text-white tabular-nums">{liveYaw}°</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Impact</p>
                    <p className="text-2xl font-black text-white tabular-nums">{currentG.toFixed(1)} <span className="text-xs opacity-50">G</span></p>
                </div>
            </div>
            
            <div className="flex flex-col items-center gap-1 mb-8">
                <div className="h-1.5 w-32 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 animate-progress" style={{ width: '100%' }}></div>
                </div>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{pointsRecorded} data points</p>
            </div>
            
            <button
              onClick={stopSession}
              className="w-full bg-red-600 text-white font-black py-5 text-xl rounded-xl hover:bg-red-500 transition-all shadow-xl active:scale-95"
            >
              STOP & SAVE
            </button>
        </div>
      )}

      {(status === 'uninitialized' || status === 'calibrating' || status === 'armed') && (
        <div className="mt-auto w-full pt-4">
            <button
              onClick={onBack}
              className="w-full bg-gray-700 text-gray-400 font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors uppercase text-xs tracking-widest"
            >
              Back to Menu
            </button>
        </div>
      )}

      <style>{`
        @keyframes progress {
            from { transform: translateX(-100%); }
            to { transform: translateX(100%); }
        }
        .animate-progress {
            animation: progress 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default SessionTracker;
