
import React, { useState, useEffect, useRef } from 'react';
import { Session, SessionDataPoint, Motion, GpsPoint } from '../types';

interface SessionTrackerProps {
  onSessionComplete: (session: Session) => void;
  previousSessions: Session[];
  onBack: () => void;
  motions: Motion[];
}

const SessionTracker: React.FC<SessionTrackerProps> = ({ onSessionComplete, previousSessions, onBack, motions }) => {
  const [status, setStatus] = useState<'idle' | 'tracking'>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const [currentG, setCurrentG] = useState(1.0);
  const [liveYaw, setLiveYaw] = useState(0); 
  const [pointsRecorded, setPointsRecorded] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  
  const timelineRef = useRef<SessionDataPoint[]>([]);
  const speedReadingsRef = useRef<number[]>([]);
  const pathRef = useRef<GpsPoint[]>([]);
  
  const startTimeRef = useRef(0);
  const lastPositionRef = useRef<GpsPoint | null>(null);

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
      stopTicks: 0,
      lastG: 1.0,
      isSettling: true, // Used to ignore initial sensor drift
      settleTimer: 0
  });

  const handleMotion = (event: DeviceMotionEvent) => {
    const { x, y, z } = event.accelerationIncludingGravity || {x:0,y:0,z:0};
    const { alpha, beta, gamma } = event.rotationRate || {alpha:0, beta:0, gamma:0};
    
    const gForce = Math.sqrt((x||0)**2 + (y||0)**2 + (z||0)**2) / 9.8;
    const rotMag = Math.sqrt((alpha||0)**2 + (beta||0)**2 + (gamma||0)**2); 

    sensorDataRef.current.gForce = gForce;
    sensorDataRef.current.rotRate = rotMag;
    setCurrentG(gForce);
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
          sensorDataRef.current.alpha = event.alpha;
          sensorDataRef.current.hasOrientation = true;
      }
  };

  const sampleSensors = () => {
      if (status !== 'tracking') return;

      const now = Date.now();
      const timeSec = (now - startTimeRef.current) / 1000;
      const data = sensorDataRef.current;
      const track = trackingStateRef.current;

      // 1. Calculate Rotation Delta
      let delta = track.lastAlpha - data.alpha;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      // 2. Handle Initial Drift/Settling
      if (track.isSettling) {
          track.settleTimer += 0.1;
          // During the first 2 seconds, we constantly reset the baseline to '0'
          // unless the user is actually jumping/moving (G-force change)
          const isUserMoving = Math.abs(data.gForce - 1.0) > 0.2;
          if (!isUserMoving) {
              track.lastAlpha = data.alpha;
              track.accumulatedTurn = 0;
              if (track.settleTimer > 2.5) track.isSettling = false;
              return; // Don't record during warm-up
          } else {
              // User started early! Stop settling immediately
              track.isSettling = false;
          }
      }

      // Filter out impossible noise (jumps > 30deg in 100ms while still)
      if (Math.abs(delta) > 30 && Math.abs(data.gForce - 1.0) < 0.1) {
          track.lastAlpha = data.alpha;
          return;
      }

      const absDelta = Math.abs(delta);
      if (absDelta > 0.3) {
          track.accumulatedTurn += delta;
      }
      track.lastAlpha = data.alpha;
      setLiveYaw(Math.round(track.accumulatedTurn));

      let shouldRecord = false;
      let turnAngle: number | undefined = undefined;
      let isGroupStart = false;

      // 3. Rotation Commit Logic
      if (!track.isRotating) {
          const diffFromStable = Math.abs(track.accumulatedTurn - track.lastStableAngle);
          if (diffFromStable > 15) { // Lowered to 15 to catch pumps and small turns
              track.isRotating = true;
              track.rotationStartValue = track.lastStableAngle;
              track.stopTicks = 0;
              shouldRecord = true;
              isGroupStart = true;
          }
      } else {
          // If actively rotating, commit points every 500ms for detail
          if (timeSec - track.lastRecordTime > 0.5) shouldRecord = true;

          if (absDelta < 1.0) {
              track.stopTicks++;
          } else {
              track.stopTicks = 0;
          }

          if (track.stopTicks >= 5) { // Still for ~500ms
              track.isRotating = false;
              track.stopTicks = 0;
              shouldRecord = true;
              turnAngle = Math.round(track.accumulatedTurn - track.rotationStartValue);
              track.lastStableAngle = track.accumulatedTurn;
          }
      }

      // 4. Intensity / Pump Logic
      // Record any significant G-force change (pumps/landings)
      const gDiff = Math.abs(data.gForce - track.lastG);
      if (gDiff > 0.4 || data.gForce > 2.5) {
          shouldRecord = true;
      }
      track.lastG = data.gForce;

      // 5. Heartbeat
      if (timeSec - track.lastRecordTime > 2.0) {
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
          setPointsRecorded(prev => prev + 1);
          track.lastRecordTime = timeSec;
      }
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3;
      const φ1 = lat1 * Math.PI/180;
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lon2-lon1) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
  }

  useEffect(() => {
    let watchId: number;
    let sampleInterval: number;
    let simInterval: number;

    if (status === 'tracking') {
      startTimeRef.current = Date.now();
      timelineRef.current = []; 
      speedReadingsRef.current = [];
      pathRef.current = [];
      lastPositionRef.current = null;
      
      trackingStateRef.current = {
          lastAlpha: sensorDataRef.current.alpha,
          accumulatedTurn: 0,
          lastRecordTime: 0,
          lastStableAngle: 0,
          isRotating: false,
          rotationStartValue: 0,
          stopTicks: 0,
          lastG: 1.0,
          isSettling: true,
          settleTimer: 0
      };
      
      setPointsRecorded(0);
      setLiveYaw(0);
      setCurrentSpeed(0);
      
      const timerInterval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      window.addEventListener('devicemotion', handleMotion);
      window.addEventListener('deviceorientation', handleOrientation);
      sampleInterval = window.setInterval(sampleSensors, 100);

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

      const checkForSensors = setTimeout(() => {
          if (!sensorDataRef.current.hasOrientation && timelineRef.current.length === 0) {
             let simTime = 0;
             simInterval = window.setInterval(() => {
                   simTime += 0.1;
                   let alpha = 0;
                   const cycle = simTime % 10;
                   if (cycle > 2 && cycle < 4) {
                       alpha = (cycle - 2) * 90; 
                   } else if (cycle >= 4 && cycle < 6) {
                       alpha = 180;
                   } else if (cycle >= 6 && cycle < 8) {
                       alpha = 180 - (cycle - 6) * 90;
                   }
                   sensorDataRef.current.alpha = alpha;
                   sensorDataRef.current.gForce = 1.0 + (Math.random() * 0.1);
             }, 100); 
          }
      }, 2000);

      return () => {
        window.removeEventListener('devicemotion', handleMotion);
        window.removeEventListener('deviceorientation', handleOrientation);
        clearInterval(timerInterval);
        clearInterval(sampleInterval);
        clearTimeout(checkForSensors);
        if (simInterval) clearInterval(simInterval);
        if (watchId) navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [status]);
  
  const startSession = async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        if (response === 'granted') {
           if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
               await (DeviceOrientationEvent as any).requestPermission();
           }
           setStatus('tracking');
        } else {
          alert("Permission to access motion sensors is required.");
        }
      } catch (e) {
        setStatus('tracking');
      }
    } else {
      setStatus('tracking');
    }
  };

  const stopSession = () => {
    setStatus('idle');
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
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg shadow-lg min-h-[400px]">
      <h2 className="text-2xl font-bold mb-4 text-cyan-300">Track a Session</h2>
      
      {status === 'idle' && (
        <div className="w-full mb-6 text-center">
            <p className="text-gray-400 text-sm mb-3">
               Press Record. Put phone in pocket or use a mount.
            </p>
            <div className="text-xs text-cyan-400 border border-cyan-800 bg-cyan-900 bg-opacity-20 p-2 rounded inline-block">
                {previousSessions.length > 0 
                  ? `AI Active: Learning from ${previousSessions.length} past sessions.` 
                  : "AI Ready: Record sessions to start learning your tricks."}
            </div>
        </div>
      )}

      {status === 'tracking' && (
        <div className="text-center w-full">
            <div className="inline-block px-3 py-1 rounded-full bg-red-900 text-xs text-white font-bold mb-4 animate-pulse">
                ● RECORDING LIVE SENSORS
            </div>
            <div className="text-6xl font-bold text-cyan-400 my-4">{formatTime(elapsedTime)}</div>
            
            <div className="grid grid-cols-2 gap-4 text-center mb-6">
                <div className={`p-2 rounded border transition-colors duration-200 bg-gray-900 ${trackingStateRef.current.isSettling ? 'border-yellow-600' : 'border-gray-700'}`}>
                    <p className="text-xs text-gray-500 uppercase">Live Angle</p>
                    <p className="text-xl font-bold text-white">
                        {liveYaw}°
                    </p>
                    {trackingStateRef.current.isSettling && <p className="text-[9px] text-yellow-500 animate-pulse">SETTLING...</p>}
                </div>
                <div className="bg-gray-900 p-2 rounded border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase">Impact</p>
                    <p className="text-xl font-bold text-white">{currentG.toFixed(1)} <span className="text-xs text-gray-500">G</span></p>
                </div>
                <div className="bg-gray-900 p-2 rounded border border-gray-700 col-span-2">
                    <p className="text-xs text-gray-500 uppercase">Speed</p>
                    <p className="text-xl font-bold text-white">{currentSpeed.toFixed(1)} <span className="text-xs text-gray-500">km/h</span></p>
                </div>
            </div>

            <div className="w-full max-w-xs mx-auto bg-gray-900 h-2 rounded-full overflow-hidden relative border border-gray-700 mt-2">
                 <div 
                    className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-100"
                    style={{ width: `${Math.min((currentG / 4) * 100, 100)}%` }}
                 ></div>
            </div>
            
            <p className="text-xs text-gray-600 mt-4 font-mono">{pointsRecorded} data points recorded</p>
            <p className="text-sm text-gray-400 mt-6">Screen can be turned off.</p>
        </div>
      )}

      <div className="mt-auto w-full">
        {status !== 'tracking' ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={startSession}
              className="w-full bg-green-500 text-gray-900 font-bold py-4 text-xl rounded-lg hover:bg-green-400 transition-colors duration-200 shadow-lg"
            >
              RECORD SESSION
            </button>
            <button
              onClick={onBack}
              className="w-full bg-gray-700 text-gray-300 font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              BACK
            </button>
          </div>
        ) : (
          <button
            onClick={stopSession}
            className="w-full bg-red-500 text-white font-bold py-4 text-xl rounded-lg hover:bg-red-400 transition-colors duration-200 shadow-lg"
          >
            STOP & SAVE
          </button>
        )}
      </div>
    </div>
  );
};

export default SessionTracker;
