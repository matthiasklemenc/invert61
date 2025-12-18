
import React, { useState, useEffect, useRef } from 'react';
import { Session, SessionDataPoint, Motion, GpsPoint } from '../types';

interface SessionTrackerProps {
  onSessionComplete: (session: Session) => void;
  previousSessions: Session[];
  onBack: () => void;
  motions: Motion[];
}

const CALIBRATION_DURATION_SEC = 10;
const SLAP_THRESHOLD = 2.2; // Optimized for pocket-slaps
const SLAP_WINDOW_MS = 1000; // 1 second window between slaps

const SessionTracker: React.FC<SessionTrackerProps> = ({ onSessionComplete, previousSessions, onBack, motions }) => {
  const [status, setStatus] = useState<'uninitialized' | 'calibrating' | 'armed' | 'tracking'>('uninitialized');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [calibrationLeft, setCalibrationLeft] = useState(CALIBRATION_DURATION_SEC);
  
  const [currentG, setCurrentG] = useState(1.0);
  const [peakG, setPeakG] = useState(1.0);
  const [liveYaw, setLiveYaw] = useState(0); 
  const [pointsRecorded, setPointsRecorded] = useState(0);
  
  const [firstSlapDetected, setFirstSlapDetected] = useState(false);
  
  const timelineRef = useRef<SessionDataPoint[]>([]);
  const speedReadingsRef = useRef<number[]>([]);
  const pathRef = useRef<GpsPoint[]>([]);
  
  const startTimeRef = useRef(0);
  const lastSlapTimeRef = useRef<number>(0);
  const sampleIntervalRef = useRef<number | null>(null);
  const peakResetTimerRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const sensorDataRef = useRef({
      gForce: 1.0,
      rotRate: 0,
      alpha: 0, 
      hasOrientation: false,
      hasMotion: false
  });

  const trackingStateRef = useRef({
      lastAlpha: 0,
      accumulatedTurn: 0,
      lastRecordTime: 0,
      isFirstSample: true
  });

  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
    const rot = event.rotationRate || { alpha: 0, beta: 0, gamma: 0 };
    
    // Total G including gravity
    const gForce = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2) / 9.81;
    const rotMag = Math.sqrt((rot.alpha || 0) ** 2 + (rot.beta || 0) ** 2 + (rot.gamma || 0) ** 2); 

    sensorDataRef.current.gForce = gForce;
    sensorDataRef.current.rotRate = rotMag;
    sensorDataRef.current.hasMotion = true;
    
    setCurrentG(gForce);
    
    // Visual Peak Meter
    if (gForce > peakG) setPeakG(gForce);

    // SLAP DETECTION
    if (status === 'armed') {
        if (gForce > SLAP_THRESHOLD) {
            const now = Date.now();
            const diff = now - lastSlapTimeRef.current;
            
            if (diff < SLAP_WINDOW_MS && diff > 150) {
                // SUCCESS: Double slap!
                startRecording();
            } else {
                // Potential first slap
                setFirstSlapDetected(true);
                setTimeout(() => setFirstSlapDetected(false), SLAP_WINDOW_MS);
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
      const now = Date.now();
      const data = sensorDataRef.current;
      const track = trackingStateRef.current;

      // 1. Heading Updates
      if (data.hasOrientation) {
          let delta = track.lastAlpha - data.alpha;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;

          if (Math.abs(delta) > 0.4) {
              track.accumulatedTurn += delta;
          }
          track.lastAlpha = data.alpha;
          setLiveYaw(Math.round(track.accumulatedTurn));
      }

      // 2. Continuous Recording
      if (status === 'tracking' && startTimeRef.current > 0) {
          const timeSec = (now - startTimeRef.current) / 1000;
          
          const newPoint: SessionDataPoint = {
              timestamp: parseFloat(timeSec.toFixed(2)),
              intensity: parseFloat(data.gForce.toFixed(2)),
              rotation: parseFloat(data.rotRate.toFixed(2)),
              turnAngle: undefined 
          };

          timelineRef.current.push(newPoint);
          setPointsRecorded(timelineRef.current.length);
      }
  };

  // Peak Meter Reset
  useEffect(() => {
    const timer = setInterval(() => setPeakG(prev => Math.max(1, prev - 0.1)), 100);
    return () => clearInterval(timer);
  }, []);

  // Calibration Countdown
  useEffect(() => {
      if (status === 'calibrating' && calibrationLeft > 0) {
          const timer = setTimeout(() => setCalibrationLeft(l => l - 1), 1000);
          return () => clearTimeout(timer);
      } else if (status === 'calibrating' && calibrationLeft === 0) {
          setStatus('armed');
      }
  }, [status, calibrationLeft]);

  const startRecording = () => {
      if (status === 'tracking') return;
      
      // CRITICAL: Initialize buffers exactly when recording starts
      timelineRef.current = []; 
      speedReadingsRef.current = [];
      pathRef.current = [];
      startTimeRef.current = Date.now();
      
      setPointsRecorded(0);
      setElapsedTime(0);
      setStatus('tracking');

      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

      // Start GPS
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, speed } = position.coords;
            const speedKmh = (speed || 0) * 3.6;
            speedReadingsRef.current.push(speedKmh);
            pathRef.current.push({ lat: latitude, lon: longitude, timestamp: position.timestamp, speed: speedKmh });
          },
          undefined,
          { enableHighAccuracy: true }
        );
      }
  };

  // Tracking timer
  useEffect(() => {
    if (status === 'tracking') {
        const timer = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [status]);
  
  const initSensors = async () => {
    if ('wakeLock' in navigator) {
        try { (navigator as any).wakeLock.request('screen'); } catch(e){}
    }

    const activate = () => {
        window.removeEventListener('devicemotion', handleMotion, true);
        window.removeEventListener('deviceorientation', handleOrientation, true);
        window.addEventListener('devicemotion', handleMotion, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
        
        if (sampleIntervalRef.current) clearInterval(sampleIntervalRef.current);
        sampleIntervalRef.current = window.setInterval(sampleSensors, 100);
        
        setStatus('calibrating');
        setCalibrationLeft(CALIBRATION_DURATION_SEC);
    };

    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const motionRes = await (DeviceMotionEvent as any).requestPermission();
        if (motionRes === 'granted') {
           if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
               await (DeviceOrientationEvent as any).requestPermission();
           }
           activate();
        } else {
          alert("Sensor permission denied.");
        }
      } catch (e) {
        activate();
      }
    } else {
      activate();
    }
  };

  const stopSession = () => {
    if (sampleIntervalRef.current) clearInterval(sampleIntervalRef.current);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    window.removeEventListener('devicemotion', handleMotion, true);
    window.removeEventListener('deviceorientation', handleOrientation, true);

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
    setStatus('uninitialized');
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg shadow-lg min-h-[520px]">
      <h2 className="text-2xl font-bold mb-4 text-cyan-300">Session Tracker</h2>
      
      {status === 'uninitialized' && (
        <div className="w-full text-center">
            <div className="mb-10 p-6 bg-gray-900/50 rounded-xl border border-gray-700">
                <p className="text-gray-300 text-sm leading-relaxed">
                   Tracking uses Gyroscope & GPS.<br/>
                   Click below to authorize.
                </p>
            </div>
            <button
              onClick={initSensors}
              className="w-full bg-blue-600 text-white font-black py-5 text-xl rounded-2xl hover:bg-blue-500 transition-all shadow-[0_10px_20px_rgba(37,99,235,0.3)]"
            >
              INITIALIZE SENSORS
            </button>
        </div>
      )}

      {status === 'calibrating' && (
        <div className="text-center w-full">
            <div className="relative w-40 h-40 mx-auto mb-10">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-700" />
                    <circle
                        cx="80" cy="80" r="74"
                        stroke="currentColor" strokeWidth="12" fill="transparent"
                        strokeDasharray={465}
                        strokeDashoffset={465 - (465 * (CALIBRATION_DURATION_SEC - calibrationLeft)) / CALIBRATION_DURATION_SEC}
                        className="text-cyan-400 transition-all duration-1000 ease-linear"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-5xl font-black text-white tabular-nums">
                    {calibrationLeft}
                </div>
            </div>
            <p className="text-cyan-400 animate-pulse font-bold tracking-widest text-xl">STAY STILL</p>
        </div>
      )}

      {status === 'armed' && (
        <div className="text-center w-full">
            <div className={`w-32 h-32 border-4 rounded-full mx-auto flex items-center justify-center mb-8 transition-all duration-150 ${firstSlapDetected ? 'bg-yellow-500/20 border-yellow-500 scale-110 shadow-[0_0_30px_rgba(234,179,8,0.5)]' : 'bg-red-600/10 border-red-600 animate-pulse shadow-[0_0_40px_rgba(220,38,38,0.3)]'}`}>
                <div className={`w-16 h-16 rounded-full shadow-[0_0_20px_rgba(220,38,38,1)] transition-colors ${firstSlapDetected ? 'bg-yellow-500' : 'bg-red-600'}`}></div>
            </div>
            
            <h3 className="text-3xl font-black text-white mb-2 tracking-tighter italic uppercase">System Armed</h3>
            <p className="text-gray-400 text-sm mb-10 leading-relaxed">
                Put phone in pocket.<br/>
                <span className={`${firstSlapDetected ? 'text-yellow-400 scale-110' : 'text-red-500'} inline-block font-bold underline transition-all`}>Double-slap pocket</span> to start.
            </p>

            <div className="mb-8 px-4">
                <div className="h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative">
                    <div 
                        className={`h-full transition-all duration-75 ${currentG > SLAP_THRESHOLD ? 'bg-green-500' : 'bg-cyan-500'}`}
                        style={{ width: `${Math.min(100, (currentG / 5) * 100)}%` }}
                    ></div>
                    <div className="absolute top-0 right-0 h-full w-0.5 bg-red-500/50" style={{ left: `${(SLAP_THRESHOLD / 5) * 100}%` }}></div>
                </div>
                <div className="flex justify-between mt-1 px-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Angle: {liveYaw}°</span>
                    <span className="text-[10px] text-gray-500 font-mono">Input: {currentG.toFixed(1)}G</span>
                </div>
            </div>

            <button
              onClick={startRecording}
              className="w-full bg-green-500 text-gray-900 font-black py-5 text-2xl rounded-2xl hover:bg-green-400 transition-all shadow-xl active:scale-95 mb-4"
            >
              START MANUALLY
            </button>
        </div>
      )}

      {status === 'tracking' && (
        <div className="text-center w-full">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs text-white font-black mb-8 bg-red-900/80 border border-red-500 animate-pulse uppercase tracking-widest">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span> RECORDING
            </div>
            
            <div className="text-[100px] leading-none font-black text-white my-8 tabular-nums tracking-tighter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:{(elapsedTime % 60).toString().padStart(2, '0')}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-700">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Heading</p>
                    <p className="text-3xl font-black text-cyan-400 tabular-nums">{liveYaw}°</p>
                </div>
                <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-700">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Input</p>
                    <p className="text-3xl font-black text-white tabular-nums">{currentG.toFixed(1)} <span className="text-xs text-gray-500">G</span></p>
                </div>
            </div>
            
            <p className="text-xs text-gray-500 font-mono mb-8 uppercase tracking-widest">
                {pointsRecorded} data points captured
            </p>
            
            <button
              onClick={stopSession}
              className="w-full bg-red-600 text-white font-black py-5 text-2xl rounded-2xl hover:bg-red-500 transition-all shadow-2xl"
            >
              STOP & SAVE
            </button>
        </div>
      )}

      {(status === 'uninitialized' || status === 'calibrating' || status === 'armed') && (
        <div className="mt-auto w-full pt-6">
            <button onClick={onBack} className="w-full bg-gray-700/50 text-gray-400 font-bold py-3 rounded-xl hover:bg-gray-700 hover:text-white transition-all text-xs uppercase tracking-widest">
              Exit Tracker
            </button>
        </div>
      )}
    </div>
  );
};

export default SessionTracker;
