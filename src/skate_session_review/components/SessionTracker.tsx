import React, { useState, useEffect, useRef } from 'react';
import { Session, SessionDataPoint, Motion, GpsPoint } from '../types';

interface SessionTrackerProps {
  onSessionComplete: (session: Session) => void;
  previousSessions: Session[];
  onBack: () => void;
  motions: Motion[];
}

const CALIBRATION_DURATION_SEC = 5; 
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
  const sampleIntervalRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const setStatus = (s: typeof status) => {
      statusRef.current = s;
      setStatusState(s);
  };

  const sensorDataRef = useRef({
      accRaw: { x: 0, y: 0, z: 9.81 }, 
      rotRaw: { alpha: 0, beta: 0, gamma: 0 }, 
      gForce: 1.0,
      rotRate: 0,
      hasMotion: false
  });

  const trackingStateRef = useRef({
      accumulatedTurn: 0,
      lastStableAngle: 0,
      sampleCount: 0
  });

  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity || { x: 0, y: 0, z: 9.81 };
    const rot = event.rotationRate || { alpha: 0, beta: 0, gamma: 0 };
    
    const gForce = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2) / 9.81;
    const rotMag = Math.sqrt((rot.alpha || 0) ** 2 + (rot.beta || 0) ** 2 + (rot.gamma || 0) ** 2); 

    sensorDataRef.current.accRaw = { x: acc.x || 0, y: acc.y || 0, z: acc.z || 9.81 };
    sensorDataRef.current.rotRaw = { alpha: rot.alpha || 0, beta: rot.beta || 0, gamma: rot.gamma || 0 };
    sensorDataRef.current.gForce = gForce;
    sensorDataRef.current.rotRate = rotMag;
    sensorDataRef.current.hasMotion = true;
    
    setCurrentG(gForce);

    if (statusRef.current === 'armed') {
        if (gForce > SLAP_THRESHOLD) {
            const now = Date.now();
            const diff = now - lastSlapTimeRef.current;
            if (diff < SLAP_WINDOW_MS && diff > 100) {
                startRecording();
            } else {
                setFirstSlapDetected(true);
                setTimeout(() => setFirstSlapDetected(false), SLAP_WINDOW_MS);
            }
            lastSlapTimeRef.current = now;
        }
    }
  };

  const sampleSensors = () => {
      const now = Date.now();
      const data = sensorDataRef.current;
      const track = trackingStateRef.current;
      let turnToRecord: number | undefined = undefined;

      track.sampleCount++;

      if (data.hasMotion) {
          const acc = data.accRaw;
          const rot = data.rotRaw;
          const gTotal = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
          
          if (gTotal > 0.5) {
              // Thinner dt for 100Hz frequency
              const projectedRate = (rot.beta * acc.x + rot.gamma * acc.y + rot.alpha * acc.z) / gTotal;
              const dt = 0.01; 
              
              if (Math.abs(projectedRate) > 3) {
                  track.accumulatedTurn += projectedRate * dt;
              }
              
              // Throttled UI update (20Hz) to keep preview snappy without burning CPU
              if (track.sampleCount % 5 === 0) {
                setLiveYaw(Math.round(track.accumulatedTurn));
              }

              // Snappy detection: trigger if moved 20+ degrees and speed drops below 60 deg/s
              const delta = track.accumulatedTurn - track.lastStableAngle;
              if (Math.abs(delta) > 20 && Math.abs(projectedRate) < 60) {
                  turnToRecord = Math.round(delta);
                  track.lastStableAngle = track.accumulatedTurn;
              }
          }
      }

      if (statusRef.current === 'tracking') {
          // Log at 10Hz to save memory, while math runs at 100Hz
          if (track.sampleCount % 10 === 0) {
              const timeSec = (now - startTimeRef.current) / 1000;
              const newPoint: SessionDataPoint = {
                  timestamp: parseFloat(timeSec.toFixed(2)),
                  intensity: parseFloat(data.gForce.toFixed(2)),
                  rotation: parseFloat(data.rotRate.toFixed(2)),
                  turnAngle: turnToRecord
              };
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
      trackingStateRef.current.accumulatedTurn = 0;
      trackingStateRef.current.lastStableAngle = 0;
      trackingStateRef.current.sampleCount = 0;
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
        if (sampleIntervalRef.current) clearInterval(sampleIntervalRef.current);
        // INCREASED SAMPLING RATE TO 100HZ (10ms)
        sampleIntervalRef.current = window.setInterval(sampleSensors, 10);
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
    if (sampleIntervalRef.current) clearInterval(sampleIntervalRef.current);
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
      <h2 className="text-2xl font-bold mb-4 text-cyan-300 uppercase tracking-tighter">Skate Sense Tracker</h2>
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
            <p className="text-cyan-400 font-bold tracking-widest text-xl uppercase">Calibrating...</p>
            <p className="text-xs text-gray-500 mt-2">Hold phone completely still.</p>
        </div>
      )}
      {status === 'armed' && (
        <div className="text-center w-full">
            <div className={`w-32 h-32 border-4 rounded-full mx-auto flex items-center justify-center mb-8 transition-all duration-75 ${firstSlapDetected ? 'bg-yellow-500 border-yellow-300 scale-110' : 'bg-red-600/10 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.4)] animate-pulse'}`}>
                <div className={`w-16 h-16 rounded-full ${firstSlapDetected ? 'bg-white' : 'bg-red-600'}`}></div>
            </div>
            <h3 className="text-3xl font-black text-white mb-2 italic uppercase">System Armed</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">Put phone in pocket.<br/><span className={`${firstSlapDetected ? 'text-yellow-400 scale-110 font-black' : 'text-red-500 font-bold'} inline-block transition-all underline decoration-2`}>Double-tap phone</span> to start.</p>
            <div className="bg-black/40 p-4 rounded-xl border border-gray-700 mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sensor Activity</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Angle: {liveYaw}°</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 transition-all duration-75" style={{ width: `${Math.min(100, (currentG / 3) * 100)}%` }}></div></div>
                <div className="mt-2 text-left text-[9px] text-gray-600 font-mono">Input: {currentG.toFixed(3)} G</div>
            </div>
            <button onClick={startRecording} className="w-full bg-green-500 text-gray-900 font-black py-4 text-xl rounded-xl shadow-lg active:scale-95 mb-4">START MANUALLY</button>
        </div>
      )}
      {status === 'tracking' && (
        <div className="text-center w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] text-white font-black mb-8 bg-red-600 animate-pulse uppercase tracking-widest">
                <span className="w-2 h-2 bg-white rounded-full"></span> Tracking Active
            </div>
            <div className="text-8xl font-black text-white mb-10 tabular-nums tracking-tighter">{Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:{(elapsedTime % 60).toString().padStart(2, '0')}</div>
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-700"><p className="text-[10px] text-gray-500 uppercase font-black mb-1">Rotation</p><p className="text-3xl font-black text-cyan-400 tabular-nums">{liveYaw}°</p></div>
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-700"><p className="text-[10px] text-gray-500 uppercase font-black mb-1">Last Force</p><p className="text-3xl font-black text-white tabular-nums">{currentG.toFixed(1)}G</p></div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-mono mb-8 uppercase"><span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>{pointsRecorded} data points captured</div>
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