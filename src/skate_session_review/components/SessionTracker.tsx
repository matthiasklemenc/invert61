import React, { useState, useEffect, useRef } from 'react';
import { Session, SessionDataPoint, Motion, GpsPoint } from '../types';

interface SessionTrackerProps {
  onSessionComplete: (session: Session) => void;
  previousSessions: Session[];
  onBack: () => void;
  motions: Motion[];
}

const CALIBRATION_DURATION_SEC = 3;
const SLAP_THRESHOLD = 2.0; 
const SLAP_WINDOW_MS = 1200; 
const ROTATION_NOISE_FLOOR = 1.0; 

// Axis indices for the locked gyro
type Axis = 'alpha' | 'beta' | 'gamma';

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
  
  const timelineRef = useRef<SessionDataPoint[]>([]);
  const speedReadingsRef = useRef<number[]>([]);
  const pathRef = useRef<GpsPoint[]>([]);
  
  // Mathematical State for high-fidelity tracking
  const trackingRef = useRef({
      // Which gyro axis maps to horizontal turn based on phone orientation
      lockedAxis: 'alpha' as Axis,
      axisSign: 1,
      accumulatedTurn: 0,
      lastStableTurn: 0,
      lastLogTime: 0,
      lastEventTime: 0,
      calibAcc: { x: 0, y: 0, z: 0, count: 0 },
      // Auto-scaling unit detection
      unitMultiplier: 1.0,
      isUnitVerified: false
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
    const totalG = Math.sqrt(ax * ax + ay * ay + az * az) / 9.81;

    // --- 1. CALIBRATION (Finding the World-Vertical Axis) ---
    if (statusRef.current === 'calibrating') {
        trackingRef.current.calibAcc.x += ax;
        trackingRef.current.calibAcc.y += ay;
        trackingRef.current.calibAcc.z += az;
        trackingRef.current.calibAcc.count++;
        return;
    }

    // --- 2. ARMING (Double Slap Trigger) ---
    if (statusRef.current === 'armed' && totalG > SLAP_THRESHOLD) {
        const now = Date.now();
        if (now - lastSlapTimeRef.current < SLAP_WINDOW_MS && lastSlapTimeRef.current > 0) {
            startRecording();
        } else {
            lastSlapTimeRef.current = now;
            setIsDoubleSlapTriggered(true);
            setTimeout(() => setIsDoubleSlapTriggered(false), SLAP_WINDOW_MS);
        }
    }

    // --- 3. HIGH-PRECISION INTEGRATION ---
    const now = performance.now();
    const track = trackingRef.current;
    
    // Calculate precise time delta
    let dt = (now - track.lastEventTime) / 1000;
    if (dt <= 0 || dt > 0.1) dt = 0.016; // Frequency cap for background/jitters
    track.lastEventTime = now;

    // Get rotation rate from the axis determined during calibration
    // alpha = around Z (screen), beta = around X (transverse), gamma = around Y (longitudinal)
    const rawRate = (rot[track.lockedAxis] || 0) * track.axisSign;

    // UNIT AUTO-CORRECTION (Fixes "Thousands of Degrees")
    // If we get a single-frame burst > 100 and haven't verified units, 
    // it's likely degrees/s. If it's small (e.g. 1.5), might be Radians.
    if (!track.isUnitVerified && Math.abs(rawRate) > 5) {
        if (Math.abs(rawRate) > 40) {
            // High value detected: Device is already in Degrees
            track.unitMultiplier = 1.0;
        } else {
            // Low value detected for high speed movement: Device is in Radians
            track.unitMultiplier = 57.2958; 
        }
        track.isUnitVerified = true;
    }

    const calibratedRate = rawRate * track.unitMultiplier;

    if (Math.abs(calibratedRate) > ROTATION_NOISE_FLOOR) {
        track.accumulatedTurn += calibratedRate * dt;
        
        // Prevent integration runaway
        if (Math.abs(track.accumulatedTurn) > 50000) track.accumulatedTurn = 0;

        // Throttled UI updates
        if (Math.floor(now / 80) !== Math.floor((now - dt*1000) / 80)) {
            setLiveYaw(Math.round(track.accumulatedTurn));
            setCurrentG(totalG);
        }
    }

    // --- 4. RECORDING / LOGGING ---
    if (statusRef.current === 'tracking') {
        const wallTime = Date.now();
        if (wallTime - track.lastLogTime > 150) {
            track.lastLogTime = wallTime;
            const timeSec = (wallTime - startTimeRef.current) / 1000;
            
            const currentTurn = Math.round(track.accumulatedTurn);
            const deltaTurn = currentTurn - track.lastStableTurn;
            
            let turnEvent: number | undefined = undefined;
            // Record a 'point' in the history if a significant turn happened
            if (Math.abs(deltaTurn) >= 20) {
                turnEvent = deltaTurn;
                track.lastStableTurn = currentTurn;
            }

            timelineRef.current.push({
                timestamp: parseFloat(timeSec.toFixed(2)),
                intensity: parseFloat(totalG.toFixed(2)),
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
        trackingRef.current.calibAcc = { x: 0, y: 0, z: 0, count: 0 };
        trackingRef.current.lastEventTime = performance.now();
        setStatus('calibrating');
        setCalibrationLeft(CALIBRATION_DURATION_SEC);
    };

    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const res = await (DeviceMotionEvent as any).requestPermission();
        if (res === 'granted') activate();
      } catch (e) { activate(); }
    } else { activate(); }
  };

  const finalizeCalibration = () => {
      const c = trackingRef.current.calibAcc;
      if (c.count > 0) {
          const ax = c.x / c.count;
          const ay = c.y / c.count;
          const az = c.z / c.count;
          
          // Determine which axis is vertical (pointing down)
          const absX = Math.abs(ax);
          const absY = Math.abs(ay);
          const absZ = Math.abs(az);

          // Map Gyro Axis to the gravity vector
          // Note: Gyro rotates AROUND the axis. Gravity points ALONG the axis.
          if (absZ > absX && absZ > absY) {
              trackingRef.current.lockedAxis = 'alpha'; // Around Z (Phone is flat)
              trackingRef.current.axisSign = az > 0 ? 1 : -1;
          } else if (absY > absX && absY > absZ) {
              trackingRef.current.lockedAxis = 'gamma'; // Around Y (Phone is vertical/portrait)
              trackingRef.current.axisSign = ay > 0 ? 1 : -1;
          } else {
              trackingRef.current.lockedAxis = 'beta'; // Around X (Phone is landscape upright)
              trackingRef.current.axisSign = ax > 0 ? 1 : -1;
          }
      }
      setStatus('armed');
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
          pathRef.current.push({ lat: pos.coords.latitude, lon: pos.coords.longitude, timestamp: pos.timestamp, speed });
        },
        null, { enableHighAccuracy: true }
      );
    }
  };

  const stopSession = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    window.removeEventListener('devicemotion', handleMotion, true);
    const s = speedReadingsRef.current;
    onSessionComplete({
      id: `skate-${Date.now()}`,
      date: new Date().toISOString(),
      duration: elapsedTime,
      trickSummary: {},
      totalTricks: 0,
      maxSpeed: s.length ? Math.max(...s) : 0,
      avgSpeed: s.length ? s.reduce((a,b)=>a+b,0)/s.length : 0,
      timelineData: [...timelineRef.current],
      path: pathRef.current.length > 1 ? [...pathRef.current] : undefined
    });
    setStatusState('uninitialized');
  };

  useEffect(() => {
    if (status === 'calibrating' && calibrationLeft > 0) {
      const t = setTimeout(() => setCalibrationLeft(l => l - 1), 1000);
      return () => clearTimeout(t);
    } else if (status === 'calibrating' && calibrationLeft === 0) {
      finalizeCalibration();
    }
  }, [status, calibrationLeft]);

  useEffect(() => {
    if (status === 'tracking') {
      const t = setInterval(() => setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
      return () => clearInterval(t);
    }
  }, [status]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-3xl shadow-2xl min-h-[520px] border border-gray-700">
      <h2 className="text-2xl font-black mb-6 text-cyan-400 uppercase tracking-tighter italic">Motion Tracker</h2>
      
      {status === 'uninitialized' && (
        <div className="w-full text-center space-y-8">
            <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-700">
                <p className="text-gray-400 text-sm leading-relaxed italic font-mono">Calibration required. Hold your phone in the position it will be in during skating.</p>
            </div>
            <button onClick={initSensors} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 text-xl rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest">Start Calibration</button>
        </div>
      )}

      {status === 'calibrating' && (
        <div className="text-center w-full">
            <div className="w-32 h-32 border-4 border-cyan-500 rounded-full mx-auto flex items-center justify-center mb-8 animate-pulse">
                <span className="text-5xl font-black text-white">{calibrationLeft}</span>
            </div>
            <p className="text-cyan-400 font-black tracking-widest text-xl uppercase italic">Locking Vertical Axis...</p>
            <p className="text-xs text-gray-500 mt-2">DO NOT MOVE THE PHONE</p>
        </div>
      )}

      {status === 'armed' && (
        <div className="text-center w-full">
            <div className={`w-32 h-32 border-4 rounded-full mx-auto flex items-center justify-center mb-10 transition-all duration-200 ${isDoubleSlapTriggered ? 'bg-yellow-500 border-yellow-200 scale-110' : 'bg-red-600/10 border-red-600 animate-pulse'}`}>
                <div className={`w-16 h-16 rounded-full ${isDoubleSlapTriggered ? 'bg-white' : 'bg-red-600'}`}></div>
            </div>
            <h3 className="text-3xl font-black text-white mb-2 italic uppercase tracking-tight">System Armed</h3>
            <p className="text-gray-400 text-sm mb-10 px-6 leading-relaxed">Place phone in pocket. <span className={`font-black ${isDoubleSlapTriggered ? 'text-yellow-400' : 'text-red-500'}`}>Double-slap</span> the phone or leg to start.</p>
            <button onClick={startRecording} className="w-full bg-green-500 text-gray-900 font-black py-4 text-lg rounded-2xl shadow-lg active:scale-95 transition-transform uppercase">Manual Start</button>
        </div>
      )}

      {status === 'tracking' && (
        <div className="text-center w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] text-white font-black mb-10 bg-red-600 animate-pulse uppercase tracking-widest">
                <span className="w-2 h-2 bg-white rounded-full"></span> Tracking Active
            </div>
            <div className="text-8xl font-black text-white mb-10 tabular-nums tracking-tighter drop-shadow-lg">{Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:{(elapsedTime % 60).toString().padStart(2, '0')}</div>
            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-700 shadow-inner">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Total Turn</p>
                    <p className="text-4xl font-black text-cyan-400 tabular-nums">{liveYaw}°</p>
                </div>
                <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-700 shadow-inner">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Max Force</p>
                    <p className="text-4xl font-black text-white tabular-nums">{currentG.toFixed(1)}<span className="text-sm opacity-30">G</span></p>
                </div>
            </div>
            <div className="flex items-center justify-center gap-3 text-[10px] text-gray-600 font-mono mb-8 uppercase font-bold">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> {pointsRecorded} Data Points Logged
            </div>
            <button onClick={stopSession} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 text-2xl rounded-2xl shadow-2xl transition-all active:scale-95 border-b-4 border-red-800">STOP SESSION</button>
        </div>
      )}

      {status !== 'tracking' && (
        <div className="mt-auto w-full pt-4">
            <button onClick={onBack} className="w-full bg-transparent text-gray-700 font-bold py-2 rounded-lg hover:text-white transition-all text-[10px] uppercase tracking-[0.4em]">Cancel</button>
        </div>
      )}
    </div>
  );
};

export default SessionTracker;