import React, { useState, useEffect, useRef } from 'react';
import { Session, SessionDataPoint, Motion, GpsPoint } from '../types';

interface SessionTrackerProps {
  onSessionComplete: (session: Session) => void;
  previousSessions: Session[];
  onBack: () => void;
  motions: Motion[];
}

const CALIBRATION_DURATION_SEC = 5;

const SessionTracker: React.FC<SessionTrackerProps> = ({ onSessionComplete, previousSessions, onBack, motions }) => {
  const [status, setStatus] = useState<'idle' | 'tracking'>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const [currentG, setCurrentG] = useState(1.0);
  const [liveYaw, setLiveYaw] = useState(0); 
  const [pointsRecorded, setPointsRecorded] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  
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
      lastG: 1.0,
      isFirstSample: true,
      lastDeltaSign: 0 // 1 for right, -1 for left
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
          if (trackingStateRef.current.isFirstSample && status === 'tracking') {
              trackingStateRef.current.lastAlpha = event.alpha;
              trackingStateRef.current.isFirstSample = false;
          }
          sensorDataRef.current.alpha = event.alpha;
          sensorDataRef.current.hasOrientation = true;
      }
  };

  const sampleSensors = () => {
      if (status !== 'tracking' || trackingStateRef.current.isFirstSample) return;

      const now = Date.now();
      const timeSec = (now - startTimeRef.current) / 1000;
      const data = sensorDataRef.current;
      const track = trackingStateRef.current;

      const calibrating = timeSec < CALIBRATION_DURATION_SEC;
      setIsCalibrating(calibrating);

      // 1. Calculate Rotation Delta
      let delta = track.lastAlpha - data.alpha;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      const absDelta = Math.abs(delta);
      const currentDeltaSign = delta > 0.6 ? 1 : (delta < -0.6 ? -1 : 0);

      if (!calibrating) {
          // DRIFT FILTER: Prevent noise from accumulating when stationary
          if (absDelta > 0.6) {
              track.accumulatedTurn += delta;
          } else if (!track.isRotating) {
              track.accumulatedTurn = track.lastStableAngle;
          }
      } else {
          track.accumulatedTurn = 0;
          track.lastStableAngle = 0;
          track.lastAlpha = data.alpha;
      }
      
      track.lastAlpha = data.alpha;
      setLiveYaw(Math.round(track.accumulatedTurn));

      let shouldRecord = false;
      let turnAngle: number | undefined = undefined;
      let isGroupStart = false;
      let customLabel: string | undefined = undefined;

      if (calibrating) {
          if (timeSec - track.lastRecordTime > 1.0) {
              shouldRecord = true;
              customLabel = "Calibration";
          }
      } else {
          // 2. DETECTION LOGIC
          
          // A) ROTATION DETECTION
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
              if (timeSec - track.lastRecordTime > 0.2) shouldRecord = true;

              // IMMEDIATE COMMIT LOGIC:
              // Per request: if speed drops below 3.0° per sample, finalize turn INSTANTLY.
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

          // B) IMPACT DETECTION
          const gDiff = Math.abs(data.gForce - track.lastG);
          if (gDiff > 0.2 || data.gForce > 1.8) {
              shouldRecord = true;
          }
          track.lastG = data.gForce;

          // C) continuity heartbeat
          if (timeSec - track.lastRecordTime > 2.0) {
              shouldRecord = true;
          }
      }

      if (shouldRecord) {
          const newPoint: SessionDataPoint = {
              timestamp: parseFloat(timeSec.toFixed(2)),
              intensity: parseFloat(data.gForce.toFixed(2)),
              rotation: parseFloat(data.rotRate.toFixed(2)),
              turnAngle,
              isGroupStart: isGroupStart || !!customLabel,
              label: customLabel,
              groupId: track.isRotating ? `rot-${track.rotationStartValue}` : (customLabel ? 'calib' : undefined)
          };

          timelineRef.current.push(newPoint);
          setPointsRecorded(prev => prev + 1);
          track.lastRecordTime = timeSec;
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

  useEffect(() => {
    let watchId: number;
    let sampleInterval: number;

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
          lastG: 1.0,
          isFirstSample: true,
          lastDeltaSign: 0
      };
      
      setPointsRecorded(0);
      setLiveYaw(0);
      setCurrentSpeed(0);
      setIsCalibrating(true);
      
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

      return () => {
        window.removeEventListener('devicemotion', handleMotion);
        window.removeEventListener('deviceorientation', handleOrientation);
        clearInterval(timerInterval);
        clearInterval(sampleInterval);
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
    if (trackingStateRef.current.isRotating) {
        const track = trackingStateRef.current;
        const turnAngle = Math.round(track.accumulatedTurn - track.rotationStartValue);
        const data = sensorDataRef.current;
        const now = Date.now();
        const timeSec = (now - startTimeRef.current) / 1000;

        timelineRef.current.push({
            timestamp: parseFloat(timeSec.toFixed(2)),
            intensity: parseFloat(data.gForce.toFixed(2)),
            rotation: parseFloat(data.rotRate.toFixed(2)),
            turnAngle,
            isGroupStart: false
        });
    }

    setStatus('idle');
    const processedTimeline = timelineRef.current;
    const summary: Record<string, number> = {};
    motions.forEach(m => summary[m.name] = 0);
    
    let totalTricks = 0;
    processedTimeline.forEach(p => {
        if (p.label && p.isGroupStart && p.label !== "Calibration") {
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
            <div className={`inline-block px-3 py-1 rounded-full text-xs text-white font-bold mb-4 animate-pulse ${isCalibrating ? 'bg-yellow-600' : 'bg-red-900'}`}>
                ● {isCalibrating ? 'CALIBRATING SENSORS' : 'RECORDING LIVE SENSORS'}
            </div>
            <div className="text-6xl font-bold text-cyan-400 my-4">{formatTime(elapsedTime)}</div>
            
            <div className="grid grid-cols-2 gap-4 text-center mb-6">
                <div className={`p-2 rounded border transition-colors duration-200 bg-gray-900 border-gray-700`}>
                    <p className="text-xs text-gray-500 uppercase">Live Angle</p>
                    <p className={`text-xl font-bold ${isCalibrating ? 'text-yellow-500 animate-pulse' : 'text-white'}`}>
                        {isCalibrating ? 'WAIT' : `${liveYaw}°`}
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