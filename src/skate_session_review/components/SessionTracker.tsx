
import React, { useState, useEffect, useRef } from 'react';
import { Session, SessionDataPoint, Motion } from '../types';

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
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  
  // Real Data Stores
  const timelineRef = useRef<SessionDataPoint[]>([]);
  const speedReadingsRef = useRef<number[]>([]);
  const startTimeRef = useRef(0);
  
  const handleMotion = (event: DeviceMotionEvent) => {
    const { x, y, z } = event.accelerationIncludingGravity || {x:0,y:0,z:0};
    const gForce = Math.sqrt((x||0)**2 + (y||0)**2 + (z||0)**2) / 9.8;
    
    setCurrentG(gForce);

    // Only record data if tracking
    if (status !== 'tracking') return;

    const now = (Date.now() - startTimeRef.current) / 1000;
    
    // Throttle data recording to approx 10Hz (every 0.1s)
    const lastPoint = timelineRef.current[timelineRef.current.length - 1];
    if (!lastPoint || (now - lastPoint.timestamp > 0.1)) {
        timelineRef.current.push({
            timestamp: parseFloat(now.toFixed(2)),
            intensity: parseFloat(gForce.toFixed(2)),
        });
    }
  };

  useEffect(() => {
    let watchId: number;

    if (status === 'tracking') {
      startTimeRef.current = Date.now();
      timelineRef.current = []; // Clear previous data
      speedReadingsRef.current = [];
      
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      window.addEventListener('devicemotion', handleMotion);

      // --- GPS TRACKING ---
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const speedKmh = (position.coords.speed || 0) * 3.6;
            setCurrentSpeed(speedKmh);
            speedReadingsRef.current.push(speedKmh);
          },
          (err) => console.warn('GPS Error', err),
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      }

      // If desktop/testing, simulate data injection
      if (!window.DeviceMotionEvent) {
           const simInterval = setInterval(() => {
               const simG = 1 + Math.random() * 0.5;
               const finalG = Math.random() > 0.95 ? 3.0 : simG;
               handleMotion({ accelerationIncludingGravity: { x:0, y: finalG * 9.8, z: 0 } } as any);
               
               const simSpeed = Math.random() * 15;
               setCurrentSpeed(simSpeed);
               speedReadingsRef.current.push(simSpeed);
           }, 100);
           return () => {
             window.removeEventListener('devicemotion', handleMotion);
             clearInterval(interval);
             clearInterval(simInterval);
             if (watchId) navigator.geolocation.clearWatch(watchId);
           };
      }

      return () => {
        window.removeEventListener('devicemotion', handleMotion);
        clearInterval(interval);
        if (watchId) navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [status]);
  
  const startSession = async () => {
    // --- iOS PERMISSION REQUEST ---
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
      }
    } else {
      setStatus('tracking');
    }
  };
  
  const stopSession = () => {
    setStatus('idle');
    
    // 1. Process Timeline to Auto-Label using Learning Logic
    const processedTimeline = autoLabelTimeline(timelineRef.current, previousSessions);
    
    // 2. Generate Summary based on new labels
    const summary: Record<string, number> = {};
    motions.forEach(m => summary[m.name] = 0);
    
    let totalTricks = 0;
    processedTimeline.forEach(p => {
        if (p.label) {
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
      timelineData: processedTimeline
    };
    onSessionComplete(newSession);
  };
  
  // --- AI / PATTERN MATCHING LOGIC ---
  const autoLabelTimeline = (timeline: SessionDataPoint[], history: Session[]): SessionDataPoint[] => {
      const knownPatterns: { intensity: number, label: string }[] = [];
      history.forEach(s => {
          s.timelineData.forEach(p => {
              if (p.label && p.label !== 'Trick Attempt') {
                  knownPatterns.push({ intensity: p.intensity, label: p.label });
              }
          });
      });

      return timeline.map((p, index, arr) => {
          if (p.intensity < 1.5) return p;

          const prev = arr[index - 1]?.intensity || 0;
          const next = arr[index + 1]?.intensity || 0;
          
          if (p.intensity > prev && p.intensity > next) {
              let bestMatchLabel: string | undefined = undefined;
              let minDiff = 0.5;

              for (const pattern of knownPatterns) {
                  const diff = Math.abs(p.intensity - pattern.intensity);
                  if (diff < minDiff) {
                      minDiff = diff;
                      bestMatchLabel = pattern.label;
                  }
              }

              if (bestMatchLabel) {
                  return { ...p, label: bestMatchLabel };
              } else if (p.intensity > 2.0) {
                  return { ...p, label: 'Trick Attempt' };
              }
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
                    <p className="text-xs text-gray-500 uppercase">Speed</p>
                    <p className="text-xl font-bold text-white">{currentSpeed.toFixed(1)} <span className="text-xs text-gray-500">km/h</span></p>
                </div>
                <div className="bg-gray-900 p-2 rounded border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase">Impact</p>
                    <p className="text-xl font-bold text-white">{currentG.toFixed(1)} <span className="text-xs text-gray-500">G</span></p>
                </div>
            </div>

            {/* Live G-Force Meter */}
            <div className="w-full max-w-xs mx-auto bg-gray-900 h-2 rounded-full overflow-hidden relative border border-gray-700 mt-2">
                 <div 
                    className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-100"
                    style={{ width: `${Math.min((currentG / 4) * 100, 100)}%` }}
                 ></div>
            </div>

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
