import React, { useState, useEffect, useRef } from 'react';
import { Session, SessionDataPoint, Motion, GpsPoint } from '../types';

interface SessionTrackerProps {
  onSessionComplete: (session: Session) => void;
  previousSessions: Session[];
  onBack: () => void;
  motions: Motion[];
}

const CALIBRATION_DURATION_SEC = 3;
const SLAP_THRESHOLD = 2.2; // Slightly higher to avoid false starts
const SLAP_WINDOW_MS = 1200; 
const ROTATION_NOISE_FLOOR = 1.5; // Ignore rotation < 1.5 deg/s to prevent drift

const SessionTracker: React.FC<SessionTrackerProps> = ({ onSessionComplete, previousSessions, onBack, motions }) => {
  const [status, setStatusState] = useState<'uninitialized' | 'calibrating' | 'armed' | 'tracking'>('uninitialized');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [calibrationLeft, setCalibrationLeft] = useState(CALIBRATION_DURATION_SEC);
  const [currentG, setCurrentG] = useState(1.0);
  const [liveYaw, setLiveYaw] = useState(0);
  const [pointsRecorded, setPointsRecorded] = useState(0);
  const [isDoubleSlapTriggered, setIsDoubleSlapTriggered] = useState(false);

  const statusRef = useRef(status);
  const startTimeRef = useRef(0);
  const lastSlapTimeRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);
  const lastEventTimeRef = useRef(0);
  
  const timelineRef = useRef<SessionDataPoint[]>([]);
  const speedReadingsRef = useRef<number[]>([]);
  const pathRef = useRef<GpsPoint[]>([]);
  
  const trackingRef = useRef({
      gravityRef: { x: 0, y: 0, z: 9.81 },
      accumulatedTurn: 0,
      lastStableTurn: 0,
      lastLogTime: 0
  });

  const setStatus = (s: typeof status) => {
      statusRef.current = s;
      setStatusState(s);
  };

  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity || { x: 0, y: 0, z: 9.81 };
    const rot = event.rotationRate || { alpha: 0, beta: 0, gamma: 0 };
    
    const ax = acc.x || 0;
    const ay = acc.y || 0;
    const az = acc.z || 0;
    
    // Total acceleration magnitude
    const totalAcc_ms2 = Math.sqrt(ax * ax + ay * ay + az * az);
    const gForce = totalAcc_ms2 / 9.81;
    
    // Update live G display (throttled for readability)
    if (performance.now() - lastEventTimeRef.current > 100) {
        setCurrentG(gForce);
    }

    // --- CALIBRATION ---
    if (statusRef.current === 'calibrating') {
        trackingRef.current.gravityRef.x = trackingRef.current.gravityRef.x * 0.8 + ax * 0.2;
        trackingRef.current.gravityRef.y = trackingRef.current.gravityRef.y * 0.8 + ay * 0.2;
        trackingRef.current.gravityRef.z = trackingRef.current.gravityRef.z * 0.8 + az * 0.2;
        return;
    }

    // --- TRIGGER (Double Slap) ---
    if (statusRef.current === 'armed') {
        if (gForce > SLAP_THRESHOLD) {
            const now = Date.now();
            if (now - lastSlapTimeRef.current < SLAP_WINDOW_MS && lastSlapTimeRef.current > 0) {
                startRecording();
            } else {
                lastSlapTimeRef.current = now;
                setIsDoubleSlapTriggered(true);
                setTimeout(() => setIsDoubleSlapTriggered(false), SLAP_WINDOW_MS);
            }
        }
    }

    // --- ROTATION TRACKING (Gravity-Aligned Projection) ---
    if (totalAcc_ms2 > 0.1) {
        // Precise time delta calculation
        const now = performance.now();
        let dt = (event.interval || (now - lastEventTimeRef.current)) / 1000;
        if (dt <= 0 || dt > 0.5) dt = 0.016; // Fallback to 60fps if gap is weird
        lastEventTimeRef.current = now;

        /**
         * CALCULATE TURN RATE AROUND WORLD-VERTICAL (Gravity)
         * We project the 3D rotation rate vector onto the current gravity vector.
         * W3C Standard for DeviceRotationRate: degrees per second.
         * rot.alpha = Z-axis (screen), rot.beta = X-axis, rot.gamma = Y-axis.
         */
        const turnRateDegPerSec = ((rot.beta || 0) * ax + (rot.gamma || 0) * ay + (rot.alpha || 0) * az) / totalAcc_ms2;
        
        const track = trackingRef.current;
        
        // Noise gate to stop numerical drift when phone is essentially still
        if (Math.abs(turnRateDegPerSec) > ROTATION_NOISE_FLOOR) {
            // Integration: Degrees = (Degrees/Sec) * Seconds
            track.accumulatedTurn += turnRateDegPerSec * dt;
            
            // Throttle UI update for performance
            if (Math.floor(now / 50) !== Math.floor((now - dt*1000) / 50)) {
                setLiveYaw(Math.round(track.accumulatedTurn));
            }
        }
    }

    // --- LOGGING ---
    if (statusRef.current === 'tracking') {
        const wallTime = Date.now();
        if (wallTime - trackingRef.current.lastLogTime > 100) {
            trackingRef.current.lastLogTime = wallTime;
            const timeSec = (wallTime - startTimeRef.current) / 1000;
            
            const currentTurn = Math.round(trackingRef.current.accumulatedTurn);
            const deltaTurn = currentTurn - trackingRef.current.lastStableTurn;
            
            // Significant turn events recorded in session data
            let turnEvent: number | undefined = undefined;
            if (Math.abs(deltaTurn) >= 20) {
                turnEvent = deltaTurn;
                trackingRef.current.lastStableTurn = currentTurn;
            }

            timelineRef.current.push({
                timestamp: parseFloat(timeSec.toFixed(2)),
                intensity: parseFloat(gForce.toFixed(2)),
                turnAngle: turnEvent
            });
            setPointsRecorded(timelineRef.current.length);
        }
    }
  };

  const initSensors = async () => {
    const activate = () => {
        window.removeEventListener('devicemotion', handleMotion, true);
        window.addEventListener('devicemotion', handleMotion, true);
        setStatus('calibrating');
        setCalibrationLeft(CALIBRATION_DURATION_SEC);
        lastEventTimeRef.current = performance.now();
    };

    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const res = await (DeviceMotionEvent as any).requestPermission();
        if (res === 'granted') activate();
      } catch (e) { activate(); }
    } else { activate(); }
  };

  const startRecording = () => {
    if (statusRef.current === 'tracking') return;
    
    timelineRef.current = [];
    speedReadingsRef.current = [];
    pathRef.current = [];
    startTimeRef.current = Date.now();
    
    trackingRef.current.accumulatedTurn = 0;
    trackingRef.current.lastStableTurn = 0;
    trackingRef.current.lastLogTime = Date.now();
    
    setStatus('tracking');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const speed = (pos.coords.speed || 0) * 3.6;
          speedReadingsRef.current.push(speed);
          pathRef.current.push({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            timestamp: pos.timestamp,
            speed: speed
          });
        },
        null, { enableHighAccuracy: true }
      );
    }
  };

  const stopSession = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    window.removeEventListener('devicemotion', handleMotion, true);

    const speeds = speedReadingsRef.current;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

    onSessionComplete({
      id: `skate-${Date.now()}`,
      date: new Date().toISOString(),
      duration: elapsedTime,
      trickSummary: {},
      totalTricks: 0,
      maxSpeed: parseFloat(maxSpeed.toFixed(1)),
      avgSpeed: parseFloat(avgSpeed.toFixed(1)),
      timelineData: [...timelineRef.current],
      path: pathRef.current.length > 1 ? [...pathRef.current] : undefined
    });
    
    setStatusState('uninitialized');
  };

  // Calibration Timer
  useEffect(() => {
    if (status === 'calibrating' && calibrationLeft > 0) {
      const t = setTimeout(() => setCalibrationLeft(l => l - 1), 1000);
      return () => clearTimeout(t);
    } else if (status === 'calibrating' && calibrationLeft === 0) {
      setStatus('armed');
    }
  }, [status, calibrationLeft]);

  // Tracking Timer
  useEffect(() => {
    if (status === 'tracking') {
      const t = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      return () => clearInterval(t);
    }
  }, [status]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-2xl shadow-2xl min-h-[520px] border border-gray-700">
      <h2 className="text-2xl font-black mb-6 text-cyan-400 uppercase tracking-tighter italic">Motion Tracker</h2>
      
      {status === 'uninitialized' && (
        <div className="w-full text-center space-y-8">
            <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm leading-relaxed italic">Calibration required. Please place your phone on a flat surface or hold it horizontally in your hand.</p>
            </div>
            <button onClick={initSensors} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 text-xl rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-wider">Start Calibration</button>
        </div>
      )}

      {status === 'calibrating' && (
        <div className="text-center w-full">
            <div className="w-32 h-32 border-4 border-cyan-500 rounded-full mx-auto flex items-center justify-center mb-8 animate-pulse relative">
                <span className="text-5xl font-black text-white">{calibrationLeft}</span>
                <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full scale-125 animate-ping"></div>
            </div>
            <p className="text-cyan-400 font-black tracking-widest text-xl uppercase italic">Calibrating Down-Vector...</p>
            <p className="text-xs text-gray-500 mt-2">Hold phone still on flat surface or horizontally.</p>
        </div>
      )}

      {status === 'armed' && (
        <div className="text-center w-full">
            <div className={`w-32 h-32 border-4 rounded-full mx-auto flex items-center justify-center mb-10 transition-all duration-200 ${isDoubleSlapTriggered ? 'bg-yellow-500 border-yellow-200 scale-110 shadow-[0_0_40px_rgba(234,179,8,0.6)]' : 'bg-red-600/10 border-red-600 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.3)]'}`}>
                <div className={`w-16 h-16 rounded-full ${isDoubleSlapTriggered ? 'bg-white' : 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)]'}`}></div>
            </div>
            <h3 className="text-3xl font-black text-white mb-2 italic uppercase tracking-tight">System Armed</h3>
            <p className="text-gray-400 text-sm mb-10 px-6 leading-relaxed">Put phone in pocket. <span className={`font-black ${isDoubleSlapTriggered ? 'text-yellow-400' : 'text-red-500'}`}>Double-slap</span> your leg/phone to trigger recording start.</p>
            
            <div className="bg-black/40 p-4 rounded-xl border border-gray-700 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sensor Feed</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Status: Stable</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 transition-all duration-75" style={{ width: `${Math.min(100, (currentG / 3) * 100)}%` }}></div>
                </div>
            </div>
            
            <button onClick={startRecording} className="w-full bg-green-500 text-gray-900 font-black py-4 text-lg rounded-xl shadow-lg active:scale-95 transition-transform uppercase">Manual Start</button>
        </div>
      )}

      {status === 'tracking' && (
        <div className="text-center w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] text-white font-black mb-10 bg-red-600 animate-pulse uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                <span className="w-2 h-2 bg-white rounded-full"></span> Live Recording
            </div>
            
            <div className="text-8xl font-black text-white mb-10 tabular-nums tracking-tighter drop-shadow-lg">
                {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:{(elapsedTime % 60).toString().padStart(2, '0')}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-700 shadow-inner group">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1 group-hover:text-cyan-400 transition-colors">Angle Turn</p>
                    <p className="text-4xl font-black text-cyan-400 tabular-nums">{liveYaw}°</p>
                </div>
                <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-700 shadow-inner group">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1 group-hover:text-white transition-colors">G-Load</p>
                    <p className="text-4xl font-black text-white tabular-nums">{currentG.toFixed(1)}<span className="text-sm opacity-40">G</span></p>
                </div>
            </div>

            <div className="flex items-center justify-center gap-3 text-xs text-gray-500 font-mono mb-10 uppercase font-bold">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                {pointsRecorded} telemetry data points
            </div>

            <button onClick={stopSession} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 text-2xl rounded-2xl shadow-2xl transition-all active:scale-95 border-b-4 border-red-800">STOP & SAVE</button>
        </div>
      )}

      {status !== 'tracking' && (
        <div className="mt-auto w-full pt-4">
            <button onClick={onBack} className="w-full bg-transparent text-gray-600 font-bold py-2 rounded-lg hover:text-white transition-all text-[10px] uppercase tracking-[0.3em]">Cancel Session</button>
        </div>
      )}
    </div>
  );
};

export default SessionTracker;