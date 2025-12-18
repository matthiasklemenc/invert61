import React, { useState, useEffect, useRef } from 'react';
import { Session, SessionDataPoint, Motion, GpsPoint } from '../types';

interface SessionTrackerProps {
  onSessionComplete: (session: Session) => void;
  previousSessions: Session[];
  onBack: () => void;
  motions: Motion[];
}

const CALIBRATION_DURATION_SEC = 10;
const SLAP_THRESHOLD = 4.5; // G-Force magnitude spike
const SLAP_WINDOW_MS = 800; // Time allowed between two slaps

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
    
    const gForce = Math.sqrt((x||0)**2 + (y||0)**2 + (z||0)**2) / 9.8;
    const rotMag = Math.sqrt((alpha||0)**2 + (beta||0)**2 + (gamma||0)**2); 

    sensorDataRef.current.gForce = gForce;
    sensorDataRef.current.rotRate = rotMag;
    setCurrentG(gForce);

    // SLAP DETECTION (Listen while Armed)
    if (status === 'armed') {
        if (gForce > SLAP_THRESHOLD) {
            const now = Date.now();
            const diff = now - lastSlapTimeRef.current;
            if (diff < SLAP_WINDOW_MS && diff > 150) {
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
      // Run sampling regardless of tracking status to update Live UI
      if (status === 'uninitialized' || trackingStateRef.current.isFirstSample) return;

      const now = Date.now();
      const data = sensorDataRef.current;
      const track = trackingStateRef.current;

      // 1. Calculate Rotation Delta
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

      // 2. Only record to timeline if status is 'tracking'
      if (status !== 'tracking') return;

      const timeSec = (now - startTimeRef.current) / 1000;
      let shouldRecord = false;
      let turnAngle: number | undefined = undefined;
      let isGroupStart = false;

      // ROTATION DETECTION
      if (!track.isRotating) {
          const diffFromStable = Math.abs(track.accumulatedTurn - track.lastStableAngle);
          if (diffFromStable > 12) { 
              track.isRotating = true;
              track.rotationStartValue = track.lastStableAngle;
              track.lastDeltaSign = currentDeltaSign;
              shouldRecord = true;
              isGroupStart = true;
          }
      } else {
          if (now - track.lastRecordTime > 200) shouldRecord = true;

          const directionChanged = currentDeltaSign !== 0 && track.lastDeltaSign !== 0 && currentDeltaSign !== track.lastDeltaSign;
          const hasSlowedDown = absDelta < 3.0;

          if (hasSlowedDown || directionChanged) { 
              track.isRotating = false;
              shouldRecord = true;
              turnAngle = Math.round(track.accumulatedTurn - track.rotationStartValue);
              track.lastStableAngle = track.accumulatedTurn;
          }
          
          if (currentDeltaSign !== 0) track.lastDeltaSign = currentDeltaSign;
      }

      // IMPACT DETECTION
      const gDiff = Math.abs(data.gForce - track.lastG);
      if (gDiff > 0.2 || data.gForce > 1.8) {
          shouldRecord = true;
      }
      track.lastG = data.gForce;

      // Heartbeat
      if (now - track.lastRecordTime > 1500) {
          shouldRecord = true;
      }

      if (shouldRecord) {
          const newPoint: SessionDataPoint = {
              timestamp: parseFloat(timeSec.toFixed(2)),
              intensity: parseFloat(data.gForce.toFixed(2)),
              rotation: parseFloat(data.rotRate.toFixed(2)),
              turnAngle,
              isGroupStart: isGroupStart,
              groupId: track.isRotating ? `rot-${track.rotationStartValue}` : undefined
          };

          timelineRef.current.push(newPoint);
          setPointsRecorded(timelineRef.current.length);
          track.lastRecordTime = now;
      }
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3;
      const phi1 = lat1 * Math.PI/180;
      const phi2 = lat2 * Math.PI/180;
      const dPhi = (lat2-lat1) * Math.PI/180;
      const dLambda = (lon2-lon1) * Math.PI/180;
      const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda/2) * Math.sin(dLambda/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
  }

  // Calibration Countdown
  useEffect(() => {
      if (status === 'calibrating' && calibrationLeft > 0) {
          const timer = setTimeout(() => setCalibrationLeft(l => l - 1), 1000);
          return () => clearTimeout(timer);
      } else if (status === 'calibrating' && calibrationLeft === 0) {
          setStatus('armed');
      }
  }, [status, calibrationLeft]);

  // Session Timers and GPS
  useEffect(() => {
    let watchId: number;

    if (status === 'tracking') {
      startTimeRef.current = Date.now();
      timelineRef.current = []; 
      speedReadingsRef.current = [];
      pathRef.current = [];
      lastPositionRef.current = null;
      
      setPointsRecorded(0);
      setElapsedTime(0);
      
      const timerInterval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, speed } = position.coords;
            const timestamp = position.timestamp;
            let calculatedSpeed = speed || 0;
            if (lastPositionRef.current) {
                const dist = getDistance(lastPositionRef.current.lat, lastPositionRef.current.lon, latitude, longitude);
                const timeDiff = (timestamp - lastPositionRef.current.timestamp) / 1000;
                if (timeDiff > 0) {
                    const derivedSpeed = dist / timeDiff; 
                    if ((calculatedSpeed === 0 || calculatedSpeed === null) && derivedSpeed < 30) calculatedSpeed = derivedSpeed;
                }
            }
            const speedKmh = calculatedSpeed * 3.6;
            if (speedKmh > 0.5) {
                setCurrentSpeed(speedKmh);
                speedReadingsRef.current.push(speedKmh);
            }
            const newPoint = { lat: latitude, lon: longitude, timestamp, speed: speedKmh };
            pathRef.current.push(newPoint);
            lastPositionRef.current = newPoint;
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
    // Attempt WakeLock
    if ('wakeLock' in navigator) {
        try { (navigator as any).wakeLock.request('screen'); } catch(e){}
    }

    const start = () => {
        window.addEventListener('devicemotion', handleMotion);
        window.addEventListener('deviceorientation', handleOrientation);
        if (!sampleIntervalRef.current) {
            sampleIntervalRef.current = window.setInterval(sampleSensors, 100);
        }
        setStatus('calibrating');
        setCalibrationLeft(CALIBRATION_DURATION_SEC);
    };

    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        if (response === 'granted') {
           if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
               await (DeviceOrientationEvent as any).requestPermission();
           }
           start();
        } else {
          alert("Motion sensor permission is required.");
        }
      } catch (e) {
        start();
      }
    } else {
      start();
    }
  };

  const startRecording = () => {
      setStatus('tracking');
      trackingStateRef.current.lastRecordTime = Date.now();
  };

  const stopSession = () => {
    if (sampleIntervalRef.current) {
        clearInterval(sampleIntervalRef.current);
        sampleIntervalRef.current = null;
    }
    window.removeEventListener('devicemotion', handleMotion);
    window.removeEventListener('deviceorientation', handleOrientation);

    const processedTimeline = timelineRef.current;
    const summary: Record<string, number> = {};
    motions.forEach(m => summary[m.name] = 0);
    
    let totalTricks = 0;
    processedTimeline.forEach(p => {
        if (p.label && p.isGroupStart) {
            if (!summary[p.label]) summary[p.label] = 0;
            summary[p.label]++;
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
    <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg shadow-lg min-h-[460px]">
      <h2 className="text-2xl font-bold mb-4 text-cyan-300">Track a Session</h2>
      
      {status === 'uninitialized' && (
        <div className="w-full mb-6 text-center">
            <p className="text-gray-400 text-sm mb-6">
               Place phone on a flat surface or in pocket.<br/>
               Calibration takes 10 seconds.
            </p>
            <button
              onClick={initSensors}
              className="w-full bg-blue-600 text-white font-bold py-4 text-xl rounded-lg hover:bg-blue-500 transition-colors shadow-lg"
            >
              INITIALIZE SENSORS
            </button>
        </div>
      )}

      {status === 'calibrating' && (
        <div className="text-center w-full">
            <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="64" cy="64" r="60"
                        stroke="currentColor" strokeWidth="8" fill="transparent"
                        className="text-gray-700"
                    />
                    <circle
                        cx="64" cy="64" r="60"
                        stroke="currentColor" strokeWidth="8" fill="transparent"
                        strokeDasharray={377}
                        strokeDashoffset={377 - (377 * (CALIBRATION_DURATION_SEC - calibrationLeft)) / CALIBRATION_DURATION_SEC}
                        className="text-cyan-400 transition-all duration-1000 ease-linear"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">
                    {calibrationLeft}
                </div>
            </div>
            <p className="text-cyan-400 animate-pulse font-bold">STAY STILL...</p>
            
            <div className="mt-8 space-y-3">
                <button disabled className="w-full bg-gray-700 text-gray-500 font-bold py-4 text-xl rounded-lg cursor-not-allowed">
                    RECORD SESSION
                </button>
                <button onClick={onBack} className="w-full bg-gray-700 text-gray-300 font-bold py-2 rounded-lg">
                    CANCEL
                </button>
            </div>
        </div>
      )}

      {status === 'armed' && (
        <div className="text-center w-full">
            <div className="w-24 h-24 bg-red-600/20 border-4 border-red-600 rounded-full mx-auto flex items-center justify-center mb-6 animate-pulse">
                <div className="w-12 h-12 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.8)]"></div>
            </div>
            <h3 className="text-2xl font-black text-red-500 mb-2 tracking-tighter">SYSTEM ARMED</h3>
            <p className="text-gray-300 text-sm mb-6 px-4">
                Put phone in pocket now.<br/>
                <span className="text-white font-bold underline decoration-red-500">Double-slap your pocket</span> to start recording hands-free.
            </p>

            <div className="grid grid-cols-2 gap-4 text-center mb-6">
                <div className="bg-gray-900 p-2 rounded border border-gray-700">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Live Angle</p>
                    <p className="text-xl font-bold text-white">{liveYaw}°</p>
                </div>
                <div className="bg-gray-900 p-2 rounded border border-gray-700">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Ambient G</p>
                    <p className="text-xl font-bold text-white">{currentG.toFixed(1)}</p>
                </div>
            </div>

            <button
              onClick={startRecording}
              className="w-full bg-green-500 text-gray-900 font-bold py-4 text-xl rounded-lg hover:bg-green-400 transition-colors shadow-lg mb-3"
            >
              START NOW
            </button>
        </div>
      )}

      {status === 'tracking' && (
        <div className="text-center w-full">
            <div className="inline-block px-3 py-1 rounded-full text-xs text-white font-bold mb-4 bg-red-900 animate-pulse border border-red-500">
                ● RECORDING LIVE
            </div>
            <div className="text-6xl font-bold text-cyan-400 my-4 tabular-nums">{formatTime(elapsedTime)}</div>
            
            <div className="grid grid-cols-2 gap-4 text-center mb-6">
                <div className="bg-gray-900 p-2 rounded border border-gray-700">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Heading</p>
                    <p className="text-xl font-bold text-white">{liveYaw}°</p>
                </div>
                <div className="bg-gray-900 p-2 rounded border border-gray-700">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Current G</p>
                    <p className="text-xl font-bold text-white">{currentG.toFixed(1)}</p>
                </div>
            </div>
            
            <p className="text-xs text-gray-600 font-mono mb-6">{pointsRecorded} motion data points recorded</p>
            
            <button
              onClick={stopSession}
              className="w-full bg-red-500 text-white font-bold py-4 text-xl rounded-lg hover:bg-red-400 transition-colors shadow-lg"
            >
              STOP & SAVE
            </button>
        </div>
      )}

      {status === 'uninitialized' && (
        <div className="mt-auto w-full">
            <button
              onClick={onBack}
              className="w-full bg-gray-700 text-gray-300 font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              BACK
            </button>
        </div>
      )}
    </div>
  );
};

export default SessionTracker;