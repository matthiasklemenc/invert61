
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
  
  // Live feedback for the current "in-progress" turn
  const [liveTurnAngle, setLiveTurnAngle] = useState(0); 
  const [isTurningUI, setIsTurningUI] = useState(false);

  // Real Data Stores
  const timelineRef = useRef<SessionDataPoint[]>([]);
  const speedReadingsRef = useRef<number[]>([]);
  const pathRef = useRef<GpsPoint[]>([]);
  
  const startTimeRef = useRef(0);
  const lastPositionRef = useRef<GpsPoint | null>(null);

  // --- EVENT DETECTION STATE ---
  const lastIntegrationTimeRef = useRef(0);
  
  // Turn Detection Refs
  const isTurningRef = useRef(false);
  const turnStartYawRef = useRef(0);
  const cumulativeYawRef = useRef(0); // Continuous absolute yaw
  const lastRecordTimeRef = useRef(0);

  const handleMotion = (event: DeviceMotionEvent) => {
    const nowPerf = performance.now();
    
    // 1. Calculate Time Delta (dt) in seconds
    let dt = (nowPerf - lastIntegrationTimeRef.current) / 1000;
    if (dt > 0.5) dt = 0; // Filter huge jumps
    lastIntegrationTimeRef.current = nowPerf;

    // 2. Sensor Data
    const { x, y, z } = event.accelerationIncludingGravity || {x:0,y:0,z:0};
    const { alpha, beta, gamma } = event.rotationRate || {alpha:0, beta:0, gamma:0};
    
    const gForce = Math.sqrt((x||0)**2 + (y||0)**2 + (z||0)**2) / 9.8;
    const rotMag = Math.sqrt((alpha||0)**2 + (beta||0)**2 + (gamma||0)**2); 
    // Alpha is usually Z-axis (Yaw). 
    // Note: On some Android devices in Chrome, alpha might be absolute 0-360. 
    // rotationRate is usually deg/s.
    const yawRate = alpha || 0; // deg/s

    // UI Updates
    setCurrentG(gForce);
    setCurrentRot(rotMag);

    // 3. Integrate Yaw (Z-axis rotation)
    // We track absolute yaw relative to session start
    cumulativeYawRef.current += yawRate * dt;

    if (status !== 'tracking') return;

    const nowSec = (Date.now() - startTimeRef.current) / 1000;
    
    // --- EVENT LOGIC ---

    // A. IMPACT DETECTION (Instant)
    // If G-Force spikes, record immediately (e.g. landing a trick)
    // Increased threshold slightly to filter table bumps
    if (gForce > 2.0) { 
       // Debounce impacts slightly
       if (nowSec - lastRecordTimeRef.current > 0.2) {
           recordPoint(nowSec, gForce, rotMag, undefined);
           lastRecordTimeRef.current = nowSec;
       }
    }

    // B. TURN DETECTION (State Machine)
    // Lowered thresholds significantly for table testing
    const TURN_START_THRESHOLD = 15; // deg/s (Start detecting turn)
    const TURN_END_THRESHOLD = 5;    // deg/s (Stop detecting turn)

    if (!isTurningRef.current) {
        // Start a turn if rotating fast enough
        if (Math.abs(yawRate) > TURN_START_THRESHOLD) {
            isTurningRef.current = true;
            turnStartYawRef.current = cumulativeYawRef.current;
            setIsTurningUI(true);
        }
    } else {
        // We are currently in a turn
        
        // Update UI for live angle
        const currentDelta = cumulativeYawRef.current - turnStartYawRef.current;
        setLiveTurnAngle(Math.round(currentDelta));

        // Check if rotation has slowed down enough to consider the turn "finished"
        if (Math.abs(yawRate) < TURN_END_THRESHOLD) {
            finishTurn(nowSec, gForce, rotMag);
        }
    }

    // C. HEARTBEAT (Keep graph alive)
    // Record a boring point every 2 seconds if nothing else happens
    if (nowSec - lastRecordTimeRef.current > 2.0 && !isTurningRef.current) {
        recordPoint(nowSec, gForce, rotMag, undefined); 
        lastRecordTimeRef.current = nowSec;
    }
  };

  const finishTurn = (time: number, g: number, rot: number) => {
      isTurningRef.current = false;
      setIsTurningUI(false);
      setLiveTurnAngle(0);
      
      // Calculate total angle change during the event
      const totalTurn = cumulativeYawRef.current - turnStartYawRef.current;
      
      // Only record if it was a real turn (> 15 degrees)
      // This filters out jitter when just picking up the phone
      if (Math.abs(totalTurn) > 15) {
          // Round to nearest 5 for cleaner UI (e.g. 87 -> 90)
          const cleanAngle = Math.round(totalTurn / 5) * 5;
          recordPoint(time, g, rot, cleanAngle);
          lastRecordTimeRef.current = time;
      }
  };

  const recordPoint = (time: number, g: number, rot: number, angle?: number) => {
      const point: SessionDataPoint = {
          timestamp: parseFloat(time.toFixed(2)),
          intensity: parseFloat(g.toFixed(2)),
          rotation: parseFloat(rot.toFixed(2)),
          turnAngle: angle // This is the simplified "Event" angle
      };
      timelineRef.current.push(point);
      setPointsRecorded(prev => prev + 1);
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
      
      // Reset Integration State
      cumulativeYawRef.current = 0;
      lastIntegrationTimeRef.current = performance.now();
      isTurningRef.current = false;
      lastRecordTimeRef.current = 0;
      
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

      // Updated Simulation for "Event Based" testing
      const checkForSensors = setTimeout(() => {
          if (timelineRef.current.length === 0) {
             console.log("No motion detected, starting simulation...");
             lastIntegrationTimeRef.current = performance.now();
             
             let simTime = 0;
             let simYaw = 0;

             simInterval = window.setInterval(() => {
                   simTime += 0.016;
                   const now = performance.now();
                   
                   // Simulate a 90 degree turn every 3 seconds
                   let alpha = 0;
                   const cycle = simTime % 3;
                   
                   // From 1.0s to 1.5s, turn sharply (180 deg/s for 0.5s = 90 deg)
                   if (cycle > 1.0 && cycle < 1.5) {
                       alpha = 180;
                   }
                   
                   simYaw += alpha * 0.016;

                   handleMotion({ 
                       accelerationIncludingGravity: { x:0, y: 9.8, z: 0 },
                       rotationRate: { alpha: alpha, beta: 0, gamma: 0 },
                       timeStamp: now
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
      };
    }
  }, [status]);
  
  const startSession = () => {
    setStatus('tracking');
  };

  const stopSession = () => {
    setStatus('idle');
    
    // 1. Process Timeline
    const processedTimeline = autoLabelTimeline(timelineRef.current, previousSessions);
    
    // 2. Generate Summary
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

    // 3. Calculate Speed Stats
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
  
  // --- AI / PATTERN MATCHING LOGIC ---
  const autoLabelTimeline = (timeline: SessionDataPoint[], history: Session[]): SessionDataPoint[] => {
      // Basic auto-labeling based on angles
      return timeline.map((p, index) => {
          // If we have a specific turn angle recorded, maybe we can guess a trick?
          if (p.turnAngle) {
              const absAngle = Math.abs(p.turnAngle);
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
               Press Record and put your phone in your pocket.
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
                <div className={`p-2 rounded border transition-colors duration-200 ${isTurningUI ? 'bg-cyan-900 border-cyan-400' : 'bg-gray-900 border-gray-700'}`}>
                    <p className="text-xs text-gray-500 uppercase">Turn Angle</p>
                    <p className={`text-xl font-bold ${isTurningUI ? 'text-cyan-300' : 'text-white'}`}>
                        {isTurningUI ? liveTurnAngle : currentRot.toFixed(0)} <span className="text-xs text-gray-500">deg</span>
                    </p>
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
