
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
  
  // Real Data Stores
  const timelineRef = useRef<SessionDataPoint[]>([]);
  const speedReadingsRef = useRef<number[]>([]);
  const pathRef = useRef<GpsPoint[]>([]);
  const startTimeRef = useRef(0);
  const lastPositionRef = useRef<GpsPoint | null>(null);
  
  const handleMotion = (event: DeviceMotionEvent) => {
    // 1. Calculate Linear G-Force (Impact)
    const { x, y, z } = event.accelerationIncludingGravity || {x:0,y:0,z:0};
    const gForce = Math.sqrt((x||0)**2 + (y||0)**2 + (z||0)**2) / 9.8;
    
    // 2. Calculate Rotation Magnitude (Turn Intensity in deg/s)
    const { alpha, beta, gamma } = event.rotationRate || {alpha:0, beta:0, gamma:0};
    // Magnitude of rotation vector
    const rotMag = Math.sqrt((alpha||0)**2 + (beta||0)**2 + (gamma||0)**2); 

    // Specific Yaw Rotation (Z-axis) for angle calculation
    // alpha is in degrees per second
    const yawRate = alpha || 0; 

    setCurrentG(gForce);
    setCurrentRot(rotMag);

    // Only record data if tracking
    if (status !== 'tracking') return;

    const now = (Date.now() - startTimeRef.current) / 1000;
    const lastPoint = timelineRef.current[timelineRef.current.length - 1];
    
    // Throttle data recording to approx 10Hz (every 0.1s)
    const timeSinceLast = lastPoint ? now - lastPoint.timestamp : 0.1;

    if (timeSinceLast >= 0.1) {
        
        // --- LOGIC UPDATE ---
        // 1. G-Force changes (Ollies, landings)
        const isImpact = gForce > 1.2 || gForce < 0.8;
        
        // 2. Rapid Rotation (Snaps, 180s, 90deg turns)
        const degreesTurned = yawRate * timeSinceLast;
        const isRapidRotation = Math.abs(degreesTurned) > 10 || rotMag > 150; 
        
        // 3. Heartbeat: Record at least every 0.5s even if idle, so the graph isn't empty
        const isHeartbeat = timeSinceLast > 0.5;

        if (isImpact || isRapidRotation || isHeartbeat) {
            
            const point: SessionDataPoint = {
                timestamp: parseFloat(now.toFixed(2)),
                intensity: parseFloat(gForce.toFixed(2)),
                rotation: parseFloat(rotMag.toFixed(2))
            };

            // Only add turnAngle if it was a significant rotation event to keep UI clean
            if (Math.abs(degreesTurned) > 5) {
                point.turnAngle = Math.round(degreesTurned);
            }

            timelineRef.current.push(point);
            setPointsRecorded(prev => prev + 1);
        }
    }
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
      timelineRef.current = []; // Clear previous data
      speedReadingsRef.current = [];
      pathRef.current = [];
      lastPositionRef.current = null;
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
            
            // Calculate speed manually if device returns null (common indoors/low signal)
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
                    const derivedSpeed = dist / timeDiff; // m/s
                    // Use derived speed if GPS speed is null, or filter massive jumps
                    if ((calculatedSpeed === 0 || calculatedSpeed === null) && derivedSpeed < 30) {
                        calculatedSpeed = derivedSpeed;
                    }
                }
            }

            const speedKmh = calculatedSpeed * 3.6;
            
            // Filter noise: simple low pass
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

      // If desktop/testing (no sensors), simulate data
      // Check if sensors actually fire, if not, start sim
      const checkForSensors = setTimeout(() => {
          if (timelineRef.current.length === 0) {
             console.log("No motion detected, starting simulation for testing...");
             simInterval = window.setInterval(() => {
                   const simG = 1 + Math.random() * 0.2;
                   const finalG = Math.random() > 0.9 ? 2.5 : simG;
                   
                   const isSnap = Math.random() > 0.92;
                   const direction = Math.random() > 0.5 ? 1 : -1;
                   const simAlpha = isSnap ? (250 * direction) : (Math.random() * 10 * direction);
    
                   handleMotion({ 
                       accelerationIncludingGravity: { x:0, y: finalG * 9.8, z: 0 },
                       rotationRate: { alpha: simAlpha, beta: 0, gamma: 0 },
                       timeStamp: Date.now()
                   } as any);
                   
                   const simSpeed = 5 + Math.random() * 10;
                   setCurrentSpeed(simSpeed);
                   speedReadingsRef.current.push(simSpeed);
             }, 100);
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
  
  const startSession = async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        if (response === 'granted') {
          setStatus('tracking');
        } else {
          alert("Permission to access motion sensors is required to track tricks.");
        }
      } catch (e) {
        console.error(e);
        // Fallback for non-iOS or error
        setStatus('tracking');
      }
    } else {
      setStatus('tracking');
    }
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
      if (history.length === 0) return timeline;

      const knownPatterns: { intensity: number, rotation: number, label: string }[] = [];
      history.forEach(s => {
          if (s.timelineData) {
              s.timelineData.forEach(p => {
                  if (p.label && p.isGroupStart) {
                      knownPatterns.push({ intensity: p.intensity, rotation: p.rotation || 0, label: p.label });
                  }
              });
          }
      });

      if (knownPatterns.length === 0) return timeline;

      return timeline.map((p, index) => {
          // Check for significant events
          const isEvent = p.intensity > 1.5 || (p.rotation && p.rotation > 150);
          
          if (!isEvent) return p;

          let bestMatchLabel: string | undefined = undefined;
          let minDiff = 1000;

          for (const pattern of knownPatterns) {
              const gDiff = Math.abs(p.intensity - pattern.intensity);
              const rDiff = Math.abs((p.rotation || 0) - pattern.rotation);
              const totalDiff = gDiff + (rDiff / 100); 

              if (totalDiff < minDiff && totalDiff < 0.8) {
                  minDiff = totalDiff;
                  bestMatchLabel = pattern.label;
              }
          }

          if (bestMatchLabel) {
              return { ...p, label: bestMatchLabel, isGroupStart: true, groupId: `auto-${Date.now()}-${index}` };
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
                <div className="bg-gray-900 p-2 rounded border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase">Rotation</p>
                    <p className="text-xl font-bold text-white">{currentRot.toFixed(0)} <span className="text-xs text-gray-500">deg/s</span></p>
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

            {/* Live G-Force Meter */}
            <div className="w-full max-w-xs mx-auto bg-gray-900 h-2 rounded-full overflow-hidden relative border border-gray-700 mt-2">
                 <div 
                    className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-100"
                    style={{ width: `${Math.min((currentG / 4) * 100, 100)}%` }}
                 ></div>
            </div>
            
            <p className="text-xs text-gray-600 mt-4 font-mono">{pointsRecorded} points recorded</p>

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
