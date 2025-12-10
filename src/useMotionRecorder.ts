import { useState, useRef, useCallback, useEffect } from 'react';
import { MotionDataPoint, TrickTake } from './types';

export type RecorderStatus = 'idle' | 'permission' | 'arming' | 'armed' | 'recording' | 'confirming' | 'denied' | 'error';

const STILLNESS_THRESHOLD = 0.2; // Relaxed from 0.05
const STILLNESS_DURATION = 800; // Reduced from 1500ms
const RECORD_START_THRESHOLD = 2.0; // G-force to start
const RECORD_END_THRESHOLD = 1.2; // G-force to stop
const MAX_RECORD_DURATION = 5000; // ms

export const useMotionRecorder = () => {
    // We use a Ref for status to avoid stale closures in the event listener
    const statusRef = useRef<RecorderStatus>('idle');
    const [status, setStatusState] = useState<RecorderStatus>('idle');

    const setStatus = (s: RecorderStatus) => {
        statusRef.current = s;
        setStatusState(s);
    };

    const motionBuffer = useRef<MotionDataPoint[]>([]);
    const stillnessBuffer = useRef<number[]>([]);
    const stillnessTimer = useRef<number | null>(null);
    const recordingTimer = useRef<number | null>(null);
    const forceArmTimer = useRef<number | null>(null); // Safety timeout

    const [recordedData, setRecordedData] = useState<TrickTake | null>(null);

    const cleanupTimers = () => {
        if (stillnessTimer.current) {
            clearTimeout(stillnessTimer.current);
            stillnessTimer.current = null;
        }
        if (recordingTimer.current) {
            clearTimeout(recordingTimer.current);
            recordingTimer.current = null;
        }
        if (forceArmTimer.current) {
            clearTimeout(forceArmTimer.current);
            forceArmTimer.current = null;
        }
    };

    // Stable event handler using refs
    const handleMotion = useCallback((e: DeviceMotionEvent) => {
        const currentStatus = statusRef.current;
        
        // Only process events if we are in an active state
        if (currentStatus === 'idle' || currentStatus === 'confirming' || currentStatus === 'error' || currentStatus === 'denied') return;

        const acc = e.accelerationIncludingGravity;
        const rot = e.rotationRate;
        if (!acc || !rot) return;

        const dataPoint: MotionDataPoint = {
            ax: acc.x ?? 0, ay: acc.y ?? 0, az: acc.z ?? 0,
            gx: rot.alpha ?? 0, gy: rot.beta ?? 0, gz: rot.gamma ?? 0,
            timestamp: e.timeStamp || Date.now(),
        };
        
        const magnitude = Math.sqrt(dataPoint.ax**2 + dataPoint.ay**2 + dataPoint.az**2) / 9.81;

        if (currentStatus === 'arming') {
            stillnessBuffer.current.push(magnitude);
            if (stillnessBuffer.current.length > 40) stillnessBuffer.current.shift();
            
            // Only check if we have enough data
            if (stillnessBuffer.current.length >= 10) {
                const mean = stillnessBuffer.current.reduce((a, b) => a + b, 0) / stillnessBuffer.current.length;
                const variance = stillnessBuffer.current.map(v => (v - mean) ** 2).reduce((a, b) => a + b, 0) / stillnessBuffer.current.length;
                
                if (variance < STILLNESS_THRESHOLD) {
                    if (!stillnessTimer.current) {
                        stillnessTimer.current = window.setTimeout(() => {
                            if (statusRef.current === 'arming') {
                                setStatus('armed');
                                motionBuffer.current = []; // Clear buffer
                                // Clear force arm timer since we succeeded
                                if (forceArmTimer.current) {
                                    clearTimeout(forceArmTimer.current);
                                    forceArmTimer.current = null;
                                }
                            }
                        }, STILLNESS_DURATION);
                    }
                } else {
                    if (stillnessTimer.current) {
                        clearTimeout(stillnessTimer.current);
                        stillnessTimer.current = null;
                    }
                }
            }
        } else if (currentStatus === 'armed') {
            if (magnitude > RECORD_START_THRESHOLD) {
                setStatus('recording');
                motionBuffer.current.push(dataPoint);
                recordingTimer.current = window.setTimeout(() => stopRecording(), MAX_RECORD_DURATION);
            }
        } else if (currentStatus === 'recording') {
            motionBuffer.current.push(dataPoint);
            // End recording when motion settles down
            if (magnitude < RECORD_END_THRESHOLD && motionBuffer.current.length > 10) {
                // Debounce slightly to ensure we catch the landing
                if (!recordingTimer.current) { 
                     // Usually handled by the main timer, but we could add a short "landing finish" delay here
                     stopRecording(); 
                } else {
                     // Reset the max duration timer and trigger stop immediate + small delay?
                     // For simplicity, just stop now.
                     stopRecording();
                }
            }
        }
    }, []);

    const stopRecording = useCallback(() => {
        window.removeEventListener('devicemotion', handleMotion);
        cleanupTimers();
        setRecordedData([...motionBuffer.current]);
        setStatus('confirming');
    }, [handleMotion]);

    const startRecordingAttempt = useCallback(async () => {
        cleanupTimers();
        setStatus('permission');
        
        // iOS Permission Check
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            try {
                const permissionState = await (DeviceMotionEvent as any).requestPermission();
                if (permissionState !== 'granted') {
                    setStatus('denied');
                    return;
                }
            } catch (err) {
                console.error(err);
                setStatus('error');
                return;
            }
        }
        
        motionBuffer.current = [];
        stillnessBuffer.current = [];
        
        window.addEventListener('devicemotion', handleMotion);
        setStatus('arming');

        // Safety fallback: Force arm after 5 seconds if stillness detection is too strict
        forceArmTimer.current = window.setTimeout(() => {
            if (statusRef.current === 'arming') {
                console.log("Force arming due to timeout.");
                setStatus('armed');
                motionBuffer.current = [];
            }
        }, 5000);

    }, [handleMotion]);

    const confirmTake = () => {
        window.removeEventListener('devicemotion', handleMotion);
        cleanupTimers();
        setStatus('idle');
        setRecordedData(null);
    };

    const discardTake = () => {
        window.removeEventListener('devicemotion', handleMotion);
        cleanupTimers();
        setStatus('idle');
        setRecordedData(null);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            window.removeEventListener('devicemotion', handleMotion);
            cleanupTimers();
        };
    }, [handleMotion]);

    return { status, startRecordingAttempt, confirmTake, discardTake, recordedData };
};