
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
  const [currentRot, setCurrentRot] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [pointsRecorded, setPointsRecorded] = useState(0);
  
  // Live feedback vars
  const [liveYaw, setLiveYaw] = useState(0); // Total accumulated yaw since start
  const [lastSavedYawDisplay, setLastSavedYawDisplay] = useState(0);

  // Real Data Stores
  const timelineRef = useRef<SessionDataPoint[]>([]);
  const speedReadingsRef = useRef<number[]>([]);
  const pathRef = useRef<GpsPoint[]>([]);
  
  const startTimeRef = useRef(0);
  const lastPositionRef = useRef<GpsPoint | null>(null);

  // --- MOTION PROCESSING STATE ---
  const lastTimestampRef = useRef<number>(0);
  
  // The absolute accumulated yaw (Z-axis rotation) since session start
  const cumulativeYawRef = useRef(0); 
  
  // The yaw value at the last time we "saved" an event (to calc deltas)
  const lastSavedYawRef = useRef(0);
  
  // Timer to detect when motion has stopped
  const stillnessTimerRef = useRef<number | null>(null);

  const handleMotion = (event: DeviceMotionEvent) => {
    // 1. Time Delta
    // Use event.interval if available (it's the hardware polling rate in seconds), otherwise calc manually
    // Note: event.interval is usually in seconds, but sometimes milliseconds on different browsers.
    // Standard is seconds. We fallback to performance.now delta if needed.
    const now = performance.now();
    let dt = 0;
    
    if (event.interval && event.interval > 0) {
        // Some Androids report interval in ms, iOS in s. 
        // Typically < 1.0 means seconds.
        dt = event.interval < 1.0 ? event.interval : event.interval / 1000;
    } else {
        if (lastTimestampRef.current > 0) {
            dt = (now - lastTimestampRef.current) / 1000;
        }
        lastTimestampRef.current = now;
    }
    
    // Sanity check dt to prevent huge jumps on lag
    if (dt > 0.5) dt = 0; 

    // 2. Sensor Data extraction
    const { x, y, z } = event.accelerationIncludingGravity || {x:0,y:0,z:0};
    const { alpha, beta, gamma } = event.rotationRate || {alpha:0, beta:0, gamma:0};
    
    const gForce = Math.sqrt((x||0)**2 + (y||0)**2 + (z||0)**2) / 9.8;
    const rotMag = Math.sqrt((alpha||0)**2 + (beta||0)**2 + (gamma||0)**2); 
    
    // Alpha is Z-axis (Yaw). We rely on this for table turns and general spins.
    let yawRate = alpha || 0; 

    // 3. DEADZONE / NOISE GATE
    // If rotation is extremely slow (jitter), ignore it to prevent drift
    if (Math.abs(yawRate) < 1.0) {
        yawRate = 0;
    }

    // 4. INTEGRATION
    cumulativeYawRef.current += yawRate * dt;

    // UI Updates (throttled slightly by React state, but that's fine)
    setCurrentG(gForce);
    setCurrentRot(rotMag);
    setLiveYaw(Math.round(cumulativeYawRef.current));

    if (status !== 'tracking') return;

    const sessionTime = (Date.now() - startTimeRef.current) / 1000;

    // --- LOGIC: "Move then Stop" Detection ---
    
    const IS_MOVING_THRESHOLD = 5.0; // deg/s. If rate is below this, we consider it "stopped".
    const MIN_ANGLE_TO_RECORD = 15.0; // Degrees. Must turn at least this much to matter.
    const IMPACT_THRESHOLD = 2.5; // Gs.

    // A. IMPACT DETECTION (Immediate)
    if (gForce > IMPACT_THRESHOLD) {
        recordPoint(sessionTime, gForce, rotMag, undefined, "Impact");
        // Reset stillness check if we just slammed
        if (stillnessTimerRef.current) clearTimeout(stillnessTimerRef.current);
    }

    // B. ROTATION COMMIT LOGIC
    if (Math.abs(yawRate) > IS_MOVING_THRESHOLD) {
        // We are moving. Cancel any pending "stop" checks.
        if (stillnessTimerRef.current) {
            clearTimeout(stillnessTimerRef.current);
            stillnessTimerRef.current = null;
        }
    } else {
        // We are NOT moving (or moving very slowly).
        // If we haven't started a timer to check for "settling", start one now.
        if (!stillnessTimerRef.current) {
            stillnessTimerRef.current = window.setTimeout(() => {
                // The timer finished! Meaning we stayed still for X ms.
                
                // Check how much we turned since the last save
                const deltaYaw = cumulativeYawRef.current - lastSavedYawRef.current;
                
                if (Math.abs(deltaYaw) > MIN_ANGLE_TO_RECORD) {
                    // It was a significant turn. Record it.
                    const cleanAngle = Math.round(deltaYaw);
                    recordPoint(sessionTime, gForce, rotMag, cleanAngle, "Turn");
                    
                    // Update our baseline so we start counting from 0 for the next trick
                    lastSavedYawRef.current = cumulativeYawRef.current;
                    setLastSavedYawDisplay(Math.round(cumulativeYawRef.current));
                }
                
                stillnessTimerRef.current = null;
            }, 400); // Wait 0.4s of stillness before committing the turn
        }
    }
  };

  const recordPoint = (time: number, g: number, rot: number, angle?: number, debugLabel?: string) => {
      const point: SessionDataPoint = {
          timestamp: parseFloat(time.toFixed(2)),
          intensity: parseFloat(g.toFixed(2)),
          rotation: parseFloat(rot.toFixed(2)),
          turnAngle: angle
      };
      timelineRef.current.push(point);
      setPointsRecorded(prev => prev + 1);
      // console.log(`Recorded: ${debugLabel} | Angle: ${angle}`);
  };

  // Helper to calc distance between two coords
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3; // metres
      const φ1 = lat1 * Math.PI/180;
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lon2-lon1) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
  }

  useEffect(() => {
    let watchId: number;
    let simInterval: number;

    if (status === 'tracking') {
      startTimeRef.current = Date.now();
      timelineRef.current = []; 
      speedReadingsRef.current = [];
      pathRef.current = [];
      lastPositionRef.current = null;
      
      // Reset State
      cumulativeYawRef.current = 0;
      lastSavedYawRef.current = 0;
      lastTimestampRef.current = performance.now();
      setLiveYaw(0);
      setLastSavedYawDisplay(0);
      setPointsRecorded(0);
      
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      window.addEventListener('devicemotion', handleMotion);

      // --- GPS TRACKING ---
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, speed } = position.coords;
            const timestamp = position.timestamp;
            
            let calculatedSpeed = speed || 0;
            
            if (lastPositionRef.current) {
                const dist = getDistance(
                    lastPositionRef.current.lat, 
                    lastPositionRef.current.lon, 
                    latitude, 
                    longitude
                );
                const timeDiff = (timestamp - lastPositionRef.current.timestamp) / 1000;
                if (timeDiff > 0) {
                    const derivedSpeed = dist / timeDiff; 
                    if ((calculatedSpeed === 0 || calculatedSpeed === null) && derivedSpeed < 30) {
                        calculatedSpeed = derivedSpeed;
                    }
                }
            }

            const speedKmh = calculatedSpeed * 3.6;
            
            if (speedKmh > 0.5) {
                setCurrentSpeed(speedKmh);
                speedReadingsRef.current.push(speedKmh);
            }

            const newPoint = {
                lat: latitude,
                lon: longitude,
                timestamp: timestamp,
                speed: speedKmh
            };
            
            pathRef.current.push(newPoint);
            lastPositionRef.current = newPoint;
          },
          (err) => console.warn('GPS Error', err),
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      }

      // Simulation for Desktop Testing
      const checkForSensors = setTimeout(() => {
          // If no events received after 2s, assume no sensors (desktop) and simulate
          if (timelineRef.current.length === 0 && cumulativeYawRef.current === 0) {
             console.log("No motion detected, starting simulation...");
             lastTimestampRef.current = performance.now();
             
             let simTime = 0;

             simInterval = window.setInterval(() => {
                   simTime += 0.016; // 60fps
                   const now = performance.now();
                   
                   // Simulate a turn: 
                   // 0-2s: Nothing
                   // 2-3s: Turn 90 deg (90 deg/s for 1s)
                   // 3-5s: Stop (should trigger record)
                   let alpha = 0;
                   const cycle = simTime % 5;
                   
                   if (cycle > 2.0 && cycle < 3.0) {
                       alpha = 90;
                   }

                   handleMotion({ 
                       accelerationIncludingGravity: { x:0, y: 9.8, z: 0 },
                       rotationRate: { alpha: alpha, beta: 0, gamma: 0 },
                       timeStamp: now,
                       interval: 0.016 // Provide interval for simulation accuracy
                   } as any);
                   
                   const simSpeed = 5 + Math.random() * 2;
                   setCurrentSpeed(simSpeed);
                   if (Math.random() > 0.95) speedReadingsRef.current.push(simSpeed);

             }, 16); 
          }
      }, 2000);

      return () => {
        window.removeEventListener('devicemotion', handleMotion);
        clearInterval(interval);
        clearTimeout(checkForSensors);
        if (simInterval) clearInterval(simInterval);
        if (watchId) navigator.geolocation.clearWatch(watchId);
        if (stillnessTimerRef.current) clearTimeout(stillnessTimerRef.current);
      };
    }
  }, [status]);
  
  const startSession = async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        if (response === 'granted') {
          setStatus('tracking');
        } else {
          alert("Permission to access motion sensors is required.");
        }
      } catch (e) {
        console.error(e);
        // Sometimes non-iOS devices throw error on requestPermission, just try starting
        setStatus('tracking');
      }
    } else {
      setStatus('tracking');
    }
  };

  const stopSession = () => {
    setStatus('idle');
    
    const processedTimeline = autoLabelTimeline(timelineRef.current, previousSessions);
    
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
  
  const autoLabelTimeline = (timeline: SessionDataPoint[], history: Session[]): SessionDataPoint[] => {
      return timeline.map((p, index) => {
          if (p.turnAngle) {
              const absAngle = Math.abs(p.turnAngle);
              // Simple heuristic for labels
              if (absAngle >= 160 && absAngle <= 200) {
                  return { 
                      ...p, 
                      label: "180 Turn", 
                      isGroupStart: true, 
                      groupId: `auto-${Date.now()}-${index}` 
                  };
              } else if (absAngle >= 330) {
                   return { 
                      ...p, 
                      label: "360 Spin", 
                      isGroupStart: true, 
                      groupId: `auto-${Date.now()}-${index}` 
                  };
              }
          }
          if (p.intensity > 3.0) {
               return { 
                  ...p, 
                  label: "Impact", 
                  isGroupStart: true, 
                  groupId: `auto-${Date.now()}-${index}` 
              };
          }
          return p;
      });
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
                <div className={`p-2 rounded border transition-colors duration-200 bg-gray-900 border-gray-700`}>
                    <p className="text-xs text-gray-500 uppercase">Live Angle</p>
                    <p className="text-xl font-bold text-white">
                        {/* Show current accumulation relative to last save */}
                        {Math.round(liveYaw - lastSavedYawDisplay)}°
                    </p>
                    <p className="text-[10px] text-gray-600">Abs: {liveYaw}°</p>
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
            
            <p className="text-xs text-gray-600 mt-4 font-mono">{pointsRecorded} events recorded</p>

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
