import React, { useState, useEffect, useRef } from 'react';
import { Session, SessionDataPoint, Motion, GpsPoint } from '../types';

interface SessionTrackerProps {
  onSessionComplete: (session: Session) => void;
  previousSessions: Session[];
  onBack: () => void;
  motions: Motion[];
}

const CALIBRATION_DURATION_SEC = 3; 
const SLAP_THRESHOLD = 1.8; 
const SLAP_WINDOW_MS = 1200; 

const SessionTracker: React.FC<SessionTrackerProps> = ({ onSessionComplete, previousSessions, onBack, motions }) => {
  const [status, setStatusState] = useState<'uninitialized' | 'calibrating' | 'armed' | 'tracking'>('uninitialized');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [calibrationLeft, setCalibrationLeft] = useState(CALIBRATION_DURATION_SEC);
  const [currentG, setCurrentG] = useState(1.0);
  const [liveYaw, setLiveYaw] = useState(0); 
  const [pointsRecorded, setPointsRecorded] = useState(0);
  const [firstSlapDetected, setFirstSlapDetected] = useState(false);
  
  const statusRef = useRef(status);
  const timelineRef = useRef<SessionDataPoint[]>([]);
  const speedReadingsRef = useRef<number[]>([]);
  const pathRef = useRef<GpsPoint[]>([]);
  const startTimeRef = useRef(0);
  const lastSlapTimeRef = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);

  const setStatus = (s: typeof status) => {
      statusRef.current = s;
      setStatusState(s);
  };

  const trackingStateRef = useRef({
      accumulatedTurn: 0,
      lastStableAngle: 0,
      lastLogTime: 0,
      pendingTurn: null as number | null
  });

  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity || { x: 0, y: 0, z: 9.81 };
    const rot = event.rotationRate || { alpha: 0, beta: 0, gamma: 0 };
    
    // 1. G-Force Calculation
    const ax = acc.x || 0;
    const ay = acc.y || 0;
    const az = acc.z || 9.81;
    const totalG_ms2 = Math.sqrt(ax**2 + ay**2 + az**2);
    const gForce = totalG_ms2 / 9.81;
    setCurrentG(gForce);

    // 2. Hardware Interval (Correction for 1000x bug)
    let dt = (event.interval || 16.66) / 1000;
    if (dt > 1) dt /= 1000; // Force seconds if interval is in ms

    const track = trackingStateRef.current;

    // 3. Rotation Integration (The "Simple Fix")
    // Use the dot product to find rotation around the Earth's gravity vector.
    // We multiply by 57.2958 (180/PI) because many mobile browsers return Radians instead of Degrees.
    if (totalG_ms2 > 0.5) {
        const radToDeg = 57.2957795;
        // Dot product of rotation vector and normalized gravity vector
        let turnRate = ((rot.beta || 0) * ax + (rot.gamma || 0) * ay + (rot.alpha || 0) * az) / totalG_ms2;
        
        // Multiplier Fix: If your phone shows 1.5 degrees for a 90 turn, this multiplier fixes it.
        // We apply a small threshold (0.1) to avoid drift when the phone is static.
        if (Math.abs(turnRate) > 0.1) {
            track.accumulatedTurn += (turnRate * radToDeg) * dt;
            
            // Throttled UI update
            if (Math.floor(performance.now() / 50) !== Math.floor((performance.now() - dt*1000) / 50)) {
                setLiveYaw(Math.round(track.accumulatedTurn));
            }
        }

        // 4. Turn Event Logic
        const delta = track.accumulatedTurn - track.lastStableAngle;
        if (Math.abs(delta) >= 15) {
            track.pendingTurn = Math.round(delta);
            track.lastStableAngle = track.accumulatedTurn;
        }
    }

    // --- State Logic ---
    if (statusRef.current === 'armed') {
        if (gForce > SLAP_THRESHOLD) {
            const nowTime = Date.now();
            if (nowTime - lastSlapTimeRef.current < SLAP_WINDOW_MS) {
                startRecording();
            } else {
                setFirstSlapDetected(true);
                setTimeout(() => setFirstSlapDetected(false), SLAP_WINDOW_MS);
            }
            lastSlapTimeRef.current = nowTime;
        }
    }

    if (statusRef.current === 'tracking') {
        const now = Date.now();
        if (now - track.lastLogTime > 100) {
            track.lastLogTime = now;
            const timeSec = (now - startTimeRef.current) / 1000;
            const newPoint: SessionDataPoint = {
                timestamp: parseFloat(timeSec.toFixed(2)),
                intensity: parseFloat(gForce.toFixed(2)),
                turnAngle: track.pendingTurn || undefined
            };
            track.pendingTurn = null; 
            timelineRef.current.push(newPoint);
            setPointsRecorded(timelineRef.current.length);
        }
    }
  };

  useEffect(() => {
      if (status === 'calibrating' && calibrationLeft > 0) {
          const timer = setTimeout(() => setCalibrationLeft(l => l - 1), 1000);
          return () => clearTimeout(timer);
      } else if (status === 'calibrating' && calibrationLeft === 0) {
          setStatus('armed');
      }
  }, [status, calibrationLeft]);

  const startRecording = () => {
      if (statusRef.current === 'tracking') return;
      timelineRef.current = []; 
      speedReadingsRef.current = [];
      pathRef.current = [];
      startTimeRef.current = Date.now();
      
      const track = trackingStateRef.current;
      track.accumulatedTurn = 0;
      track.lastStableAngle = 0;
      track.lastLogTime = Date.now();
      track.pendingTurn = null;
      
      setPointsRecorded(0);
      setElapsedTime(0);
      setStatus('tracking');
      
      if (navigator.vibrate) navigator.vibrate([150, 100, 150]);

      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const speedKmh = (pos.coords.speed || 0) * 3.6;
            speedReadingsRef.current.push(speedKmh);
            pathRef.current.push({ lat: pos.coords.latitude, lon: pos.coords.longitude, timestamp: pos.timestamp, speed: speedKmh });
          },
          null, { enableHighAccuracy: true }
        );
      }
  };

  useEffect(() => {
    if (status === 'tracking') {
        const timer = setInterval(() => setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
        return () => clearInterval(timer);
    }
  }, [status]);
  
  const initSensors = async () => {
    const activate = () => {
        window.removeEventListener('devicemotion', handleMotion, true);
        window.addEventListener('devicemotion', handleMotion, true);
        setStatus('calibrating');
        setCalibrationLeft(CALIBRATION_DURATION_SEC);
    };

    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const motionRes = await (DeviceMotionEvent as any).requestPermission();
        if (motionRes === 'granted') activate();
      } catch (e) { activate(); }
    } else { activate(); }
  };

  const stopSession = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    window.removeEventListener('devicemotion', handleMotion, true);

    const speeds = speedReadingsRef.current;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

    const newSession: Session = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString(),
      duration: elapsedTime,
      trickSummary: {},
      totalTricks: 0,
      maxSpeed: parseFloat(maxSpeed.toFixed(1)), 
      avgSpeed: parseFloat(avgSpeed.toFixed(1)),
      timelineData: [...timelineRef.current],
      path: pathRef.current.length > 1 ? [...pathRef.current] : undefined
    };
    onSessionComplete(newSession);
    setStatusState('uninitialized');
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg shadow-lg min-h-[520px]">
      <h2 className="text-2xl font-bold mb-4 text-cyan-300 uppercase tracking-tighter text-center">Skate Sense Tracker</h2>
      {status === 'uninitialized' && (
        <div className="w-full text-center">
            <div className="mb-10 p-6 bg-gray-900 rounded-xl border border-gray-700">
                <p className="text-gray-300 text-sm leading-relaxed">Sensors must be initialized.<br/>Tap the button to authorize.</p>
            </div>
            <button onClick={initSensors} className="w-full bg-blue-600 text-white font-black py-5 text-xl rounded-2xl shadow-xl active:scale-95 transition-transform">INITIALIZE SENSORS</button>
        </div>
      )}
      {status === 'calibrating' && (
        <div className="text-center w-full">
            <div className="w-32 h-32 border-4 border-cyan-500 rounded-full mx-auto flex items-center justify-center mb-8 animate-pulse">
                <span className="text-4xl font-black text-white">{calibrationLeft}</span>
            </div>
            <p className="text-cyan-400 font-bold tracking-widest text-xl uppercase">Syncing Gyro...</p>
            <p className="text-xs text-gray-500 mt-2">Hold phone still.</p>
        </div>
      )}
      {status === 'armed' && (
        <div className="text-center w-full">
            <div className={`w-32 h-32 border-4 rounded-full mx-auto flex items-center justify-center mb-8 transition-all duration-75 ${firstSlapDetected ? 'bg-yellow-500 border-yellow-300 scale-110' : 'bg-red-600/10 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.4)] animate-pulse'}`}>
                <div className={`w-16 h-16 rounded-full ${firstSlapDetected ? 'bg-white' : 'bg-red-600'}`}></div>
            </div>
            <h3 className="text-3xl font-black text-white mb-2 italic uppercase">System Armed</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed text-center px-4">Place phone in pocket or board.<br/><span className={`${firstSlapDetected ? 'text-yellow-400 scale-110 font-black' : 'text-red-500 font-bold'} inline-block transition-all underline decoration-2`}>Double-tap phone</span> to start.</p>
            <div className="bg-black/40 p-4 rounded-xl border border-gray-700 mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sensor Activity</span>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold">Yaw: {liveYaw}°</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 transition-all duration-75" style={{ width: `${Math.min(100, (currentG / 3) * 100)}%` }}></div></div>
            </div>
            <button onClick={startRecording} className="w-full bg-green-500 text-gray-900 font-black py-4 text-xl rounded-xl shadow-lg active:scale-95 mb-4 uppercase">Manual Start</button>
        </div>
      )}
      {status === 'tracking' && (
        <div className="text-center w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] text-white font-black mb-8 bg-red-600 animate-pulse uppercase tracking-widest">
                <span className="w-2 h-2 bg-white rounded-full"></span> Live Tracking
            </div>
            <div className="text-8xl font-black text-white mb-10 tabular-nums tracking-tighter">{Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:{(elapsedTime % 60).toString().padStart(2, '0')}</div>
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-700"><p className="text-[10px] text-gray-500 uppercase font-black mb-1">Total Turn</p><p className="text-3xl font-black text-cyan-400 tabular-nums">{liveYaw}°</p></div>
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-700"><p className="text-[10px] text-gray-500 uppercase font-black mb-1">Impact G</p><p className="text-3xl font-black text-white tabular-nums">{currentG.toFixed(1)}G</p></div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-mono mb-8 uppercase"><span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>{pointsRecorded} events captured</div>
            <button onClick={stopSession} className="w-full bg-red-600 text-white font-black py-5 text-2xl rounded-2xl shadow-2xl active:scale-95 transition-all">STOP & SAVE</button>
        </div>
      )}
      {status !== 'tracking' && (
        <div className="mt-auto w-full pt-4">
            <button onClick={onBack} className="w-full bg-transparent text-gray-500 font-bold py-2 rounded-lg hover:text-white transition-all text-[10px] uppercase tracking-[0.3em]">Cancel</button>
        </div>
      )}
    </div>
  );
};

export default SessionTracker;